'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { NodeStatus, QHSENode } from '@/types/qhse';
import { NODE_STATUSES } from '@/types/qhse';
import { StatusBadge } from '@/components/ui/StatusBadge';

export interface EditorPatch {
  title?: string;
  description?: string;
  owner?: string;
  dueDate?: string;
  status?: NodeStatus;
  notes?: string;
}

interface Props {
  node: QHSENode | null;
  onSave: (id: string, patch: EditorPatch) => void;
  onAddChild: (parentId: string, title: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function NodeEditor({ node, onSave, onAddChild, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<NodeStatus>('draft');
  const [notes, setNotes] = useState('');
  const [childTitle, setChildTitle] = useState('');

  // Re-hydrate the form whenever a different node is selected
  useEffect(() => {
    if (!node) return;
    setTitle(node.title);
    setDescription(node.description ?? '');
    setOwner(node.owner ?? '');
    setDueDate(node.dueDate ?? '');
    setStatus(node.status);
    setNotes(node.notes ?? '');
    setChildTitle('');
  }, [node?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!node) return null;

  const save = () => {
    onSave(node.id, {
      title: title.trim() || node.title,
      description,
      owner,
      dueDate,
      status,
      notes,
    });
  };

  return (
    <aside className="card absolute right-4 top-4 z-20 max-h-[calc(100%-2rem)] w-80 overflow-y-auto p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight">{node.title}</h3>
          <p className="mt-1 text-xs text-gray-500">
            id: <code>{node.id}</code> · updated{' '}
            {new Date(node.updatedAt).toLocaleString()}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close editor">
          ✕
        </button>
      </div>

      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Title</label>
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Description</label>
      <textarea
        className="input min-h-[60px]"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Owner</label>
          <input className="input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. HSE Officer" />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Due date</label>
          <input
            type="date"
            className="input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Status</label>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-gray-600 bg-gray-700 px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as NodeStatus)}
        >
          {NODE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <StatusBadge status={status} />
      </div>

      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">Notes</label>
      <textarea className="input min-h-[50px]" value={notes} onChange={(e) => setNotes(e.target.value)} />

      <div className="mb-4 flex gap-2">
        <button onClick={save} className="btn-primary flex-1">
          Save
        </button>
        <Link href={`/nodes/${node.id}`} className="btn-ghost" title="Open full detail page">
          Full page →
        </Link>
      </div>

      <div className="border-t border-gray-700 pt-3">
        <label className="mb-1 block text-xs uppercase tracking-wide text-gray-400">
          Add child node ({node.children.length} existing)
        </label>
        <div className="flex gap-2">
          <input
            className="input mb-0 flex-1"
            placeholder="New sub-item title"
            value={childTitle}
            onChange={(e) => setChildTitle(e.target.value)}
          />
          <button
            className="btn-success whitespace-nowrap"
            disabled={!childTitle.trim()}
            onClick={() => {
              onAddChild(node.id, childTitle.trim());
              setChildTitle('');
            }}
          >
            + Add
          </button>
        </div>
      </div>

      {node.parentId !== null && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <button
            className="btn-danger w-full"
            onClick={() => {
              if (confirm(`Delete "${node.title}" and its ${node.children.length} children?`)) {
                onDelete(node.id);
              }
            }}
          >
            Delete node & subtree
          </button>
        </div>
      )}
    </aside>
  );
}
