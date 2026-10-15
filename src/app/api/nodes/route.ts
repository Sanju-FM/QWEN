import { NextRequest, NextResponse } from 'next/server';
import { SEED_TREE } from '@/lib/seed-data';
import type { QHSENode } from '@/types/qhse';

export const dynamic = 'force-dynamic';

/**
 * Nodes API.
 *
 * Demo mode: GET returns the seed tree (the live edits live in the user's
 * browser localStorage). Swap `SEED_TREE` for Prisma calls in production:
 *
 *   import { db } from '@/lib/db';
 *   const tree = await db.qHSENode.findFirst();
 */

function findNode(node: QHSENode, id: string): QHSENode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const node = findNode(SEED_TREE, id);
    if (!node) return NextResponse.json({ error: `node ${id} not found` }, { status: 404 });
    return NextResponse.json(node);
  }
  return NextResponse.json(SEED_TREE);
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { id?: string; patch?: Partial<QHSENode> };
  if (!body.id || !body.patch) {
    return NextResponse.json({ error: 'expected { id, patch }' }, { status: 400 });
  }
  const node = findNode(SEED_TREE, body.id);
  if (!node) return NextResponse.json({ error: 'node not found' }, { status: 404 });
  // In production: await db.qHSENode.update({ where: { id: body.id }, data: body.patch })
  return NextResponse.json({ ok: true, node: { ...node, ...body.patch } });
}
