import type { Exchange, MarketQuote, PricePoint } from "@/lib/types";
import { cleanSymbol, toYahooSymbol } from "@/lib/market/normalize";
import { fallbackQuote } from "@/lib/market/fallback";

type YahooFinanceClient = {
  quote: (symbol: string) => Promise<Record<string, unknown>>;
  quoteSummary: (
    symbol: string,
    options: { modules: string[] }
  ) => Promise<Record<string, unknown>>;
  chart: (
    symbol: string,
    options: { period1: Date; interval: string }
  ) => Promise<unknown>;
};

/**
 * Some Indian stocks have different Yahoo Finance symbols
 * than their NSE ticker. Map them here.
 */
const yahooSymbolOverrides: Record<string, string> = {
  ETERNAL: "ZOMATO.NS",       // Zomato renamed to Eternal
  TATAMTRDVR: "TATAMTRDVR.NS",
  SBIN: "SBIN.NS",
  "M&M": "M&M.NS",
  "BAJAJ-AUTO": "BAJAJ-AUTO.NS",
};

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function buildHistory(chart: unknown): PricePoint[] {
  const quotes = (chart as { quotes?: Array<{ date?: Date; close?: number }> })
    ?.quotes;
  if (!Array.isArray(quotes)) {
    return [];
  }
  return quotes
    .filter((point) => point.date && typeof point.close === "number")
    .slice(-180)
    .map((point) => ({
      date: new Date(point.date as Date).toISOString().slice(0, 10),
      close: Number(point.close)
    }));
}

export async function fetchYahooQuote(
  symbol: string,
  exchange: Exchange,
  buyPrice?: number
): Promise<MarketQuote> {
  const clean = cleanSymbol(symbol);
  const yahooSymbol = yahooSymbolOverrides[clean] ?? toYahooSymbol(clean, exchange);

  try {
    const yahoo = (await import("yahoo-finance2"))
      .default as unknown as YahooFinanceClient;
    const [quote, summary, chart] = await Promise.all([
      yahoo.quote(yahooSymbol),
      yahoo
        .quoteSummary(yahooSymbol, {
          modules: ["summaryDetail", "defaultKeyStatistics", "financialData"]
        })
        .catch(() => null),
      yahoo
        .chart(yahooSymbol, {
          period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          interval: "1d"
        })
        .catch(() => null)
    ]);

    const price =
      toNumber(quote?.regularMarketPrice) ??
      toNumber(quote?.postMarketPrice) ??
      toNumber(quote?.previousClose);

    if (!price) {
      return fallbackQuote(clean, exchange, buyPrice);
    }

    const previousClose = toNumber(quote?.regularMarketPreviousClose);
    const change =
      toNumber(quote?.regularMarketChange) ??
      (previousClose ? price - previousClose : 0);
    const changePercent =
      toNumber(quote?.regularMarketChangePercent) ??
      (previousClose ? ((price - previousClose) / previousClose) * 100 : 0);

    return {
      idKey: `${exchange}:${clean}`,
      symbol: clean,
      exchange,
      yahooSymbol,
      name:
        toText(quote?.longName) ??
        toText(quote?.shortName) ??
        `${clean} ${exchange}`,
      price,
      currency: toText(quote?.currency) ?? "INR",
      change,
      changePercent,
      previousClose,
      dayHigh: toNumber(quote?.regularMarketDayHigh),
      dayLow: toNumber(quote?.regularMarketDayLow),
      fiftyTwoWeekHigh: toNumber(quote?.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: toNumber(quote?.fiftyTwoWeekLow),
      fundamentals: {
        marketCap: toNumber(quote?.marketCap),
        trailingPe:
          toNumber(quote?.trailingPE) ??
          toNumber(getRecord(summary?.summaryDetail)?.trailingPE),
        forwardPe: toNumber(getRecord(summary?.summaryDetail)?.forwardPE),
        eps: toNumber(getRecord(summary?.defaultKeyStatistics)?.trailingEps),
        dividendYield: toNumber(getRecord(summary?.summaryDetail)?.dividendYield),
        beta: toNumber(getRecord(summary?.summaryDetail)?.beta),
        debtToEquity: toNumber(getRecord(summary?.financialData)?.debtToEquity),
        returnOnEquity: toNumber(getRecord(summary?.financialData)?.returnOnEquity),
        revenueGrowth: toNumber(getRecord(summary?.financialData)?.revenueGrowth),
        profitMargins: toNumber(getRecord(summary?.financialData)?.profitMargins)
      },
      history: buildHistory(chart),
      dataSource: "Yahoo Finance unofficial",
      freshness: "delayed",
      fetchedAt: new Date().toISOString(),
      warnings: ["Yahoo Finance is an unofficial and potentially delayed source"]
    };
  } catch {
    return fallbackQuote(clean, exchange, buyPrice);
  }
}
