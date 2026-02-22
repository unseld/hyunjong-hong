import { prisma } from '@acme/db';
export default async function NewSales(){ const partners = await prisma.partner.findMany(); return <form method='post' action='/api/invoices'><h1>New Sales Invoice</h1><input type='hidden' name='type' value='SALES' />
<select name='partnerId'>{partners.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
<input name='totalAmount' placeholder='110000'/><button>Create</button></form>; }
