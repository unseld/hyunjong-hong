import { prisma } from '@acme/db'; import { NextResponse } from 'next/server';
export async function GET(){ return NextResponse.json(await prisma.bankAccount.findMany()); }
export async function POST(req:Request){ const b=await req.json(); return NextResponse.json(await prisma.bankAccount.create({data:{companyId:b.companyId??'company_default',bankName:b.bankName,accountNumber:b.accountNumber,fintechUseNum:b.fintechUseNum,accessToken:b.accessToken,status:b.status??'MOCK'}})); }
export async function PUT(req:Request){ const b=await req.json(); return NextResponse.json(await prisma.bankAccount.update({where:{id:b.id},data:b})); }
export async function DELETE(req:Request){ const {id}=await req.json(); await prisma.bankAccount.delete({where:{id}}); return NextResponse.json({ok:true}); }
