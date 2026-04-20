import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LayoutDashboard,
  Truck,
  Building2,
  FileText,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Banknote,
  Upload,
  Bell,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Financial Operations — DCS Command Suite',
  description: 'Supplier finance, client billing, invoice approvals, disputes, forecasting, and weekly cash flow.',
};

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/clients', label: 'Clients', icon: Building2 },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/payments', label: 'Payments', icon: Wallet },
  { href: '/cash-flow', label: 'Cash Flow', icon: Banknote },
  { href: '/forecasting', label: 'Forecasting', icon: TrendingUp },
  { href: '/warnings', label: 'Warnings', icon: Bell },
  { href: '/documents', label: 'Documents', icon: Upload },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="min-h-screen flex">
          <aside className="w-60 shrink-0 border-r border-border bg-bg-elevated">
            <div className="p-4 border-b border-border">
              <div className="text-xs text-text-muted uppercase tracking-wider">DCS Command Suite</div>
              <div className="text-base font-semibold mt-1">Financial Ops</div>
            </div>
            <nav className="p-2 space-y-0.5">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-bg-raised transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="flex-1 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
