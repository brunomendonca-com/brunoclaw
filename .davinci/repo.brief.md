# DaVinci Functional Brief

Repository path: [repo]

Profile: `exhaustive`
Scope: `Full`
Boundary: deterministic orientation evidence, not an LLM semantic summary.

## Executive Orientation

- **one line assessment:** Start with actionable production evidence before broad code reading; this repo has deterministic findings that can mislead a raw orientation pass.
**what matters**
- typescript is the dominant language across 261 scanned files and 41584 loaded LOC.
- Orientation readiness is 95/100 and health is 52.0/100.
- Detected capability tags: agent, api-server, identity-auth, mcp.
- 161 findings are present; 99 are production-context and 152 are agent-actionable by default.

**what could break**
- Production-context findings can change release or remediation priority; inspect report.agent.json and evidence packs first.
- 67 supply-chain exposure findings need dependency, workflow, or container owner review.

**recommended reader route**
- Read the README and package/manifest evidence to establish intent.
- Use Read First Files and Central Files for the smallest useful code pass.
- Open report.agent.json and evidence.packs.json before assigning remediation work.
- Use evidence.graph.json or davinci_impact for risky-file neighborhood review.


## Purpose Evidence

Personal Claude assistant. Lightweight, secure, customizable.

## Capability Tags

`agent`, `api-server`, `identity-auth`, `mcp`

## Provenance

| Field | Value |
|---|---|
| checkout_status | valid |
| commit_sha | e5a235ab2f114aaccc88e7eadf9100ad28b657ee |
| branch | codex/add-davinci-artifacts |
| last_commit_at | 2026-05-27T17:55:39-04:00 |
| remote_origin_url | https://github.com/bernie-b1stAI/brunoclaw.git |
| dirty | true |

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

| id | path | reason |
|---|---|---|
| brief.read_first.df62d5fe6dea | README.md | project orientation |
| brief.read_first.1edae8cc0546 | package.json | installability and metadata |
| brief.read_first.8bc1b1dcab1c | container/agent-runner/src/mcp-tools/index.ts | runtime entrypoint |
| brief.read_first.66bf8d898abd | container/agent-runner/src/mcp-tools/server.ts | runtime entrypoint |
| brief.read_first.69c8617a6c4e | src/channels/cli.ts | runtime entrypoint |
| brief.read_first.e3a95be39750 | src/index.ts | runtime entrypoint |
| brief.read_first.d2bbc1d49af4 | src/channels/chat-sdk-bridge.ts | high-impact file |
| brief.read_first.6b6ac51edfcd | container/agent-runner/scripts/sdk-signal-probe.ts | high-impact file |
| brief.read_first.315c0019bceb | container/agent-runner/src/formatter.ts | high-impact file |
| brief.read_first.9d5e76096f0b | setup/whatsapp-auth.ts | high-impact file |
| brief.read_first.0cca05c13542 | scripts/init-first-agent.ts | high-impact file |
| brief.read_first.afd77a96d152 | setup/index.ts | high-impact file |
| brief.read_first.9b4557ae2ac6 | setup/lib/tz-from-claude.ts | high-impact file |
| brief.read_first.61b12357303e | src/container-runner.ts | high-impact file |
| brief.read_first.0c6a3c5b7743 | src/host-sweep.ts | high-impact file |
| brief.read_first.7b61f03a52ea | src/modules/approvals/primitive.ts | high-impact file |

## Component Clusters

| component | files | lines | findings | risk_files |
|---|---|---|---|---|
| setup | 60 | 9582 | 49 | 3 |
| container | 49 | 5130 | 15 | 4 |
| src/modules | 43 | 5094 | 2 | 3 |
| src | 26 | 4608 | 8 | 7 |
| src/db | 21 | 2280 | 1 | 0 |
| docs | 21 | 6438 | 0 | 0 |
| scripts | 10 | 1639 | 12 | 1 |
| src/channels | 8 | 1493 | 2 | 2 |
| repo-tokens | 2 | 299 | 3 | 0 |
| src/providers | 2 | 64 | 0 | 0 |
| nanoclaw.sh | 1 | 251 | 4 | 0 |
| CLAUDE.md | 1 | 247 | 3 | 0 |
| package.json | 1 | 51 | 1 | 0 |
| .mcp.json | 1 | 3 | 0 | 0 |
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
| error | high | js.child-process-exec.tainted | setup/verify.ts | 263 | production |
| error | high | js.child-process-exec.tainted | setup/verify.ts | 263 | production |
| error | high | js.child-process-exec.tainted | setup/verify.ts | 263 | production |
| high | high | supply-chain.container.remote-build-script | container/Dockerfile | 69 | production |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/add-opencode/SKILL.md | 79 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/add-vercel/SKILL.md | 1 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/get-qodo-rules/SKILL.md | 48 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/get-qodo-rules/references/repository-scope.md | 10 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/init-first-agent/SKILL.md | 114 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/init-onecli/SKILL.md | 1 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/migrate-from-openclaw/SKILL.md | 10 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | .claude/skills/update-nanoclaw/SKILL.md | 199 | docs |
| high | high | supply-chain.agent-instructions.prompt-exfiltration | CLAUDE.md | 1 | docs |
| high | medium | bash.command-substitution-injection | setup/add-telegram.sh | 130 | production |
| high | medium | supply-chain.agent-instructions.secret-access | .claude/skills/add-dashboard/SKILL.md | 73 | docs |

## Risk Summary

| Field | Value |
|---|---:|
| health_score | 52 |
| findings_count | 161 |
| production_findings | 99 |
| non_production_findings | 62 |
| hotspots_detected | 0 |
| degradation_count | 0 |

## Decision Support

Orientation readiness score: **95/100**

---
Generated by DaVinci functional brief schema 1.0.0.