import Papa from 'papaparse';
import type { QHSENode } from '@/types/qhse';
import { download } from './json';

interface CsvRow {
  Id: string;
  Level: number;
  Path: string;
  Title: string;
  Status: string;
  Owner: string;
  DueDate: string;
  Description: string;
  Notes: string;
  Evidence: string;
  UpdatedAt: string;
}

function flatten(
  node: QHSENode,
  depth = 0,
  path: string[] = [],
): Array<{ node: QHSENode; depth: number; path: string[] }> {
  const current = [...path, node.title];
  return [
    { node, depth, path: current },
    ...node.children.flatMap((c) => flatten(c, depth + 1, current)),
  ];
}

export function treeToCsvRows(tree: QHSENode): CsvRow[] {
  return flatten(tree).map(({ node, depth, path }) => ({
    Id: node.id,
    Level: depth,
    Path: path.join(' > '),
    Title: node.title,
    Status: node.status,
    Owner: node.owner ?? '',
    DueDate: node.dueDate ?? '',
    Description: node.description ?? '',
    Notes: node.notes ?? '',
    Evidence: (node.evidence ?? []).join(' | '),
    UpdatedAt: node.updatedAt,
  }));
}

/** Flat CSV of every node (one row per node, full breadcrumb path). */
export function exportCSV(tree: QHSENode, filename = 'QHSE-Plan.csv'): void {
  const csv = Papa.unparse(treeToCsvRows(tree));
  download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), filename);
}
