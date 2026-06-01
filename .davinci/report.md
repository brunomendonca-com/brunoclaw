# DaVinci Scan Report

**Repository:** [repo]  
**Profile:** exhaustive  
**Scope:** Full  
**Duration:** 1.19s  
**Files Scanned:** 261

## Health Score: 52/100

| Component | Score |
|-----------|-------|
| Overall | 52 |
| Security | 65 |
| Architecture | 10 |
| Wiring | 37 |
| Simulation | 100 |
| Maintenance | 75 |

## Coverage And Caveats

| Metric | Value |
|--------|------:|
| Degradation grade | `green` |
| Selected files | 261 |
| Loaded files | 261 |
| Loaded LOC | 41584 |
| Loaded bytes | 1572521 |
| Parsed files | 261 |
| Parse-skipped files | 0 |
| Source-load skipped files | 0 |
| Source-load failed files | 0 |
| Security-scan degraded files | 0 |
| Security-scan skipped files | 0 |
| Affected-file upper-bound ratio | 0.00% |
| Source-load coverage | 100.00% |
| Parse coverage | 100.00% |
| Exact degradation events | 0 |
| Retained degradation events | 0 |
| Event detail truncated | false |
| Index mode | `metadata` |
| Index status | `metadata_only` |

Grade reason: No material bounded-analysis caveat was detected.

### Degradation Taxonomy

| Roll-up | Grade |
|---------|-------|
| Integrity (input fully loaded) | `green` |
| Coverage (analysis depth bounded by design) | `green` |

Scan integrity is intact: the full selected input was loaded. Analysis depth was applied broadly with no material bounding.

| Axis | Class | Grade | Metric | Value |
|------|-------|-------|--------|------:|
| source_load_coverage | integrity | `green` | loaded_over_selected_ratio | 1.0000 |
| parse_coverage | bounded | `green` | parsed_over_loaded_ratio | 1.0000 |
| security_coverage | bounded | `green` | security_degraded_over_loaded_ratio | 0.0000 |
| finding_retention | bounded | `green` | retention_skipped_file_count | 0.0000 |
| event_observability | observability | `green` | event_detail_truncated | 0.0000 |

Caveats:
- DaVinci evidence is deterministic scan context, not final exploitability judgment.
- Findings in tests, fixtures, generated code, vendored code, examples, or docs should be reviewed with that path context.
- Degradation counts should be interpreted with file denominators above; a high event count can still represent a bounded subset of loaded files.
- Local structured metadata exists, but text/vector search artifacts are intentionally unavailable because this scan used `--index-mode metadata`.

## Summary

- **Findings:** 161
- **Degradations:** 0
- **Nodes:** 842
- **Edges:** 668
- **Import Edges Resolved:** 0
- **Hotspots Detected:** 0
- **Files in Cycles:** 0
- **Lean Report Tokens:** 74342

## Validated Evidence

| Metric | Value |
|--------|------:|
| Findings validated | 161 |
| Evidence packs | 12 |
| Finding clusters | 50 |
| Average grounding score | 0.765 |
| Average review priority score | 0.507 |

False-positive likelihood counts: `{"high":59,"low":86,"medium":16}`

Deterministic challenge counts: `{"context_demoted":9,"downgraded_unverified":63,"needs_exploitability_review":3,"upheld_candidate":86}`

