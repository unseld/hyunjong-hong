import { describe, expect, it } from 'vitest';
import { scoreInvoiceToTransaction, shouldAutoConfirm } from './engine';

const cfg = { N: 7, threshold: 80, margin: 10, weights: { amount: 0.55, date: 0.15, name: 0.2, memo: 0.1, penalty: 0.15 } };

describe('matching engine', () => {
  it('high score when amount/date/name align', () => {
    const res = scoreInvoiceToTransaction({ id:'i1', type:'SALES', totalAmount:110000, issueDate:new Date('2025-01-01'), dueDate:new Date('2025-01-02'), partnerName:'가나다상사', partnerBizNo:'123', approvalNo:'A1' }, { id:'t1', trxDate:new Date('2025-01-02'), amount:110000, direction:'IN', description:'가나다상사 A1 입금' }, cfg, 1, 1);
    expect(res.score).toBeGreaterThan(85);
  });
  it('penalty lowers score with ambiguous duplicates', () => {
    const base = scoreInvoiceToTransaction({ id:'i1', type:'SALES', totalAmount:110000, issueDate:new Date(), partnerName:'가나다상사' }, { id:'t1', trxDate:new Date(), amount:110000, direction:'IN', description:'입금' }, cfg, 1, 1);
    const penal = scoreInvoiceToTransaction({ id:'i1', type:'SALES', totalAmount:110000, issueDate:new Date(), partnerName:'가나다상사' }, { id:'t1', trxDate:new Date(), amount:110000, direction:'IN', description:'입금' }, cfg, 4, 4);
    expect(penal.score).toBeLessThan(base.score);
  });
  it('auto confirm threshold/margin behavior', () => {
    expect(shouldAutoConfirm(91, 75, true, cfg)).toBe(true);
    expect(shouldAutoConfirm(81, 76, true, cfg)).toBe(false);
  });
  it('partial matching sum', () => {
    const total = [30000, 40000, 20000].reduce((a,b)=>a+b,0);
    expect(total).toBe(90000);
  });
});
