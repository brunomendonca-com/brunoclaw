#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

LEGACY_DB="${LEGACY_DB:-$REPO_ROOT/store/messages.db}"
V2_DB="${V2_DB:-$REPO_ROOT/data/v2.db}"
DRY_RUN="${DRY_RUN:-0}"
ZIBOT_DRIVE_PATH="${ZIBOT_DRIVE_PATH:-$HOME/My Drive/Agents/Zibot}"

if [[ ! -f "$LEGACY_DB" ]]; then
  echo "ERROR: legacy database not found: $LEGACY_DB"
  exit 1
fi

if [[ ! -f "$V2_DB" ]]; then
  echo "ERROR: v2 database not found: $V2_DB"
  exit 1
fi

cd "$REPO_ROOT"

LEGACY_FOLDERS=()
while IFS= read -r folder; do
  [[ -n "$folder" ]] && LEGACY_FOLDERS+=("$folder")
done < <(sqlite3 "$LEGACY_DB" "select folder from registered_groups order by is_main desc, folder;")

echo "Legacy groups:"
printf '  %s\n' "${LEGACY_FOLDERS[@]}"
echo

echo "Already present in v2:"
sqlite3 -line "$V2_DB" "select folder from agent_groups order by folder;" | sed 's/^folder = /  /' || true
echo

for folder in "${LEGACY_FOLDERS[@]}"; do
  echo "==> Restoring $folder"
  if [[ "$folder" == "whatsapp_zibot" ]]; then
    LEGACY_DB="$LEGACY_DB" \
    V2_DB="$V2_DB" \
    ZIBOT_DRIVE_PATH="$ZIBOT_DRIVE_PATH" \
    DRY_RUN="$DRY_RUN" \
    bash generated/restore_zibot_v2_host_patch.sh
  else
    LEGACY_DB="$LEGACY_DB" \
    V2_DB="$V2_DB" \
    DRY_RUN="$DRY_RUN" \
    bash generated/restore_legacy_group_v2_host.sh "$folder"
  fi
  echo
done

echo "Finished."
