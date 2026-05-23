/**
 * WhatsApp channel adapter (v2) — native Baileys v6 implementation.
 *
 * Implements ChannelAdapter directly (no Chat SDK bridge) using
 * @whiskeysockets/baileys v6 (stable). Ports proven v1 infrastructure:
 * getMessage fallback, outgoing queue, group metadata cache, LID mapping,
 * reconnection with backoff.
 *
 * Auth credentials persist in store/auth/. On first run:
 * - If WHATSAPP_PHONE_NUMBER is set → pairing code (printed to log)
 * - Otherwise → QR code (printed to log)
 * Subsequent restarts reuse the saved session automatically.
 */
import fs from 'fs';
import path from 'path';
// Named import (not default) — pino's .d.ts under NodeNext resolution
// exports `{ pino as default, pino }`, but the namespace/function merge at
// `declare namespace pino` + `declare function pino` makes the default
// resolve to `typeof pino` (the namespace type), which isn't callable.
// The named export resolves to the callable function.
import { pino } from 'pino';

import {
  makeWASocket,
  Browsers,
  DisconnectReason,
  fetchLatestWaWebVersion,
  downloadMediaMessage,
  generateWAMessage,
  makeCacheableSignalKeyStore,
  normalizeMessageContent,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import type { GroupMetadata, WAMessageKey, WAMessage, WASocket } from '@whiskeysockets/baileys';

import { ASSISTANT_HAS_OWN_NUMBER, ASSISTANT_NAME, DATA_DIR } from '../config.js';
import { readEnvFile } from '../env.js';
import { log } from '../log.js';
import { transcribeAudio } from '../transcription.js';
import { registerChannelAdapter } from './channel-registry.js';
import { normalizeOptions, type NormalizedOption } from './ask-question.js';
import type { ChannelAdapter, ChannelSetup, ConversationInfo, InboundMessage, OutboundMessage } from './adapter.js';

// Baileys v6 bug: getPlatformId sends charCode (49) instead of enum value (1).
// Fixed in Baileys 7.x but not backported. Without this, pairing codes fail with
// "couldn't link device" because WhatsApp receives an invalid platform ID.
// Must use createRequire — ESM `import *` creates a read-only namespace.
// proto is not available as a named ESM export — use createRequire (same as v1)
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const { proto } = _require('@whiskeysockets/baileys') as { proto: any };
try {
  const _generics = _require('@whiskeysockets/baileys/lib/Utils/generics') as Record<string, unknown>;
  _generics.getPlatformId = (browser: string): string => {
    const platformType =
      proto.DeviceProps.PlatformType[browser.toUpperCase() as keyof typeof proto.DeviceProps.PlatformType];
    return platformType ? platformType.toString() : '1';
  };
} catch {
  // If CJS require fails (Node version mismatch), pairing codes may not work
  // but QR auth will still function fine.
  log.warn('Could not patch getPlatformId — pairing code auth may fail');
}

const baileysLogger = pino({ level: 'silent' });

const AUTH_DIR = path.join(process.cwd(), 'store', 'auth');
const GROUP_SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24h
const GROUP_METADATA_CACHE_TTL_MS = 60_000; // 1 min for outbound sends
const SENT_MESSAGE_CACHE_MAX = 256;
const RECONNECT_DELAY_MS = 5000;
const PENDING_QUESTIONS_MAX = 64;

/** Normalize an option label to a slash command: "Approve" → "/approve" */
function optionToCommand(option: string): string {
  return '/' + option.toLowerCase().replace(/\s+/g, '-');
}

// --- Markdown → WhatsApp formatting ---

interface TextSegment {
  content: string;
  isProtected: boolean;
}

/** Split text into code-block-protected and unprotected regions. */
function splitProtectedRegions(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ content: text.slice(lastIndex, match.index), isProtected: false });
    }
    segments.push({ content: match[0], isProtected: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ content: text.slice(lastIndex), isProtected: false });
  }

  return segments;
}

/** Apply WhatsApp-native formatting to an unprotected text segment. */
function transformForWhatsApp(text: string): string {
  // Order matters: italic before bold to avoid **bold** → *bold* → _bold_
  // 1. Italic: *text* (not **) → _text_
  text = text.replace(/(?<!\*)\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*)/g, '_$1_');
  // 2. Bold: **text** → *text*
  text = text.replace(/\*\*(?=[^\s*])([^*]+?)(?<=[^\s*])\*\*/g, '*$1*');
  // 3. Headings: ## Title → *Title*
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');
  // 4. Links: [text](url) → text (url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  // 5. Horizontal rules: --- / *** / ___ → stripped
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '');
  return text;
}

