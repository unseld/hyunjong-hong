import { prisma } from '@acme/db';
export async function logAudit(companyId:string, userId:string|undefined, action:string, payload:unknown) {
  await prisma.auditLog.create({ data: { companyId, userId, action, payload: payload as any } });
}
