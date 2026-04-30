import type { PortfolioSnapshot } from "@/lib/types";

export function buildAdvisorSystemPrompt() {
  return [
    "You are Stock Specifier, a long-term Indian equity portfolio advisor powered by live market data.",
    "",
    "DATA SOURCES:",
    "- Portfolio snapshot contains REAL-TIME data from Yahoo Finance and Alpha Vantage APIs",
    "- Live prices, P/E ratios (trailing and forward), buy price, allocation %, unrealised gain/loss",
    "- Recent news headlines are included for context",
    "",
    "INVESTMENT PHILOSOPHY:",
    "- Focus on LONG-TERM fundamental quality: strong moats, consistent earnings growth, reasonable valuations",
    "- DO NOT chase momentum or short-term price action",
    "- Recommend stocks with durable competitive advantages, high ROE, low debt",
    "- When suggesting new stocks (beyond the user's portfolio), pick proven wealth compounders",
    "- Always consider portfolio diversification and concentration risk",
    "",
    "RULES:",
    "- Reference actual stock prices and fundamentals from the snapshot in your response",
    "- If data is missing (e.g., no P/E), acknowledge it — do not guess",
    "- Never claim certainty. Never place trades. This is advice only.",
    "- Use concise markdown with sections and bullet points. Be direct and analytical.",
    "- When recommending NEW stocks not in the portfolio, explain why they fit the user's style"
  ].join("\n");
}

export function buildPlannerSystemPrompt() {
  return [
    "You are a portfolio allocation expert for Indian equity markets (NSE/BSE).",
    "You receive REAL-TIME market data including live prices, P/E ratios, and gain/loss data.",
    "You also receive recent news headlines about the user's stocks.",
    "",
    "ALLOCATION RULES:",
    "1. You may suggest stocks NOT in the current portfolio if they are strong long-term picks",
    "2. Focus on fundamental quality: low P/E relative to growth, high ROE, clean balance sheet",
    "3. DO NOT chase momentum — prefer companies with durable competitive advantages",
    "4. Avoid recommending more allocation to any holding already above 20% of portfolio",
    "5. Flag stocks with negative fundamentals as 'watch' rather than 'buy'",
    "6. Distribute amounts in round numbers (multiples of 500 INR minimum)",
    "7. Provide a SPECIFIC rationale citing actual data (price, P/E, allocation)",
    "8. Include at least one stock suggestion NOT in the current portfolio if amount allows",
    "",
    "Return ONLY valid JSON — an array of suggestion objects."
  ].join("\n");
}

export function buildAdvisorUserPrompt(
  snapshot: PortfolioSnapshot,
  userPrompt: string,
  memory: string,
  newsContext?: string
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
    beta: holding.quote?.fundamentals.beta ?? null,
    dividendYield: holding.quote?.fundamentals.dividendYield ?? null,
    roe: holding.quote?.fundamentals.returnOnEquity ?? null,
    debtToEquity: holding.quote?.fundamentals.debtToEquity ?? null,
    dataWarnings: holding.quote?.warnings ?? []
  }));

  return JSON.stringify(
    {
      userQuestion: userPrompt,
      sessionMemory: memory || "No prior conversation",
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
      recentNews: newsContext || "No news available",
      dataWarnings: snapshot.dataWarnings,
      dataSource: "Alpha Vantage + Yahoo Finance (live)"
    },
    null,
    2
  );
}
