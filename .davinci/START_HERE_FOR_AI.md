# Start Here For AI

Repository: `[repo]`

Profile: `exhaustive`  
Scope: `Full`  
Schema: `2.37.0`  
Duration: `1.19s`  
Files / LOC: `261` / `41584`  
Findings (production): `99`  
Findings (total): `161` (incl. `62` in tests/fixtures/docs)  
Health: `52/100`  
Index mode: `metadata` (`metadata_only`)

Supply-chain findings: `67` (`0` IOC hits, `0` optional evidence hits)

Degradation grade: `green` - No material bounded-analysis caveat was detected.

## Read Order

1. `repo.dossier.md` or `repo.dossier.json` for engineering readiness, lifecycle stage, maturity, backlog themes, and AI next-read plan.
2. `repo.brief.md` or `repo.brief.json` for repository orientation, purpose evidence, components, and read-first files.
3. `report.digest.json` for the smallest first-pass routing summary and context budget.
4. `decision.views.md` or `decision.views.json` for curated executive, AI, security, architecture, release, performance, and backlog views.
5. `report.agent.json` for compact action items, top findings, top risks, validated evidence summary, and token-efficient scan context.
6. `evidence.graph.json` for an evidence-focused graph of risky files, findings, symbols, wiring gaps, evidence packs, and supply-chain exposure.
7. `evidence.packs.json` when a finding needs grounding, false-positive context, or deterministic challenge evidence.
8. `report.lean.json` for compact structured filtering, scoring, and context-window planning.
9. `findings.sarif` for CI/security-tool ingestion.
10. `artifact-manifest.json` to verify which artifacts were refreshed by this scan and which optional artifacts may be stale.
11. `report.json` only when the compact artifacts do not contain enough evidence.

## Operating Rules

- Treat DaVinci artifacts as deterministic evidence and triage context, not final truth.
- Validate exploitability, false-positive likelihood, and path context before recommending code changes.
- Prefer compact artifacts before opening source files; use source only for files that the artifacts identify as relevant.
- Do not assume local search/vector artifacts exist unless index mode is `full`.

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
