import type Database from 'better-sqlite3';

import type { Migration } from './index.js';

function hasColumn(db: Database.Database, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

export const migration013: Migration = {
  version: 13,
  name: '013-main-groups-known-chats',
  up(db) {
    if (!hasColumn(db, 'agent_groups', 'is_main')) {
      db.exec(`ALTER TABLE agent_groups ADD COLUMN is_main INTEGER NOT NULL DEFAULT 0;`);
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_agent_groups_is_main ON agent_groups(is_main);`);

    db.exec(`
      CREATE TABLE IF NOT EXISTS known_chats (
        channel_type TEXT NOT NULL,
        platform_id  TEXT NOT NULL,
        name         TEXT,
        is_group     INTEGER NOT NULL DEFAULT 0,
        last_seen    TEXT NOT NULL,
        PRIMARY KEY (channel_type, platform_id)
      );
      CREATE INDEX IF NOT EXISTS idx_known_chats_name ON known_chats(channel_type, is_group, name);
      CREATE INDEX IF NOT EXISTS idx_known_chats_last_seen ON known_chats(last_seen DESC);
    `);
  },
};
