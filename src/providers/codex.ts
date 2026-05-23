/**
 * Host-side container config for the `codex` provider.
 *
 * Codex reads MCP config from ~/.codex. We give each session its own
 * private writable directory so the in-container provider can rewrite
 * config.toml freely on every wake with container-appropriate MCP server
 * paths, without racing other sessions or leaking per-session paths back to
 * the host.
 *
 * Credentials must stay behind the OneCLI gateway. Do not copy host Codex
 * auth files or pass provider API keys into the container; the gateway
 * injects credentials at request time.
 */
import fs from 'fs';
import path from 'path';

import { registerProviderContainerConfig } from './provider-container-registry.js';

registerProviderContainerConfig('codex', (ctx) => {
  const codexDir = path.join(ctx.sessionDir, 'codex');
  fs.mkdirSync(codexDir, { recursive: true });

  const env: Record<string, string> = {};
  if (ctx.hostEnv.CODEX_MODEL) env.CODEX_MODEL = ctx.hostEnv.CODEX_MODEL;

  return {
    mounts: [{ hostPath: codexDir, containerPath: '/home/node/.codex', readonly: false }],
    env,
  };
});
