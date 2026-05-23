import type Database from 'better-sqlite3';

import { wakeContainer } from '../../container-runner.js';
import { readContainerConfig, writeContainerConfig } from '../../container-config.js';
import { createAgentGroup, getAgentGroup, getAgentGroupByFolder, updateAgentGroup } from '../../db/agent-groups.js';
import { listKnownChats } from '../../db/known-chats.js';
import {
  createMessagingGroup,
  createMessagingGroupAgent,
  getMessagingGroup,
  getMessagingGroupAgentByPair,
  getMessagingGroupAgents,
  getMessagingGroupByPlatform,
  updateMessagingGroup,
  updateMessagingGroupAgent,
} from '../../db/messaging-groups.js';
import { assertValidGroupFolder } from '../../group-folder.js';
import { initGroupFilesystem } from '../../group-init.js';
import { log } from '../../log.js';
import { writeSessionMessage } from '../../session-manager.js';
import type { Session, UnknownSenderPolicy } from '../../types.js';
import {
  createDestination,
  getDestinationByName,
  getDestinationByTarget,
  normalizeName,
} from '../agent-to-agent/db/agent-destinations.js';
import { writeDestinations } from '../agent-to-agent/write-destinations.js';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function notifySystem(session: Session, action: string, status: 'success' | 'error', result: unknown): void {
  writeSessionMessage(session.agent_group_id, session.id, {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: 'system',
    timestamp: new Date().toISOString(),
    platformId: null,
    channelType: null,
    threadId: null,
    content: JSON.stringify({ action, status, result }),
  });
  wakeContainer(session).catch((err) => log.error('Failed to wake container after system response', { action, err }));
}

function requireMainGroup(session: Session, action: 'register_group' | 'list_known_chats') {
  const group = getAgentGroup(session.agent_group_id);
  if (!group || group.is_main !== 1) {
    notifySystem(session, action, 'error', {
      error: 'main_group_only',
      message: 'Only the main/admin group can use main-channel group-management tools.',
    });
    return null;
  }
  return group;
}

function deriveFolder(channelType: string, name: string, explicitFolder: string | undefined): string {
  const folder = explicitFolder?.trim() || `${channelType}_${normalizeName(name)}`;
  assertValidGroupFolder(folder);
  return folder;
}

function deriveEngage(
  trigger: string,
  requiresTrigger: boolean,
  aliases: string[] = [],
): { engageMode: 'pattern'; engagePattern: string } {
  if (!requiresTrigger) return { engageMode: 'pattern', engagePattern: '.' };

  const normalizedAliases = Array.from(new Set(aliases.map((value) => value.trim()).filter(Boolean)));

  const normalizedTrigger = trigger.trim();
  if (normalizedAliases.length > 1 && normalizedTrigger.startsWith('@')) {
    return {
      engageMode: 'pattern',
      engagePattern: `@(?:${normalizedAliases.map((value) => escapeRegex(value.replace(/^@/, ''))).join('|')})\\b`,
    };
  }

  return { engageMode: 'pattern', engagePattern: `${escapeRegex(normalizedTrigger)}\\b` };
}

function ensureMainDestination(
  sourceAgentGroupId: string,
  messagingGroupId: string,
  baseName: string,
  createdAt: string,
): string {
  const existingByTarget = getDestinationByTarget(sourceAgentGroupId, 'channel', messagingGroupId);
  if (existingByTarget) return existingByTarget.local_name;

  const base = normalizeName(baseName) || `chat-${messagingGroupId.slice(0, 8)}`;
  let localName = base;
  let suffix = 2;
  while (getDestinationByName(sourceAgentGroupId, localName)) {
    localName = `${base}-${suffix}`;
    suffix++;
  }

  createDestination({
    agent_group_id: sourceAgentGroupId,
    local_name: localName,
    target_type: 'channel',
    target_id: messagingGroupId,
    created_at: createdAt,
  });

  return localName;
}

export async function handleListKnownChats(
  content: Record<string, unknown>,
  session: Session,
  _inDb: Database.Database,
): Promise<void> {
  if (!requireMainGroup(session, 'list_known_chats')) return;

  const channelType = typeof content.channelType === 'string' ? content.channelType : undefined;
  const search = typeof content.search === 'string' ? content.search.trim() || undefined : undefined;
  const isGroup = typeof content.isGroup === 'boolean' ? (content.isGroup ? 1 : 0) : undefined;
  const rawLimit = typeof content.limit === 'number' ? content.limit : Number(content.limit ?? 20);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, rawLimit)) : 20;

  const chats = listKnownChats({ channelType, search, isGroup, limit });
  notifySystem(session, 'list_known_chats', 'success', {
    count: chats.length,
    filters: { channelType: channelType ?? null, search: search ?? null, isGroup: isGroup ?? null, limit },
    chats,
  });
}

