import type { PortfolioSnapshot } from "@/lib/types";

export function buildAdvisorSystemPrompt() {
  return [
    "You are Stock Specifier, a long-term Indian equity portfolio advisor.",
    "You cover NSE/BSE equities only and speak in practical, balanced language.",
    "Default style: durable businesses, valuation sanity, diversification, risk control, and long holding periods.",
    "Never claim certainty. Never place trades. Never present advice as guaranteed financial advice.",
    "Always mention data freshness or missing data when relevant.",
    "Use concise markdown with sections and bullets."
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
    price: holding.quote?.price,
    allocation: Number(holding.allocation.toFixed(2)),
    gainLossPercent: Number(holding.gainLossPercent.toFixed(2)),
    signal: holding.longTermSignal,
    pe:
      holding.quote?.fundamentals.trailingPe ??
      holding.quote?.fundamentals.forwardPe,
    warnings: holding.quote?.warnings ?? []
  }));

  return JSON.stringify(
    {
      request: userPrompt,
      priorMemory: memory,
      portfolioSummary: snapshot.summary,
      holdings: compactHoldings,
      dataWarnings: snapshot.dataWarnings
    },
    null,
    2
  );
}
