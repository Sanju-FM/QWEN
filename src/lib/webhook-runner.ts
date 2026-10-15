import type { QHSENode, Webhook } from '@/types/qhse';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  nodeId?: string;
  node?: QHSENode;
  metadata?: Record<string, unknown>;
}

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [500, 1500];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * HMAC-SHA256 signature of the payload body.
 * Uses WebCrypto in the browser/Edge runtime and node:crypto on the Node
 * server runtime, so this module works in both places.
 */
export async function sign(secret: string, body: string): Promise<string> {
  if (typeof globalThis.crypto !== 'undefined' && 'subtle' in globalThis.crypto) {
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sig = await globalThis.crypto.subtle.sign('HMAC', key, enc.encode(body));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Node (server) fallback
  const crypto = await import('crypto');
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function deliver(hook: Webhook, body: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  let lastError = '';
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'kezad-qhse-app/1.0',
        'X-Webhook-Id': hook.id,
      };
      if (hook.secret) headers['X-Webhook-Signature'] = await sign(hook.secret, body);

      const res = await fetch(hook.url, { method: 'POST', headers, body });
      if (res.ok) return { ok: true, status: res.status };
      lastError = `HTTP ${res.status}`;
      // 4xx are permanent failures — don't retry them
      if (res.status >= 400 && res.status < 500) break;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
    if (attempt < MAX_ATTEMPTS - 1) await sleep(BACKOFF_MS[attempt] ?? 1500);
  }
  return { ok: false, error: lastError };
}

export interface FireResult {
  hookId: string;
  hookName: string;
  success: boolean;
  httpStatus?: number;
  error: string | null;
}

/**
 * Dispatch `event` to every active webhook subscribed to it.
 * Retries transient failures with backoff; records per-hook results.
 */
export async function fireWebhooks(
  hooks: Webhook[],
  event: string,
  payload: Omit<WebhookPayload, 'event' | 'timestamp'>,
): Promise<FireResult[]> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  } satisfies WebhookPayload);

  const matched = hooks.filter((h) => h.active && h.events.includes(event as never));

  const settled = await Promise.allSettled(
    matched.map(async (h) => ({ hook: h, ...(await deliver(h, body)) })),
  );

  return settled.map((r, i) => {
    const hook = matched[i];
    if (r.status === 'fulfilled') {
      return {
        hookId: hook.id,
        hookName: hook.name,
        success: r.value.ok,
        httpStatus: r.value.status,
        error: r.value.error ?? null,
      };
    }
    return {
      hookId: hook.id,
      hookName: hook.name,
      success: false,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });
}
