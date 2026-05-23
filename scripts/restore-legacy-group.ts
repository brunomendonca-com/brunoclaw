import fs from 'fs';
import path from 'path';

import Database from 'better-sqlite3';

import { GROUPS_DIR } from '../src/config.js';
import { readContainerConfig, writeContainerConfig, type ContainerConfig } from '../src/container-config.js';
import { createAgentGroup, getAgentGroupByFolder, getAllAgentGroups, updateAgentGroup } from '../src/db/agent-groups.js';
import { initDb } from '../src/db/connection.js';
import {
  createMessagingGroup,
  createMessagingGroupAgent,
  getMessagingGroupAgentByPair,
  getMessagingGroupByPlatform,
} from '../src/db/messaging-groups.js';
import { runMigrations } from '../src/db/migrations/index.js';
import { getSession } from '../src/db/sessions.js';
import { initGroupFilesystem } from '../src/group-init.js';
import { createDestination, getDestinationByName, getDestinationByTarget, normalizeName } from '../src/modules/agent-to-agent/db/agent-destinations.js';
import { pauseTask, insertTask } from '../src/modules/scheduling/db.js';
import { openInboundDb, resolveSession, writeSessionRouting } from '../src/session-manager.js';
import type { MessagingGroup, MessagingGroupAgent } from '../src/types.js';

interface Args {
  folder: string;
  legacyDb: string;
  v2Db: string;
  drivePath: string | null;
  assistantName: string | null;
  agentName: string | null;
  dryRun: boolean;
}

interface LegacyGroupRow {
  jid: string;
  name: string;
  folder: string;
  trigger_pattern: string;
  added_at: string;
  container_config: string | null;
  requires_trigger: number | null;
  is_main: number | null;
  group_settings: string | null;
}

interface LegacyTaskRow {
  id: string;
  prompt: string;
  schedule_type: string;
  schedule_value: string;
  next_run: string | null;
  status: string;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    switch (key) {
      case '--folder':
        out.folder = val;
        i++;
        break;
      case '--legacy-db':
        out.legacyDb = val;
        i++;
        break;
      case '--v2-db':
        out.v2Db = val;
        i++;
        break;
      case '--drive-path':
        out.drivePath = val;
        i++;
        break;
      case '--assistant-name':
        out.assistantName = val;
        i++;
        break;
      case '--agent-name':
        out.agentName = val;
        i++;
        break;
      case '--dry-run':
        out.dryRun = true;
        break;
      default:
        break;
    }
  }

  if (!out.folder) {
    console.error('Usage: pnpm exec tsx scripts/restore-legacy-group.ts --folder <group-folder> [options]');
    process.exit(2);
  }

  return {
    folder: out.folder,
    legacyDb: out.legacyDb || path.join(process.cwd(), 'store', 'messages.db'),
    v2Db: out.v2Db || path.join(process.cwd(), 'data', 'v2.db'),
    drivePath: out.drivePath || null,
    assistantName: out.assistantName || null,
    agentName: out.agentName || null,
    dryRun: out.dryRun === true,
  };
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeChatName(chatName: string | null, row: LegacyGroupRow): string | null {
  if (!chatName) return null;
  const trimmed = chatName.trim();
  if (!trimmed || trimmed === row.jid || trimmed === row.folder || trimmed === row.name) return null;
  return trimmed;
}

function deriveAssistantName(row: LegacyGroupRow, chatName: string | null, override: string | null): string {
  if (override) return override;
  const normalizedChatName = normalizeChatName(chatName, row);
  const raw = row.trigger_pattern?.trim();
  if (raw) return raw.replace(/^@+/, '').trim() || raw;
  if (normalizedChatName) return normalizedChatName;
  if (row.name) return row.name;
  return row.folder;
}

function deriveAgentName(row: LegacyGroupRow, chatName: string | null, assistantName: string, override: string | null): string {
  if (override) return override;
  const normalizedChatName = normalizeChatName(chatName, row);
  if (normalizedChatName) return normalizedChatName;
  if (row.name && row.name !== row.folder) return row.name;
  return assistantName;
}

function deriveChannelType(folder: string, jid: string): string {
  if (jid.endsWith('@g.us') || jid.endsWith('@s.whatsapp.net')) return 'whatsapp';
  const idx = folder.indexOf('_');
  return idx === -1 ? 'unknown' : folder.slice(0, idx);
}

