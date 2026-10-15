'use client';

import type { Webhook } from '@/types/qhse';

interface Props {
  hooks: Webhook[];
  onToggle: (id: string) => void;
  onTest: (hook: Webhook) => void;
  onEdit: (hook: Webhook) => void;
  onDelete: (id: string) => void;
  testingId?: string | null;
}

export default function WebhookList({
  hooks,
  onToggle,
  onTest,
  onEdit,
  onDelete,
  testingId,
}: Props) {
  if (hooks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 bg-panel p-8 text-center text-sm text-gray-500">
        No webhooks configured yet. Add one above to start pushing QHSE events
        to Slack, Teams, Zapier or any HTTPS endpoint.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {hooks.map((h) => (
        <li
          key={h.id}
          className="rounded-xl border border-gray-800 bg-panel p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold">
                <span>{h.name}</span>
                <span
                  title={h.active ? 'Active' : 'Paused'}
                  className={h.active ? '' : 'opacity-60'}
                >
                  {h.active ? '🟢' : '🔴'}
                </span>
                {h.failureCount > 0 && (
                  <span className="rounded-full bg-red-900/70 px-2 py-0.5 text-[10px] font-bold uppercase text-red-300">
                    {h.failureCount} failures
                  </span>
                )}
              </div>
              <div className="mt-0.5 truncate text-sm text-gray-400">{h.url}</div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-gray-500">
                {h.events.map((e) => (
                  <span
                    key={e}
                    className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-[11px]"
                  >
                    {e}
                  </span>
                ))}
                {h.secret && (
                  <span className="rounded bg-gray-800 px-1.5 py-0.5 text-[11px]">
                    🔏 signed
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Last triggered:{' '}
                {h.lastTriggered ? new Date(h.lastTriggered).toLocaleString() : 'never'}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => onToggle(h.id)}
                className="btn-ghost !px-3 !py-1.5 text-xs"
              >
                {h.active ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => onTest(h)}
                disabled={testingId === h.id}
                className="btn-success !px-3 !py-1.5 text-xs"
              >
                {testingId === h.id ? 'Testing…' : 'Test'}
              </button>
              <button
                onClick={() => onEdit(h)}
                className="btn-ghost !px-3 !py-1.5 text-xs"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Delete webhook “${h.name}”?`)) onDelete(h.id);
                }}
                className="btn-danger !px-3 !py-1.5 text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
