'use client';

import { useEffect, useState } from 'react';
import WebhookForm from '@/components/webhooks/WebhookForm';
import WebhookList from '@/components/webhooks/WebhookList';
import WebhookLog from '@/components/webhooks/WebhookLog';
import {
  clearWebhookLog,
  loadWebhookLog,
  loadWebhooks,
  saveWebhooks,
} from '@/lib/db';
import { notifyEvent } from '@/lib/notify';
import type { Webhook, WebhookLogEntry } from '@/types/qhse';

/**
 * Webhook Manager.
 *
 * Demo mode: registry + delivery log persist in localStorage (see lib/db.ts)
 * and dispatching happens through /api/trigger/[id] or directly from the
 * browser via lib/notify.ts. In production the same UI writes to Prisma via
 * /api/webhooks and the server owns delivery.
 */
export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [log, setLog] = useState<WebhookLogEntry[]>([]);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setHooks(loadWebhooks());
    setLog(loadWebhookLog());
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  const persist = (next: Webhook[]) => {
    setHooks(next);
    saveWebhooks(next);
  };

  const handleSave = (hook: Webhook) => {
    const exists = hooks.some((h) => h.id === hook.id);
    persist(exists ? hooks.map((h) => (h.id === hook.id ? hook : h)) : [...hooks, hook]);
    setEditing(null);
    setBanner({ ok: true, text: exists ? `Updated “${hook.name}”` : `Added “${hook.name}”` });
  };

  const handleToggle = (id: string) => {
    persist(hooks.map((h) => (h.id === id ? { ...h, active: !h.active } : h)));
  };

  const handleDelete = (id: string) => {
    const h = hooks.find((x) => x.id === id);
    persist(hooks.filter((x) => x.id !== id));
    if (editing?.id === id) setEditing(null);
    setBanner({ ok: true, text: `Deleted “${h?.name ?? id}”` });
  };

  /** Manual test — routes through the dispatcher so the delivery log updates. */
  const handleTest = async (hook: Webhook) => {
    setTestingId(hook.id);
    setBanner(null);
    try {
      const results = await notifyEvent(
        [{ ...hook, active: true, events: hook.events.length ? hook.events : ['node.updated'] }],
        hook.events[0] ?? 'node.updated',
        { nodeId: 'test', metadata: { manualTest: true, source: 'webhook-manager' } },
      );
      const r = results[0];
      // update lastTriggered / failureCount on the stored hook
      persist(
        hooks.map((h) =>
          h.id === hook.id
            ? {
                ...h,
                lastTriggered: new Date().toISOString(),
                failureCount: r?.success ? 0 : h.failureCount + 1,
              }
            : h,
        ),
      );
      setLog(loadWebhookLog());
      setBanner(
        r?.success
          ? { ok: true, text: `✔ Test delivered to ${hook.name} (HTTP ${r.httpStatus ?? 200})` }
          : { ok: false, text: `✘ Test failed: ${r?.error ?? 'no matching subscription'}` },
      );
    } finally {
      setTestingId(null);
    }
  };

  const handleClearLog = () => {
    clearWebhookLog();
    setLog([]);
  };

  return (
    <div className="space-y-6 px-6 py-8">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">Webhook Manager</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Push QHSE plan events to Slack, MS Teams, Zapier/Make, Power BI or any
          custom HTTPS endpoint. Each delivery is retried up to 3 times with
          backoff and can carry an HMAC-SHA256 signature in{' '}
          <code className="text-blue-400">X-Webhook-Signature</code>.
        </p>
      </section>

      {banner && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            banner.ok
              ? 'border-green-800 bg-green-950/50 text-green-300'
              : 'border-red-800 bg-red-950/50 text-red-300'
          }`}
        >
          {banner.text}
        </div>
      )}

      <WebhookForm
        key={editing?.id ?? 'new'}
        initial={editing}
        onSave={handleSave}
        onCancel={editing ? () => setEditing(null) : undefined}
      />

      <WebhookList
        hooks={hooks}
        onToggle={handleToggle}
        onTest={handleTest}
        onEdit={(h) => {
          setEditing(h);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDelete={handleDelete}
        testingId={testingId}
      />

      <WebhookLog entries={log} onClear={handleClearLog} />

      {/* Integration recipes */}
      <section className="rounded-xl border border-gray-800 bg-panel p-5">
        <h2 className="mb-3 text-lg font-semibold">Ready-to-use integrations</h2>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Slack', hint: 'Incoming webhook URL → incident alerts channel', eg: 'https://hooks.slack.com/services/T…/B…/…' },
            { name: 'MS Teams', hint: 'Connector incoming webhook for HSE notices', eg: 'https://company.webhook.office.com/webhook2/…' },
            { name: 'Zapier / Make', hint: 'Catch-hook triggers a workflow on node.updated', eg: 'https://hooks.zapier.com/hooks/catch/…/' },
            { name: 'Power BI', hint: 'Push KPI snapshot when export.done fires', eg: 'https://powerbi.microsoft.com/…/push?key=…' },
            { name: 'Custom API', hint: 'Any HTTPS endpoint; verify X-Webhook-Signature', eg: 'https://api.yourdomain.ae/qhse/events' },
          ].map((i) => (
            <div key={i.name} className="rounded-lg border border-gray-800 bg-card p-3">
              <div className="font-semibold">{i.name}</div>
              <div className="mt-1 text-gray-400">{i.hint}</div>
              <div className="mt-1 break-all font-mono text-[11px] text-gray-600">{i.eg}</div>
            </div>
          ))}
        </div>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-blue-400">
            Example payload sent to your endpoint
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-300">
{JSON.stringify(
  {
    event: 'node.updated',
    timestamp: '2026-10-15T12:00:00.000Z',
    nodeId: 'impl-1',
    node: { title: 'Permit To Work (PTW) System', status: 'active' },
    metadata: { changedBy: 'hse.officer@kezad.ae' },
  },
  null,
  2,
)}
          </pre>
        </details>
      </section>
    </div>
  );
}
