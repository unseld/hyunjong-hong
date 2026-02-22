import { prisma } from '@acme/db'; import { NextResponse } from 'next/server';
export async function POST(req:Request){ const b=await req.json(); await prisma.taxInvoice.update({where:{id:b.invoiceId},data:{reconcileStatus:'HOLD'}}); await prisma.auditLog.create({data:{companyId:'company_default',userId:b.userId,action:'MATCH_HOLD',payload:b}}); return NextResponse.json({ok:true}); }
