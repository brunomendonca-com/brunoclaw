# DaVinci Repo Dossier

Repository path: `[repo]`
Profile: `exhaustive`
Scope: `Full`
Boundary: deterministic engineering-readiness evidence, not an LLM semantic summary or exploitability verdict.

## Review Posture

| Field | Value |
|---|---|
| headline | Production high/error findings dominate the next review step. |
| owner_focus | Start with production high/error evidence packs and assign owners only after exploitability review. |
| release_gate | blocked_until_production_high_or_error_review |
| ai_reader_warning | Do not treat total finding counts as release risk without path context; non-production high/error evidence is separated in this dossier. |

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
| maturity_score | 70.94 |
| documentation_score | 95.0 |
| test_score | 79.47 |
| ci_score | 30.0 |
| packaging_score | 87.0 |
| structure_score | 70.0 |
| coverage_score | 100.0 |
| risk_adjusted_score | 51.8 |

## Risk Context

| Metric | Value |
|---|---:|
| health_score | 52.0 |
| findings_total | 161 |
| production_findings | 99 |
| high_or_error_findings | 54 |
| high_or_error_findings_production | 5 |
| high_or_error_findings_non_production | 49 |
| supply_chain_findings | 67 |
| degradation_events | 0 |
| hotspots | 0 |
| cycles | 0 |

## Engineering Backlog Themes

| theme | priority | finding_count | high_or_error_count | representative_rule | recommended_action |
|---|---|---|---|---|---|
| supply_chain_and_ci | 1 | 67 | 50 | supply-chain.agent-instructions.secret-access | Pin mutable workflow/action/container references, review publish paths, and add provenance controls. |
| command_execution_risk | 2 | 4 | 4 | js.child-process-exec.tainted | Remove shell interpolation where possible; otherwise isolate, allowlist, and quote arguments. |
| adaptability_and_resilience | 2 | 90 | 0 | adaptability.hardcoded-external-endpoint | Move fixed paths, endpoints, timeouts, and resource caps behind policy/config, and prefer degradation over fail-fast behavior. |

## AI Next-Read Plan

| id | path | reason | source |
|---|---|---|---|
| dossier.read_first.e067c7193480 | src/channels/chat-sdk-bridge.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.314af73f0b7a | container/agent-runner/scripts/sdk-signal-probe.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.4908219c3804 | container/agent-runner/src/formatter.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.7bb18cc02740 | setup/whatsapp-auth.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.8d8e5c90c95d | scripts/init-first-agent.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.1567833594c8 | setup/index.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.b50d62ac2d01 | setup/lib/tz-from-claude.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.25ade8e01bf6 | src/container-runner.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.bf8e38f3102c | src/host-sweep.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.3a0a79d36b20 | src/modules/approvals/primitive.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.6388aac9951f | src/modules/permissions/index.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.bcb2f4e95579 | src/modules/approvals/onecli-approvals.ts | High deterministic file risk score; inspect before broad source reading. | top_risk |
| dossier.read_first.32221c0c5aee | container/Dockerfile | Representative high finding `supply-chain.container.remote-build-script`. | high_severity_finding |
| dossier.read_first.1f87c4d41238 | setup/add-telegram.sh | Representative high finding `bash.command-substitution-injection`. | high_severity_finding |
| dossier.read_first.79b586e999d0 | setup/verify.ts | Representative error finding `js.child-process-exec.tainted`. | high_severity_finding |

## Recommendations

| id | priority | action | reason |
|---|---|---|---|
| dossier.rec.review_supply_chain_exposure | 1 | review_supply_chain_exposure | 67 deterministic supply-chain exposure findings are present. |
| dossier.rec.triage_production_high_or_error | 1 | triage_production_high_or_error_findings | 5 production high/error findings need owner validation before productization. |
| dossier.rec.separate_primary_from_noise | 2 | separate_primary_code_from_generated_reports | A large share of findings appears outside primary source. Review path context, suppress verified fixtures/generated artifacts, or use production scope for release review. |
| dossier.rec.review_non_production_high_or_error | 3 | review_non_production_high_or_error_context | 49 high/error findings are outside production context; validate fixtures, docs, generated reports, or tests before assigning remediation. |
| dossier.rec.use_evidence_packs_before_editing | 3 | use_evidence_packs_before_editing | Treat findings as candidate evidence. Validate exploitability and path context before code changes. |
