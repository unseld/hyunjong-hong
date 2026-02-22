import { prisma } from '@acme/db'; import { NextResponse } from 'next/server';
export async function GET(req:Request){ const month=new URL(req.url).searchParams.get('month')!; const format=new URL(req.url).searchParams.get('format'); const start=new Date(`${month}-01`); const end=new Date(start); end.setMonth(end.getMonth()+1);
const invoices=await prisma.taxInvoice.findMany({where:{issueDate:{gte:start,lt:end}},include:{partner:true}}); const rows=invoices.map(i=>({id:i.id,partner:i.partner.name,total:Number(i.totalAmount),status:i.reconcileStatus}));
if(format==='csv'){ const csv=['id,partner,total,status',...rows.map(r=>`${r.id},${r.partner},${r.total},${r.status}`)].join('\n'); return new NextResponse(csv,{headers:{'content-type':'text/csv'}}); }
return NextResponse.json({month,count:rows.length,total:rows.reduce((a,r)=>a+r.total,0),rows}); }
