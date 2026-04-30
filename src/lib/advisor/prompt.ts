import type { PortfolioSnapshot } from "@/lib/types";

export function buildAdvisorSystemPrompt() {
  return [
    "You are Stock Specifier, a long-term Indian equity portfolio advisor powered by live market data.",
    "IMPORTANT: The portfolio snapshot you receive contains REAL-TIME data fetched from Alpha Vantage and Yahoo Finance APIs.",
    "This includes: live prices, P/E ratios (trailing and forward), buy price, allocation percentages, and unrealised gain/loss.",
    "You MUST base your analysis on the actual numbers provided — do not make up or estimate prices.",
    "Reference the actual stock prices and fundamentals from the snapshot in your response.",
    "You cover NSE/BSE equities. Style: long-term, fundamental analysis, valuation discipline, diversification, risk control.",
    "Never claim certainty. Never place trades. Always cite data from the snapshot when making recommendations.",
    "If a value is missing (e.g., no P/E data), acknowledge the gap rather than guessing.",
    "Use concise markdown with sections and bullet points. Be direct and analytical."
  ].join("\n");
}

export function buildPlannerSystemPrompt() {
  return [
    "You are a portfolio allocation expert for Indian equity markets (NSE/BSE).",
    "You receive REAL-TIME market data including live prices, P/E ratios, gain/loss data, and allocation percentages fetched from Alpha Vantage and Yahoo Finance.",
    "Your task: Allocate a given monthly investment amount across the user's holdings intelligently.",
    "Rules:",
    "1. Prefer holdings with lower current allocation that have strong fundamentals (low P/E relative to peers, positive momentum).",
    "2. Avoid recommending more allocation to any holding already above 25% of portfolio.",
    "3. Flag any holding showing negative momentum (>15% loss) as 'watch' rather than 'buy' unless fundamentals are compelling.",
    "4. Distribute the amount in round numbers (multiples of 100 INR minimum).",
    "5. Provide a SPECIFIC rationale citing actual price, P/E, and allocation from the snapshot.",
    "Return ONLY valid JSON — an array of suggestion objects."
  ].join("\n");
}

export function buildAdvisorUserPrompt(
  snapshot: PortfolioSnapshot,
  userPrompt: string,
  memory: string
) {
  const compactHoldings = snapshot.holdings.map((holding) => ({
    symbol: holding.symbol,
    exchange: holding.exchange,
    quantity: holding.quantity,
    averagePrice: holding.averagePrice,
    livePrice: holding.quote?.price ?? null,
    allocation: Number(holding.allocation.toFixed(2)),
    gainLossPercent: Number(holding.gainLossPercent.toFixed(2)),
    gainLossInr: Number(holding.gainLoss.toFixed(2)),
    marketValue: Number(holding.marketValue.toFixed(2)),
    signal: holding.longTermSignal,
    trailingPe: holding.quote?.fundamentals.trailingPe ?? null,
    forwardPe: holding.quote?.fundamentals.forwardPe ?? null,
    dataWarnings: holding.quote?.warnings ?? []
  }));

  return JSON.stringify(
    {
      userQuestion: userPrompt,
      sessionMemory: memory,
      portfolioSummary: {
        totalValue: snapshot.summary.totalValue,
        totalCost: snapshot.summary.totalCost,
        totalGainLoss: snapshot.summary.totalGainLoss,
        totalGainLossPercent: snapshot.summary.totalGainLossPercent,
        holdingsCount: snapshot.summary.holdingsCount,
        qualityScore: snapshot.summary.qualityScore,
        concentrationScore: snapshot.summary.concentrationScore
      },
      holdings: compactHoldings,
      dataWarnings: snapshot.dataWarnings,
      dataSource: "Alpha Vantage + Yahoo Finance (live)"
    },
    null,
    2
  );
}
