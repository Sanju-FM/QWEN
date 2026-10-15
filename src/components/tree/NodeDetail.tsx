'use client';

import { useEffect, useState } from 'react';
import type { NodeStatus, QHSENode } from '@/types/qhse';
import { NODE_STATUSES } from '@/types/qhse';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Props {
  nodeId: string;
}

export default function NodeDetail({ nodeId }: Props) {
  const [tree, setTree] = useState<QHSENode | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kezad-qhse:tree:v1');
      const t: QHSENode = raw ? JSON.parse(raw) : undefined;
      if (!t) return;
      setTree(t);
      // build breadcrumb path
      const find = (n: QHSENode, acc: string[]): string[] | null => {
        const p = [...acc, n.title];
        if (n.id === nodeId) return p;
        for (const c of n.children) {
          const r = find(c, p);
          if (r) return r;
        }
        return null;
      };
      setPath(find(t, []) ?? []);
    } catch {
      /* ignore */
    }
  }, [nodeId]);

  if (!tree) {
    return (
      <div className="p-6 text-sm text-gray-400">
        Loading node… open the{' '}
        <a href="/tree" className="text-blue-400 underline">
          Mind Map
        </a>{' '}
        first (this page reads the tree saved in your browser).
      </div>
    );
  }

  const node = (() => {
    const find = (n: QHSENode): QHSENode | null => {
      if (n.id === nodeId) return n;
      for (const c of n.children) {
        const r = find(c);
        if (r) return r;
      }
      return null;
    };
    return find(tree);
  })();

  if (!node) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Node “{nodeId}” not found</h1>
        <p className="mt-2 text-sm text-gray-400">
          It may have been deleted.{' '}
          <a href="/tree" className="text-blue-400 underline">
            Back to the mind map
          </a>
        </p>
      </div>
    );
  }

  const patchAndSave = (patch: Partial<QHSENode>) => {
    const upd = (n: QHSENode): QHSENode =>
      n.id === nodeId
        ? { ...n, ...patch, updatedAt: new Date().toISOString() }
        : { ...n, children: n.children.map(upd) };
    const next = upd(tree);
    setTree(next);
    window.localStorage.setItem('kezad-qhse:tree:v1', JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    void fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'node.updated', nodeId, metadata: { source: 'node-detail' } }),
    }).catch(() => undefined);
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <nav className="mb-3 flex flex-wrap gap-1 text-xs text-gray-500">
        {path.map((p, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-1">/</span>}
            {p}
          </span>
        ))}
      </nav>

      <h1 className="text-2xl font-bold">{node.title}</h1>
      <p className="mt-1 text-xs text-gray-500">
        id: <code>{node.id}</code> · status: {node.status} · updated{' '}
        {new Date(node.updatedAt).toLocaleString()}
      </p>

      <div className="card mt-6 space-y-4 p-5">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Title</label>
          <input
            className="input"
            defaultValue={node.title}
            onBlur={(e) => e.target.value.trim() && patchAndSave({ title: e.target.value.trim() })}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Description</label>
          <textarea
            className="input min-h-[80px]"
            defaultValue={node.description ?? ''}
            onBlur={(e) => patchAndSave({ description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Owner</label>
            <input
              className="input"
              defaultValue={node.owner ?? ''}
              onBlur={(e) => patchAndSave({ owner: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Due date</label>
            <input
              type="date"
              className="input"
              defaultValue={node.dueDate ?? ''}
              onChange={(e) => patchAndSave({ dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Status</label>
            <select
              className="input"
              value={node.status}
              onChange={(e) => patchAndSave({ status: e.target.value as NodeStatus })}
            >
              {NODE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Notes</label>
          <textarea
            className="input min-h-[70px]"
            defaultValue={node.notes ?? ''}
            onBlur={(e) => patchAndSave({ notes: e.target.value })}
          />
        </div>
        {saved && <p className="text-xs text-green-400">Saved ✓ (webhook dispatched)</p>}
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Children ({node.children.length})
        </h2>
        <ul className="space-y-1">
          {node.children.map((c) => (
            <li key={c.id} className="card flex items-center justify-between px-3 py-2 text-sm">
              <a href={`/nodes/${c.id}`} className="hover:text-blue-300">
                {c.title}
              </a>
              <StatusBadge status={c.status} />
            </li>
          ))}
          {node.children.length === 0 && (
            <li className="text-sm text-gray-500">No child nodes.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
