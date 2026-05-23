/**
 * Step: groups — report platform chats discovered by host adapters.
 *
 * Adapters own platform-specific discovery and write canonical rows to
 * known_chats in data/v2.db. This setup step intentionally does not open a
 * second WhatsApp/Baileys socket or write legacy store/messages.db rows.
 */
import path from 'path';

import { DATA_DIR } from '../src/config.js';
import { closeDb, initDb } from '../src/db/connection.js';
import { listKnownChats } from '../src/db/known-chats.js';
import { runMigrations } from '../src/db/migrations/index.js';
import { log } from '../src/log.js';
import { emitStatus } from './status.js';

function parseArgs(args: string[]): { list: boolean; limit: number } {
  let list = false;
  let limit = 30;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list') list = true;
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
  }
  return { list, limit };
}

export async function run(args: string[]): Promise<void> {
  const { list, limit } = parseArgs(args);
  const db = initDb(path.join(DATA_DIR, 'v2.db'));
  runMigrations(db);

  try {
    const chats = listKnownChats({ isGroup: 1, limit });
    if (list) {
      for (const chat of chats) {
        console.log(`${chat.platform_id}|${chat.name ?? chat.platform_id}`);
      }
      return;
    }

    log.info('Group discovery uses canonical known_chats rows populated by channel adapters', {
      groupsInDb: chats.length,
    });
    emitStatus('SYNC_GROUPS', {
      BUILD: 'skipped',
      SYNC: 'adapter-managed',
      GROUPS_IN_DB: chats.length,
      STATUS: 'success',
      LOG: 'logs/setup.log',
    });
  } finally {
    closeDb();
  }
}
