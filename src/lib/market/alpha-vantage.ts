import type { Exchange, MarketQuote } from "@/lib/types";
import { cleanSymbol, toYahooSymbol } from "@/lib/market/normalize";

/**
 * Alpha Vantage symbol format for Indian stocks.
 * Free tier: 25 calls/day, 5 calls/minute.
 */
function alphaSymbol(symbol: string, exchange: Exchange) {
  // Alpha Vantage uses SYMBOL.BSE for BSE, and SYMBOL.NSE for NSE
  return `${symbol}.${exchange}`;
}

function readNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function fetchAlphaVantageQuote(
  symbol: string,
  exchange: Exchange
): Promise<MarketQuote | null> {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  const clean = cleanSymbol(symbol);
  const avSymbol = alphaSymbol(clean, exchange);

  // Try both formats: SYMBOL.NSE and NSE:SYMBOL
  for (const symbolFormat of [avSymbol, `${exchange}:${clean}`]) {
    try {
      const url = new URL("https://www.alphavantage.co/query");
      url.searchParams.set("function", "GLOBAL_QUOTE");
      url.searchParams.set("symbol", symbolFormat);
      url.searchParams.set("apikey", process.env.ALPHA_VANTAGE_API_KEY);

      const response = await fetch(url, { next: { revalidate: 300 } });
      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        "Global Quote"?: Record<string, string>;
        Note?: string;
        Information?: string;
      };

      // Check for rate limiting
      if (data.Note || data.Information) {
        console.warn("[Alpha Vantage] Rate limit:", data.Note ?? data.Information);
        return null;
      }

      const quote = data["Global Quote"];
      const price = readNumber(quote?.["05. price"]);
      if (!quote || !price) {
        continue; // Try next format
      }

      const previousClose = readNumber(quote["08. previous close"]);
      const change = readNumber(quote["09. change"]) ?? 0;
      const rawPercent = quote["10. change percent"]?.replace("%", "");
      const changePercent = readNumber(rawPercent) ?? 0;

      return {
        idKey: `${exchange}:${clean}`,
        symbol: clean,
        exchange,
        yahooSymbol: toYahooSymbol(clean, exchange),
        name: `${clean} ${exchange}`,
        price,
        currency: "INR",
        change,
        changePercent,
        previousClose,
        fundamentals: {},
        history: [],
        dataSource: "Alpha Vantage",
        freshness: "delayed",
        fetchedAt: new Date().toISOString(),
        warnings: ["P/E and fundamentals not available from Alpha Vantage free tier"]
      };
    } catch {
      continue;
    }
  }

  return null;
}
