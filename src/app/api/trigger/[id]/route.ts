import { NextRequest, NextResponse } from 'next/server';
import { fireWebhooks } from '@/lib/webhook-runner';
import type { Webhook } from '@/types/qhse';

export const dynamic = 'force-dynamic';

/**
 * POST /api/trigger/[id] — manually trigger the webhook with the given id.
 * Body: { hooks?: Webhook[], event?: string, nodeId?: string, metadata?: object }
 * (`hooks` is demo-mode; production loads the hook by id from the DB.)
 */
interface Props {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Props) {
  let body: {
    hooks?: Webhook[];
    event?: string;
    nodeId?: string;
    metadata?: Record<string, unknown>;
  } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine for a test ping */
  }

  // Production: const hook = await db.webhook.findUnique({ where: { id: params.id } });
  const all: Webhook[] = body.hooks ?? [];
  const target = all.filter((h) => h.id === params.id);
  if (target.length === 0) {
    return NextResponse.json({ error: `webhook ${params.id} not found` }, { status: 404 });
  }

  const event = body.event ?? 'node.updated';
  const results = await fireWebhooks(
    [{ ...target[0], active: true }], // force-active for manual tests
    event,
    { nodeId: body.nodeId ?? 'test', metadata: { ...(body.metadata ?? {}), manualTest: true } },
  );
  return NextResponse.json({ results });
}
