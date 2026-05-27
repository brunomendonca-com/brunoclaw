# DaVinci Repo Dossier

Repository path: `[repo]`
Profile: `exhaustive`
Scope: `Full`
Boundary: deterministic engineering-readiness evidence, not an LLM semantic summary or exploitability verdict.

## Readiness

| Field | Value |
|---|---|
| stage | active_development |
| recommendation | continue_with_backlog |
| confidence | medium |
| why | Repo appears in progress; evidence supports a prioritized backlog rather than release judgment. |
| primary_user_goal | Use the engineering backlog and AI next-read plan to guide development. |

## Maturity

| Metric | Value |
|---|---:|
| maturity_score | 69.05 |
| documentation_score | 95.0 |
| test_score | 73.86 |
| ci_score | 30.0 |
| packaging_score | 87.0 |
| structure_score | 70.0 |
| coverage_score | 100.0 |
| risk_adjusted_score | 47.16 |

## Risk Context

| Metric | Value |
|---|---:|
| health_score | 50.0 |
| findings_total | 180 |
| production_findings | 126 |
| high_or_error_findings | 71 |
| supply_chain_findings | 67 |
| degradation_events | 0 |
| hotspots | 0 |
| cycles | 0 |

## Engineering Backlog Themes

| theme | priority | finding_count | high_or_error_count | representative_rule | recommended_action |
|---|---|---|---|---|---|
| supply_chain_and_ci | 1 | 67 | 50 | supply-chain.agent-instructions.secret-access | Pin mutable workflow/action/container references, review publish paths, and add provenance controls. |
| secrets_hygiene | 1 | 5 | 4 | secret.generic-api-key | Validate whether hits are real secrets, rotate exposed credentials, and suppress only verified placeholders or generated report copies. |
| command_execution_risk | 2 | 13 | 13 | bash.command-substitution-injection | Remove shell interpolation where possible; otherwise isolate, allowlist, and quote arguments. |
| input_and_injection_risk | 2 | 4 | 4 | js.ssrf-fetch | Trace inputs to sinks and replace string-built queries/HTML/URLs with safe APIs. |
| adaptability_and_resilience | 2 | 91 | 0 | adaptability.hardcoded-external-endpoint | Move fixed paths, endpoints, timeouts, and resource caps behind policy/config, and prefer degradation over fail-fast behavior. |

## AI Next-Read Plan

| path | reason | source |
|---|---|---|
| src/channels/chat-sdk-bridge.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| container/agent-runner/scripts/sdk-signal-probe.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| container/agent-runner/src/formatter.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| setup/whatsapp-auth.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| scripts/init-first-agent.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| setup/index.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| setup/lib/tz-from-claude.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| src/container-runner.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| src/host-sweep.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| src/modules/approvals/primitive.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| src/modules/permissions/index.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| src/modules/approvals/onecli-approvals.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| container/Dockerfile | Representative high finding `supply-chain.container.remote-build-script`. | high_severity_finding |
| nanoclaw.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| scripts/cleanup-sessions.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| setup.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| setup/add-telegram.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| setup/channels/discord.ts | Representative high finding `js.ssrf-fetch`. | high_severity_finding |
| setup/lib/diagnostics.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| setup/lib/diagnostics.ts | Representative high finding `js.ssrf-fetch`. | high_severity_finding |
| setup/probe.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| setup/register-claude-token.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| src/config.ts | Representative high finding `secret.generic-api-key`. | high_severity_finding |

## Recommendations

| priority | action | reason |
|---|---|---|
| 1 | triage_high_or_error_findings | 71 high/error findings need owner validation before productization. |
| 1 | review_supply_chain_exposure | 67 deterministic supply-chain exposure findings are present. |
| 2 | separate_primary_code_from_generated_reports | A large share of findings appears outside primary source. Review path context, suppress verified fixtures/generated artifacts, or use production scope for release review. |
| 3 | use_evidence_packs_before_editing | Treat findings as candidate evidence. Validate exploitability and path context before code changes. |