| Cluster | Rule | Count | Context | FP likelihood | Challenge | File |
|---------|------|------:|---------|---------------|-----------|------|
| `FCL-001` | `js.child-process-exec.tainted` | 3 | production | low | upheld_candidate | `setup/verify.ts` |
| `FCL-002` | `bash.command-substitution-injection` | 1 | production | low | upheld_candidate | `setup/add-telegram.sh` |
| `FCL-003` | `adaptability.hardcoded-platform-path` | 4 | production | low | upheld_candidate | `setup/channels/discord.ts` |
| `FCL-004` | `adaptability.hardcoded-platform-path` | 3 | production | low | upheld_candidate | `container/entrypoint.sh` |
| `FCL-005` | `adaptability.hardcoded-platform-path` | 3 | production | low | upheld_candidate | `setup/platform.ts` |
| `FCL-006` | `adaptability.hardcoded-platform-path` | 3 | production | low | upheld_candidate | `setup/service.ts` |
| `FCL-007` | `adaptability.hardcoded-platform-path` | 3 | production | low | upheld_candidate | `src/container-runner.ts` |
| `FCL-008` | `adaptability.hardcoded-platform-path` | 2 | production | low | upheld_candidate | `setup/auto.ts` |
| `FCL-009` | `adaptability.hardcoded-platform-path` | 2 | production | low | upheld_candidate | `setup/register-claude-token.sh` |
| `FCL-010` | `adaptability.hardcoded-platform-path` | 1 | production | low | upheld_candidate | `container/agent-runner/src/index.ts` |

