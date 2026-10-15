import TreeView from '@/components/tree/TreeView';
import { loadTree } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function TreePage() {
  // SSR-safe: returns the seed tree on the server, hydrated client-side from localStorage
  return <TreeView initialTree={loadTree()} />;
}
