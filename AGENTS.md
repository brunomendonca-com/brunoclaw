# PipipiClaw

Personal AI assistant. See [README.md](README.md) for philosophy and setup. See [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) for architecture decisions.

## Quick Context

Single Node.js process with skill-based channel system. Channels (WhatsApp, Telegram, Slack, Discord, Gmail) are skills that self-register at startup. Messages route to the Pi agent framework (`@mariozechner/pi-coding-agent`) running in containers (Linux VMs). Each group has isolated filesystem and memory.

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Orchestrator: state, message loop, agent invocation |
| `src/channels/registry.ts` | Channel registry (self-registration at startup) |
| `src/ipc.ts` | IPC watcher and task processing |
| `src/router.ts` | Message formatting and outbound routing |
| `src/config.ts` | Trigger pattern, paths, intervals |
| `src/container-runner.ts` | Spawns agent containers with mounts |
| `src/task-scheduler.ts` | Runs scheduled tasks |
| `src/db.ts` | SQLite operations |
| `groups/{name}/AGENTS.md` | Per-group memory (isolated) |
| `container/agent-runner/src/index.ts` | Pi agent runner (headless, runs inside container) |
| `container/agent-runner/src/ipc-mcp-stdio.ts` | IPC MCP server (stdio, bridged via MCPorter) |
| `container/skills/agent-browser` | Browser automation tool (available to all agents) |

## Skills

| Skill | When to Use |
|-------|-------------|
| `/setup` | First-time installation, authentication, service configuration |
| `/customize` | Adding channels, integrations, changing behavior |
| `/debug` | Container issues, logs, troubleshooting |
| `/update-nanoclaw` | Bring upstream updates into a customized install |
| `/update-skills` | Sync skills from upstream without touching application code |
| `/qodo-pr-resolver` | Fetch and fix Qodo PR review issues interactively or in batch |
| `/get-qodo-rules` | Load org- and repo-level coding rules from Qodo before code tasks |

## Setup Process

Setup runs automatically via `bash setup.sh` followed by `npx tsx setup/index.ts --step <name>`. It includes:

1. **Git & Fork Setup** - Ensures you have a fork with upstream configured
2. **Bootstrap** - Installs Node.js 22 and dependencies
3. **Container Runtime** - Sets up Docker or Apple Container
4. **Authentication** - API key or OAuth configuration
5. **Channels** - WhatsApp, Telegram, Slack, Discord (each via its own skill)
6. **Mount Allowlist** - Configures agent file access
7. **Start Service** - Launches background service
8. **Verify** - Confirms everything works

## Development

Run commands directly—don't tell the user to run them.

```bash
npm run dev          # Run with hot reload
npm run build        # Compile TypeScript
./container/build.sh # Rebuild agent container
```

Service management:
```bash
# macOS (launchd)
launchctl load ~/Library/LaunchAgents/com.pipipiclaw.plist
launchctl unload ~/Library/LaunchAgents/com.pipipiclaw.plist
launchctl kickstart -k gui/$(id -u)/com.pipipiclaw  # restart

# Linux (systemd)
systemctl --user start pipipiclaw
systemctl --user stop pipipiclaw
systemctl --user restart pipipiclaw
```

## Troubleshooting

**WhatsApp not connecting after upgrade:** WhatsApp is a separate channel fork, not bundled in core. Run `/add-whatsapp` to install it. Existing auth credentials and groups are preserved.

**Agent not responding:** Check container logs at `groups/{name}/logs/container-*.log`. Pi session files are stored at `data/sessions/{group}/pi/session.jsonl`.

**MCP tools not available:** The IPC MCP server is bridged via MCPorter. Check agent-runner logs for `IPC tools loaded:` to verify tools were discovered.

## Container Build Cache

The container buildkit caches the build context aggressively. `--no-cache` alone does NOT invalidate COPY steps — the builder's volume retains stale files. To force a truly clean rebuild, prune the builder then re-run `./container/build.sh`.
