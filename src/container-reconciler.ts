/**
 * Host startup reconciliation for NanoClaw containers.
 *
 * Runtime discovery stays in container-runtime.ts; this coordinator owns the
 * session/runner decision: adopt healthy containers from a previous host
 * process, stop stale or unlabeled ones.
 */
import fs from 'fs';

import { adoptRunningContainer } from './container-runner.js';
import { listLabeledContainers, listLegacyContainers, stopContainer } from './container-runtime.js';
import { log } from './log.js';
import { heartbeatPath } from './session-manager.js';

// A container whose .heartbeat file was touched within this window is
// considered alive. The container touches heartbeat files during provider
// activity; host-sweep owns the longer stuck/ceiling kill policy.
const HEARTBEAT_FRESH_MS = 5 * 60 * 1000;

export function cleanupOrphans(): void {
  try {
    const adopted: string[] = [];
    const stopped: string[] = [];

    for (const container of listLabeledContainers()) {
      const fresh =
        container.sessionId && container.agentGroupId && isHeartbeatFresh(container.agentGroupId, container.sessionId);

      if (fresh && container.sessionId) {
        adoptRunningContainer(container.sessionId, container.name);
        adopted.push(container.name);
        continue;
      }

      stopIfRunning(container.name);
      stopped.push(container.name);
    }

    for (const name of listLegacyContainers().filter((n) => !adopted.includes(n) && !stopped.includes(n))) {
      stopIfRunning(name);
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

function stopIfRunning(name: string): void {
  try {
    stopContainer(name);
  } catch {
    /* already stopped */
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
