import type { KnownChat } from '../types.js';
import { getDb } from './connection.js';

export function upsertKnownChat(chat: KnownChat): void {
  getDb()
    .prepare(
      `INSERT INTO known_chats (channel_type, platform_id, name, is_group, last_seen)
       VALUES (@channel_type, @platform_id, @name, @is_group, @last_seen)
       ON CONFLICT(channel_type, platform_id) DO UPDATE SET
         name = COALESCE(excluded.name, known_chats.name),
         is_group = excluded.is_group,
         last_seen = excluded.last_seen`,
    )
    .run(chat);
}

export function listKnownChats(filters?: {
  channelType?: string;
  isGroup?: number;
  search?: string;
  limit?: number;
}): KnownChat[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters?.channelType) {
    where.push('channel_type = @channelType');
    params.channelType = filters.channelType;
  }
  if (filters?.isGroup !== undefined) {
    where.push('is_group = @isGroup');
    params.isGroup = filters.isGroup;
  }
  if (filters?.search) {
    where.push("(platform_id LIKE @search OR COALESCE(name, '') LIKE @search)");
    params.search = `%${filters.search}%`;
  }

  params.limit = filters?.limit ?? 20;
  const sql = `SELECT * FROM known_chats ${where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY is_group DESC, COALESCE(name, platform_id), last_seen DESC LIMIT @limit`;
  return getDb().prepare(sql).all(params) as KnownChat[];
}
