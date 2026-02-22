import { cookies } from 'next/headers';
import { prisma } from '@acme/db';
export async function getSessionUser() {
  const email = cookies().get('session_email')?.value;
  if (!email) return null;
  return prisma.user.findUnique({ where: { email }, include: { roles: true } });
}
export async function requireUser() { const user = await getSessionUser(); if (!user) throw new Error('Unauthorized'); return user; }
