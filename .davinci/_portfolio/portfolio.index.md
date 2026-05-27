# DaVinci Portfolio Index

Boundary: deterministic portfolio assessment over existing DaVinci artifacts. It ranks engineering attention but does not replace owner decisions.

## Summary

| Metric | Value |
|---|---:|
| repos | 1 |
| files | 260 |
| loaded_lines | 41581 |
| findings | 180 |
| supply_chain_findings | 67 |
| degradation_events | 0 |
| average_health | 50.0 |

## Repo Readiness

| Repo | Stage | Recommendation | Health | Maturity | Findings | High/Error | Supply Chain | Degradations | Dossier |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| [repo] | active_development | continue_with_backlog | 50.0 | 69.05 | 180 | 71 | 67 | 0 | [repo:_repo_] |

## Stage Counts

| Stage | Repos |
|---|---:|
| active_development | 1 |

## Aggregate Backlog Themes

| theme | priority | repo_count | finding_count | high_or_error_count | sample_repos |
|---|---|---|---|---|---|
| supply_chain_and_ci | 1 | 1 | 67 | 50 | [repo] |
| secrets_hygiene | 1 | 1 | 5 | 4 | [repo] |
| command_execution_risk | 2 | 1 | 13 | 13 | [repo] |

## Recommended Next Steps

| priority | action | why |
|---|---|---|
| 1 | review_supply_chain_and_ci_exposure | 67 supply-chain findings exist across the portfolio. |
| 2 | batch_triage_top_backlog_theme | Theme `supply_chain_and_ci` appears in 1 repo with 50 high/error findings. |

