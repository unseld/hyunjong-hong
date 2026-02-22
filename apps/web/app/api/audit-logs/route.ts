import { prisma } from '@acme/db'; import { NextResponse } from 'next/server';
export async function GET(){ return NextResponse.json(await prisma.auditLog.findMany({orderBy:{createdAt:'desc'},take:100})); }