| Pack | Priority | Rule | Location | Grounding | FP likelihood | Next action |
|------|---------:|------|----------|-----------|---------------|-------------|
| `EV-001` | 1.000 | `js.child-process-exec.tainted` | `setup/verify.ts:263` | grounded | low | inspect the cited source range and decide fix priority |
| `EV-002` | 0.847 | `bash.command-substitution-injection` | `setup/add-telegram.sh:130` | grounded | low | inspect the cited source range and decide fix priority |
| `EV-003` | 0.771 | `adaptability.hardcoded-platform-path` | `container/agent-runner/src/index.ts:21` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |
| `EV-004` | 0.771 | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh:8` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |
| `EV-005` | 0.771 | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh:14` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |
| `EV-006` | 0.771 | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh:16` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |
| `EV-007` | 0.771 | `adaptability.hardcoded-platform-path` | `nanoclaw.sh:157` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |
| `EV-008` | 0.771 | `supply-chain.package.lifecycle-script-risk` | `package.json:16` | grounded | low | inspect the cited source range and decide fix priority |
| `EV-009` | 0.771 | `adaptability.hardcoded-platform-path` | `setup/auto.ts:210` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |
| `EV-010` | 0.771 | `adaptability.hardcoded-platform-path` | `setup/auto.ts:777` | grounded | low | confirm whether the value is live, rotate if live, and move to secret storage |

Full bounded evidence is available in `evidence.packs.json`.

## Supply-Chain Exposure

DaVinci supply-chain findings are deterministic static repo exposure evidence. They do not prove endpoint compromise, extension installation, secret exfiltration, or repository cloning unless supplied audit/log evidence supports that conclusion.

| Metric | Value |
|--------|------:|
| Findings | 67 |
| IOC hits | 0 |
| Static exposures | 67 |
| Optional evidence hits | 0 |
| Workflow files scanned | 4 |
| Package files scanned | 6 |
| Container files scanned | 1 |
| Agent instruction files scanned | 78 |
| Evidence files scanned | 0 |
| Repo input scope | tracked |
| Repo input truncated | false |

| Exposure class | Count | Max severity |
|----------------|------:|--------------|
| `agent-instructions` | 53 | `high` |
| `container` | 2 | `high` |
| `workflow` | 11 | `medium` |
| `package` | 1 | `medium` |

## Adaptive Policy

Adaptive policy evidence explains budget utilization and next-run recommendations. DaVinci does not silently mutate scan limits during a run; users, CI, or signed budget files remain the control plane.

| Field | Value |
|-------|-------|
| Profile | `exhaustive` |
| Policy source | `profile` |
| Budget file | - |

| Budget | Used | Limit | Ratio | Status |
|--------|-----:|------:|------:|--------|
| `source_files` | 261 | 250000 | 0.001 | `ok` |
| `source_bytes` | 1572521 | 2000000000 | 0.001 | `ok` |
| `parse_files` | 261 | 100000 | 0.003 | `ok` |
| `security_findings` | 161 | 200000 | 0.001 | `ok` |
| `symbol_graph_nodes` | 668 | 250000 | 0.003 | `ok` |

## Degradation File Context

| Metric | Count / Ratio |
|--------|--------------:|
| Selected files | 261 |
| Loaded files | 261 |
| Source-load skipped files | 0 |
| Source-load failed files | 0 |
| Parsed files | 261 |
| Parse-skipped files | 0 |
| Security-scan degraded files | 0 |
| Security-scan skipped files | 0 |
| Security finding retention skipped files | 0 |
| Affected file upper bound | 0 |
| Source-load coverage | 100.00% |
| Parse coverage | 100.00% |
| Parse skip ratio | 0.00% |
| Security degraded ratio | 0.00% |
| Exact degradation events | 0 |
| Retained degradation events | 0 |
| Event detail truncated | false |

_Upper bound only; parser/security/source-load categories can overlap on the same file._

## Stage Timings

| Stage | Seconds |
|-------|---------|
| adaptability | 0.040 |
| cache_lookup | 0.000 |
| dependency_scan | 0.000 |
| git_history | 0.000 |
| graph | 0.004 |
| index | 0.342 |
| parser | 0.122 |
| preflight | 0.681 |
| report_generation | 0.012 |
| sim | 0.000 |
| supply_chain | 0.521 |

## Findings (161)

| Severity | Confidence | Context | Provenance | Rule | File | Line | Message |
|----------|------------|---------|------------|------|------|------|---------|
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-dashboard/SKILL.md` | 73 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-discord/SKILL.md` | 75 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-emacs/SKILL.md` | 65 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-gchat/SKILL.md` | 71 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-github/REMOVE.md` | 4 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-github/SKILL.md` | 84 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-imessage/SKILL.md` | 83 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-karpathy-llm-wiki/SKILL.md` | 81 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-linear/REMOVE.md` | 4 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-linear/SKILL.md` | 114 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-matrix/SKILL.md` | 129 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-ollama-provider/SKILL.md` | 40 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-ollama-tool/SKILL.md` | 72 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/add-opencode/SKILL.md` | 79 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-opencode/SKILL.md` | 120 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-parallel/SKILL.md` | 41 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-resend/REMOVE.md` | 4 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-resend/SKILL.md` | 69 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-slack/SKILL.md` | 83 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-teams/SKILL.md` | 175 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-telegram/SKILL.md` | 87 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/add-vercel/SKILL.md` | 1 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-vercel/SKILL.md` | 1 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-vercel/container-skills/vercel-cli/SKILL.md` | 81 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-webex/REMOVE.md` | 4 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-webex/SKILL.md` | 66 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-wechat/SKILL.md` | 75 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-whatsapp-cloud/SKILL.md` | 71 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/add-whatsapp/SKILL.md` | 187 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/claw/SKILL.md` | 8 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/convert-to-apple-container/SKILL.md` | 16 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/get-qodo-rules/SKILL.md` | 48 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| low | medium | production | source | `supply-chain.agent-instructions.hidden-unicode.variation-selector` | `.claude/skills/get-qodo-rules/references/output-format.md` | 29 | Agent instruction file contains invisible or visually ambiguous Unicode that may hide instructions from human review. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/get-qodo-rules/references/repository-scope.md` | 10 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/init-first-agent/SKILL.md` | 13 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/init-first-agent/SKILL.md` | 114 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/init-onecli/SKILL.md` | 1 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/init-onecli/SKILL.md` | 3 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/manage-channels/SKILL.md` | 14 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/migrate-from-openclaw/MIGRATE_CRONS.md` | 76 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/migrate-from-openclaw/SKILL.md` | 10 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/migrate-from-openclaw/SKILL.md` | 66 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/migrate-nanoclaw/SKILL.md` | 22 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| low | medium | production | source | `supply-chain.agent-instructions.hidden-unicode.variation-selector` | `.claude/skills/qodo-pr-resolver/SKILL.md` | 67 | Agent instruction file contains invisible or visually ambiguous Unicode that may hide instructions from human review. |
| low | medium | production | source | `supply-chain.agent-instructions.hidden-unicode.variation-selector` | `.claude/skills/qodo-pr-resolver/resources/providers.md` | 149 | Agent instruction file contains invisible or visually ambiguous Unicode that may hide instructions from human review. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `.claude/skills/update-nanoclaw/SKILL.md` | 199 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/use-native-credential-proxy/SKILL.md` | 3 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `.claude/skills/x-integration/SKILL.md` | 31 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/bump-version.yml` | 13 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/bump-version.yml` | 19 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/bump-version.yml` | 23 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/ci.yml` | 11 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/ci.yml` | 12 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/ci.yml` | 13 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/ci.yml` | 17 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/label-pr.yml` | 13 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/update-tokens.yml` | 14 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/update-tokens.yml` | 20 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| medium | medium | production | source | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/update-tokens.yml` | 24 | Workflow uses an action reference that is not pinned to a full 40-character commit SHA. |
| low | medium | production | source | `supply-chain.agent-instructions.hidden-unicode.variation-selector` | `CLAUDE.md` | 1 | Agent instruction file contains invisible or visually ambiguous Unicode that may hide instructions from human review. |
| high | high | production | source | `supply-chain.agent-instructions.prompt-exfiltration` | `CLAUDE.md` | 1 | Agent instruction file combines prompt-override language with secret access or external transmission cues. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `CLAUDE.md` | 154 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| low | medium | production | source | `supply-chain.container.mutable-image-ref` | `container/Dockerfile` | 13 | Container image reference is not pinned by digest. |
| high | high | production | source | `supply-chain.container.remote-build-script` | `container/Dockerfile` | 69 | Container build or compose command downloads remote code and executes it in the same step. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `groups/global/CLAUDE.md` | 1 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| high | medium | production | source | `supply-chain.agent-instructions.secret-access` | `groups/main/CLAUDE.md` | 1 | Agent instruction file references secrets together with command execution and network transfer primitives. |
| medium | medium | production | source | `supply-chain.package.lifecycle-script-risk` | `package.json` | 16 | Package lifecycle script executes during install or publish and should be reviewed for supply-chain risk. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `container/agent-runner/scripts/sdk-signal-probe.ts` | 109 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `container/agent-runner/scripts/sdk-signal-probe.ts` | 120 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `container/agent-runner/scripts/sdk-signal-probe.ts` | 145 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `container/agent-runner/src/db/messages-out.ts` | 51 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `container/agent-runner/src/db/messages-out.ts` | 52 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `container/agent-runner/src/index.ts` | 21 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `container/agent-runner/src/mcp-tools/interactive.ts` | 65 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `container/agent-runner/src/mcp-tools/interactive.ts` | 124 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `container/agent-runner/src/mcp-tools/self-mod.ts` | 37 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `container/agent-runner/src/scheduling/task-script.ts` | 7 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh` | 8 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh` | 14 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh` | 16 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `nanoclaw.sh` | 157 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `nanoclaw.sh` | 158 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `nanoclaw.sh` | 172 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `nanoclaw.sh` | 179 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `repo-tokens/action.yml` | 117 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `repo-tokens/action.yml` | 151 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `repo-tokens/action.yml` | 153 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `scripts/chat.ts` | 19 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `scripts/init-first-agent.ts` | 376 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `scripts/run-migrations.ts` | 89 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| medium | medium | test | source | `adaptability.hardcoded-platform-path` | `scripts/test-v2-agent.ts` | 10 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | test | source | `adaptability.hardcoded-platform-path` | `scripts/test-v2-channel-e2e.ts` | 13 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | test | source | `adaptability.hardcoded-timeout` | `scripts/test-v2-channel-e2e.ts` | 195 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | test | source | `adaptability.hardcoded-timeout` | `scripts/test-v2-channel-e2e.ts` | 205 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | test | source | `adaptability.hardcoded-timeout` | `scripts/test-v2-channel-e2e.ts` | 222 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| medium | medium | test | source | `adaptability.hardcoded-platform-path` | `scripts/test-v2-host.ts` | 15 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | test | source | `adaptability.hardcoded-timeout` | `scripts/test-v2-host.ts` | 108 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | test | source | `adaptability.hardcoded-timeout` | `scripts/test-v2-host.ts` | 128 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | test | source | `adaptability.hardcoded-timeout` | `scripts/test-v2-host.ts` | 136 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/add-telegram.sh` | 131 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/auto.ts` | 210 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/auto.ts` | 777 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | 10 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | 17 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/discord.ts` | 35 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/discord.ts` | 144 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | 176 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | 197 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/discord.ts` | 355 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/teams.ts` | 46 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/teams.ts` | 128 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/teams.ts` | 129 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/teams.ts` | 141 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/telegram.ts` | 49 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/channels/telegram.ts` | 175 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/channels/whatsapp.ts` | 378 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/container.ts` | 53 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/container.ts` | 132 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/install-claude.sh` | 32 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/install-docker.sh` | 26 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/install-docker.sh` | 34 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/install-node.sh` | 25 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/install-node.sh` | 33 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/lib/channels-remote.sh` | 36 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/lib/diagnostics.sh` | 14 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/lib/diagnostics.ts` | 14 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/lib/diagnostics.ts` | 61 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/lib/teams-manifest.ts` | 25 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/onecli.ts` | 132 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `setup/pair-telegram.ts` | 68 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/platform.ts` | 73 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/platform.ts` | 76 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/platform.ts` | 81 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/register-claude-token.sh` | 20 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/register-claude-token.sh` | 36 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/register-claude-token.sh` | 67 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/run-suggested.sh` | 5 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `setup/service.ts` | 86 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/service.ts` | 208 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/service.ts` | 214 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/service.ts` | 291 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/service.ts` | 295 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `setup/service.ts` | 380 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `setup/whatsapp-auth.ts` | 137 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `src/channels/chat-sdk-bridge.ts` | 302 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `src/channels/chat-sdk-bridge.ts` | 528 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `src/container-runner.ts` | 257 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `src/container-runner.ts` | 259 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `src/container-runner.ts` | 460 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `src/container-runner.ts` | 483 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-timeout` | `src/container-runtime.ts` | 40 | Static timeout rigidity: Fixed timeout literals can be too small for large repos or too large for hostile inputs; adaptive policy should own the value. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `src/db/session-db.ts` | 82 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `src/delivery.ts` | 32 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `src/host-sweep.ts` | 57 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| medium | medium | production | source | `adaptability.hardcoded-platform-path` | `src/modules/permissions/user-dm.ts` | 30 | Platform portability rigidity: Hardcoded platform paths or target triples can make local, CI, and customer installations fail outside the developer's machine. |
| low | medium | production | source | `adaptability.hardcoded-resource-cap` | `src/modules/self-mod/request.ts` | 33 | Static resource-cap rigidity: Fixed caps and batch sizes can silently limit scale or waste memory when repo size and hardware vary. |
| low | medium | production | source | `adaptability.hardcoded-external-endpoint` | `src/webhook-server.ts` | 35 | Service binding rigidity: Hardcoded service endpoints reduce offline tolerance, testability, customer deployment flexibility, and failover options. |
| high | medium | production | source | `bash.command-substitution-injection` | `setup/add-telegram.sh` | 130 | Command substitution with potential injection |
| error | high | production | source | `js.child-process-exec.tainted` | `setup/verify.ts` | 263 | child_process exec with tainted command |
| error | high | production | source | `js.child-process-exec.tainted` | `setup/verify.ts` | 263 | child_process exec with tainted command |
| error | high | production | source | `js.child-process-exec.tainted` | `setup/verify.ts` | 263 | child_process exec with tainted command |

