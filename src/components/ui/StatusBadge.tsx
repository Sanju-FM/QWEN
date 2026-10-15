import { NODE_STATUSES, type NodeStatus } from '@/types/qhse';

export const STATUS_BADGE: Record<NodeStatus, string> = {
  draft: 'bg-gray-600 text-gray-100',
  active: 'bg-blue-600 text-white',
  review: 'bg-amber-600 text-white',
  closed: 'bg-green-700 text-white',
};

export function StatusBadge({ status }: { status: NodeStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_BADGE[status] ?? 'bg-gray-700'}`}
    >
      {status}
    </span>
  );
}

export { NODE_STATUSES };
