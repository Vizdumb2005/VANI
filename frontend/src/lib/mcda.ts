import { PriorityCard } from "../types";

export interface McdaWeights {
  w_demand: number;
  w_deprivation: number;
  w_population: number;
  w_scheme: number;
}

export function calculateSpearmanRho(ranksA: number[], ranksB: number[]): number {
  const n = ranksA.length;
  if (n <= 1) return 1.0;
  let dSqSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = ranksA[i] - ranksB[i];
    dSqSum += diff * diff;
  }
  const rho = 1.0 - (6.0 * dSqSum) / (n * (n * n - 1));
  return Math.round(Math.max(-1.0, Math.min(1.0, rho)) * 1000) / 1000;
}

export function reRankPriorityCards(
  cards: PriorityCard[],
  weights: McdaWeights
): { scoredCards: PriorityCard[]; spearmanRho: number } {
  const totalW = weights.w_demand + weights.w_deprivation + weights.w_population + weights.w_scheme;
  const wD = totalW > 0 ? weights.w_demand / totalW : 0.35;
  const wG = totalW > 0 ? weights.w_deprivation / totalW : 0.25;
  const wP = totalW > 0 ? weights.w_population / totalW : 0.20;
  const wS = totalW > 0 ? weights.w_scheme / totalW : 0.20;

  const originalRanks = cards.map((c) => c.rank);

  const recomputed = cards.map((c) => {
    const comp = c.components;
    const score =
      wD * comp.D_demand +
      wG * comp.G_deprivation +
      wP * comp.P_population +
      wS * comp.S_scheme_alignment;

    return {
      ...c,
      priority: Math.round(score * 10000) / 10000,
      _origRank: c.rank,
    };
  });

  recomputed.sort((a, b) => b.priority - a.priority);

  const newRanks: number[] = [];
  const baseRanks: number[] = [];

  const finalCards = recomputed.map((item, idx) => {
    const newRank = idx + 1;
    newRanks.push(newRank);
    baseRanks.push(item._origRank);
    const { _origRank, ...rest } = item;
    return {
      ...rest,
      rank: newRank,
    };
  });

  const rho = calculateSpearmanRho(newRanks, baseRanks);

  return { scoredCards: finalCards, spearmanRho: rho };
}