## Top Risks

| File | Risk | Complexity | Churn | Coupling | Centrality |
|------|------|------------|-------|----------|------------|
| `src/channels/chat-sdk-bridge.ts` | 0.79 | 5.0 | 0.0 | 1.4 | 0.6 |
| `container/agent-runner/scripts/sdk-signal-probe.ts` | 0.76 | 4.7 | 0.0 | 0.6 | 0.6 |
| `container/agent-runner/src/formatter.ts` | 0.69 | 5.0 | 0.0 | 1.2 | 0.6 |
| `setup/whatsapp-auth.ts` | 0.67 | 5.0 | 0.0 | 2.7 | 0.6 |
| `scripts/init-first-agent.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `setup/index.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `setup/lib/tz-from-claude.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `src/container-runner.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `src/host-sweep.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `src/modules/approvals/primitive.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `src/modules/permissions/index.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `src/modules/approvals/onecli-approvals.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `container/agent-runner/src/mcp-tools/interactive.ts` | 0.65 | 5.0 | 0.0 | 3.0 | 0.6 |
| `src/webhook-server.ts` | 0.64 | 5.0 | 0.0 | 2.2 | 0.6 |
| `src/delivery.ts` | 0.63 | 5.0 | 0.0 | 2.8 | 0.6 |
| `src/router.ts` | 0.63 | 5.0 | 0.0 | 2.8 | 0.6 |
| `src/index.ts` | 0.63 | 4.8 | 0.0 | 3.0 | 0.6 |
| `container/agent-runner/src/mcp-tools/core.ts` | 0.62 | 5.0 | 0.0 | 2.7 | 0.6 |
| `src/channels/cli.ts` | 0.61 | 5.0 | 0.0 | 2.5 | 0.6 |
| `src/session-manager.ts` | 0.61 | 5.0 | 0.0 | 2.5 | 0.6 |

