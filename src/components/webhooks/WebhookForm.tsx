'use client';

import { useState } from 'react';
import type { Webhook, WebhookEvent } from '@/types/qhse';
import { WEBHOOK_EVENTS } from '@/types/qhse';
import { makeId } from '@/lib/db';

interface Props {
  /** editing an existing hook when provided */
  initial?: Webhook | null;
  onSave: (hook: Webhook) => void;
  onCancel?: () => void;
}

const EMPTY: Webhook = {
  id: '',
  name: '',
  url: '',
  secret: '',
  events: [],
  active: true,
  failureCount: 0,
};

export default function WebhookForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Webhook>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!form.name.trim()) return setError('Name is required.');
    if (!/^https:\/\/.+/i.test(form.url.trim()))
      return setError('URL must start with https://');
    if (form.events.length === 0) return setError('Pick at least one event.');

    const hook: Webhook = {
      ...form,
      id: form.id || makeId('hook'),
      name: form.name.trim(),
      url: form.url.trim(),
      secret: form.secret?.trim() || undefined,
    };
    onSave(hook);
    if (!initial) setForm(EMPTY);
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-panel p-5">
      <h2 className="mb-3 text-lg font-semibold">
        {initial ? `Edit “${initial.name}”` : 'Add webhook'}
      </h2>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        Name
      </label>
      <input
        className="input"
        placeholder="Slack — HSE alerts channel"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        Target URL (HTTPS)
      </label>
      <input
        className="input"
        placeholder="https://hooks.slack.com/services/..."
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
      />

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        Signing secret (optional — sends X-Webhook-Signature HMAC-SHA256)
      </label>
      <input
        className="input"
        type="password"
        placeholder="••••••••"
        value={form.secret ?? ''}
        onChange={(e) => setForm({ ...form, secret: e.target.value })}
      />

      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
        Subscribed events
      </label>
      <div className="mb-3 flex flex-wrap gap-3">
        {WEBHOOK_EVENTS.map((ev) => {
          const checked = form.events.includes(ev);
          return (
            <label
              key={ev}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                checked
                  ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => {
                  const events: WebhookEvent[] = e.target.checked
                    ? [...form.events, ev]
                    : form.events.filter((x) => x !== ev);
                  setForm({ ...form, events });
                }}
              />
              {ev}
            </label>
          );
        })}
      </div>

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm({ ...form, active: e.target.checked })}
        />
        Active
      </label>

      {error && (
        <p className="mb-3 rounded-md bg-red-950 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={submit} className="btn-primary">
          {initial ? 'Update webhook' : 'Save webhook'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
