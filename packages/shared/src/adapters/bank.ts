export type BankSyncInput = { bankAccountId: string; from: Date; to: Date; fintechUseNum?: string; accessToken?: string };
export type BankTrx = { externalTrxId?: string; trxDate: Date; amount: number; direction: 'IN'|'OUT'; description: string; balance?: number; rawHash: string; metadata?: Record<string, unknown> };
export interface BankAdapter { syncTransactions(input: BankSyncInput): Promise<BankTrx[]>; }
export class MockBankAdapter implements BankAdapter {
  async syncTransactions(input: BankSyncInput) {
    return [{ externalTrxId: `MOCK-${Date.now()}`, trxDate: new Date(), amount: 110000, direction: 'IN', description: '가나다상사 입금', rawHash: `hash-${input.bankAccountId}-${Date.now()}` }];
  }
}
export class OpenBankingSkeleton implements BankAdapter {
  private endpoint = process.env.OPENBANK_API_ENDPOINT!;
  async syncTransactions(input: BankSyncInput) {
    if (!this.endpoint || !input.fintechUseNum || !input.accessToken) throw new Error('OpenBanking env/credential missing');
    // TODO: implement real OpenBanking fetch with fintech_use_num/access_token
    return [];
  }
}
