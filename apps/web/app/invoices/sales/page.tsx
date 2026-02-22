import Link from 'next/link';
import { prisma } from '@acme/db';
export default async function Sales(){ const list = await prisma.taxInvoice.findMany({ where:{type:'SALES'}, include:{partner:true} }); return <div><h1>Sales Invoices</h1><Link href='/invoices/sales/new'>New</Link><table><tbody>{list.map(i=><tr key={i.id}><td><Link href={`/invoices/sales/${i.id}`}>{i.id}</Link></td><td>{i.partner.name}</td><td>{String(i.totalAmount)}</td><td>{i.reconcileStatus}</td></tr>)}</tbody></table></div>; }