## Action Items

| Priority | Category | Issue | File | Action |
|----------|----------|-------|------|--------|
| 1 | security | `js.child-process-exec.tainted` | `setup/verify.ts` | replace |
| 2 | security | `supply-chain.container.remote-build-script` | `container/Dockerfile` | Replace remote installer pipes with pinned package-manager steps or verified downloads with checksum/signature validation before execution. |
| 3 | security | `bash.command-substitution-injection` | `setup/add-telegram.sh` | validate |
| 4 | security | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/bump-version.yml` | Pin third-party actions to a reviewed full commit SHA and update them through an intentional process. |
| 4 | security | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/ci.yml` | Pin third-party actions to a reviewed full commit SHA and update them through an intentional process. |
| 4 | security | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/label-pr.yml` | Pin third-party actions to a reviewed full commit SHA and update them through an intentional process. |
| 4 | security | `supply-chain.workflow.mutable-action-ref` | `.github/workflows/update-tokens.yml` | Pin third-party actions to a reviewed full commit SHA and update them through an intentional process. |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `container/agent-runner/src/index.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `container/entrypoint.sh` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `nanoclaw.sh` | externalize_or_normalize_path |
| 4 | security | `supply-chain.package.lifecycle-script-risk` | `package.json` | Avoid install-time side effects where possible; otherwise keep lifecycle scripts minimal, reviewed, and covered by provenance controls. |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/auto.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/auto.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/channels/discord.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/container.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/platform.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/register-claude-token.sh` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/register-claude-token.sh` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/run-suggested.sh` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/service.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `setup/service.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `src/container-runner.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `src/container-runner.ts` | externalize_or_normalize_path |
| 4 | adaptability | `adaptability.hardcoded-platform-path` | `src/modules/permissions/user-dm.ts` | externalize_or_normalize_path |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/config.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/db/connection.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/db/messages-in.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/db/messages-out.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/db/session-routing.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/db/session-state.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/destinations.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/formatter.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/mcp-tools/agents.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/mcp-tools/core.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/mcp-tools/interactive.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/mcp-tools/scheduling.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/mcp-tools/self-mod.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/mcp-tools/types.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/poll-loop.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/providers/claude.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/providers/factory.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/providers/mock.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/providers/provider-registry.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/providers/types.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/scheduling/task-script.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `container/agent-runner/src/timezone.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `scripts/chat.ts` | review_or_remove |
| 4 | architecture | `orphaned_module` | `scripts/init-cli-agent.ts` | review_or_remove |

---
*Generated by DaVinci v0.3.0 — schema 2.37.0*