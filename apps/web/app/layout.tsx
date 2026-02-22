import './globals.css';
import Link from 'next/link';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body><nav>
    <Link href="/dashboard">Dashboard</Link><Link href="/invoices/sales">Invoices</Link><Link href="/bank-accounts">Bank</Link><Link href="/reconcile">Reconcile</Link><Link href="/reports/monthly">Reports</Link><Link href="/admin/rules">Rules</Link>
  </nav>{children}</body></html>;
}
