# DaVinci Functional Brief

Repository path: [repo]

Profile: `exhaustive`
Scope: `Full`
Boundary: deterministic orientation evidence, not an LLM semantic summary.

## Purpose Evidence

Personal Claude assistant. Lightweight, secure, customizable.

## Capability Tags

`agent`, `api-server`, `identity-auth`, `mcp`

## Provenance

| Field | Value |
|---|---|
| checkout_status | valid |
| commit_sha | 601fc7c39678462d94098c8915ef320da1dfe466 |
| branch | main |
| last_commit_at | 2026-04-23T09:33:39+03:00 |
| remote_origin_url | https://github.com/brunomendonca-com/brunoclaw |
| dirty | false |

## Installability

| Field | Value |
|---|---|
| manifest_count | 2 |
| has_ci | true |
| has_docker | true |
| has_tests | true |
| package_managers | docker, npm |

## Entrypoints

| kind | path | reason |
|---|---|---|
| package_script | package.json | declared package script |
| package_script | package.json | declared package script |
| package_script | package.json | declared package script |
| package_script | package.json | declared package script |
| mcp_server | container/agent-runner/src/mcp-tools/index.ts | entrypoint-like path convention |
| mcp_server | container/agent-runner/src/mcp-tools/server.ts | entrypoint-like path convention |
| application_entrypoint | src/channels/cli.ts | entrypoint-like path convention |
| application_entrypoint | src/index.ts | entrypoint-like path convention |

## Read First Files

| path | reason |
|---|---|
| README.md | project orientation |
| package.json | installability and metadata |
| container/agent-runner/src/mcp-tools/index.ts | runtime entrypoint |
| container/agent-runner/src/mcp-tools/server.ts | runtime entrypoint |
| src/channels/cli.ts | runtime entrypoint |
| src/index.ts | runtime entrypoint |
| src/channels/chat-sdk-bridge.ts | high-impact file |
| container/agent-runner/scripts/sdk-signal-probe.ts | high-impact file |
| container/agent-runner/src/formatter.ts | high-impact file |
| setup/whatsapp-auth.ts | high-impact file |
| scripts/init-first-agent.ts | high-impact file |
| setup/index.ts | high-impact file |
| setup/lib/tz-from-claude.ts | high-impact file |
| src/container-runner.ts | high-impact file |
| src/host-sweep.ts | high-impact file |
| src/modules/approvals/primitive.ts | high-impact file |

## Component Clusters

| component | files | lines | findings | risk_files |
|---|---|---|---|---|
| setup | 60 | 9582 | 53 | 3 |
| container | 49 | 5130 | 15 | 4 |
| src/modules | 43 | 5094 | 2 | 3 |
| src | 26 | 4608 | 8 | 7 |
| src/db | 21 | 2280 | 1 | 0 |
| docs | 21 | 6438 | 0 | 0 |
| scripts | 10 | 1639 | 15 | 1 |
| src/channels | 8 | 1493 | 3 | 2 |
| repo-tokens | 2 | 299 | 3 | 0 |
| src/providers | 2 | 64 | 0 | 0 |
| nanoclaw.sh | 1 | 251 | 9 | 0 |
| CLAUDE.md | 1 | 247 | 3 | 0 |
| package.json | 1 | 51 | 1 | 0 |
| setup.sh | 1 | 233 | 1 | 0 |
| CHANGELOG.md | 1 | 163 | 0 | 0 |

## Central Files

| path | risk | centrality | reason |
|---|---|---|---|
| src/channels/chat-sdk-bridge.ts | 0.789 | 0.649 | central top-risk file |
| container/agent-runner/scripts/sdk-signal-probe.ts | 0.756 | 0.649 | central top-risk file |
| container/agent-runner/src/formatter.ts | 0.693 | 0.649 | central top-risk file |
| setup/whatsapp-auth.ts | 0.674 | 0.649 | central top-risk file |
| scripts/init-first-agent.ts | 0.649 | 0.649 | central top-risk file |
| setup/index.ts | 0.649 | 0.649 | central top-risk file |
| setup/lib/tz-from-claude.ts | 0.649 | 0.649 | central top-risk file |
| src/container-runner.ts | 0.649 | 0.649 | central top-risk file |
| src/host-sweep.ts | 0.649 | 0.649 | central top-risk file |
| src/modules/approvals/primitive.ts | 0.649 | 0.649 | central top-risk file |
| src/modules/permissions/index.ts | 0.649 | 0.649 | central top-risk file |
| src/modules/approvals/onecli-approvals.ts | 0.647 | 0.649 | central top-risk file |
| container/agent-runner/src/mcp-tools/interactive.ts | 0.646 | 0.649 | central top-risk file |
| src/webhook-server.ts | 0.637 | 0.649 | central top-risk file |
| src/delivery.ts | 0.634 | 0.649 | central top-risk file |

## Key Files

| path | reason | risk | centrality |
|---|---|---|---|
| src/channels/chat-sdk-bridge.ts | top risk by deterministic scoring | 0.789 | 0.649 |
| container/agent-runner/scripts/sdk-signal-probe.ts | top risk by deterministic scoring | 0.756 | 0.649 |
| container/agent-runner/src/formatter.ts | top risk by deterministic scoring | 0.693 | 0.649 |
| setup/whatsapp-auth.ts | top risk by deterministic scoring | 0.674 | 0.649 |
| scripts/init-first-agent.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| setup/index.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| setup/lib/tz-from-claude.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| src/container-runner.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| src/host-sweep.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| src/modules/approvals/primitive.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| src/modules/permissions/index.ts | top risk by deterministic scoring | 0.649 | 0.649 |
| src/modules/approvals/onecli-approvals.ts | top risk by deterministic scoring | 0.647 | 0.649 |
| container/agent-runner/src/mcp-tools/interactive.ts | top risk by deterministic scoring | 0.646 | 0.649 |
| src/webhook-server.ts | top risk by deterministic scoring | 0.637 | 0.649 |
| src/delivery.ts | top risk by deterministic scoring | 0.634 | 0.649 |

## Top Actionable Findings

| severity | confidence | rule_id | path | line | path_context |
|---|---|---|---|---|---|
| high | high | supply-chain.container.remote-build-script | container/Dockerfile | 69 | production |
| high | high | js.ssrf-fetch | setup/channels/discord.ts | 197 | production |
| high | high | js.ssrf-fetch | setup/channels/discord.ts | 386 | production |
| high | high | js.ssrf-fetch | setup/lib/diagnostics.ts | 62 | production |
| high | high | js.ssrf-fetch | src/channels/chat-sdk-bridge.ts | 528 | production |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/add-opencode/SKILL.md | 79 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/add-vercel/SKILL.md | 1 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/get-qodo-rules/SKILL.md | 48 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/get-qodo-rules/references/repository-scope.md | 10 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/init-first-agent/SKILL.md | 114 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/init-onecli/SKILL.md | 1 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/migrate-from-openclaw/SKILL.md | 10 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/update-nanoclaw/SKILL.md | 199 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | CLAUDE.md | 1 | docs |
| high | medium | bash.command-substitution-injection | nanoclaw.sh | 121 | production |

## Risk Summary

| Field | Value |
|---|---:|
| health_score | 50 |
| findings_count | 175 |
| production_findings | 122 |
| non_production_findings | 53 |
| hotspots_detected | 0 |
| degradation_count | 0 |

## Decision Support

Orientation readiness score: **95/100**

---
Generated by DaVinci functional brief schema 1.0.0.