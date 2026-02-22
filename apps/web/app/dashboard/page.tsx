import { prisma } from '@acme/db';
export default async function Dashboard(){
  const [invoices, txs] = await Promise.all([prisma.taxInvoice.count(), prisma.bankTransaction.count()]);
  const unmatched = await prisma.taxInvoice.count({ where: { reconcileStatus: 'UNMATCHED' } });
  return <div><h1>Dashboard</h1><p>Invoices: {invoices}</p><p>Transactions: {txs}</p><p>Unmatched: {unmatched}</p></div>;
}
