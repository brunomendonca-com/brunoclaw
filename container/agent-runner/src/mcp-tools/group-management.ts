import { writeMessageOut } from '../db/messages-out.js';
import { registerTools } from './server.js';
import type { McpToolDefinition } from './types.js';

function log(msg: string): void {
  console.error(`[mcp-tools] ${msg}`);
}

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }], isError: true };
}

const registerGroup: McpToolDefinition = {
  tool: {
    name: 'register_group',
    description:
      'Main-channel only. Register or repair a chat/group as a dedicated NanoClaw agent group. Usually used for new WhatsApp groups from the main/admin channel.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Human-readable agent/group name (e.g. "ZiBot")' },
        platformId: {
          type: 'string',
          description: 'Target chat id / platform id. For WhatsApp groups this is the JID, e.g. 1203...@g.us.',
        },
        channelType: {
          type: 'string',
          description: 'Channel type such as whatsapp, slack, telegram. Defaults to the current conversation channel when omitted.',
        },
        folder: {
          type: 'string',
          description: 'Optional explicit folder name. Default: <channelType>_<normalized-name>.',
        },
        assistantName: {
          type: 'string',
          description: 'Optional assistant display name. Defaults to name.',
        },
        trigger: {
          type: 'string',
          description: 'Optional trigger/mention pattern like @ZiBot. Default: @<assistantName>.',
        },
        requiresTrigger: {
          type: 'boolean',
          description: 'When false, the agent responds to every message in the group. Default: true.',
        },
        sessionMode: {
          type: 'string',
          enum: ['shared', 'per-thread', 'agent-shared'],
          description: 'Session isolation mode. Default: shared.',
        },
        provider: {
          type: 'string',
          description: 'Optional provider override (e.g. codex, claude). Defaults to the current main group provider.',
        },
        isGroup: {
          type: 'boolean',
          description: 'Optional explicit group flag. Inferred from platformId when omitted.',
        },
        unknownSenderPolicy: {
          type: 'string',
          enum: ['strict', 'request_approval', 'public'],
          description: 'Optional unknown-sender policy. Default: public for groups, strict for DMs.',
        },
      },
      required: ['name', 'platformId'],
    },
  },
  async handler(args) {
    const name = args.name as string;
    const platformId = args.platformId as string;
    if (!name) return err('name is required');
    if (!platformId) return err('platformId is required');

    const requestId = generateId();
    writeMessageOut({
      id: requestId,
      kind: 'system',
      content: JSON.stringify({ action: 'register_group', requestId, ...args }),
    });

    log(`register_group: ${requestId} → ${name} (${platformId})`);
    return ok(`Registering group "${name}". You will receive a system response when the host finishes.`);
  },
};

const listKnownChats: McpToolDefinition = {
  tool: {
    name: 'list_known_chats',
    description:
      'Main-channel only. List chats/groups discovered by the host adapters (for example WhatsApp metadata sync) so you can choose one to register.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        channelType: { type: 'string', description: 'Optional channel filter, e.g. whatsapp.' },
        isGroup: { type: 'boolean', description: 'Optional group-vs-DM filter.' },
        search: { type: 'string', description: 'Optional substring match against name or platform id.' },
        limit: { type: 'integer', description: 'Max rows to return (default 20, max 100).' },
      },
    },
  },
  async handler(args) {
    const requestId = generateId();
    writeMessageOut({
      id: requestId,
      kind: 'system',
      content: JSON.stringify({ action: 'list_known_chats', requestId, ...args }),
    });

    log(`list_known_chats: ${requestId}`);
    return ok('Fetching known chats from the host. You will receive a system response when ready.');
  },
};

if (process.env.NANOCLAW_IS_MAIN === '1') {
  registerTools([registerGroup, listKnownChats]);
}
