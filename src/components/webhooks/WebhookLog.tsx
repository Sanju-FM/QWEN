'use client';

import type { WebhookLogEntry } from '@/types/qhse';

interface Props {
  entries: WebhookLogEntry[];
  onClear: () => void;
}

export default function WebhookLog({ entries, onClear }: Props) {
  return (
    <div className="rounded-xl border border-gray-800 bg-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Delivery log</h2>
        {entries.length > 0 && (
          <button onClick={onClear} className="btn-ghost !px-3 !py-1 text-xs">
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">
          No deliveries recorded yet. Use “Test” on a webhook or edit a node in
          the Mind Map to generate events. (Last 100 deliveries are kept in the
          browser.)
        </p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-panel text-[10px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="py-1.5 pr-2">When</th>
                <th className="py-1.5 pr-2">Webhook</th>
                <th className="py-1.5 pr-2">Event</th>
                <th className="py-1.5 pr-2">Result</th>
                <th className="py-1.5">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {entries.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap py-2 pr-2 text-gray-400">
                    {new Date(e.at).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-2 font-medium text-gray-200">
                    {e.webhookName}
                  </td>
                  <td className="py-2 pr-2 font-mono text-gray-400">{e.event}</td>
                  <td className="py-2 pr-2">
                    {e.ok ? (
                      <span className="rounded bg-green-900/60 px-1.5 py-0.5 font-semibold text-green-300">
                        OK {e.httpStatus ?? ''}
                      </span>
                    ) : (
                      <span className="rounded bg-red-900/60 px-1.5 py-0.5 font-semibold text-red-300">
                        FAIL
                      </span>
                    )}
                  </td>
                  <td className="max-w-[220px] break-all py-2 text-gray-500">
                    {e.error ?? e.url}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
