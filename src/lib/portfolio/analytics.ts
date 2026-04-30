import type {
  EnrichedHolding,
  HoldingInput,
  MarketQuote,
  PortfolioSnapshot
} from "@/lib/types";
import { clamp } from "@/lib/utils";

function signalForHolding(
  holding: HoldingInput,
  quote: MarketQuote | undefined,
  allocation: number
): EnrichedHolding["longTermSignal"] {
  if (!quote || quote.freshness === "fallback") {
    return "watch";
  }
  const pe = quote.fundamentals.trailingPe ?? quote.fundamentals.forwardPe ?? 0;
  if (allocation > 28) {
    return "trim";
  }
  if (pe > 0 && pe < 45 && quote.changePercent > -8) {
    return "hold";
  }
  if (quote.changePercent < -12) {
    return "watch";
  }
  return "accumulate";
}

function riskNotesForHolding(
  allocation: number,
  quote: MarketQuote | undefined
) {
  const notes: string[] = [];
  if (allocation > 25) {
    notes.push("High concentration");
  }
  if (!quote) {
    notes.push("Missing market quote");
  }
  if (quote?.warnings.length) {
    notes.push(...quote.warnings.slice(0, 2));
  }
  const pe = quote?.fundamentals.trailingPe ?? quote?.fundamentals.forwardPe;
  if (pe && pe > 65) {
    notes.push("Valuation needs review");
  }
  return notes;
}

export function buildPortfolioSnapshot(
  holdings: HoldingInput[],
  quotes: MarketQuote[]
): PortfolioSnapshot {
  const quoteMap = new Map(quotes.map((quote) => [quote.idKey ?? quote.yahooSymbol, quote]));
  const raw = holdings.map((holding) => {
    const key = `${holding.exchange}:${holding.symbol}`;
    const quote =
      quoteMap.get(key) ??
      quotes.find(
        (candidate) =>
          candidate.exchange === holding.exchange && candidate.symbol === holding.symbol
      );
    const price = quote?.price ?? holding.averagePrice;
    const costBasis = holding.quantity * holding.averagePrice;
    const marketValue = holding.quantity * price;
    return {
      holding,
      quote,
      costBasis,
      marketValue
    };
  });

  const totalValue = raw.reduce((sum, item) => sum + item.marketValue, 0);
  const totalCost = raw.reduce((sum, item) => sum + item.costBasis, 0);

  const enriched: EnrichedHolding[] = raw.map((item) => {
    const allocation = totalValue > 0 ? (item.marketValue / totalValue) * 100 : 0;
    const gainLoss = item.marketValue - item.costBasis;
    const gainLossPercent =
      item.costBasis > 0 ? (gainLoss / item.costBasis) * 100 : 0;
    return {
      ...item.holding,
      quote: item.quote,
      costBasis: item.costBasis,
      marketValue: item.marketValue,
      gainLoss,
      gainLossPercent,
      allocation,
      longTermSignal: signalForHolding(item.holding, item.quote, allocation),
      riskNotes: riskNotesForHolding(allocation, item.quote)
    };
  });

  const topHolding = enriched.toSorted((a, b) => b.allocation - a.allocation)[0];
  const concentrationScore = clamp(
    100 - enriched.reduce((sum, item) => sum + Math.max(0, item.allocation - 12), 0),
    0,
    100
  );
  const qualityScore = clamp(
    Math.round(
      72 +
        enriched.filter((item) => item.longTermSignal === "hold").length * 4 -
        enriched.filter((item) => item.longTermSignal === "trim").length * 6 -
        enriched.filter((item) => item.quote?.freshness === "fallback").length * 5
    ),
    0,
    100
  );
  const totalGainLoss = totalValue - totalCost;

  return {
    holdings: enriched,
    summary: {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent: totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0,
      holdingsCount: holdings.length,
      concentrationScore,
      qualityScore,
      topHolding: topHolding?.symbol
    },
    refreshedAt: new Date().toISOString(),
    dataWarnings: Array.from(
      new Set(enriched.flatMap((holding) => holding.quote?.warnings ?? []))
    )
  };
}
