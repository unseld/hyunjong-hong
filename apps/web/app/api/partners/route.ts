import { prisma } from '@acme/db';
import { NextResponse } from 'next/server';
import { normalizeText } from '@acme/shared/src/utils/normalize';
export async function GET(){ return NextResponse.json(await prisma.partner.findMany()); }
export async function POST(req:Request){ const b=await req.json(); const row=await prisma.partner.create({data:{companyId:b.companyId??'company_default',type:b.type,name:b.name,bizNo:b.bizNo,normalizedName:normalizeText(`${b.name}${b.bizNo??''}`)}}); return NextResponse.json(row); }
export async function PUT(req:Request){ const b=await req.json(); const row=await prisma.partner.update({where:{id:b.id},data:{name:b.name,bizNo:b.bizNo,normalizedName:normalizeText(`${b.name}${b.bizNo??''}`)}}); return NextResponse.json(row); }
export async function DELETE(req:Request){ const {id}=await req.json(); await prisma.partner.delete({where:{id}}); return NextResponse.json({ok:true}); }
