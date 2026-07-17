/**
 * Zaby SDK & OpenAI API integration service.
 * Handles Zaby Runtime Token direct usage, API key-based token minting,
 * OpenAI API direct calls, and manages runs and event streams.
 */

import { configureZaby, Zaby } from '@zaby-ai/sdk';
import { ZabyRuntime } from '@zaby-ai/sdk/runtime';
import type { SseEvent } from '@zaby-ai/sdk/types';

const STORAGE_KEY_PROVIDER = 'aiui_active_provider'; // 'zaby' | 'openai'
const STORAGE_KEY_API_ORIGIN = 'aiui_zaby_api_origin';
const STORAGE_KEY_AUTH_MODE = 'aiui_zaby_auth_mode';
const STORAGE_KEY_RUNTIME_TOKEN = 'aiui_zaby_runtime_token';
const STORAGE_KEY_API_KEY = 'aiui_zaby_api_key';
const STORAGE_KEY_APP_ID = 'aiui_zaby_app_id';
const STORAGE_KEY_DEPLOYMENT_ID = 'aiui_zaby_deployment_id';
const STORAGE_KEY_USER_ID = 'aiui_zaby_user_id';

const STORAGE_KEY_OPENAI_KEY = 'aiui_openai_api_key';
const STORAGE_KEY_OPENAI_MODEL = 'aiui_openai_model';
const STORAGE_KEY_OPENAI_TEMP = 'aiui_openai_temperature';

export interface PlaygroundConfig {
  provider: 'zaby' | 'openai';
  
  // Zaby settings
  apiOrigin: string;
  authMode: 'token' | 'mint';
  runtimeToken: string;
  apiKey: string;
  externalAppId: string;
  deploymentId: string;
  externalUserId: string;

  // OpenAI settings
  openaiApiKey: string;
  openaiModel: string;
  openaiTemperature: number;
}

// ---------------------------------------------------------------------------
// Config helpers (localStorage persistence)
// ---------------------------------------------------------------------------

export function getStoredPlaygroundConfig(): PlaygroundConfig {
  return {
    provider: (localStorage.getItem(STORAGE_KEY_PROVIDER) as 'zaby' | 'openai') ?? 'zaby',
    
    // Zaby settings
    apiOrigin: localStorage.getItem(STORAGE_KEY_API_ORIGIN) ?? 'https://genapi.zaby.io',
    authMode: (localStorage.getItem(STORAGE_KEY_AUTH_MODE) as 'token' | 'mint') ?? 'token',
    runtimeToken: localStorage.getItem(STORAGE_KEY_RUNTIME_TOKEN) ?? '',
    apiKey: localStorage.getItem(STORAGE_KEY_API_KEY) ?? '',
    externalAppId: localStorage.getItem(STORAGE_KEY_APP_ID) ?? '',
    deploymentId: localStorage.getItem(STORAGE_KEY_DEPLOYMENT_ID) ?? '',
    externalUserId: localStorage.getItem(STORAGE_KEY_USER_ID) ?? 'playground-user',

    // OpenAI settings
    openaiApiKey: localStorage.getItem(STORAGE_KEY_OPENAI_KEY) ?? '',
    openaiModel: localStorage.getItem(STORAGE_KEY_OPENAI_MODEL) ?? 'gpt-4o-mini',
    openaiTemperature: parseFloat(localStorage.getItem(STORAGE_KEY_OPENAI_TEMP) ?? '0.7'),
  };
}

export function savePlaygroundConfig(config: Partial<PlaygroundConfig>): void {
  if (config.provider !== undefined) localStorage.setItem(STORAGE_KEY_PROVIDER, config.provider);
  
  // Zaby settings
  if (config.apiOrigin !== undefined) localStorage.setItem(STORAGE_KEY_API_ORIGIN, config.apiOrigin);
  if (config.authMode !== undefined) localStorage.setItem(STORAGE_KEY_AUTH_MODE, config.authMode);
  if (config.runtimeToken !== undefined) localStorage.setItem(STORAGE_KEY_RUNTIME_TOKEN, config.runtimeToken);
  if (config.apiKey !== undefined) localStorage.setItem(STORAGE_KEY_API_KEY, config.apiKey);
  if (config.externalAppId !== undefined) localStorage.setItem(STORAGE_KEY_APP_ID, config.externalAppId);
  if (config.deploymentId !== undefined) localStorage.setItem(STORAGE_KEY_DEPLOYMENT_ID, config.deploymentId);
  if (config.externalUserId !== undefined) localStorage.setItem(STORAGE_KEY_USER_ID, config.externalUserId);

  // OpenAI settings
  if (config.openaiApiKey !== undefined) localStorage.setItem(STORAGE_KEY_OPENAI_KEY, config.openaiApiKey);
  if (config.openaiModel !== undefined) localStorage.setItem(STORAGE_KEY_OPENAI_MODEL, config.openaiModel);
  if (config.openaiTemperature !== undefined) localStorage.setItem(STORAGE_KEY_OPENAI_TEMP, String(config.openaiTemperature));
}

// ---------------------------------------------------------------------------
// Token Resolver for Zaby
// ---------------------------------------------------------------------------

export async function resolveZabyRuntimeToken(config: PlaygroundConfig): Promise<string> {
  if (config.authMode === 'token') {
    if (!config.runtimeToken.trim()) {
      throw new Error('Zaby Runtime Token is not configured. Please add one in Settings.');
    }
    return config.runtimeToken.trim();
  }

  // Auto-mint mode
  if (!config.apiKey.trim() || !config.externalAppId.trim() || !config.deploymentId.trim()) {
    throw new Error('API Key, App ID, and Deployment ID must all be set for Auto-Mint mode.');
  }

  configureZaby({
    apiOrigin: config.apiOrigin,
  });

  const zaby = new Zaby({
    apiKey: config.apiKey.trim(),
  });

  const result = await zaby.runtimeTokens.create({
    externalAppId: config.externalAppId.trim(),
    deploymentId: config.deploymentId.trim(),
    externalUserId: config.externalUserId.trim(),
    channel: 'server',
    ttlSeconds: 3600, // 1 hour token
    maxUses: 100,
  });

  if (!result.token) {
    throw new Error('Failed to mint Zaby runtime token: No token returned from server');
  }

  return result.token;
}

// ---------------------------------------------------------------------------
// Connection test
// ---------------------------------------------------------------------------

export async function testZabyConnection(config: PlaygroundConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const token = await resolveZabyRuntimeToken(config);
    configureZaby({
      apiOrigin: config.apiOrigin,
    });

    const runtime = new ZabyRuntime({ token });
    await runtime.runs.start({
      input: { message: 'ping' },
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Run Streaming Generator for Zaby
// ---------------------------------------------------------------------------

export async function* streamZabyRun(
  message: string,
  config: PlaygroundConfig,
  externalSessionId?: string,
  signal?: AbortSignal,
): AsyncGenerator<SseEvent, void, undefined> {
  const token = await resolveZabyRuntimeToken(config);

  configureZaby({
    apiOrigin: config.apiOrigin,
  });

  const runtime = new ZabyRuntime({ token });

  const runResponse = await runtime.runs.start(
    {
      input: { message },
      ...(externalSessionId ? { externalSessionId } : {}),
    },
    { signal }
  );

  const runId = extractRunId(runResponse);

  for await (const event of runtime.runs.stream(runId, undefined, { signal })) {
    yield event;
  }
}

function extractRunId(response: any): string {
  const runId = response?.runId ?? response?.id ?? response?.run?.id;
  if (!runId) {
    throw new Error('Zaby runtime run start response did not include a run ID.');
  }
  return String(runId);
}
