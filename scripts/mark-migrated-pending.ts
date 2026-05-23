import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const DATA_DIR = path.join(process.cwd(), 'data');
const V2_SESSIONS_DIR = path.join(DATA_DIR, 'v2-sessions');

function main() {
  if (!fs.existsSync(V2_SESSIONS_DIR)) {
    console.error(`V2 sessions directory not found at ${V2_SESSIONS_DIR}`);
    return;
  }

  const agentGroups = fs.readdirSync(V2_SESSIONS_DIR);

  for (const agId of agentGroups) {
    const agPath = path.join(V2_SESSIONS_DIR, agId);
    if (!fs.statSync(agPath).isDirectory()) continue;

    const sessions = fs.readdirSync(agPath);
    for (const sessId of sessions) {
      const sessPath = path.join(agPath, sessId);
      if (!fs.statSync(sessPath).isDirectory()) continue;

      const inDbPath = path.join(sessPath, 'inbound.db');
      if (fs.existsSync(inDbPath)) {
        console.log(`Processing ${inDbPath}...`);
        const db = new Database(inDbPath);
        
        // Mark all messages as pending so the agent can see them.
        // We only mark 'completed' ones to avoid re-triggering actually pending ones
        // although in this context they should all be the ones we migrated.
        const result = db.prepare("UPDATE messages_in SET status = 'pending' WHERE status = 'completed'").run();
        console.log(`  Updated ${result.changes} messages to pending.`);
        
        db.close();
      }
    }
  }

  console.log('Finished marking messages as pending.');
}

main();
