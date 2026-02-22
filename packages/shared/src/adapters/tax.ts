export type IssueInvoicePayload = { invoiceId: string; amount: number; partnerName: string };
export type TaxIssueResult = { providerInvoiceId: string; ntsStatus: 'PENDING'|'SENT'; documentNo?: string };
export type TaxStatusResult = { ntsStatus: 'PENDING'|'SENT'|'ACCEPTED'|'REJECTED'; approvalNo?: string };
export interface TaxProviderAdapter { issueInvoice(payload: IssueInvoicePayload): Promise<TaxIssueResult>; pollStatus(providerInvoiceId: string): Promise<TaxStatusResult>; }

export class MockTaxProvider implements TaxProviderAdapter {
  async issueInvoice(payload: IssueInvoicePayload) { return { providerInvoiceId: `MOCK-${payload.invoiceId}`, ntsStatus: 'PENDING', documentNo: `DOC-${Date.now()}` }; }
  async pollStatus() { return { ntsStatus: 'ACCEPTED', approvalNo: `APR-${Date.now()}` as string }; }
}

export class RealTaxProviderSkeleton implements TaxProviderAdapter {
  private endpoint = process.env.TAX_PROVIDER_ENDPOINT!;
  private apiKey = process.env.TAX_PROVIDER_API_KEY!;
  async issueInvoice(payload: IssueInvoicePayload) {
    if (!this.endpoint || !this.apiKey) throw new Error('Missing TAX provider env');
    // TODO: implement real ERP/ASP API call
    return { providerInvoiceId: `TODO-${payload.invoiceId}`, ntsStatus: 'SENT' };
  }
  async pollStatus(providerInvoiceId: string) {
    if (!providerInvoiceId) throw new Error('providerInvoiceId required');
    // TODO: implement polling call and map provider statuses
    return { ntsStatus: 'PENDING' };
  }
}
