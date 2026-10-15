import jsPDF from 'jspdf';
import type { QHSENode } from '@/types/qhse';

interface Row {
  title: string;
  depth: number;
  status: string;
}

function flatten(node: QHSENode, depth = 0): Row[] {
  const row: Row = { title: node.title, depth, status: node.status };
  return [row, ...node.children.flatMap((c) => flatten(c, depth + 1))];
}

export function exportPDF(tree: QHSENode, filename = 'QHSE-Plan.pdf'): void {
  const doc = new jsPDF();
  const rows = flatten(tree);
  let y = 20;

  // Title block
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text('Project QHSE Plan - KEZAD Mamourah', 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(`Generated ${new Date().toISOString().slice(0, 10)}  |  ${rows.length} nodes`, 14, y);
  y += 10;

  doc.setFontSize(10);
  rows.forEach((r) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const indent = r.depth * 6;
    const label = `[${r.status.toUpperCase()}] ${r.title}`;
    if (r.depth === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 95);
    } else if (r.depth === 1) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 40, 40);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
    }
    doc.text(doc.splitTextToSize(label, 180 - indent), 14 + indent, y);
    y += 7;
  });

  doc.save(filename);
}
