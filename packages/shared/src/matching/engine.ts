import { jaccardSimilarity, normalizeText } from '../utils/normalize';
import { RuleConfig } from '../types/matching';

export type InvoiceInput = { id: string; type: 'SALES'|'PURCHASE'; totalAmount: number; issueDate: Date; supplyDate?: Date|null; dueDate?: Date|null; approvalNo?: string|null; documentNo?: string|null; partnerName: string; partnerBizNo?: string|null; };
export type TrxInput = { id: string; trxDate: Date; amount: number; direction: 'IN'|'OUT'; description: string };

export function scoreInvoiceToTransaction(invoice: InvoiceInput, trx: TrxInput, config: RuleConfig, dupTrxCount:number, dupInvCount:number) {
  const baseDate = invoice.dueDate ?? invoice.supplyDate ?? invoice.issueDate;
  const daysDiff = Math.abs((trx.trxDate.getTime() - baseDate.getTime()) / 86400000);
  const dateScore = Math.max(0, 1 - daysDiff / config.N);
  const nameSim = jaccardSimilarity(normalizeText(trx.description), normalizeText(`${invoice.partnerName}${invoice.partnerBizNo ?? ''}`));
  const memoHit = [invoice.approvalNo, invoice.documentNo, invoice.partnerName].filter(Boolean).some((k) => trx.description.includes(k!)) ? 1 : 0;
  const amountExact = trx.amount === invoice.totalAmount ? 1 : 0;
  const ambiguityPenalty = Math.min(1, (dupTrxCount - 1) / 3) * 0.5 + Math.min(1, (dupInvCount - 1) / 3) * 0.5;
  const score = 100 * (config.weights.amount * amountExact + config.weights.date * dateScore + config.weights.name * nameSim + config.weights.memo * memoHit) - 100 * (config.weights.penalty * ambiguityPenalty);
  return { score, reasons: { daysDiff, dateScore, nameSim, memoHit, amountExact, dupTrxCount, dupInvCount, ambiguityPenalty } };
}

export function shouldAutoConfirm(top:number, second:number, amountExact:boolean, config: RuleConfig) {
  return amountExact && top >= config.threshold && (top - second) >= config.margin;
}

export function invoiceDirection(type:'SALES'|'PURCHASE'): 'IN'|'OUT' { return type==='SALES' ? 'IN' : 'OUT'; }
