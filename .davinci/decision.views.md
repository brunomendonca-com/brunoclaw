# DaVinci Decision Views

Boundary: curated deterministic views over scan evidence. Use `report.json` for full evidence.

## Scale

| Metric | Value |
|---|---:|
| class | medium |
| selected_files | 261 |
| loaded_lines | 41584 |
| findings | 161 |
| degradation_events | 0 |

Reason: The report is compact enough for normal triage, but decision views still reduce repeated reading.

## Coverage Quality

| Metric | Value |
|---|---|
| Grade | `green` |
| Grade reason | No material bounded-analysis caveat was detected. |
| Integrity grade | `green` |
| Coverage grade | `green` |
| Source load coverage | 100.0% (261/261 files) |
| Parse coverage | 100.0% (261/261 loaded files) |
| Affected file upper bound | 0 files (0.0% of selected) |
| Event detail truncated | false |

## Executive Snapshot

| Field | Value |
|---|---|
| Verdict | `fix_now` |
| Recommendation | Assign the fix-now queue before broad refactoring or roadmap work. |
| Why | DaVinci found high-confidence or high-priority evidence in production-weighted paths. |
| Next gate | Open report.agent.json and evidence.packs.json for the top fix-now items. |

| Actionability | Count |
|---|---:|
| `fix_now` | 3 |
| `investigate` | 29 |
| `review_evidence` | 18 |
| `unknown` | 0 |

### Owner-Ready Top Actions

| Priority | Actionability | Owner | File | Issue | Next step |
|---:|---|---|---|---|---|
| 1 | `fix_now` | `security_owner_or_service_owner` | `setup/verify.ts` | `js.child-process-exec.tainted` | Validate the evidence, confirm runtime reachability, apply `replace`, and add or update the narrowest regression test. |
| 2 | `fix_now` | `release_or_security_owner` | `container/Dockerfile` | `supply-chain.container.remote-build-script` | Confirm the workflow or release path is intentional, verify provenance and permission boundaries, then apply `Replace remote installer pipes with pinned package-manager steps or verified downloads with checksum/signature validation before execution.` if exposure is broader than needed. |
| 3 | `fix_now` | `security_owner_or_service_owner` | `setup/add-telegram.sh` | `bash.command-substitution-injection` | Validate the evidence, confirm runtime reachability, apply `validate`, and add or update the narrowest regression test. |
| 4 | `investigate` | `release_or_security_owner` | `.github/workflows/bump-version.yml` | `supply-chain.workflow.mutable-action-ref` | Confirm the workflow or release path is intentional, verify provenance and permission boundaries, then apply `Pin third-party actions to a reviewed full commit SHA and update them through an intentional process.` if exposure is broader than needed. |
| 4 | `investigate` | `release_or_security_owner` | `.github/workflows/ci.yml` | `supply-chain.workflow.mutable-action-ref` | Confirm the workflow or release path is intentional, verify provenance and permission boundaries, then apply `Pin third-party actions to a reviewed full commit SHA and update them through an intentional process.` if exposure is broader than needed. |

## Executive

- Goal: Decide whether the repo is low-risk, needs triage, or needs deeper review.
- Use when: Leadership, portfolio review, or first-pass AI routing.
- Read: `START_HERE_FOR_AI.md, report.digest.json, repo.dossier.md, decision.views.json`

## AI First Read

- Goal: Choose the smallest justified artifact and source-file set before an AI opens raw code.
- Use when: AI coding assistant, MCP client, IDE wrapper, or reviewer bot needs repo context.
- Read: `START_HERE_FOR_AI.md, repo.dossier.json, repo.brief.json, report.digest.json, report.agent.json, evidence.packs.json, evidence.graph.json`

## Security Triage

- Goal: Find production-actionable security candidates and supporting evidence.
- Use when: Security triage, release review, CI gating, or remediation planning.
- Read: `report.agent.json, evidence.packs.json, findings.sarif, report.lean.json`

## Architecture And Wiring

- Goal: Understand graph hotspots, wiring gaps, import cycles, and blast-radius candidates.
- Use when: Architecture review, refactoring planning, or PR impact analysis.
- Read: `evidence.graph.json, repo.brief.json, repo.dossier.json, report.agent.json`

## Supply Chain And Release

- Goal: Review workflow, package, container, provenance, and release-exposure evidence.
- Use when: Before trusting CI, publishing, installer, or agent-instruction paths.
- Read: `report.agent.json, findings.sarif, evidence.packs.json, report.json`

## Performance And Coverage

- Goal: Decide whether scan quality is sufficient or a deeper budget/profile is justified.
- Use when: Large repos, warm/cold comparisons, or scans with high-looking degradation counts.
- Read: `report.digest.json, report.agent.json, artifact-write-timings.json, artifact-manifest.json, report.json`

## Remediation Backlog

- Goal: Turn findings and risks into a bounded, ordered remediation backlog.
- Use when: Sprint planning, cleanup passes, and AI-assisted issue decomposition.
- Read: `report.agent.json, evidence.packs.json, repo.dossier.json, report.lean.json`


## Previous Scan Comparison

Verdict: `improved` - Health improved without adding production or high/error production evidence.

| Metric | Previous | Current | Delta |
|---|---:|---:|---:|
| Health | 50.0 | 52.0 | 2.0 |
| Findings | 175 | 161 | -14 |
| Production findings | 122 | 99 | -23 |
| High/error production findings | - | 5 | - |
| Degradations | 0 | 0 | 0 |
| Supply-chain findings | 67 | 67 | 0 |
| Loaded LOC | 41581 | 41584 | 3 |
| Duration seconds | 1.56 | 1.19 | -0.37 |