function deriveMessagingGroupName(chatName: string | null, row: LegacyGroupRow): string {
  return normalizeChatName(chatName, row) || row.name || row.folder;
}

function derivePolicy(row: LegacyGroupRow): MessagingGroup['unknown_sender_policy'] {
  if (row.is_main === 1 || row.requires_trigger === 0) return 'public';
  const jid = row.jid;
  return jid.endsWith('@g.us') ? 'public' : 'strict';
}

function deriveEngage(
  row: LegacyGroupRow,
  assistantName: string,
  agentName: string,
): Pick<MessagingGroupAgent, 'engage_mode' | 'engage_pattern'> {
  if (row.requires_trigger === 0) {
    return { engage_mode: 'pattern', engage_pattern: '.' };
  }
  const trigger = row.trigger_pattern?.trim();
  if (trigger) {
    const aliases = Array.from(
      new Set([assistantName, agentName].map((value) => value.trim()).filter(Boolean)),
    );
    if (aliases.length > 1 && trigger.startsWith('@')) {
      return {
        engage_mode: 'pattern',
        engage_pattern: `@(?:${aliases.map((value) => escapeRegex(value.replace(/^@/, ''))).join('|')})\\b`,
      };
    }
    return { engage_mode: 'pattern', engage_pattern: `${escapeRegex(trigger)}\\b` };
  }
  return { engage_mode: 'mention', engage_pattern: null };
}

