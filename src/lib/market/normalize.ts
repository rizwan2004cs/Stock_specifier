import type { Exchange } from "@/lib/types";

export function inferExchange(raw: string): Exchange {
  const value = raw.trim().toUpperCase();
  if (value.endsWith(".BO") || value.includes("BSE")) {
    return "BSE";
  }
  return "NSE";
}

export function cleanSymbol(raw: string) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\.NS$/, "")
    .replace(/\.BO$/, "")
    .replace(/^NSE:/, "")
    .replace(/^BSE:/, "");
}

export function toYahooSymbol(symbol: string, exchange: Exchange) {
  const clean = cleanSymbol(symbol);
  return `${clean}.${exchange === "BSE" ? "BO" : "NS"}`;
}

export function makeHoldingId(symbol: string, exchange: Exchange) {
  return `${exchange}:${cleanSymbol(symbol)}`;
}
