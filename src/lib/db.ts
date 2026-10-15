import type { QHSENode } from '@/types/qhse';
import { SEED_TREE } from './seed-data';

/**
 * Zero-config demo persistence layer.
 *
 * The tree and webhook registry live in localStorage so the whole app runs
 * with no database. In production swap these calls for Prisma
 * (`db.qHSENode.findMany()` etc.) — the shapes are identical.
 */

const TREE_KEY = 'kezad-qhse:tree:v1';
const HOOKS_KEY = 'kezad-qhse:webhooks:v1';
const LOG_KEY = 'kezad-qhse:webhook-log:v1';

const isBrowser = () => typeof window !== 'undefined';

/* ---------------------------------- tree --------------------------------- */

export function loadTree(): QHSENode {
  if (!isBrowser()) return SEED_TREE;
  try {
    const raw = window.localStorage.getItem(TREE_KEY);
    if (raw) return JSON.parse(raw) as QHSENode;
  } catch {
    /* corrupted storage → fall back to seed */
  }
  return SEED_TREE;
}

export function saveTree(tree: QHSENode): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TREE_KEY, JSON.stringify(tree));
  } catch {
    /* quota exceeded — ignore in demo mode */
  }
}

export function resetTree(): QHSENode {
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(TREE_KEY);
    } catch {
      /* ignore */
    }
  }
  return SEED_TREE;
}

/* ------------------------------ tree utilities ---------------------------- */

export function findNode(node: QHSENode, id: string): QHSENode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

/** Immutably apply `patch` to the node with `id`, returning a new tree. */
export function updateNode(
  node: QHSENode,
  id: string,
  patch: Partial<Omit<QHSENode, 'id' | 'children'>>,
): QHSENode {
  if (node.id === id) {
    return { ...node, ...patch, updatedAt: new Date().toISOString() };
  }
  return {
    ...node,
    children: node.children.map((c) => updateNode(c, id, patch)),
  };
}

/** Immutably append a child under `parentId`, returning a new tree. */
export function addChild(
  node: QHSENode,
  parentId: string,
  child: QHSENode,
): QHSENode {
  if (node.id === parentId) {
    return {
      ...node,
      children: [...node.children, child],
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    ...node,
    children: node.children.map((c) => addChild(c, parentId, child)),
  };
}

/** Immutably remove a subtree by id, returning a new tree. */
export function removeNode(node: QHSENode, id: string): QHSENode {
  return {
    ...node,
    children: node.children
      .filter((c) => c.id !== id)
      .map((c) => removeNode(c, id)),
  };
}

export function flattenNodes(
  node: QHSENode,
  depth = 0,
  path: string[] = [],
): Array<{ node: QHSENode; depth: number; path: string[] }> {
  const current = [...path, node.title];
  return [
    { node, depth, path: current },
    ...node.children.flatMap((c) => flattenNodes(c, depth + 1, current)),
  ];
}

export function countNodes(node: QHSENode): number {
  return 1 + node.children.reduce((acc, c) => acc + countNodes(c), 0);
}

export function makeId(prefix = 'node'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rnd}`;
}

/* -------------------------------- webhooks ------------------------------- */

import type { Webhook, WebhookLogEntry } from '@/types/qhse';

export function loadWebhooks(): Webhook[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(HOOKS_KEY);
    if (raw) return JSON.parse(raw) as Webhook[];
  } catch {
    /* ignore */
  }
  return [];
}

export function saveWebhooks(hooks: Webhook[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(HOOKS_KEY, JSON.stringify(hooks));
  } catch {
    /* ignore */
  }
}

export function loadWebhookLog(): WebhookLogEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    if (raw) return JSON.parse(raw) as WebhookLogEntry[];
  } catch {
    /* ignore */
  }
  return [];
}

export function appendWebhookLog(entries: WebhookLogEntry[]): void {
  if (!isBrowser()) return;
  const merged = [...entries, ...loadWebhookLog()].slice(0, 100); // keep last 100
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

export function clearWebhookLog(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(LOG_KEY);
  } catch {
    /* ignore */
  }
}
