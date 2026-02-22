import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({ where: { id: 'company_default' }, update: {}, create: { id: 'company_default', name: 'Demo Corp' } });
  const passwordHash = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@local' },
    update: { passwordHash },
    create: { email: 'admin@local', name: 'Admin', passwordHash, companyId: company.id }
  });
  await prisma.userRole.upsert({ where: { userId_role: { userId: admin.id, role: Role.ADMIN } }, update: {}, create: { userId: admin.id, role: Role.ADMIN } });

  const partner = await prisma.partner.create({ data: { companyId: company.id, type: 'CUSTOMER', name: '가나다상사', bizNo: '123-45-67890', normalizedName: '가나다상사1234567890' } });
  const account = await prisma.bankAccount.create({ data: { companyId: company.id, bankName: 'MockBank', accountNumber: '110-123-456789', status: 'CONNECTED' } });

  const invoice = await prisma.taxInvoice.create({
    data: {
      companyId: company.id,
      partnerId: partner.id,
      type: 'SALES',
      issueDate: new Date(),
      supplyDate: new Date(),
      dueDate: new Date(),
      supplyAmount: 100000,
      taxAmount: 10000,
      totalAmount: 110000,
      status: 'ISSUED',
      ntsStatus: 'ACCEPTED',
      approvalNo: 'APPROVAL123',
      documentNo: 'DOC123',
      items: { create: [{ description: '서비스', quantity: 1, unitPrice: 100000, amount: 100000 }] }
    }
  });

  await prisma.bankTransaction.create({
    data: {
      companyId: company.id,
      bankAccountId: account.id,
      externalTrxId: 'MOCK-1',
      rawHash: 'MOCK-1-HASH',
      trxDate: new Date(),
      amount: 110000,
      direction: 'IN',
      description: '가나다상사 APPROVAL123 입금'
    }
  });

  await prisma.matchingRuleConfig.create({
    data: { companyId: company.id, N: 7, threshold: 80, margin: 10, weights: { amount: 0.55, date: 0.15, name: 0.2, memo: 0.1, penalty: 0.15 } }
  });

  console.log({ company: company.id, admin: admin.email, invoice: invoice.id });
}
main().finally(() => prisma.$disconnect());
