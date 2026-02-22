import { prisma } from '@acme/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
export async function POST(req: Request) {
  const form = await req.formData().catch(()=>null);
  const body = form ? { email:String(form.get('email')), password:String(form.get('password')) } : await req.json();
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) return NextResponse.json({ error: 'Invalid' }, { status: 401 });
  cookies().set('session_email', user.email, { httpOnly: true });
  return form ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.json({ ok: true });
}
