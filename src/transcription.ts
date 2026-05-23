/**
 * Voice-note transcription via Google Cloud Speech-to-Text.
 *
 * Ported from v1 (src/speech.ts) — uses longRunningRecognize so audio
 * over 60s isn't truncated. WhatsApp voice notes are OGG_OPUS at 16 kHz.
 * Primary language is pt-BR with en-US/es-ES alternatives + auto-punctuation.
 *
 * Activation: requires GOOGLE_APPLICATION_CREDENTIALS in .env pointing at a
 * service-account JSON keyfile readable by the host process. When unset (or
 * if the client/import fails), `transcribeAudio` returns null and the caller
 * silently skips transcription.
 */
import type { SpeechClient } from '@google-cloud/speech';

import { readEnvFile } from './env.js';
import { log } from './log.js';

let client: SpeechClient | null = null;
let initFailed = false;

async function getClient(): Promise<SpeechClient | null> {
  if (client) return client;
  if (initFailed) return null;

  const { GOOGLE_APPLICATION_CREDENTIALS } = readEnvFile(['GOOGLE_APPLICATION_CREDENTIALS']);
  if (!GOOGLE_APPLICATION_CREDENTIALS) {
    initFailed = true;
    return null;
  }
  // Google's auth library reads GOOGLE_APPLICATION_CREDENTIALS from
  // process.env. Since .env is intentionally not loaded into process.env
  // (see src/env.ts), set it explicitly here for the speech client's
  // benefit only.
  process.env.GOOGLE_APPLICATION_CREDENTIALS = GOOGLE_APPLICATION_CREDENTIALS;

  try {
    const speech = await import('@google-cloud/speech');
    client = new speech.SpeechClient();
    return client;
  } catch (err) {
    initFailed = true;
    log.warn('Failed to initialize Google Speech client — transcription disabled', { err });
    return null;
  }
}

export async function transcribeAudio(buffer: Buffer): Promise<string | null> {
  const c = await getClient();
  if (!c) return null;

  const [operation] = await c.longRunningRecognize({
    audio: { content: buffer.toString('base64') },
    config: {
      encoding: 'OGG_OPUS',
      sampleRateHertz: 16000,
      languageCode: 'pt-BR',
      alternativeLanguageCodes: ['en-US', 'es-ES'],
      enableAutomaticPunctuation: true,
    },
  });
  const [response] = await operation.promise();

  const transcription = response.results
    ?.map((r) => r.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(' ')
    .trim();

  if (!transcription) {
    log.warn('Google STT returned empty transcription');
    return null;
  }

  return transcription;
}
