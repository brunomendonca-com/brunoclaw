/**
 * Container runtime abstraction for NanoClaw.
 * All runtime-specific logic lives here so swapping runtimes means changing one file.
 */
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';

import { log } from './log.js';
import { heartbeatPath } from './session-manager.js';
import { adoptRunningContainer } from './container-runner.js';

/** The container runtime binary name. */
export const CONTAINER_RUNTIME_BIN = 'docker';

/** CLI args needed for the container to resolve the host gateway. */
export function hostGatewayArgs(): string[] {
  // On Linux, host.docker.internal isn't built-in — add it explicitly
  if (os.platform() === 'linux') {
    return ['--add-host=host.docker.internal:host-gateway'];
  }
  return [];
}

/** Returns CLI args for a readonly bind mount. */
export function readonlyMountArgs(hostPath: string, containerPath: string): string[] {
  return ['-v', `${hostPath}:${containerPath}:ro`];
}

/** Stop a container by name. Uses execFileSync to avoid shell injection. */
export function stopContainer(name: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name)) {
    throw new Error(`Invalid container name: ${name}`);
  }
  execSync(`${CONTAINER_RUNTIME_BIN} stop -t 1 ${name}`, { stdio: 'pipe' });
}

/** Ensure the container runtime is running, starting it if needed. */
export function ensureContainerRuntimeRunning(): void {
  try {
    execSync(`${CONTAINER_RUNTIME_BIN} info`, {
      stdio: 'pipe',
      timeout: 10000,
    });
    log.debug('Container runtime already running');
  } catch (err) {
    log.error('Failed to reach container runtime', { err });
    console.error('\n╔════════════════════════════════════════════════════════════════╗');
    console.error('║  FATAL: Container runtime failed to start                      ║');
    console.error('║                                                                ║');
    console.error('║  Agents cannot run without a container runtime. To fix:        ║');
    console.error('║  1. Ensure Docker is installed and running                     ║');
    console.error('║  2. Run: docker info                                           ║');
    console.error('║  3. Restart NanoClaw                                           ║');
    console.error('╚════════════════════════════════════════════════════════════════╝\n');
    throw new Error('Container runtime is required but failed to start', {
      cause: err,
    });
  }
}

// A container whose .heartbeat file was touched within this window is
// considered alive. The container touches the heartbeat after every
// provider event, plus periodically — a value greater than the longest
// expected gap between events keeps healthy long-running tool calls from
// being misclassified as dead. host-sweep uses the same file with a
// 30-minute absolute ceiling for kill decisions; here we're only deciding
// whether to adopt or stop, so a tighter window is fine.
const HEARTBEAT_FRESH_MS = 5 * 60 * 1000;

/**
 * Reconcile NanoClaw containers running at host startup with the central
 * DB and per-session heartbeat files:
 *
 *  - Containers with a fresh heartbeat → adopt. The previous host process
 *    spawned them; we lost the ChildProcess handle on restart but the
 *    session DBs are file-based, so delivery + sweep keep working as
 *    soon as we register the container by name.
 *  - Containers with a stale heartbeat (or no labels at all — pre-label
 *    builds) → stop. Genuinely orphaned, or stuck and worth restarting.
 *
 * The previous implementation killed every nanoclaw- container at
 * startup, which silently destroyed in-flight conversations whenever the
 * host process restarted.
 */
export function cleanupOrphans(): void {
  try {
    const output = execSync(
      `${CONTAINER_RUNTIME_BIN} ps --filter label=nanoclaw=1 --format '{{.Names}}\t{{.Label "nanoclaw-session-id"}}\t{{.Label "nanoclaw-agent-group-id"}}'`,
      { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf-8' },
    );

    const lines = output.trim().split('\n').filter(Boolean);
    const adopted: string[] = [];
    const stopped: string[] = [];

    for (const line of lines) {
      const [name, sessionId, agentGroupId] = line.split('\t');
      if (!name) continue;

      const fresh = sessionId && agentGroupId && isHeartbeatFresh(agentGroupId, sessionId);
      if (fresh) {
        adoptRunningContainer(sessionId, name);
        adopted.push(name);
        continue;
      }

      try {
        stopContainer(name);
      } catch {
        /* already stopped */
      }
      stopped.push(name);
    }

    // Older builds (pre-label) didn't tag containers — sweep those by
    // name prefix as a last resort. They can't be adopted (no session id
    // mapping) so it's stop-or-leak.
    const legacy = execSync(`${CONTAINER_RUNTIME_BIN} ps --filter name=nanoclaw- --format '{{.Names}}'`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean)
      .filter((n) => !adopted.includes(n) && !stopped.includes(n));
    for (const name of legacy) {
      try {
        stopContainer(name);
      } catch {
        /* already stopped */
      }
      stopped.push(name);
    }

    if (adopted.length > 0) {
      log.info('Adopted running containers', { count: adopted.length, names: adopted });
    }
    if (stopped.length > 0) {
      log.info('Stopped orphaned containers', { count: stopped.length, names: stopped });
    }
  } catch (err) {
    log.warn('Failed to clean up orphaned containers', { err });
  }
}

function isHeartbeatFresh(agentGroupId: string, sessionId: string): boolean {
  try {
    const stat = fs.statSync(heartbeatPath(agentGroupId, sessionId));
    return Date.now() - stat.mtimeMs < HEARTBEAT_FRESH_MS;
  } catch {
    return false;
  }
}
