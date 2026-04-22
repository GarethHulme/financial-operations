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
import UserBadge from '@/components/UserBadge';

export const metadata: Metadata = {
  title: 'DCS Command Suite — Financial Operations',
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen flex flex-col">
          <div className="flex flex-1">
            <aside className="w-60 shrink-0 border-r border-border bg-bg-elevated flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-white">DCS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                </div>
                <div className="text-sm font-semibold text-text-primary mt-1">Financial Operations</div>
                <div className="text-[10px] uppercase tracking-wider text-text-muted mt-1">
                  DCS Command Suite
                </div>
              </div>
              <nav className="p-2 space-y-0.5 flex-1">
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
              <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center justify-end px-6 pt-6">
                  <UserBadge />
                </div>
                <div className="p-6">{children}</div>
              </div>
            </main>
          </div>
          <footer className="border-t border-border bg-bg-elevated px-6 py-3 text-xs text-text-muted text-center">
            © 2026 DCS Group. Internal use only.
          </footer>
        </div>
      </body>
    </html>
  );
}
