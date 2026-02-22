import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@acme/db';
import { MockBankAdapter, MockTaxProvider } from '@acme/shared';

const conn = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379');
export const queues = {
  bankSync: new Queue('bankSync',{connection:conn}),
  invoiceStatusPoll: new Queue('invoiceStatusPoll',{connection:conn}),
  reconcileRematch: new Queue('reconcileRematch',{connection:conn}),
  alertNotify: new Queue('alertNotify',{connection:conn})
};

new Worker('bankSync', async job => {
  const account = await prisma.bankAccount.findUnique({ where: { id: job.data.bankAccountId } }); if (!account) return;
  const txs = await new MockBankAdapter().syncTransactions({ bankAccountId: account.id, from: new Date(Date.now()-7*86400000), to: new Date() });
  for (const t of txs) {
    await prisma.bankTransaction.upsert({ where: { bankAccountId_rawHash: { bankAccountId: account.id, rawHash: t.rawHash } }, update: {}, create: { companyId: account.companyId, bankAccountId: account.id, rawHash: t.rawHash, externalTrxId: t.externalTrxId, trxDate: t.trxDate, amount: t.amount, direction: t.direction, description: t.description } });
  }
}, { connection: conn });

new Worker('invoiceStatusPoll', async () => {
  const pending = await prisma.taxInvoice.findMany({ where: { ntsStatus: { in: ['PENDING','SENT'] }, providerInvoiceId: { not: null } } });
  const provider = new MockTaxProvider();
  for (const inv of pending) {
    const st = await provider.pollStatus(inv.providerInvoiceId!);
    await prisma.taxInvoice.update({ where: { id: inv.id }, data: { ntsStatus: st.ntsStatus, approvalNo: st.approvalNo ?? inv.approvalNo } });
  }
}, { connection: conn });

new Worker('reconcileRematch', async () => { /* TODO: enqueue suggestions recomputation */ }, { connection: conn });
new Worker('alertNotify', async () => {
  const overdue = await prisma.taxInvoice.findMany({ where: { dueDate: { lt: new Date() }, reconcileStatus: { in: ['UNMATCHED','PARTIAL_MATCHED'] } }, include: { partner: true } });
  if (!process.env.SLACK_WEBHOOK_URL || overdue.length === 0) return;
  await fetch(process.env.SLACK_WEBHOOK_URL, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ text: `[미수/미지급] ${overdue.length}건` }) });
}, { connection: conn });

(async () => {
  await queues.bankSync.add('periodic', { bankAccountId: 'all' }, { repeat: { every: 30*60*1000 } });
  await queues.invoiceStatusPoll.add('periodic', {}, { repeat: { every: 10*60*1000 } });
  await queues.alertNotify.add('daily', {}, { repeat: { pattern: '0 9 * * *' } });
  console.log('worker started');
})();
