import type { HoldingInput, MarketQuote } from "@/lib/types";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { fetchAlphaVantageQuote } from "@/lib/market/alpha-vantage";
import { fetchYahooQuote } from "@/lib/market/yahoo";

/**
 * Cache TTL: 15 minutes.
 * Alpha Vantage free tier = 25 calls/day, so aggressive caching is essential.
 */
const QUOTE_TTL_SECONDS = 900;

export async function getQuotesForHoldings(holdings: HoldingInput[]) {
  const unique = Array.from(
    new Map(holdings.map((holding) => [holding.id, holding])).values()
  );

  const quotes = await Promise.all(
    unique.map(async (holding) => {
      const cacheKey = `quote:${holding.exchange}:${holding.symbol}`;
      const cached = await cacheGet<MarketQuote>(cacheKey);
      if (cached) {
        return { ...cached, freshness: "cached" as const };
      }

      // Try Yahoo Finance first (no rate limit)
      const yahooQuote = await fetchYahooQuote(
        holding.symbol,
        holding.exchange,
        holding.averagePrice
      );

      // If Yahoo worked, cache and return
      if (yahooQuote.freshness !== "fallback") {
        await cacheSet(cacheKey, yahooQuote, QUOTE_TTL_SECONDS);
        return yahooQuote;
      }

      // Yahoo failed → try Alpha Vantage (rate limited)
      const avQuote = await fetchAlphaVantageQuote(
        holding.symbol,
        holding.exchange
      );

      if (avQuote) {
        await cacheSet(cacheKey, avQuote, QUOTE_TTL_SECONDS);
        return avQuote;
      }

      // Both failed → use fallback with buy price
      await cacheSet(cacheKey, yahooQuote, QUOTE_TTL_SECONDS);
      return yahooQuote;
    })
  );

  return quotes;
}
