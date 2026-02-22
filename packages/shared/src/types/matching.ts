export type MatchingWeights = { amount: number; date: number; name: number; memo: number; penalty: number };
export type RuleConfig = { N: number; threshold: number; margin: number; weights: MatchingWeights };
