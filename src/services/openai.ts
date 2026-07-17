/**
 * OpenAI API streaming service.
 * Calls the OpenAI chat completions endpoint directly from the browser
 * using an API key stored in localStorage.
 */

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const STORAGE_KEY_API = 'aiui_openai_api_key';
const STORAGE_KEY_MODEL = 'aiui_openai_model';
const STORAGE_KEY_TEMP = 'aiui_openai_temperature';

export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

// ---------------------------------------------------------------------------
// Config helpers (localStorage persistence)
// ---------------------------------------------------------------------------

export function getStoredConfig(): OpenAIConfig {
  return {
    apiKey: localStorage.getItem(STORAGE_KEY_API) ?? '',
    model: localStorage.getItem(STORAGE_KEY_MODEL) ?? 'gpt-4o-mini',
    temperature: parseFloat(localStorage.getItem(STORAGE_KEY_TEMP) ?? '0.7'),
  };
}

export function saveConfig(config: Partial<OpenAIConfig>): void {
  if (config.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API, config.apiKey);
  if (config.model !== undefined) localStorage.setItem(STORAGE_KEY_MODEL, config.model);
  if (config.temperature !== undefined) localStorage.setItem(STORAGE_KEY_TEMP, String(config.temperature));
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

export async function testConnection(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => ({}));
    return { ok: false, error: (body as any)?.error?.message ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Streaming chat completion
// ---------------------------------------------------------------------------

export async function* streamChat(
  messages: OpenAIChatMessage[],
  config: OpenAIConfig,
  signal?: AbortSignal,
): AsyncGenerator<string, void, undefined> {
  const isImageModel = config.model === 'gpt-image-1';
  const url = isImageModel ? 'https://api.openai.com/v1/responses' : OPENAI_API_URL;

  let body: any;
  if (isImageModel) {
    // Extract instructions (system prompt) and user message for the responses endpoint format
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role === 'user');
    const latestUserMsg = userMessages[userMessages.length - 1]?.content || '';

    body = {
      model: config.model,
      instructions: systemMsg ? systemMsg.content : '',
      input: [
        {
          type: 'text',
          text: latestUserMsg,
        },
      ],
      stream: true,
    };
  } else {
    body = {
      model: config.model,
      messages,
      temperature: config.temperature,
      stream: true,
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errMsg = (body as any)?.error?.message ?? `OpenAI API error: HTTP ${res.status}`;
    throw new Error(errMsg);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE lines are separated by double newlines
    const lines = buffer.split('\n');
    // Keep the last potentially-incomplete line in the buffer
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Audio Transcription (Whisper STT)
// ---------------------------------------------------------------------------

export async function transcribeAudio(blob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  // Whisper expects a file with a supported extension, so we wrap the blob in a File object
  const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
  formData.append('file', file);
  formData.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message ?? `Whisper API failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.text || '';
}
