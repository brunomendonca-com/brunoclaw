import type { Migration } from './index.js';

export const migration013: Migration = {
  version: 13,
  name: '013-known-chats',
  up(db) {
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
