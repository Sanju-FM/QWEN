import * as XLSX from 'xlsx';
import type { QHSENode } from '@/types/qhse';
import { download } from './json';

interface ExcelRow {
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

function flatten(node: QHSENode, path: string[] = []): ExcelRow[] {
  const current = [...path, node.title];
  const row: ExcelRow = {
    Level: path.length,
    Path: current.join(' > '),
    Title: node.title,
    Status: node.status,
    Owner: node.owner ?? '',
    DueDate: node.dueDate ?? '',
    Description: node.description ?? '',
    Notes: node.notes ?? '',
    Evidence: (node.evidence ?? []).join(' | '),
    UpdatedAt: node.updatedAt,
  };
  return [row, ...node.children.flatMap((c) => flatten(c, current))];
}

export function exportExcel(tree: QHSENode, filename = 'QHSE-Plan.xlsx'): void {
  const data = flatten(tree);
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },  // Level
    { wch: 70 }, // Path
    { wch: 45 }, // Title
    { wch: 10 }, // Status
    { wch: 20 }, // Owner
    { wch: 12 }, // DueDate
    { wch: 40 }, // Description
    { wch: 40 }, // Notes
    { wch: 30 }, // Evidence
    { wch: 24 }, // UpdatedAt
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'QHSE Plan');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(
    new Blob([out], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  );
}
