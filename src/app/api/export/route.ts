import { NextRequest, NextResponse } from 'next/server';
import { SEED_TREE } from '@/lib/seed-data';
import { treeToCsvRows } from '@/lib/exporters/csv';
import type { QHSENode } from '@/types/qhse';

export const dynamic = 'force-dynamic';

/**
 * Server-side export API — returns the payload as a downloadable file.
 * Useful for integrations (Power BI / Zapier fetching fresh plan data).
 * GET /api/export?format=csv|json|xlsx-ready-json
 */
export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format') ?? 'json';
  const tree: QHSENode = SEED_TREE; // production: await db.qHSENode.findFirst()

  if (format === 'csv') {
    const rows = treeToCsvRows(tree);
    const header = Object.keys(rows[0] ?? {}).join(',');
    const escape = (v: unknown) => `"${String(v ?? '').replaceAll('"', '""')}"`;
    const csv = [
      header,
      ...rows.map((r) => Object.values(r).map(escape).join(',')),
    ].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="QHSE-Plan.csv"',
      },
    });
  }

  return new NextResponse(JSON.stringify(tree, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="QHSE-Plan.json"',
    },
  });
}
