import { appendWebhookLog } from './db';
import { fireWebhooks, type FireResult } from './webhook-runner';
import type { QHSENode, Webhook, WebhookLogEntry } from '@/types/qhse';

/** Convert dispatch results into log entries and persist them. */
export function recordResults(
  hooks: Webhook[],
  event: string,
  results: FireResult[],
): void {
  const now = new Date().toISOString();
  const entries: WebhookLogEntry[] = results.map((r, i) => {
    const hook = hooks.find((h) => h.id === r.hookId);
    return {
      id: `${now}-${r.hookId}-${i}`,
      webhookId: r.hookId,
      webhookName: r.hookName ?? hook?.name ?? r.hookId,
      event,
      url: hook?.url ?? '',
      ok: r.success,
      httpStatus: r.httpStatus,
      error: r.error,
      at: now,
    };
  });
  if (entries.length) appendWebhookLog(entries);
}

/**
 * Fire an arbitrary event at the given hooks (client-side demo dispatcher).
 * Results are recorded in the localStorage delivery log so the Webhook
 * Manager can show what happened.
 */
export async function notifyEvent(
  hooks: Webhook[],
  event: string,
  payload: { nodeId?: string; node?: QHSENode; metadata?: Record<string, unknown> },
): Promise<FireResult[]> {
  const matched = hooks.filter(
    (h) => h.active && (h.events as string[]).includes(event),
  );
  if (matched.length === 0) return [];
  const results = await fireWebhooks(matched, event, payload);
  recordResults(matched, event, results);
  return results;
}

/** Convenience: announce a completed export to subscribed webhooks. */
export function fireExportDone(
  hooks: Webhook[],
  metadata: Record<string, unknown>,
): Promise<FireResult[]> {
  return notifyEvent(hooks, 'export.done', { metadata: { source: 'export-centre', ...metadata } });
}

/** Convenience: report an incident (e.g. from a mobile form or API caller). */
export function fireIncident(
  hooks: Webhook[],
  nodeId: string,
  node: QHSENode | undefined,
  metadata: Record<string, unknown>,
): Promise<FireResult[]> {
  return notifyEvent(hooks, 'incident.reported', { nodeId, node, metadata: { source: 'app', ...metadata } });
}
