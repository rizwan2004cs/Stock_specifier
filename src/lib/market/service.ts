import type { HoldingInput, MarketQuote } from "@/lib/types";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { fetchAlphaVantageQuote } from "@/lib/market/alpha-vantage";
import { fetchYahooQuote } from "@/lib/market/yahoo";

const QUOTE_TTL_SECONDS = 90;

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
      const yahooQuote = await fetchYahooQuote(holding.symbol, holding.exchange);
      const quote =
        yahooQuote.freshness === "fallback"
          ? (await fetchAlphaVantageQuote(holding.symbol, holding.exchange)) ??
            yahooQuote
          : yahooQuote;
      await cacheSet(cacheKey, quote, QUOTE_TTL_SECONDS);
      return quote;
    })
  );

  return quotes;
}
