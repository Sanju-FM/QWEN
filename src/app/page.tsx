'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { NodeStatus, QHSENode } from '@/types/qhse';
import { flattenNodes, loadTree } from '@/lib/db';
import { StatusBadge } from '@/components/ui/StatusBadge';

const STATUS_ORDER: NodeStatus[] = ['draft', 'active', 'review', 'closed'];

const CARD_BG: Record<NodeStatus, string> = {
  draft: 'bg-gray-600',
  active: 'bg-blue-600',
  review: 'bg-amber-600',
  closed: 'bg-green-700',
};

interface Stats {
  total: number;
  maxDepth: number;
  byStatus: Record<NodeStatus, number>;
  overdue: number;
  withOwner: number;
  recentlyUpdated: Array<{ node: QHSENode; path: string[] }>;
}

function computeStats(tree: QHSENode): Stats {
  const flat = flattenNodes(tree);
  const now = Date.now();
  const byStatus = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<
    NodeStatus,
    number
  >;
  let overdue = 0;
  let withOwner = 0;
  let maxDepth = 0;

  for (const { node, depth } of flat) {
    byStatus[node.status] = (byStatus[node.status] ?? 0) + 1;
    if (depth > maxDepth) maxDepth = depth;
    if (node.owner) withOwner += 1;
    if (node.dueDate && node.status !== 'closed') {
      const t = Date.parse(node.dueDate);
      if (!Number.isNaN(t) && t < now) overdue += 1;
    }
  }

  const recentlyUpdated = [...flat]
    .sort((a, b) => Date.parse(b.node.updatedAt) - Date.parse(a.node.updatedAt))
    .slice(0, 8)
    .map(({ node, path }) => ({ node, path }));

  return { total: flat.length, maxDepth, byStatus, overdue, withOwner, recentlyUpdated };
}

export default function DashboardPage() {
  // SSR renders the seed tree; hydrate from localStorage on the client.
  const [tree, setTree] = useState<QHSENode | null>(null);

  useEffect(() => {
    setTree(loadTree());
  }, []);

  const stats = useMemo(() => (tree ? computeStats(tree) : null), [tree]);

  const sections = useMemo(() => {
    if (!tree) return [];
    return tree.children.map((section) => {
      const flat = flattenNodes(section);
      const done = flat.filter(({ node }) => node.status === 'closed').length;
      return { section, count: flat.length, done };
    });
  }, [tree]);

  return (
    <div className="space-y-8 px-6 py-8">
      {/* Hero */}
      <section className="rounded-xl border border-gray-800 bg-panel p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-400">
          KEZAD Mamourah · External Facilities Management
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Project QHSE Plan — Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-gray-400">
          Live overview of the QHSE mind map: documentation status across all
          plan sections, open actions, overdue items and recent activity. Edit
          anything in the interactive Mind Map, then publish it through the
          Export Centre or push events to your integrations via Webhooks.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/tree" className="btn-primary">
            Open Mind Map
          </Link>
          <Link href="/export" className="btn-secondary">
            Export plan
          </Link>
          <Link href="/webhooks" className="btn-secondary">
            Manage webhooks
          </Link>
        </div>
      </section>

      {!stats ? (
        <p className="text-sm text-gray-500">Loading plan data…</p>
      ) : (
        <>
          {/* KPI cards */}
          <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Kpi label="Total nodes" value={stats.total} accent="text-white" />
            {STATUS_ORDER.map((s) => (
              <Kpi
                key={s}
                label={s[0].toUpperCase() + s.slice(1)}
                value={stats.byStatus[s] ?? 0}
                badge={s}
              />
            ))}
            <Kpi
              label="Overdue"
              value={stats.overdue}
              accent={stats.overdue > 0 ? 'text-red-400' : 'text-green-400'}
            />
          </section>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Status distribution */}
            <section className="rounded-xl border border-gray-800 bg-panel p-6">
              <h2 className="mb-4 text-lg font-semibold">Status distribution</h2>
              <div className="space-y-3">
                {STATUS_ORDER.map((s) => {
                  const n = stats.byStatus[s] ?? 0;
                  const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <StatusBadge status={s} />
                        </span>
                        <span className="text-gray-400">
                          {n} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                        <div
                          className={`h-full ${CARD_BG[s]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Tree depth: {stats.maxDepth + 1} levels · Owners assigned:{' '}
                {stats.withOwner}/{stats.total} nodes
              </p>
            </section>

            {/* Section progress */}
            <section className="rounded-xl border border-gray-800 bg-panel p-6">
              <h2 className="mb-4 text-lg font-semibold">Section progress</h2>
              <ul className="divide-y divide-gray-800">
                {sections.map(({ section, count, done }) => (
                  <li key={section.id} className="py-2">
                    <Link
                      href={`/nodes/${section.id}`}
                      className="group flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="truncate group-hover:text-blue-400">
                        {section.title}
                      </span>
                      <span className="shrink-0 text-gray-400">
                        {done}/{count} closed
                      </span>
                    </Link>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-800">
                      <div
                        className="h-full bg-green-700"
                        style={{ width: count ? `${(done / count) * 100}%` : '0%' }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Recent activity */}
          <section className="rounded-xl border border-gray-800 bg-panel p-6">
            <h2 className="mb-4 text-lg font-semibold">Recently updated</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="py-2 pr-4">Node</th>
                    <th className="py-2 pr-4">Path</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {stats.recentlyUpdated.map(({ node, path }) => (
                    <tr key={node.id} className="hover:bg-card">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/nodes/${node.id}`}
                          className="text-blue-400 hover:underline"
                        >
                          {node.title}
                        </Link>
                      </td>
                      <td className="max-w-[260px] truncate py-2 pr-4 text-gray-500">
                        {path.slice(0, -1).join(' › ') || '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={node.status} />
                      </td>
                      <td className="py-2 pr-4 text-gray-400">{node.owner || '—'}</td>
                      <td className="py-2 text-gray-400">
                        {new Date(node.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  accent = 'text-white',
  badge,
}: {
  label: string;
  value: number;
  accent?: string;
  badge?: NodeStatus;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-panel p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {badge ? <StatusBadge status={badge} /> : label}
      </div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
      {badge && <div className="mt-1 text-xs text-gray-500">{label}</div>}
    </div>
  );
}
