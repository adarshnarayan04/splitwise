type ExactShare = { userId: string; amountCents: number };
type PercentShare = { userId: string; percent: number };

type ComputeSharesInput = {
  splitType: "EQUAL" | "EXACT" | "PERCENT";
  totalCents: number;
  participants?: string[];
  exactShares?: ExactShare[];
  percentages?: PercentShare[];
};

type Share = { userId: string; amountCents: number };

function computeShares({
  splitType,
  totalCents,
  participants,
  exactShares,
  percentages,
}: ComputeSharesInput): Share[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error("totalCents must be a positive integer");
  }

  if (splitType === "EQUAL") {
    if (!participants || participants.length === 0)
      throw new Error("participants required for equal split");
    const base = Math.floor(totalCents / participants.length);
    const remainder = totalCents - base * participants.length;
    return participants.map((userId, idx) => ({
      userId,
      amountCents: base + (idx < remainder ? 1 : 0),
    }));
  }

  if (splitType === "EXACT") {
    if (!exactShares || exactShares.length === 0)
      throw new Error("exactShares required for exact split");
    const sum = exactShares.reduce((acc, s) => acc + s.amountCents, 0);
    if (sum !== totalCents) throw new Error("exactShares must sum to total");
    return exactShares;
  }

  if (splitType === "PERCENT") {
    if (!percentages || percentages.length === 0)
      throw new Error("percentages required for percent split");
    const sumPct = percentages.reduce((acc, p) => acc + p.percent, 0);
    if (sumPct !== 100) throw new Error("percentages must sum to 100");
    const preliminary = percentages.map((p) => ({
      userId: p.userId,
      amountCents: Math.round((totalCents * p.percent) / 100),
    }));
    const prelimSum = preliminary.reduce((acc, s) => acc + s.amountCents, 0);
    let diff = totalCents - prelimSum;
    for (let i = 0; diff !== 0 && i < preliminary.length; i += 1) {
      preliminary[i].amountCents += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }
    return preliminary;
  }

  throw new Error("Unsupported split type");
}

export { computeShares };
export type { Share, ComputeSharesInput, ExactShare, PercentShare };