/** Convert Claude's markdown to WhatsApp-native formatting. */
function formatWhatsApp(text: string): string {
  const segments = splitProtectedRegions(text);
  return segments.map(({ content, isProtected }) => (isProtected ? content : transformForWhatsApp(content))).join('');
}

function resolveOutboundAgentName(content: Record<string, unknown>): string {
  const agentName = typeof content.agentName === 'string' ? content.agentName.trim() : '';
  return agentName || ASSISTANT_NAME;
}

function formatOutboundText(text: string, content: Record<string, unknown>): string {
  const formatted = formatWhatsApp(text);
  if (ASSISTANT_HAS_OWN_NUMBER) return formatted;
  return `${resolveOutboundAgentName(content)}: ${formatted}`;
}

/** Extract a previewable text snippet from a quoted (replied-to) message body. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractQuotedText(quoted: any): string {
  if (!quoted) return '';
  const text =
    quoted.conversation ||
    quoted.extendedTextMessage?.text ||
    quoted.imageMessage?.caption ||
    quoted.videoMessage?.caption ||
    quoted.documentMessage?.caption ||
    '';
  let attachmentLabel = '';
  if (quoted.imageMessage) attachmentLabel = '[image]';
  else if (quoted.videoMessage) attachmentLabel = '[video]';
  else if (quoted.audioMessage) attachmentLabel = '[audio]';
  else if (quoted.stickerMessage) attachmentLabel = '[sticker]';
  else if (quoted.documentMessage) {
    attachmentLabel = `[document: ${quoted.documentMessage.fileName || 'file'}]`;
  }
  return [attachmentLabel, text].filter(Boolean).join(' ').trim();
}

/** Map file extension to Baileys media message type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMediaMessage(data: Buffer, filename: string, ext: string, caption?: string): any {
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const videoExts = ['.mp4', '.mov', '.avi', '.mkv'];
  const audioExts = ['.mp3', '.ogg', '.m4a', '.wav', '.aac', '.opus'];

  if (imageExts.includes(ext)) {
    return { image: data, caption, mimetype: `image/${ext.slice(1) === 'jpg' ? 'jpeg' : ext.slice(1)}` };
  }
  if (videoExts.includes(ext)) {
    return { video: data, caption, mimetype: `video/${ext.slice(1)}` };
  }
  if (audioExts.includes(ext)) {
    return { audio: data, mimetype: `audio/${ext.slice(1) === 'mp3' ? 'mpeg' : ext.slice(1)}` };
  }
  // Default: send as document
  return { document: data, fileName: filename, caption, mimetype: 'application/octet-stream' };
}

registerChannelAdapter('whatsapp', {
  factory: () => {
    const env = readEnvFile(['WHATSAPP_PHONE_NUMBER', 'WHATSAPP_ENABLED']);
    const phoneNumber = env.WHATSAPP_PHONE_NUMBER;
    const authDir = AUTH_DIR;

    // Skip if no existing auth, no phone number for pairing, and not explicitly enabled (QR mode)
    const hasAuth = fs.existsSync(path.join(authDir, 'creds.json'));
    if (!hasAuth && !phoneNumber && !env.WHATSAPP_ENABLED) return null;

    fs.mkdirSync(authDir, { recursive: true });

    // State
    let sock: WASocket;
    let connected = false;
    let setupConfig: ChannelSetup;
    let currentAuthState: Awaited<ReturnType<typeof useMultiFileAuthState>>['state'] | undefined;

    // LID → phone JID mapping (WhatsApp's new ID system)
    const lidToPhoneMap: Record<string, string> = {};
    let botLidUser: string | undefined;
    let botPhoneJid: string | undefined;

    // Outgoing queue for messages sent while disconnected
    const outgoingQueue: Array<{ jid: string; text: string }> = [];
    let flushing = false;
    let reconnectInFlight = false;
    let reconnectTimer: NodeJS.Timeout | undefined;

    // Sent message cache for retry/re-encrypt requests
    const sentMessageCache = new Map<string, any>();

    // Group metadata cache with TTL
    const groupMetadataCache = new Map<string, { metadata: GroupMetadata; expiresAt: number }>();

    // Pending questions: chatJid → { questionId, options }
    // User replies with /approve, /reject, etc. to answer
    const pendingQuestions = new Map<
      string,
      {
        questionId: string;
        options: NormalizedOption[];
      }
    >();

    // Group sync tracking
    let lastGroupSync = 0;
    let groupSyncTimerStarted = false;

    // First-connect promise
    let resolveFirstOpen: (() => void) | undefined;
    let rejectFirstOpen: ((err: Error) => void) | undefined;

    // Pairing code file for the setup skill to poll
    const pairingCodeFile = path.join(process.cwd(), 'store', 'pairing-code.txt');

    // --- Helpers ---

    function setLidPhoneMapping(lidUser: string, phoneJid: string): void {
      if (lidToPhoneMap[lidUser] === phoneJid) return;
      lidToPhoneMap[lidUser] = phoneJid;
      // Cached group metadata depends on participant IDs — invalidate
      groupMetadataCache.clear();
    }

    async function translateJid(jid: string): Promise<string> {
      if (!jid.endsWith('@lid')) return jid;
      const lidUser = jid.split('@')[0].split(':')[0];

      const cached = lidToPhoneMap[lidUser];
      if (cached) return cached;

      // Query Baileys' signal repository
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pn = await (sock.signalRepository as any)?.lidMapping?.getPNForLID(jid);
        if (pn) {
          const phoneJid = `${pn.split('@')[0].split(':')[0]}@s.whatsapp.net`;
          setLidPhoneMapping(lidUser, phoneJid);
          log.info('Translated LID to phone JID', { lidJid: jid, phoneJid });
          return phoneJid;
        }
      } catch (err) {
        log.debug('Failed to resolve LID via signalRepository', { jid, err });
      }

      return jid;
    }

    async function getNormalizedGroupMetadata(jid: string): Promise<GroupMetadata | undefined> {
      if (!jid.endsWith('@g.us')) return undefined;

      const cached = groupMetadataCache.get(jid);
      if (cached && cached.expiresAt > Date.now()) return cached.metadata;

      // IMPORTANT: `cachedGroupMetadata` is consumed by Baileys' outbound
      // group-send pipeline. For LID-addressed groups, participant ids and
      // addressing metadata must stay exactly as Baileys provided them.
      // Rewriting participant ids to phone JIDs here can break encryption and
      // produce group-send failures like `not-acceptable` / `No sessions`.
      // Keep the raw metadata intact; do JID translation only on inbound
      // routing paths where we need stable host-side platform ids.
      const metadata = await sock.groupMetadata(jid);
      groupMetadataCache.set(jid, {
        metadata,
        expiresAt: Date.now() + GROUP_METADATA_CACHE_TTL_MS,
      });
      return metadata;
    }

    async function syncGroupMetadata(force = false): Promise<void> {
      if (!force && lastGroupSync && Date.now() - lastGroupSync < GROUP_SYNC_INTERVAL_MS) {
        return;
      }
      try {
        log.info('Syncing group metadata from WhatsApp...');
        const groups = await sock.groupFetchAllParticipating();
        let count = 0;
        for (const [jid, metadata] of Object.entries(groups)) {
          if (metadata.subject) {
            setupConfig.onMetadata(jid, metadata.subject, true);
            count++;
          }
        }
        lastGroupSync = Date.now();
        log.info('Group metadata synced', { count });
      } catch (err) {
        log.error('Failed to sync group metadata', { err });
      }
    }

    async function flushOutgoingQueue(): Promise<void> {
      if (flushing || outgoingQueue.length === 0) return;
      flushing = true;
      try {
        log.info('Flushing outgoing message queue', { count: outgoingQueue.length });
        while (outgoingQueue.length > 0) {
          const item = outgoingQueue.shift()!;
          const sent = await sock.sendMessage(item.jid, { text: item.text });
          if (sent?.key?.id && sent.message) {
            sentMessageCache.set(sent.key.id, sent.message);
          }
        }
      } finally {
        flushing = false;
      }
    }

    function beginReconnect(reason: string, err?: unknown): void {
      if (reconnectInFlight) return;
      reconnectInFlight = true;
      connected = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }

      log.warn('Forcing WhatsApp reconnect', { reason, err });

      try {
        sock?.end(undefined);
      } catch (endErr) {
        log.debug('Failed to end WhatsApp socket during reconnect', { endErr });
      }

      const attempt = () => {
        connectSocket().catch((connectErr) => {
          log.error('Failed to reconnect, retrying in 5s', { reason, err: connectErr });
          reconnectTimer = setTimeout(attempt, RECONNECT_DELAY_MS);
        });
      };

      attempt();
    }

    /**
     * Download media from an inbound message, save to /workspace/attachments/.
     * Also returns the audio buffer (when present) so the caller can transcribe
     * without re-downloading.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function downloadInboundMedia(
      msg: WAMessage,
      normalized: any,
    ): Promise<{
      attachments: Array<{ type: string; name: string; localPath: string }>;
      audioBuffer?: Buffer;
    }> {
      const mediaTypes: Array<{ key: string; type: string; ext: string }> = [
        { key: 'imageMessage', type: 'image', ext: '.jpg' },
        { key: 'videoMessage', type: 'video', ext: '.mp4' },
        { key: 'audioMessage', type: 'audio', ext: '.ogg' },
        { key: 'documentMessage', type: 'document', ext: '' },
      ];
      const attachments: Array<{ type: string; name: string; localPath: string }> = [];
      let audioBuffer: Buffer | undefined;
      for (const { key, type, ext } of mediaTypes) {
        if (!normalized[key]) continue;
        try {
          // Forwarded media (esp. self-forwards) often 403s on the CDN — the
          // original URL/keys can be stale. `reuploadRequest` lets Baileys ask
          // the sender to re-upload and retry, which is the supported recovery
          // path. Without it, downloads silently fail and audio never reaches
          // transcription.
          const buffer = await downloadMediaMessage(
            msg,
            'buffer',
            {},
            {
              logger: baileysLogger,
              reuploadRequest: sock.updateMediaMessage,
            },
          );
          const docFilename = normalized[key].fileName;
          const filename = docFilename || `${type}-${Date.now()}${ext}`;
          const attachDir = path.join(DATA_DIR, 'attachments');
          fs.mkdirSync(attachDir, { recursive: true });
          const filePath = path.join(attachDir, filename);
          fs.writeFileSync(filePath, buffer);
          attachments.push({ type, name: filename, localPath: `attachments/${filename}` });
          if (type === 'audio' && Buffer.isBuffer(buffer)) audioBuffer = buffer;
          log.info('Media downloaded', { type, filename });
        } catch (err) {
          log.warn('Failed to download media', { type, err });
        }
      }
      return { attachments, audioBuffer };
    }

    async function sendRawMessage(
      jid: string,
      text: string,
      opts?: { queueOnFailure?: boolean },
    ): Promise<string | undefined> {
      const queueOnFailure = opts?.queueOnFailure ?? true;
      if (!connected) {
        if (queueOnFailure) {
          outgoingQueue.push({ jid, text });
          log.info('WA disconnected, message queued', { jid, queueSize: outgoingQueue.length });
          return;
        }
        throw new Error(`WhatsApp disconnected while sending to ${jid}`);
      }
      try {
        const sent = await sock.sendMessage(jid, { text });
        if (sent?.key?.id && sent.message) {
          sentMessageCache.set(sent.key.id, sent.message);
          if (sentMessageCache.size > SENT_MESSAGE_CACHE_MAX) {
            const oldest = sentMessageCache.keys().next().value!;
            sentMessageCache.delete(oldest);
          }
        }
        return sent?.key?.id ?? undefined;
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        if (
          !queueOnFailure &&
          jid.endsWith('@g.us') &&
          (errMessage.includes('No sessions') || errMessage.includes('not-acceptable'))
        ) {
          const recovered = await retryGroupMessageWithoutCaches(jid, text, err);
          if (recovered) return recovered;
        }
        if (!queueOnFailure && errMessage.includes('No sessions')) {
          beginReconnect('send failed with missing Signal sessions', err);
        }
        if (queueOnFailure) {
          outgoingQueue.push({ jid, text });
          log.warn('Failed to send, message queued', { jid, err, queueSize: outgoingQueue.length });
          return undefined;
        }
        throw err;
      }
    }

    async function retryGroupMessageWithoutCaches(
      jid: string,
      text: string,
      cause: unknown,
    ): Promise<string | undefined> {
      const relayMessage = (
        sock as WASocket & {
          relayMessage?: (
            jid: string,
            message: NonNullable<Awaited<ReturnType<typeof generateWAMessage>>['message']>,
            opts?: {
              messageId?: string;
              useCachedGroupMetadata?: boolean;
              useUserDevicesCache?: boolean;
            },
          ) => Promise<string>;
        }
      ).relayMessage;

      const userJid = sock.user?.id;
      if (!relayMessage || !userJid || !currentAuthState) {
        return undefined;
      }

      try {
        log.warn('Retrying group send with fresh sender-key/device state', { jid, cause });
        await currentAuthState.keys.set({ 'sender-key-memory': { [jid]: null } });

        const msg = await generateWAMessage(
          jid,
          { text },
          {
            userJid,
            logger: baileysLogger,
            options: {},
            upload: async () => {
              throw new Error('Media upload is unavailable in text-only recovery path');
            },
          },
        );

        const msgId = await relayMessage(jid, msg.message!, {
          messageId: msg.key.id ?? undefined,
          useCachedGroupMetadata: false,
          useUserDevicesCache: false,
        });

        if (msg.key.id && msg.message) {
          sentMessageCache.set(msg.key.id, msg.message);
          if (sentMessageCache.size > SENT_MESSAGE_CACHE_MAX) {
            const oldest = sentMessageCache.keys().next().value!;
            sentMessageCache.delete(oldest);
          }
        }

        log.info('Recovered WhatsApp group send after refreshing sessions', { jid, msgId });
        return msgId;
      } catch (retryErr) {
        log.warn('Group send recovery failed', { jid, err: retryErr });
        return undefined;
      }
    }

    // --- Socket creation ---

    async function connectSocket(): Promise<void> {
      const { state, saveCreds } = await useMultiFileAuthState(authDir);
      currentAuthState = state;

      const { version } = await fetchLatestWaWebVersion({}).catch((err) => {
        log.warn('Failed to fetch latest WA Web version, using default', { err });
        return { version: undefined };
      });

      sock = makeWASocket({
        version,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
        },
        printQRInTerminal: false,
        logger: baileysLogger,
        browser: Browsers.macOS('Chrome'),
        cachedGroupMetadata: async (jid: string) => getNormalizedGroupMetadata(jid),
        getMessage: async (key: WAMessageKey) => {
          // Check in-memory cache first (recently sent messages)
          const cached = sentMessageCache.get(key.id || '');
          if (cached) return cached;
          // Return empty message to prevent indefinite "waiting for this message"
          return proto.Message.fromObject({});
        },
      });

      // Request pairing code if phone number is set and not yet registered
      if (phoneNumber && !state.creds.registered) {
        setTimeout(async () => {
          try {
            const code = await sock.requestPairingCode(phoneNumber);
            log.info(`WhatsApp pairing code: ${code}`);
            log.info('Enter in WhatsApp > Linked Devices > Link with phone number');
            fs.writeFileSync(pairingCodeFile, code, 'utf-8');
          } catch (err) {
            log.error('Failed to request pairing code', { err });
          }
        }, 3000);
      }

      sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !phoneNumber) {
          // QR code auth — print to terminal
          (async () => {
            try {
              const QRCode = await import('qrcode');
              const qrText = await QRCode.toString(qr, { type: 'terminal' });
              log.info('WhatsApp QR code — scan with WhatsApp > Linked Devices:\n' + qrText);
            } catch {
              log.info('WhatsApp QR code (raw)', { qr });
            }
          })();
        }

        if (connection === 'close') {
          connected = false;
          const reason = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
          const shouldReconnect = reason !== DisconnectReason.loggedOut;

          log.info('WhatsApp connection closed', { reason, shouldReconnect });

          if (shouldReconnect) {
            beginReconnect(`connection closed (${reason ?? 'unknown'})`, lastDisconnect?.error);
          } else {
            log.info('WhatsApp logged out');
            if (rejectFirstOpen) {
              rejectFirstOpen(new Error('WhatsApp logged out'));
              rejectFirstOpen = undefined;
              resolveFirstOpen = undefined;
            }
          }
        } else if (connection === 'open') {
          connected = true;
          reconnectInFlight = false;
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = undefined;
          }
          log.info('Connected to WhatsApp');

          // Clean up pairing code file after successful connection
          try {
            if (fs.existsSync(pairingCodeFile)) fs.unlinkSync(pairingCodeFile);
          } catch {
            /* ignore */
          }

          // Announce availability for presence updates
          sock.sendPresenceUpdate('available').catch((err) => {
            log.warn('Failed to send presence update', { err });
          });

          // Build LID → phone mapping from auth state
          if (sock.user) {
            const phoneUser = sock.user.id.split(':')[0];
            botPhoneJid = phoneUser ? `${phoneUser}@s.whatsapp.net` : undefined;
            const lidUser = sock.user.lid?.split(':')[0];
            if (lidUser && phoneUser) {
              setLidPhoneMapping(lidUser, `${phoneUser}@s.whatsapp.net`);
              botLidUser = lidUser;
            }
          }

          // Flush queued messages
          flushOutgoingQueue().catch((err) => log.error('Failed to flush outgoing queue', { err }));

          // Group sync
          syncGroupMetadata().catch((err) => log.error('Initial group sync failed', { err }));
          if (!groupSyncTimerStarted) {
            groupSyncTimerStarted = true;
            setInterval(() => {
              syncGroupMetadata().catch((err) => log.error('Periodic group sync failed', { err }));
            }, GROUP_SYNC_INTERVAL_MS);
          }

          // Signal first open
          if (resolveFirstOpen) {
            resolveFirstOpen();
            resolveFirstOpen = undefined;
            rejectFirstOpen = undefined;
          }
        }
      });

      sock.ev.on('creds.update', saveCreds);

      // Phone number sharing events — update LID mapping
      sock.ev.on('chats.phoneNumberShare', ({ lid, jid }) => {
        const lidUser = lid?.split('@')[0].split(':')[0];
        if (lidUser && jid) setLidPhoneMapping(lidUser, jid);
      });

      // Inbound messages
      sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const msg of messages) {
          try {
            if (!msg.message) continue;
            const normalized = normalizeMessageContent(msg.message);
            if (!normalized) continue;
            const rawJid = msg.key.remoteJid;
            if (!rawJid || rawJid === 'status@broadcast') continue;

            // Translate LID → phone JID
            let chatJid = await translateJid(rawJid);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (chatJid.endsWith('@lid') && (msg.key as any).senderPn) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pn = (msg.key as any).senderPn as string;
              const phoneJid = pn.includes('@') ? pn : `${pn}@s.whatsapp.net`;
              setLidPhoneMapping(rawJid.split('@')[0].split(':')[0], phoneJid);
              chatJid = phoneJid;
            }

            const timestamp = new Date(Number(msg.messageTimestamp) * 1000).toISOString();
            const isGroup = chatJid.endsWith('@g.us');

            // Notify metadata for group discovery
            setupConfig.onMetadata(chatJid, undefined, isGroup);

            let content =
              normalized.conversation ||
              normalized.extendedTextMessage?.text ||
              normalized.imageMessage?.caption ||
              normalized.videoMessage?.caption ||
              '';

            const mentionedJids = [
              ...(normalized.extendedTextMessage?.contextInfo?.mentionedJid ?? []),
              ...(normalized.imageMessage?.contextInfo?.mentionedJid ?? []),
              ...(normalized.videoMessage?.contextInfo?.mentionedJid ?? []),
            ].map((jid) => jid.toLowerCase());
            const botMentionTargets = [botPhoneJid, botLidUser ? `${botLidUser}@lid` : undefined]
              .filter((jid): jid is string => !!jid)
              .map((jid) => jid.toLowerCase());
            const isDirectBotMention = mentionedJids.some((jid) => botMentionTargets.includes(jid));

            // Normalize known raw mention tokens into a stable placeholder.
            if (botLidUser && content.includes(`@${botLidUser}`)) {
              content = content.replaceAll(`@${botLidUser}`, '@bot');
            }
            if (botPhoneJid) {
              const phoneUser = botPhoneJid.split('@')[0];
              if (phoneUser && content.includes(`@${phoneUser}`)) {
                content = content.replaceAll(`@${phoneUser}`, '@bot');
              }
            }

            // Download media attachments (images, video, audio, documents)
            const { attachments, audioBuffer } = await downloadInboundMedia(msg, normalized);

            // Transcribe both voice notes (ptt) and forwarded audio — the
            // download branch in downloadInboundMedia matches any
            // `audioMessage`, not only ptt, since forwarded voice notes lose
            // the ptt flag. No-op when GOOGLE_APPLICATION_CREDENTIALS is
            // unset; failures don't block delivery — the audio is still saved
            // as an attachment. Transcript is carried as its own field on the
            // routed message object (see router/formatter for rendering).
            let transcript: string | undefined;
            if (audioBuffer) {
              try {
                const t = await transcribeAudio(audioBuffer);
                if (t) {
                  transcript = t;
                  log.info('Voice message transcribed', { chatJid, length: t.length });
                }
              } catch (err) {
                log.warn('Failed to transcribe voice message', { chatJid, err });
              }
            }

            // Reply context: when the user replies to a previous message,
            // Baileys exposes it via contextInfo on the message body. Forward
            // id/sender/text so the agent-runner formatter can render
            // <quoted_message …> and a reply_to link the agent can resolve
            // against earlier messages_in rows.
            const quotedContext =
              normalized.extendedTextMessage?.contextInfo ||
              normalized.imageMessage?.contextInfo ||
              normalized.videoMessage?.contextInfo;
            let replyTo: { id?: string; sender?: string; text?: string } | undefined;
            if (quotedContext?.quotedMessage) {
              const quotedText = extractQuotedText(quotedContext.quotedMessage);
              const quotedParticipantRaw = quotedContext.participant || '';
              const quotedParticipant = quotedParticipantRaw ? await translateJid(quotedParticipantRaw) : '';
              const quotedFromBot =
                (botPhoneJid && quotedParticipant === botPhoneJid) ||
                (botLidUser && quotedParticipantRaw.startsWith(`${botLidUser}@`)) ||
                (quotedContext.stanzaId ? sentMessageCache.has(quotedContext.stanzaId) : false);
              const quotedSender = quotedFromBot ? ASSISTANT_NAME : quotedParticipant.split('@')[0] || 'unknown';
              if (quotedText || quotedContext.stanzaId) {
                replyTo = {
                  id: quotedContext.stanzaId || undefined,
                  sender: quotedSender,
                  text: quotedText,
                };
              }
            }

            // Skip empty protocol messages (no text and no attachments), but
            // log enough detail to debug cases where WhatsApp delivered a group
            // event we failed to extract into a routable inbound chat message.
            if (!content && attachments.length === 0) {
              log.info('Skipping WhatsApp inbound with no extracted content', {
                chatJid,
                rawJid,
                messageId: msg.key.id,
                fromMe: msg.key.fromMe || false,
                normalizedKeys: Object.keys(normalized),
                hasExtendedTextMentions: !!normalized.extendedTextMessage?.contextInfo?.mentionedJid?.length,
                hasImageCaptionMentions: !!normalized.imageMessage?.contextInfo?.mentionedJid?.length,
                hasVideoCaptionMentions: !!normalized.videoMessage?.contextInfo?.mentionedJid?.length,
              });
              continue;
            }

            const sender = msg.key.participant || msg.key.remoteJid || '';
            const senderName = msg.pushName || sender.split('@')[0];
            const fromMe = msg.key.fromMe || false;
            const messageId = msg.key.id || '';
            const isKnownBotOutbound = messageId ? sentMessageCache.has(messageId) : false;
            const isSelfChat = !isGroup && !!botPhoneJid && chatJid === botPhoneJid;

            // Shared-number mode: keep loop guards for assistant replies, but
            // allow manual operator messages even though WhatsApp marks them
            // as `fromMe`. Dedicated-number setups still ignore all `fromMe`
            // traffic outside the self-chat.
            if (fromMe) {
              // 1) Always ignore messages we know were sent by this adapter.
              if (isKnownBotOutbound) continue;
              // 2) In dedicated-number mode, ignore all other fromMe messages
              //    unless this is the self-chat. In shared-number mode, treat
              //    non-prefixed fromMe messages as operator input.
              if (ASSISTANT_HAS_OWN_NUMBER && !isSelfChat) continue;
              // 3) Fallback guard after restart/cache loss: in shared-number
              //    mode outbound assistant replies are prefixed.
              if (!ASSISTANT_HAS_OWN_NUMBER && content.startsWith(`${ASSISTANT_NAME}:`)) continue;
            }

            const isBotMessage = ASSISTANT_HAS_OWN_NUMBER ? false : content.startsWith(`${ASSISTANT_NAME}:`);

            // Check if this reply answers a pending question via slash command
            const pending = pendingQuestions.get(chatJid);
            if (pending && content.startsWith('/')) {
              const cmd = content.trim().toLowerCase();
              const matched = pending.options.find((o) => optionToCommand(o.label) === cmd);
              if (matched) {
                const voterName = msg.pushName || sender.split('@')[0];
                setupConfig.onAction(pending.questionId, matched.value, sender);
                pendingQuestions.delete(chatJid);
                await sendRawMessage(chatJid, `${matched.selectedLabel} by ${voterName}`);
                log.info('Question answered', {
                  questionId: pending.questionId,
                  value: matched.value,
                  voterName,
                });
                continue; // Don't forward this reply to the agent
              }
            }

            const inbound: InboundMessage = {
              id: msg.key.id || `wa-${Date.now()}`,
              kind: 'chat',
              content: {
                text: content,
                sender,
                senderName,
                ...(attachments.length > 0 && { attachments }),
                ...(replyTo && { replyTo }),
                ...(transcript && { transcript }),
                fromMe,
                isBotMessage,
                isGroup,
                chatJid,
              },
              timestamp,
              isMention: isDirectBotMention,
            };

            // WhatsApp doesn't use threads — threadId is null
            setupConfig.onInbound(chatJid, null, inbound);
          } catch (err) {
            log.error('Error processing incoming WhatsApp message', {
              err,
              remoteJid: msg.key?.remoteJid,
            });
          }
        }
      });
    }

    // --- ChannelAdapter implementation ---

    const adapter: ChannelAdapter = {
      name: 'whatsapp',
      channelType: 'whatsapp',
      supportsThreads: false,

      async setup(hostConfig: ChannelSetup) {
        setupConfig = hostConfig;

        // Connect and wait for first open
        await new Promise<void>((resolve, reject) => {
          resolveFirstOpen = resolve;
          rejectFirstOpen = reject;
          connectSocket().catch(reject);
        });

        log.info('WhatsApp adapter initialized');
      },

      async deliver(
        platformId: string,
        _threadId: string | null,
        message: OutboundMessage,
      ): Promise<string | undefined> {
        const content = message.content as Record<string, unknown>;

        // Ask question → text with slash command replies
        if (content.type === 'ask_question' && content.questionId && content.options) {
          const questionId = content.questionId as string;
          const title = content.title as string;
          const question = content.question as string;
          if (!title) {
            log.error('ask_question missing required title — skipping delivery', { questionId });
            return;
          }
          const options: NormalizedOption[] = normalizeOptions(content.options as never);

          const optionLines = options.map((o) => `  ${optionToCommand(o.label)}`).join('\n');
          const text = `*${title}*\n\n${question}\n\nReply with:\n${optionLines}`;
          const msgId = await sendRawMessage(platformId, formatOutboundText(text, content), { queueOnFailure: false });
          if (msgId) {
            pendingQuestions.set(platformId, { questionId, options });
            if (pendingQuestions.size > PENDING_QUESTIONS_MAX) {
              const oldest = pendingQuestions.keys().next().value!;
              pendingQuestions.delete(oldest);
            }
          }
          return msgId;
        }

        // Reaction → emoji on a message
        if (content.operation === 'reaction' && content.messageId && content.emoji) {
          try {
            await sock.sendMessage(platformId, {
              react: {
                text: content.emoji as string,
                key: { remoteJid: platformId, id: content.messageId as string, fromMe: false },
              },
            });
          } catch (err) {
            log.debug('Failed to send reaction', { platformId, err });
          }
          return;
        }

        // Normal message (with optional file attachments)
        const text = (content.markdown as string) || (content.text as string);
        const hasFiles = message.files && message.files.length > 0;

        if (!text && !hasFiles) return;

        // Send file attachments (first file gets the caption, rest are captionless)
        if (hasFiles) {
          let captionUsed = false;
          for (const file of message.files!) {
            try {
              const ext = path.extname(file.filename).toLowerCase();
              const caption = !captionUsed && text ? formatOutboundText(text, content) : undefined;
              const mediaMsg = buildMediaMessage(file.data, file.filename, ext, caption);
              const sent = await sock.sendMessage(platformId, mediaMsg);
              if (sent?.key?.id && sent.message) {
                sentMessageCache.set(sent.key.id, sent.message);
              }
              if (caption) captionUsed = true;
            } catch (err) {
              log.error('Failed to send file', { platformId, filename: file.filename, err });
            }
          }
          if (captionUsed) return; // Text was sent as caption
        }

        if (text) {
          return sendRawMessage(platformId, formatOutboundText(text, content), { queueOnFailure: false });
        }
      },

      async setTyping(platformId: string) {
        try {
          await sock.sendPresenceUpdate('composing', platformId);
        } catch (err) {
          log.debug('Failed to update typing status', { jid: platformId, err });
        }
      },

      async teardown() {
        connected = false;
        sock?.end(undefined);
        log.info('WhatsApp adapter shut down');
      },

      isConnected() {
        return connected;
      },

      async syncConversations(): Promise<ConversationInfo[]> {
        try {
          const groups = await sock.groupFetchAllParticipating();
          return Object.entries(groups)
            .filter(([, m]) => m.subject)
            .map(([jid, m]) => ({
              platformId: jid,
              name: m.subject,
              isGroup: true,
            }));
        } catch (err) {
          log.error('Failed to sync WhatsApp conversations', { err });
          return [];
        }
      },
    };

    return adapter;
  },
});
