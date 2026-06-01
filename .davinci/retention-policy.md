# DaVinci Retention Policy

Storage model: `local_first`
Artifact root: `C:\tmp\brunoclaw-davinci-pr\.davinci`
Path mode: `redacted`

## What Artifacts May Contain

- repository file paths
- security and architecture findings
- bounded source excerpts and evidence snippets
- dependency and supply-chain metadata
- scan timing, health, and degradation metadata

## Local Default

- Artifacts: `retained_until_operator_deletes_artifact_directory`
- Output-scoped index/cache: `retained_under_artifact_root_when_index_mode_metadata_or_full`
- Heavy-scan cache: `retained_under_artifact_root_for_warm_scans`

## Cleanup

- Preview: `davinci clean --root <repo> --artifact-root .davinci --dry-run`
- Delete: `davinci clean --root <repo> --artifact-root .davinci --yes`

## Ephemeral Mode

`--no-persist` / `--ephemeral` uses a temporary output directory for scan index/cache state and deletes it on command exit; no canonical artifact directory is written.
Dependency mode requirement: `cache-only_or_none`.

This local CLI policy does not define hosted or CI artifact retention. CI uploads, sync providers, and hosted services need separate retention settings.