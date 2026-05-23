#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

GROUP_FOLDER="${1:-${GROUP_FOLDER:-}}"
LEGACY_DB="${LEGACY_DB:-$REPO_ROOT/store/messages.db}"
V2_DB="${V2_DB:-$REPO_ROOT/data/v2.db}"
DRIVE_PATH="${DRIVE_PATH:-}"
ASSISTANT_NAME="${ASSISTANT_NAME:-}"
AGENT_NAME="${AGENT_NAME:-}"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "$GROUP_FOLDER" ]]; then
  echo "Usage:"
  echo "  bash generated/restore_legacy_group_v2_host.sh <group-folder>"
  echo
  echo "Optional env vars:"
  echo "  LEGACY_DB=/path/to/store/messages.db"
  echo "  V2_DB=/path/to/data/v2.db"
  echo "  DRIVE_PATH=\$HOME/My Drive/Agents/Zibot"
  echo "  ASSISTANT_NAME=ZiBot"
  echo "  AGENT_NAME=ZiBot"
  echo "  DRY_RUN=1"
  exit 2
fi

cd "$REPO_ROOT"

ARGS=(
  --folder "$GROUP_FOLDER"
  --legacy-db "$LEGACY_DB"
  --v2-db "$V2_DB"
)

if [[ -n "$DRIVE_PATH" ]]; then
  ARGS+=(--drive-path "$DRIVE_PATH")
fi

if [[ -n "$ASSISTANT_NAME" ]]; then
  ARGS+=(--assistant-name "$ASSISTANT_NAME")
fi

if [[ -n "$AGENT_NAME" ]]; then
  ARGS+=(--agent-name "$AGENT_NAME")
fi

if [[ "$DRY_RUN" == "1" ]]; then
  ARGS+=(--dry-run)
fi

node --import tsx scripts/restore-legacy-group.ts "${ARGS[@]}"
