import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'KEZAD Mamourah — QHSE Plan',
  description:
    'Project QHSE Plan mind map for KEZAD Mamourah: interactive tree, editable nodes, exports and webhook manager.',
};

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/tree', label: 'Mind Map' },
  { href: '/export', label: 'Export Centre' },
  { href: '/webhooks', label: 'Webhooks' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <header className="sticky top-0 z-50 border-b border-gray-800 bg-panel/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="text-blue-400">◆</span>
              <span className="hidden sm:inline">QHSE Plan — KEZAD Mamourah</span>
              <span className="sm:hidden">QHSE Plan</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="nav-link">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl">{children}</main>
        <footer className="mx-auto max-w-7xl px-6 py-6 text-xs text-gray-600">
          KEZAD Mamourah External FM Services · QHSE Management System · demo data persists in your browser only
        </footer>
      </body>
    </html>
  );
}
