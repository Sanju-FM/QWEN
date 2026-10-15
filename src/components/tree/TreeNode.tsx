'use client';

import { Handle, Position, type NodeProps } from 'reactflow';
import type { NodeStatus } from '@/types/qhse';

export interface QHSEFlowData {
  label: string;
  status: NodeStatus;
  childCount: number;
  parentId: string | null;
  selected?: boolean;
}

const STATUS_STYLE: Record<NodeStatus, { bg: string; ring: string }> = {
  draft: { bg: '#374151', ring: '#4b5563' },
  active: { bg: '#1e3a5f', ring: '#60a5fa' },
  review: { bg: '#78350f', ring: '#fbbf24' },
  closed: { bg: '#14532d', ring: '#4ade80' },
};

const DOT: Record<NodeStatus, string> = {
  draft: 'bg-gray-400',
  active: 'bg-blue-400',
  review: 'bg-amber-400',
  closed: 'bg-green-400',
};

export default function TreeNode({ data }: NodeProps<QHSEFlowData>) {
  const style = STATUS_STYLE[data.status] ?? STATUS_STYLE.draft;
  return (
    <div
      className="rounded-lg px-3 py-2 text-white shadow-md transition-shadow hover:shadow-xl"
      style={{
        background: style.bg,
        border: `1px solid ${style.ring}`,
        minWidth: 190,
        maxWidth: 240,
        boxShadow: data.selected ? `0 0 0 2px ${style.ring}` : undefined,
      }}
    >
      {data.parentId !== null && (
        <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-blue-400" />
      )}
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[data.status]}`} title={data.status} />
        <span className="text-xs font-medium leading-tight">{data.label}</span>
      </div>
      {data.childCount > 0 && (
        <div className="mt-1 text-right text-[10px] text-white/50">{data.childCount} sub-items</div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-blue-400"
      />
    </div>
  );
}
