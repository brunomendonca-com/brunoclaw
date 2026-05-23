#!/usr/bin/env bash
# ZiBot-specific host restore wrapper for the current v2 layout.
#
# Run this from the NanoClaw repo root:
#   chmod +x generated/restore_zibot_v2_host_patch.sh
#   bash generated/restore_zibot_v2_host_patch.sh
#
# Optional overrides:
#   LEGACY_DB=/path/to/store/messages.db
#   V2_DB=/path/to/data/v2.db
#   ZIBOT_DRIVE_PATH="$HOME/My Drive/Agents/Zibot"
#   ZIBOT_GROUP_JID="1203...@g.us"   # required only if the legacy row is missing
#   ZIBOT_TRIGGER="@Zibot"
#   ZIBOT_FORCE=1
#   DRY_RUN=1
#
# What this wrapper does:
#   1) verifies/repairs the legacy `registered_groups` row for whatsapp_zibot
#      (and can create it if `ZIBOT_GROUP_JID` is provided)
#   2) runs the generic v1 -> v2 restore flow
#   3) ensures ZiBot-specific brain / CLAUDE.local.md files exist
#
# This keeps the generic restore logic as the source of truth for v2 wiring,
# while still healing the one legacy row that earlier migration attempts often
# missed.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

LEGACY_DB="${LEGACY_DB:-$REPO_ROOT/store/messages.db}"
V2_DB="${V2_DB:-$REPO_ROOT/data/v2.db}"
DRIVE_PATH="${ZIBOT_DRIVE_PATH:-$HOME/My Drive/Agents/Zibot}"
GROUP_JID="${ZIBOT_GROUP_JID:-}"
TRIGGER="${ZIBOT_TRIGGER:-@Zibot}"
FORCE="${ZIBOT_FORCE:-0}"
DRY_RUN="${DRY_RUN:-0}"

cd "$REPO_ROOT"

GROUP_FOLDER="whatsapp_zibot"
GROUP_NAME="ZiBot"

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: python3 is required on the host."
  exit 1
fi

python3 - "$LEGACY_DB" "$GROUP_FOLDER" "$GROUP_NAME" "$GROUP_JID" "$TRIGGER" "$DRY_RUN" <<'PY'
import json
import sqlite3
import sys
from datetime import datetime, timezone

(db_path, group_folder, group_name, group_jid, trigger, dry_run) = sys.argv[1:7]

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()
cols = [row[1] for row in cur.execute("PRAGMA table_info(registered_groups)").fetchall()]
if not cols:
    print("ERROR: registered_groups table not found in legacy database")
    sys.exit(2)

row = cur.execute("SELECT * FROM registered_groups WHERE folder = ?", (group_folder,)).fetchone()
if row is None:
    if not group_jid:
        print(f"ERROR: group '{group_folder}' is not registered and ZIBOT_GROUP_JID was not provided.")
        print("Set ZIBOT_GROUP_JID to the real WhatsApp group JID and rerun the script.")
        sys.exit(3)
    payload = {
        "jid": group_jid,
        "name": group_name,
        "folder": group_folder,
        "trigger_pattern": trigger,
        "added_at": datetime.now(timezone.utc).isoformat(),
        "container_config": json.dumps({
            "additionalMounts": [{"hostPath": "~/My Drive/Agents/Zibot", "containerPath": "drive", "readonly": False}]
        }),
        "requires_trigger": 1,
        "is_main": 0,
        "group_settings": None,
    }
    keys = [key for key in payload if key in cols]
    sql = f"INSERT INTO registered_groups ({', '.join(keys)}) VALUES ({', '.join(['?'] * len(keys))})"
    if dry_run == '1':
        print(f"would create missing legacy row for {group_folder} ({group_jid})")
    else:
        cur.execute(sql, [payload[key] for key in keys])
        conn.commit()
        print(f"created missing legacy row for {group_folder} ({group_jid})")
else:
    updates = []
    params = []
    for key, value in (("name", group_name), ("trigger_pattern", trigger), ("jid", group_jid or None)):
        if key in cols and value:
            updates.append(f"{key} = ?")
            params.append(value)
    if updates:
        params.append(group_folder)
        if dry_run == '1':
            print(f"would refresh legacy row metadata for {group_folder}")
        else:
            cur.execute(f"UPDATE registered_groups SET {', '.join(updates)} WHERE folder = ?", params)
            conn.commit()
            print(f"refreshed legacy row metadata for {group_folder}")

conn.close()
PY

ASSISTANT_NAME="$GROUP_NAME" \
AGENT_NAME="$GROUP_NAME" \
LEGACY_DB="$LEGACY_DB" \
V2_DB="$V2_DB" \
DRIVE_PATH="$DRIVE_PATH" \
DRY_RUN="$DRY_RUN" \
bash generated/restore_legacy_group_v2_host.sh "$GROUP_FOLDER"

if [[ "$DRY_RUN" == "1" ]]; then
  exit 0
fi

python3 - "$REPO_ROOT" "$FORCE" <<'PY'
import sys
from pathlib import Path

repo_root = Path(sys.argv[1])
force = sys.argv[2] == "1"
group_dir = repo_root / "groups" / "whatsapp_zibot"

def ensure_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and not force:
        print(f"kept existing {path}")
        return
    path.write_text(content, encoding="utf-8")
    print(f"wrote {path}")

claude_local = """# ZiBot

## Identity
- You are ZiBot, the WhatsApp assistant for Bruno / Alziro / Gávea Arquitetura.
- Your job is project-operations support for real AEC workflows.

## Language
- Default to Brazilian Portuguese.
- Match the user's language if they write in English.

## Behavior
- Treat voice notes as common and important.
- Respect quoted and replied WhatsApp messages as context.
- Prefer structured outputs for budgets, supplier lists, reports, and summaries.
- Offer CSV, MD, and PDF variants when useful.

## Storage
- Use only ZiBot's own group history and files by default.
- Do not cross-search other groups unless the main/admin flow explicitly authorizes it.
- Keep notes in the local `brain/` folder for this group only.

## Drive
- ZiBot's shared Drive folder is mounted at `/workspace/extra/drive`.
- Use it for project files, budgets, PDFs, and shared docs.

## Memory
- If a task is worth keeping, save it into `brain/wiki/` and update `brain/index.md` and `brain/log.md`.
"""

index_md = """# ZiBot Brain Index

This is ZiBot's isolated group brain.

## Current sections
- `wiki/` - topic articles
- `brain/log.md` - append-only activity log

## Notes
- ZiBot is the AEC/project-ops bot for Bruno / Alziro / Gávea Arquitetura.
- Use group-local search and memory only.
"""

log_md = """# ZiBot Brain Log

- Initialized ZiBot brain structure.
"""

ensure_file(group_dir / "CLAUDE.local.md", claude_local)
ensure_file(group_dir / "brain/index.md", index_md)
ensure_file(group_dir / "brain/log.md", log_md)
(group_dir / "brain/wiki").mkdir(parents=True, exist_ok=True)
print(f"ensured {group_dir / 'brain/wiki'}")
PY

echo
echo "Next step: restart NanoClaw so the restored config is loaded."
