import type { QHSENode } from '@/types/qhse';

/** Serialise the whole tree as pretty JSON and trigger a browser download. */
export function exportJSON(tree: QHSENode, filename = 'QHSE-Plan.json'): void {
  const json = JSON.stringify(tree, null, 2);
  download(new Blob([json], { type: 'application/json' }), filename);
}

/** Download helper shared by all client-side exporters. */
export function download(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
