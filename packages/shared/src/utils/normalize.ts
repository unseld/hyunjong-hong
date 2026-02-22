export const normalizeText = (value: string) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export const jaccardSimilarity = (a: string, b: string) => {
  const sa = new Set(a.split('').filter(Boolean));
  const sb = new Set(b.split('').filter(Boolean));
  const intersection = [...sa].filter((ch) => sb.has(ch)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : intersection / union;
};
