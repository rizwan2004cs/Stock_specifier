import type { Exchange, MarketQuote } from "@/lib/types";
import { toYahooSymbol } from "@/lib/market/normalize";

/**
 * When Yahoo Finance and Alpha Vantage both fail for a stock,
 * use the holding's buy price as a best-effort estimate instead of
 * generating random fake numbers.
 */
export function fallbackQuote(
  symbol: string,
  exchange: Exchange,
  buyPrice?: number
): MarketQuote {
  // Use buy price if available, otherwise use a conservative estimate
  const price = buyPrice && buyPrice > 0 ? buyPrice : 100;

  return {
    idKey: `${exchange}:${symbol}`,
    symbol,
    exchange,
    yahooSymbol: toYahooSymbol(symbol, exchange),
    name: `${symbol} ${exchange}`,
    price,
    currency: "INR",
    change: 0,
    changePercent: 0,
    previousClose: price,
    fundamentals: {},
    history: [],
    dataSource: "Fallback (using buy price)",
    freshness: "fallback",
    fetchedAt: new Date().toISOString(),
    warnings: ["Live market data unavailable; using buy price as estimate"]
  };
}
