import { NextResponse } from 'next/server';
export async function POST(){ return NextResponse.json({enqueued:true, queue:'reconcileRematch'}); }
