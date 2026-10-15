import { NextRequest, NextResponse } from 'next/server';
import { fireWebhooks } from '@/lib/webhook-runner';
import type { QHSENode, Webhook } from '@/types/qhse';

export const dynamic = 'force-dynamic';

/**
 * Webhook API.
 *
 * Demo mode: the client keeps its registry in localStorage and POSTs the
 * matching hooks along with the event, so dispatching works end-to-end with
 * zero infrastructure. In production, drop `hooks` from the request body and
 * load them server-side instead:
 *
 *   const hooks = await db.webhook.findMany({ where: { active: true } });
 */

interface FireRequestBody {
  event: string;
  nodeId?: string;
  node?: QHSENode;
  metadata?: Record<string, unknown>;
  /** demo-mode only — production loads hooks from the DB */
  hooks?: Webhook[];
}

export async function POST(req: NextRequest) {
  let body: FireRequestBody;
  try {
    body = (await req.json()) as FireRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { event, nodeId, node, metadata, hooks = [] } = body;
  if (!event) return NextResponse.json({ error: 'event is required' }, { status: 400 });

  const results = await fireWebhooks(hooks, event, { nodeId, node, metadata });
  return NextResponse.json({ results });
}

export async function GET() {
  // Production: return NextResponse.json(await db.webhook.findMany());
  return NextResponse.json([]);
}
