/** Extract a previewable text snippet from a quoted (replied-to) message body. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractQuotedText(quoted: any): string {
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
export function buildMediaMessage(data: Buffer, filename: string, ext: string, caption?: string): any {
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
  return { document: data, fileName: filename, caption, mimetype: 'application/octet-stream' };
}
