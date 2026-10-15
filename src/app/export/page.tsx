'use client';

import { useEffect, useState } from 'react';
import type { QHSENode, Webhook } from '@/types/qhse';
import { loadTree, loadWebhooks } from '@/lib/db';
import { exportPDF } from '@/lib/exporters/pdf';
import { exportExcel } from '@/lib/exporters/excel';
import { exportCSV } from '@/lib/exporters/csv';
import { exportJSON } from '@/lib/exporters/json';
import { fireExportDone } from '@/lib/notify';

type Format = 'pdf' | 'excel' | 'csv' | 'json';

const FORMATS: Array<{
  key: Format;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    key: 'pdf',
    label: '📄 PDF document',
    desc: 'Formatted A4 outline of the full QHSE plan with status tags — ideal for print & sign-off.',
    icon: 'PDF',
  },
  {
    key: 'excel',
    label: '📊 Excel workbook',
    desc: 'One row per node with Level, breadcrumb Path, Status, Owner, Due date, Notes and Evidence columns.',
    icon: 'XLSX',
  },
  {
    key: 'csv',
    label: '📋 CSV data',
    desc: 'Flat, machine-friendly dataset for Power BI, Zapier or importing into other asset systems.',
    icon: 'CSV',
  },
  {
    key: 'json',
    label: '🔧 JSON tree',
    desc: 'Complete nested structure — lossless backup and re-import source for this app.',
    icon: 'JSON',
  },
];

export default function ExportPage() {
  const [tree, setTree] = useState<QHSENode | null>(null);
  const [busy, setBusy] = useState<Format | null>(null);
  const [history, setHistory] = useState<Array<{ format: string; at: string }>>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setTree(loadTree());
  }, []);

  const run = async (fmt: Format) => {
    if (!tree) return;
    setBusy(fmt);
    setStatus(null);
    try {
      // small delay so the button feedback is visible even on fast machines
      await new Promise((r) => setTimeout(r, 150));
      if (fmt === 'pdf') exportPDF(tree);
      if (fmt === 'excel') exportExcel(tree);
      if (fmt === 'csv') exportCSV(tree);
      if (fmt === 'json') exportJSON(tree);

      const stamp = new Date().toLocaleTimeString();
      setHistory((h) => [{ format: fmt.toUpperCase(), at: stamp }, ...h].slice(0, 10));

      // Notify subscribed webhooks (fire-and-forget in demo mode)
      const hooks: Webhook[] = loadWebhooks();
      if (hooks.some((h) => h.active && h.events.includes('export.done'))) {
        void fireExportDone(hooks, { format: fmt, nodes: countAll(tree) });
        setStatus(`Exported ${fmt.toUpperCase()} · notified export.done webhooks`);
      } else {
        setStatus(`Exported ${fmt.toUpperCase()} successfully`);
      }
    } catch (e) {
      setStatus(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8 px-6 py-8">
      <section>
        <h1 className="text-2xl font-bold sm:text-3xl">Export Centre</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-400">
          Download the current KEZAD Mamourah QHSE plan — exactly as you have
          edited it in the Mind Map — in any of the four formats below. Exports
          trigger the <code className="text-blue-400">export.done</code> webhook
          event when integrations are subscribed.
        </p>
        {tree && (
          <p className="mt-2 text-xs text-gray-500">
            Source: “{tree.title}” · {countAll(tree)} nodes · last updated{' '}
            {new Date(tree.updatedAt).toLocaleString()}
          </p>
        )}
      </section>

      {status && (
        <div className="rounded-lg border border-blue-800 bg-blue-950/50 px-4 py-2 text-sm text-blue-300">
          {status}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {FORMATS.map((f) => (
          <button
            key={f.key}
            onClick={() => run(f.key)}
            disabled={!tree || busy !== null}
            className="group rounded-xl border border-gray-800 bg-panel p-5 text-left transition-colors hover:border-blue-600 hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{f.label}</span>
              <span className="rounded bg-gray-800 px-2 py-1 text-[10px] font-bold tracking-wide text-gray-400 group-hover:bg-blue-600/30 group-hover:text-blue-300">
                {busy === f.key ? '…' : f.icon}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-400">{f.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Server-side endpoints */}
        <section className="rounded-xl border border-gray-800 bg-panel p-6">
          <h2 className="mb-3 text-lg font-semibold">Server-side endpoints</h2>
          <p className="mb-4 text-sm text-gray-400">
            Fresh plan data over HTTP for dashboards & integrations (served from
            the seed dataset in demo mode):
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                className="text-blue-400 hover:underline"
                href="/api/export?format=json"
                target="_blank"
                rel="noreferrer"
              >
                GET /api/export?format=json
              </a>{' '}
              <span className="text-gray-500">— full nested tree</span>
            </li>
            <li>
              <a
                className="text-blue-400 hover:underline"
                href="/api/export?format=csv"
                target="_blank"
                rel="noreferrer"
              >
                GET /api/export?format=csv
              </a>{' '}
              <span className="text-gray-500">— flat rows, one per node</span>
            </li>
          </ul>
        </section>

        {/* Session history */}
        <section className="rounded-xl border border-gray-800 bg-panel p-6">
          <h2 className="mb-3 text-lg font-semibold">This session</h2>
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No exports yet.</p>
          ) : (
            <ul className="divide-y divide-gray-800 text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex justify-between py-2">
                  <span className="font-medium text-gray-200">{h.format}</span>
                  <span className="text-gray-500">{h.at}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function countAll(node: QHSENode): number {
  return 1 + node.children.reduce((acc, c) => acc + countAll(c), 0);
}
