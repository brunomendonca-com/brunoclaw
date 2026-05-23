import { ASSISTANT_HAS_OWN_NUMBER, ASSISTANT_NAME } from '../../config.js';

interface TextSegment {
  content: string;
  isProtected: boolean;
}

/** Normalize an option label to a slash command: "Approve" -> "/approve" */
export function optionToCommand(option: string): string {
  return '/' + option.toLowerCase().replace(/\s+/g, '-');
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
  text = text.replace(/(?<!\*)\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*)/g, '_$1_');
  text = text.replace(/\*\*(?=[^\s*])([^*]+?)(?<=[^\s*])\*\*/g, '*$1*');
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '*$1*');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  text = text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '');
  return text;
}

/** Convert markdown to WhatsApp-native formatting. */
export function formatWhatsApp(text: string): string {
  const segments = splitProtectedRegions(text);
  return segments.map(({ content, isProtected }) => (isProtected ? content : transformForWhatsApp(content))).join('');
}

function resolveOutboundAgentName(content: Record<string, unknown>): string {
  const agentName = typeof content.agentName === 'string' ? content.agentName.trim() : '';
  return agentName || ASSISTANT_NAME;
}

export function formatOutboundText(text: string, content: Record<string, unknown>): string {
  const formatted = formatWhatsApp(text);
  if (ASSISTANT_HAS_OWN_NUMBER) return formatted;
  return `${resolveOutboundAgentName(content)}: ${formatted}`;
}