function readLegacyConfig(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function mergeContainerConfig(
  folder: string,
  legacyConfig: Record<string, unknown>,
  drivePath: string | null,
  agentGroupId: string,
  agentName: string,
  assistantName: string,
  isMain: boolean,
): ContainerConfig & Record<string, unknown> {
  const current = readContainerConfig(folder) as ContainerConfig & Record<string, unknown>;
  const merged = {
    ...legacyConfig,
    ...current,
    mcpServers: current.mcpServers ?? {},
    packages: current.packages ?? { apt: [], npm: [] },
    additionalMounts: Array.isArray(current.additionalMounts) ? current.additionalMounts : [],
    skills: current.skills ?? 'all',
    provider: current.provider ?? 'codex',
    groupName: current.groupName ?? agentName,
    assistantName: current.assistantName ?? assistantName,
    agentGroupId,
    isMain: current.isMain ?? isMain,
  } as ContainerConfig & Record<string, unknown>;

  if (drivePath) {
    const hostPath = path.resolve(drivePath);
    const mount = { hostPath, containerPath: 'drive', readonly: false };
    const mounts = Array.isArray(merged.additionalMounts) ? merged.additionalMounts : [];
    const existing = mounts.find((item) => item && typeof item === 'object' && (item as Record<string, unknown>).containerPath === 'drive');
    if (existing && typeof existing === 'object') {
      Object.assign(existing as Record<string, unknown>, mount);
    } else {
      mounts.push(mount);
    }
    merged.additionalMounts = mounts;
  }

  return merged;
}

function ensureBrainFiles(folder: string, assistantName: string, dryRun: boolean): string[] {
  const groupDir = path.join(GROUPS_DIR, folder);
  const brainDir = path.join(groupDir, 'brain');
  const wikiDir = path.join(brainDir, 'wiki');
  const indexPath = path.join(brainDir, 'index.md');
  const logPath = path.join(brainDir, 'log.md');
  const results: string[] = [];

  if (!dryRun) {
    fs.mkdirSync(wikiDir, { recursive: true });
  }
  results.push(`${dryRun ? 'would ensure' : 'ensured'} ${wikiDir}`);

  if (!fs.existsSync(indexPath)) {
    const indexBody = `# ${assistantName} Brain Index

This is ${assistantName}'s isolated group brain.

## Current sections
- \`wiki/\` - topic articles
- \`brain/log.md\` - append-only activity log
`;
    if (!dryRun) fs.writeFileSync(indexPath, indexBody);
    results.push(`${dryRun ? 'would write' : 'wrote'} ${indexPath}`);
  } else {
    results.push(`kept existing ${indexPath}`);
  }

  if (!fs.existsSync(logPath)) {
    const logBody = `# ${assistantName} Brain Log\n\n- Initialized restored group brain structure.\n`;
    if (!dryRun) fs.writeFileSync(logPath, logBody);
    results.push(`${dryRun ? 'would write' : 'wrote'} ${logPath}`);
  } else {
    results.push(`kept existing ${logPath}`);
  }

  return results;
}

function taskProcessAfter(task: LegacyTaskRow): string | null {
  if (task.next_run) return task.next_run;
  if (task.schedule_type === 'once') return task.schedule_value;
  return null;
}

function shouldMigrateTask(task: LegacyTaskRow): boolean {
  return task.status === 'active' || task.status === 'paused';
}

function summarizeAction(prefix: string, value: string): void {
  console.log(`${prefix}: ${value}`);
}

function ensureMainDestination(mainAgentGroupId: string, messagingGroupId: string, baseName: string, createdAt: string): void {
  const existingByTarget = getDestinationByTarget(mainAgentGroupId, 'channel', messagingGroupId);
  if (existingByTarget) return;

  const base = normalizeName(baseName) || `chat-${messagingGroupId.slice(0, 8)}`;
  let localName = base;
  let suffix = 2;
  while (getDestinationByName(mainAgentGroupId, localName)) {
    localName = `${base}-${suffix}`;
    suffix++;
  }

  createDestination({
    agent_group_id: mainAgentGroupId,
    local_name: localName,
    target_type: 'channel',
    target_id: messagingGroupId,
    created_at: createdAt,
  });
}

function mountAllowlistWarning(mountPath: string | null): string | null {
  if (!mountPath) return null;
  const home = process.env.HOME;
  if (!home) return null;
  const allowlistPath = path.join(home, '.config', 'nanoclaw', 'mount-allowlist.json');
  if (!fs.existsSync(allowlistPath)) {
    return `mount allowlist not found at ${allowlistPath}`;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(allowlistPath, 'utf8')) as {
      allowedRoots?: Array<{ path?: string }>;
    };
    const roots = parsed.allowedRoots ?? [];
    const realMount = path.resolve(mountPath);
    for (const root of roots) {
      if (!root.path) continue;
      const expanded = root.path.startsWith('~/') ? path.join(home, root.path.slice(2)) : root.path;
      const realRoot = path.resolve(expanded);
      const relative = path.relative(realRoot, realMount);
      if (!relative.startsWith('..') && !path.isAbsolute(relative)) {
        return null;
      }
    }
    return `${realMount} is not under any allowed root in ${allowlistPath}`;
  } catch (err) {
    return `could not validate mount allowlist: ${String(err)}`;
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(args.legacyDb)) {
    console.error(`Legacy database not found: ${args.legacyDb}`);
    process.exit(1);
  }

  const legacyDb = new Database(args.legacyDb, { readonly: true });
  const legacyGroup = legacyDb
    .prepare(
      `SELECT jid, name, folder, trigger_pattern, added_at, container_config, requires_trigger, is_main, group_settings
         FROM registered_groups
        WHERE folder = ?`,
    )
    .get(args.folder) as LegacyGroupRow | undefined;

  if (!legacyGroup) {
    console.error(`Legacy group '${args.folder}' was not found in registered_groups.`);
    process.exit(2);
  }

  const chatRow = legacyDb
    .prepare('SELECT name FROM chats WHERE jid = ?')
    .get(legacyGroup.jid) as { name: string } | undefined;
  const chatName = chatRow?.name || null;
  const assistantName = deriveAssistantName(legacyGroup, chatName, args.assistantName);
  const agentName = deriveAgentName(legacyGroup, chatName, assistantName, args.agentName);
  const channelType = deriveChannelType(legacyGroup.folder, legacyGroup.jid);
  const isGroup = legacyGroup.jid.endsWith('@g.us') ? 1 : 0;
  const unknownSenderPolicy = derivePolicy(legacyGroup);
  const engage = deriveEngage(legacyGroup, assistantName, agentName);
  let legacyTasks: LegacyTaskRow[] = [];
  try {
    legacyTasks = legacyDb
      .prepare(
        `SELECT id, prompt, schedule_type, schedule_value, next_run, status
           FROM scheduled_tasks
          WHERE group_folder = ?
          ORDER BY created_at ASC`,
      )
      .all(args.folder) as LegacyTaskRow[];
  } catch {
    legacyTasks = [];
  }
  legacyDb.close();

  summarizeAction('group', legacyGroup.folder);
  summarizeAction('legacy jid', legacyGroup.jid);
  summarizeAction('assistant', assistantName);
  summarizeAction('agent', agentName);
  summarizeAction('channel', channelType);
  summarizeAction('scheduled tasks found', String(legacyTasks.length));

  if (args.dryRun) {
    const liveTasks = legacyTasks.filter(shouldMigrateTask);
    summarizeAction('dry-run', 'true');
    summarizeAction('would create/update agent group', legacyGroup.folder);
    summarizeAction('would create/update messaging group', `${channelType}/${legacyGroup.jid}`);
    summarizeAction('would wire engage mode', `${engage.engage_mode}${engage.engage_pattern ? ` (${engage.engage_pattern})` : ''}`);
    summarizeAction('would set unknown sender policy', unknownSenderPolicy);
    summarizeAction('would migrate live tasks', String(liveTasks.length));
    if (args.drivePath) {
      summarizeAction('would add mount', `${path.resolve(args.drivePath)} -> /workspace/extra/drive`);
      const warning = mountAllowlistWarning(args.drivePath);
      if (warning) summarizeAction('warning', warning);
    }
    return;
  }

  const db = initDb(args.v2Db);
  runMigrations(db);

  const now = legacyGroup.added_at || new Date().toISOString();
  const isMain = legacyGroup.is_main === 1;
  let agentGroup = getAgentGroupByFolder(legacyGroup.folder);
  if (!agentGroup) {
    createAgentGroup({
      id: generateId('ag'),
      name: agentName,
      folder: legacyGroup.folder,
      agent_provider: 'codex',
      is_main: isMain ? 1 : 0,
      created_at: now,
    });
    agentGroup = getAgentGroupByFolder(legacyGroup.folder);
  } else {
    updateAgentGroup(agentGroup.id, {
      name: args.agentName ?? agentGroup.name,
      agent_provider: agentGroup.agent_provider ?? 'codex',
      is_main: isMain ? 1 : agentGroup.is_main ?? 0,
    });
    agentGroup = getAgentGroupByFolder(legacyGroup.folder);
  }

  if (!agentGroup) {
    throw new Error(`Failed to create or load agent group for ${legacyGroup.folder}`);
  }

  initGroupFilesystem(agentGroup, {
    instructions:
      `# ${assistantName}\n\n` +
      `You are ${assistantName}, the restored assistant for the ${deriveMessagingGroupName(chatName, legacyGroup)} group.\n` +
      'Use only this group\'s own history and files by default.\n',
  });

  const mergedConfig = mergeContainerConfig(
    legacyGroup.folder,
    readLegacyConfig(legacyGroup.container_config),
    args.drivePath,
    agentGroup.id,
    agentName,
    assistantName,
    isMain,
  );
  writeContainerConfig(legacyGroup.folder, mergedConfig);
  summarizeAction('container config', path.join('groups', legacyGroup.folder, 'container.json'));

  const brainResults = ensureBrainFiles(legacyGroup.folder, assistantName, false);
  for (const line of brainResults) summarizeAction('brain', line);

  let messagingGroup = getMessagingGroupByPlatform(channelType, legacyGroup.jid);
  if (!messagingGroup) {
    createMessagingGroup({
      id: generateId('mg'),
      channel_type: channelType,
      platform_id: legacyGroup.jid,
      name: deriveMessagingGroupName(chatName, legacyGroup),
      is_group: isGroup,
      unknown_sender_policy: unknownSenderPolicy,
      created_at: now,
    });
    messagingGroup = getMessagingGroupByPlatform(channelType, legacyGroup.jid);
  }

  if (!messagingGroup) {
    throw new Error(`Failed to create or load messaging group for ${legacyGroup.jid}`);
  }

  let wiring = getMessagingGroupAgentByPair(messagingGroup.id, agentGroup.id);
  if (!wiring) {
    createMessagingGroupAgent({
      id: generateId('mga'),
      messaging_group_id: messagingGroup.id,
      agent_group_id: agentGroup.id,
      engage_mode: engage.engage_mode,
      engage_pattern: engage.engage_pattern,
      sender_scope: 'all',
      ignored_message_policy: 'drop',
      session_mode: 'shared',
      priority: 0,
      created_at: now,
    });
    wiring = getMessagingGroupAgentByPair(messagingGroup.id, agentGroup.id);
  }

  if (!wiring) {
    throw new Error(`Failed to create or load wiring for ${legacyGroup.folder}`);
  }
  summarizeAction('wiring', `${wiring.id} (${wiring.engage_mode}${wiring.engage_pattern ? ` ${wiring.engage_pattern}` : ''})`);

  const mainAgentGroup = getAllAgentGroups().find((row) => row.is_main === 1);
  if (mainAgentGroup && mainAgentGroup.id !== agentGroup.id) {
    ensureMainDestination(mainAgentGroup.id, messagingGroup.id, agentName, now);
    summarizeAction('main destination', `${mainAgentGroup.folder} -> ${legacyGroup.folder}`);
  }

  const { session } = resolveSession(agentGroup.id, messagingGroup.id, null, 'shared');
  writeSessionRouting(agentGroup.id, session.id);
  summarizeAction('session', session.id);

  const inboundDb = openInboundDb(agentGroup.id, session.id);
  try {
    const existingLiveTaskCount = (
      inboundDb
        .prepare("SELECT COUNT(*) AS count FROM messages_in WHERE kind = 'task' AND status IN ('pending', 'paused')")
        .get() as { count: number }
    ).count;
    const existingTaskIds = new Set(
      (
        inboundDb
          .prepare("SELECT series_id FROM messages_in WHERE kind = 'task' AND series_id IS NOT NULL")
          .all() as Array<{ series_id: string }>
      ).map((row) => row.series_id),
    );

    let migrated = 0;
    let skipped = 0;
    if (existingLiveTaskCount > 0) {
      summarizeAction('scheduled tasks', `live v2 tasks already exist (${existingLiveTaskCount}); skipping legacy task import`);
      summarizeAction('scheduled tasks migrated', '0');
      summarizeAction('scheduled tasks skipped', String(legacyTasks.filter(shouldMigrateTask).length));
    } else {
      for (const task of legacyTasks) {
        if (!shouldMigrateTask(task)) continue;
        if (existingTaskIds.has(task.id)) {
          skipped++;
          continue;
        }
        const processAfter = taskProcessAfter(task);
        if (!processAfter) {
          skipped++;
          summarizeAction('task skipped', `${task.id} (missing next run)`);
          continue;
        }
        if (task.schedule_type !== 'cron' && task.schedule_type !== 'once') {
          skipped++;
          summarizeAction('task skipped', `${task.id} (unsupported schedule_type=${task.schedule_type})`);
          continue;
        }

        insertTask(inboundDb, {
          id: task.id,
          processAfter,
          recurrence: task.schedule_type === 'cron' ? task.schedule_value : null,
          platformId: messagingGroup.platform_id,
          channelType: messagingGroup.channel_type,
          threadId: null,
          content: JSON.stringify({
            prompt: task.prompt,
            script: null,
            legacyTaskId: task.id,
            legacyScheduleType: task.schedule_type,
          }),
        });
        if (task.status === 'paused') {
          pauseTask(inboundDb, task.id);
        }
        existingTaskIds.add(task.id);
        migrated++;
      }
      summarizeAction('scheduled tasks migrated', String(migrated));
      summarizeAction('scheduled tasks skipped', String(skipped));
    }
  } finally {
    inboundDb.close();
  }

  const groupDir = path.join(GROUPS_DIR, legacyGroup.folder);
  const claudeMd = path.join(groupDir, 'CLAUDE.md');
  if (fs.existsSync(claudeMd) && fs.statSync(claudeMd).size > 0) {
    summarizeAction('CLAUDE.md', 'kept existing content');
  }

  if (args.drivePath) {
    summarizeAction('drive mount', `${path.resolve(args.drivePath)} -> /workspace/extra/drive`);
    const warning = mountAllowlistWarning(args.drivePath);
    if (warning) summarizeAction('warning', warning);
  }

  const freshSession = getSession(session.id);
  if (!freshSession) {
    throw new Error(`Session ${session.id} disappeared after restore`);
  }
  summarizeAction('status', 'restore complete');
}

main();
