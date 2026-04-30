import type { Exchange, MarketQuote } from "@/lib/types";
import { toYahooSymbol } from "@/lib/market/normalize";

function deterministicPrice(symbol: string) {
  const seed = symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 120 + (seed % 2200) + (seed % 17) / 10;
}

export function fallbackQuote(symbol: string, exchange: Exchange): MarketQuote {
  const price = deterministicPrice(symbol);
  const changePercent = ((symbol.length % 7) - 3) * 0.7;
  const change = price * (changePercent / 100);

  return {
    idKey: `${exchange}:${symbol}`,
    symbol,
    exchange,
    yahooSymbol: toYahooSymbol(symbol, exchange),
    name: `${symbol} ${exchange}`,
    price,
    currency: "INR",
    change,
    changePercent,
    previousClose: price - change,
    dayHigh: price * 1.012,
    dayLow: price * 0.988,
    fiftyTwoWeekHigh: price * 1.34,
    fiftyTwoWeekLow: price * 0.72,
    fundamentals: {
      trailingPe: 28 + (symbol.length % 12),
      forwardPe: 24 + (symbol.length % 10),
      eps: price / 32,
      dividendYield: (symbol.length % 4) / 100,
      beta: 0.8 + (symbol.length % 8) / 10
    },
    history: Array.from({ length: 12 }, (_, index) => ({
      date: new Date(Date.now() - (11 - index) * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      close: price * (0.86 + index * 0.015 + ((index + symbol.length) % 5) / 100)
    })),
    dataSource: "Local fallback",
    freshness: "fallback",
    fetchedAt: new Date().toISOString(),
    warnings: ["Free market source unavailable; showing fallback estimate"]
  };
}
