import type { EnrichedHolding, PlannerSuggestion, PortfolioSnapshot } from "@/lib/types";

export function buildFallbackAdvice(snapshot: PortfolioSnapshot, userPrompt: string) {
  const top = snapshot.holdings
    .toSorted((a, b) => b.allocation - a.allocation)
    .slice(0, 3);
  const trim = snapshot.holdings.filter((holding) => holding.longTermSignal === "trim");
  const accumulate = snapshot.holdings.filter(
    (holding) => holding.longTermSignal === "accumulate"
  );

  return [
    "## Portfolio view",
    `Total value is approximately ${snapshot.summary.totalValue.toFixed(0)} INR across ${snapshot.summary.holdingsCount} holdings.`,
    `Quality score is ${snapshot.summary.qualityScore}/100 and concentration score is ${snapshot.summary.concentrationScore}/100.`,
    "",
    "## Long-term stance",
    top.length
      ? `The largest positions are ${top
          .map((holding) => `${holding.symbol} (${holding.allocation.toFixed(1)}%)`)
          .join(", ")}.`
      : "Import holdings to generate a long-term stance.",
    trim.length
      ? `Review concentration in ${trim.map((holding) => holding.symbol).join(", ")} before adding more.`
      : "No holding is currently flagged for concentration-led trimming.",
    accumulate.length
      ? `Potential add candidates from the current portfolio: ${accumulate
          .slice(0, 4)
          .map((holding) => holding.symbol)
          .join(", ")}.`
      : "Fresh add candidates need cleaner live data before ranking.",
    "",
    "## Response to your note",
    userPrompt.trim()
      ? `For: \"${userPrompt.trim()}\" - keep the decision anchored to allocation, business quality, and valuation.`
      : "Ask a portfolio-specific question for a sharper response.",
    "",
    "Data is best-effort and may be delayed. This is not financial advice."
  ].join("\n");
}

export function buildPlannerSuggestions(
  holdings: EnrichedHolding[],
  amount: number
): PlannerSuggestion[] {
  const usableAmount = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const candidates = holdings
    .filter((holding) => holding.longTermSignal !== "trim")
    .toSorted((a, b) => {
      const scoreA =
        (a.longTermSignal === "accumulate" ? 20 : 10) +
        Math.max(0, 18 - a.allocation);
      const scoreB =
        (b.longTermSignal === "accumulate" ? 20 : 10) +
        Math.max(0, 18 - b.allocation);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  if (candidates.length === 0 || usableAmount === 0) {
    return [];
  }

  const base = usableAmount / candidates.length;
  return candidates.map((holding) => ({
    symbol: holding.symbol,
    exchange: holding.exchange,
    action: holding.longTermSignal === "accumulate" ? "add" : "buy",
    amount: Math.round(base / 100) * 100,
    rationale:
      holding.allocation < 15
        ? "Keeps allocation balanced while adding to a non-trim candidate."
        : "Adds selectively without increasing concentration too sharply."
  }));
}