export async function handleRegisterGroup(
  content: Record<string, unknown>,
  session: Session,
  _inDb: Database.Database,
): Promise<void> {
  const sourceGroup = requireMainGroup(session, 'register_group');
  if (!sourceGroup) return;

  try {
    const name = typeof content.name === 'string' ? content.name.trim() : '';
    const platformId = typeof content.platformId === 'string' ? content.platformId.trim() : '';
    const currentMessagingGroup = session.messaging_group_id
      ? getMessagingGroup(session.messaging_group_id)
      : undefined;
    const channelType =
      typeof content.channelType === 'string'
        ? content.channelType.trim().toLowerCase()
        : currentMessagingGroup?.channel_type;

    if (!name) {
      notifySystem(session, 'register_group', 'error', { error: 'missing_name', message: 'name is required' });
      return;
    }
    if (!platformId) {
      notifySystem(session, 'register_group', 'error', {
        error: 'missing_platform_id',
        message: 'platformId is required (for WhatsApp this is the group JID, e.g. 1203...@g.us).',
      });
      return;
    }
    if (!channelType) {
      notifySystem(session, 'register_group', 'error', {
        error: 'missing_channel_type',
        message: 'channelType is required when it cannot be inferred from the current conversation.',
      });
      return;
    }

    const assistantName =
      typeof content.assistantName === 'string' && content.assistantName.trim() ? content.assistantName.trim() : name;
    const trigger =
      typeof content.trigger === 'string' && content.trigger.trim() ? content.trigger.trim() : `@${assistantName}`;
    const requiresTrigger = content.requiresTrigger === false ? false : true;
    const isGroup =
      typeof content.isGroup === 'boolean' ? (content.isGroup ? 1 : 0) : platformId.endsWith('@g.us') ? 1 : 0;
    const unknownSenderPolicy =
      typeof content.unknownSenderPolicy === 'string'
        ? (content.unknownSenderPolicy as UnknownSenderPolicy)
        : isGroup
          ? 'public'
          : 'strict';
    const sessionMode =
      content.sessionMode === 'per-thread' || content.sessionMode === 'agent-shared' ? content.sessionMode : 'shared';
    const folder = deriveFolder(channelType, name, typeof content.folder === 'string' ? content.folder : undefined);
    const currentConfig = readContainerConfig(folder);
    const provider =
      typeof content.provider === 'string' && content.provider.trim()
        ? content.provider.trim().toLowerCase()
        : currentConfig.provider || sourceGroup.agent_provider || 'codex';
    const createdAt = new Date().toISOString();

    let agentGroup = getAgentGroupByFolder(folder);
    if (!agentGroup) {
      createAgentGroup({
        id: generateId('ag'),
        name,
        folder,
        agent_provider: provider,
        is_main: 0,
        created_at: createdAt,
      });
      agentGroup = getAgentGroupByFolder(folder);
    } else {
      updateAgentGroup(agentGroup.id, { name, agent_provider: provider, is_main: 0 });
      agentGroup = getAgentGroupByFolder(folder);
    }

    if (!agentGroup) {
      throw new Error(`Failed to create or load agent group for folder ${folder}`);
    }

    initGroupFilesystem(agentGroup, {
      instructions:
        `# ${assistantName}\n\n` +
        `You are ${assistantName}, the assistant for the ${name} group.\n` +
        `Stay scoped to this group unless the main/admin flow explicitly instructs otherwise.\n`,
    });

    writeContainerConfig(folder, {
      ...currentConfig,
      provider,
      groupName: currentConfig.groupName ?? name,
      assistantName: currentConfig.assistantName ?? assistantName,
      agentGroupId: agentGroup.id,
      isMain: currentConfig.isMain ?? false,
    });

    let messagingGroup = getMessagingGroupByPlatform(channelType, platformId);
    if (!messagingGroup) {
      createMessagingGroup({
        id: generateId('mg'),
        channel_type: channelType,
        platform_id: platformId,
        name,
        is_group: isGroup,
        unknown_sender_policy: unknownSenderPolicy,
        created_at: createdAt,
      });
      messagingGroup = getMessagingGroupByPlatform(channelType, platformId);
    } else {
      const otherWirings = getMessagingGroupAgents(messagingGroup.id).filter(
        (row) => row.agent_group_id !== agentGroup!.id,
      );
      if (otherWirings.length > 0) {
        notifySystem(session, 'register_group', 'error', {
          error: 'already_wired',
          message: `This chat is already wired to another agent group.`,
          platformId,
          channelType,
          conflictingAgentGroupIds: otherWirings.map((row) => row.agent_group_id),
        });
        return;
      }
      updateMessagingGroup(messagingGroup.id, {
        name,
        is_group: isGroup,
        unknown_sender_policy: unknownSenderPolicy,
      });
      messagingGroup = getMessagingGroupByPlatform(channelType, platformId);
    }

    if (!messagingGroup) {
      throw new Error(`Failed to create or load messaging group for ${platformId}`);
    }

    const engage = deriveEngage(trigger, requiresTrigger, [assistantName, name]);
    const existingWiring = getMessagingGroupAgentByPair(messagingGroup.id, agentGroup.id);
    if (!existingWiring) {
      createMessagingGroupAgent({
        id: generateId('mga'),
        messaging_group_id: messagingGroup.id,
        agent_group_id: agentGroup.id,
        engage_mode: engage.engageMode,
        engage_pattern: engage.engagePattern,
        sender_scope: 'all',
        ignored_message_policy: 'drop',
        session_mode: sessionMode,
        priority: 0,
        created_at: createdAt,
      });
    } else {
      updateMessagingGroupAgent(existingWiring.id, {
        engage_mode: engage.engageMode,
        engage_pattern: engage.engagePattern,
        sender_scope: 'all',
        ignored_message_policy: 'drop',
        session_mode: sessionMode,
        priority: 0,
      });
    }

    const destination = ensureMainDestination(sourceGroup.id, messagingGroup.id, name, createdAt);
    writeDestinations(session.agent_group_id, session.id);

    notifySystem(session, 'register_group', 'success', {
      agent_group_id: agentGroup.id,
      messaging_group_id: messagingGroup.id,
      folder,
      name,
      assistantName,
      provider,
      destination,
      channelType,
      platformId,
      trigger,
      sessionMode,
      isGroup,
    });
  } catch (err) {
    log.error('register_group failed', { err, sessionId: session.id, content });
    notifySystem(session, 'register_group', 'error', {
      error: 'register_group_failed',
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
