# Start Here For AI

Repository: `[repo]`

Profile: `exhaustive`  
Scope: `Full`  
Schema: `2.33.0`  
Duration: `1.56s`  
Files / LOC: `260` / `41581`  
Findings: `175`  
Health: `50/100`  
Index mode: `full` (`full`)

Supply-chain findings: `67` (`0` IOC hits, `0` optional evidence hits)

## Read Order

1. `repo.dossier.md` or `repo.dossier.json` for engineering readiness, lifecycle stage, maturity, backlog themes, and AI next-read plan.
2. `repo.brief.md` or `repo.brief.json` for repository orientation, purpose evidence, components, and read-first files.
3. `report.digest.json` for the smallest first-pass routing summary and context budget.
4. `report.agent.json` for compact action items, top findings, top risks, validated evidence summary, and token-efficient scan context.
5. `evidence.graph.json` for an evidence-focused graph of risky files, findings, symbols, wiring gaps, evidence packs, and supply-chain exposure.
6. `evidence.packs.json` when a finding needs grounding, false-positive context, or deterministic challenge evidence.
7. `report.lean.json` for compact structured filtering, scoring, and context-window planning.
8. `findings.sarif` for CI/security-tool ingestion.
9. `artifact-manifest.json` to verify which artifacts were refreshed by this scan and which optional artifacts may be stale.
10. `report.json` only when the compact artifacts do not contain enough evidence.

## Operating Rules

- Treat DaVinci artifacts as deterministic evidence and triage context, not final truth.
- Validate exploitability, false-positive likelihood, and path context before recommending code changes.
- Prefer compact artifacts before opening source files; use source only for files that the artifacts identify as relevant.
- Do not assume local search/vector artifacts exist unless index mode is `full`.

## Coverage And Caveats

| Metric | Value |
|--------|------:|
| Selected files | 260 |
| Loaded files | 260 |
| Loaded LOC | 41581 |
| Loaded bytes | 1572495 |
| Parsed files | 260 |
| Parse-skipped files | 0 |
| Source-load skipped files | 0 |
| Source-load failed files | 0 |
| Security-scan degraded files | 0 |
| Security-scan skipped files | 0 |
| Source-load coverage | 100.00% |
| Parse coverage | 100.00% |
| Exact degradation events | 0 |
| Retained degradation events | 0 |
| Event detail truncated | false |
| Index mode | `full` |
| Index status | `full` |

Caveats:
- DaVinci evidence is deterministic scan context, not final exploitability judgment.
- Findings in tests, fixtures, generated code, vendored code, examples, or docs should be reviewed with that path context.
- Degradation counts should be interpreted with file denominators above; a high event count can still represent a bounded subset of loaded files.
