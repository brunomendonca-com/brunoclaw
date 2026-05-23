import { getInboundDb, getOutboundDb } from '../db/connection.js';
import { registerTools } from './server.js';
import type { McpToolDefinition } from './types.js';

function log(msg: string): void {
  console.error(`[mcp-tools/search] ${msg}`);
}

function ok(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function err(text: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${text}` }], isError: true };
}

interface MessageResult {
  seq: number;
  timestamp: string;
  sender: string;
  content: string;
  direction: 'inbound' | 'outbound';
}

export const searchMessages: McpToolDefinition = {
  tool: {
    name: 'search_messages',
    description: 'Search the conversation history for messages containing a specific keyword or phrase.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to search for' },
        limit: { type: 'number', description: 'Maximum number of results to return (default: 20, max: 100)' },
      },
      required: ['query'],
    },
  },
  async handler(args) {
    const query = args.query as string;
    const limit = Math.min(Number(args.limit) || 20, 100);

    if (!query || query.trim().length < 2) {
      return err('Query must be at least 2 characters long');
    }

    log(`Searching for "${query}" (limit: ${limit})`);

    const inboundDb = getInboundDb();
    const outboundDb = getOutboundDb();

    // The content is stored as JSON string. We can use a simple LIKE query.
    // It's not as powerful as FTS, but it's fast enough for session databases and v2-native.
    const searchPattern = `%${query}%`;

    try {
      const inboundRows = inboundDb
        .prepare(`
          SELECT seq, timestamp, content 
          FROM messages_in 
          WHERE content LIKE ? 
          ORDER BY timestamp DESC 
          LIMIT ?
        `)
        .all(searchPattern, limit) as any[];

      const outboundRows = outboundDb
        .prepare(`
          SELECT seq, timestamp, content 
          FROM messages_out 
          WHERE content LIKE ? 
          ORDER BY timestamp DESC 
          LIMIT ?
        `)
        .all(searchPattern, limit) as any[];

      const results: MessageResult[] = [];

      for (const row of inboundRows) {
        let text = row.content;
        let sender = 'User';
        try {
          const parsed = JSON.parse(row.content);
          if (parsed.text) text = parsed.text;
          if (parsed.sender) sender = parsed.sender;
        } catch { /* ignore */ }

        results.push({
          seq: row.seq,
          timestamp: row.timestamp,
          sender,
          content: text,
          direction: 'inbound',
        });
      }

      for (const row of outboundRows) {
        let text = row.content;
        try {
          const parsed = JSON.parse(row.content);
          if (parsed.text) text = parsed.text;
        } catch { /* ignore */ }

        results.push({
          seq: row.seq,
          timestamp: row.timestamp,
          sender: 'Agent',
          content: text,
          direction: 'outbound',
        });
      }

      // Sort combined results by timestamp DESC
      results.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

      // Trim to limit and reverse to chronological order for output
      const finalResults = results.slice(0, limit).reverse();

      if (finalResults.length === 0) {
        return ok(`No messages found containing "${query}".`);
      }

      const formatted = finalResults
        .map((r) => `[#${r.seq}] ${r.timestamp} - ${r.sender}: ${r.content}`)
        .join('\n');

      return ok(`Found ${finalResults.length} messages:\n\n${formatted}`);
    } catch (e) {
      log(`Search error: ${e}`);
      return err(`Search failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  },
};

registerTools([searchMessages]);
