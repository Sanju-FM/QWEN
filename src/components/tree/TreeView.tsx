'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MindMap from '@/components/tree/MindMap';
import NodeEditor, { type EditorPatch } from '@/components/tree/NodeEditor';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  addChild,
  findNode,
  makeId,
  removeNode,
  resetTree,
  saveTree,
  updateNode,
} from '@/lib/db';
import { fireWebhooks } from '@/lib/webhook-runner';
import type { QHSENode, Webhook } from '@/types/qhse';
import { WEBHOOK_EVENTS } from '@/types/qhse';

const HOOKS_KEY = 'kezad-qhse:webhooks:v1';

interface Props {
  initialTree: QHSENode;
}

export default function TreeView({ initialTree }: Props) {
  const [tree, setTree] = useState<QHSENode>(initialTree);
  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [toast, setToast] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => (selectedId ? findNode(tree, selectedId) : null),
    [tree, selectedId],
  );

  // Load the persisted tree after mount (localStorage is browser-only)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('kezad-qhse:tree:v1');
      if (raw) setTree(JSON.parse(raw));
    } catch {
      /* keep seed */
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const readHooks = (): Webhook[] => {
    try {
      return JSON.parse(window.localStorage.getItem(HOOKS_KEY) ?? '[]') as Webhook[];
    } catch {
      return [];
    }
  };

  /** Persist + fan out webhook events for a node mutation. */
  const commit = (next: QHSENode, event: string, nodeId: string) => {
    setTree(next);
    saveTree(next);
    const node = findNode(next, nodeId) ?? undefined;
    const hooks = readHooks();
    if (hooks.some((h) => h.active && WEBHOOK_EVENTS.includes(event as never))) {
      void fireWebhooks(hooks, event, { nodeId, node, metadata: { source: 'tree-view' } });
    }
    setToast(event === 'node.created' ? 'Child created · webhook dispatched' : 'Saved · webhook dispatched');
  };

  const handleSave = (id: string, patch: EditorPatch) => {
    commit(updateNode(tree, id, patch), 'node.updated', id);
  };

  const handleAddChild = (parentId: string, title: string) => {
    const child: QHSENode = {
      id: makeId(parentId),
      parentId,
      title,
      status: 'draft',
      children: [],
      updatedAt: new Date().toISOString(),
    };
    commit(addChild(tree, parentId, child), 'node.created', child.id);
    setSelectedId(child.id);
  };

  const handleDelete = (id: string) => {
    commit(removeNode(tree, id), 'node.updated', id);
    setSelectedId(null);
    setToast('Node deleted');
  };

  const stats = useMemo(() => {
    let total = 0;
    const byStatus: Record<string, number> = {};
    const walk = (n: QHSENode) => {
      total += 1;
      byStatus[n.status] = (byStatus[n.status] ?? 0) + 1;
      n.children.forEach(walk);
    };
    walk(tree);
    return { total, byStatus };
  }, [tree]);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            <strong className="text-white">{stats.total}</strong> nodes
          </span>
          {Object.entries(stats.byStatus).map(([s, c]) => (
            <span key={s} className="flex items-center gap-1">
              <StatusBadge status={s as QHSENode['status']} /> {c}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/export" className="btn-ghost">
            Export
          </Link>
          <button
            className="btn-ghost"
            onClick={() => {
              if (confirm('Reset to the original KEZAD Mamourah mind map?')) {
                const fresh = resetTree();
                setTree(fresh);
                setSelectedId('root');
                setToast('Tree reset to seed data');
              }
            }}
          >
            Reset tree
          </button>
        </div>
      </div>

      <MindMap tree={tree} selectedId={selectedId} onNodeClick={(id) => setSelectedId(id)} />

      <NodeEditor
        node={selectedNode}
        onSave={handleSave}
        onAddChild={handleAddChild}
        onDelete={handleDelete}
        onClose={() => setSelectedId(null)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
