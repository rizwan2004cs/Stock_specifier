import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "@/lib/types";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ""
});

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function fallbackNews(symbols: string[]): NewsItem[] {
  return symbols.slice(0, 6).map((symbol, index) => ({
    id: `fallback-${symbol}-${index}`,
    title: `${symbol} market coverage unavailable in free news source`,
    source: "Local fallback",
    url: "https://news.google.com",
    publishedAt: new Date(Date.now() - index * 3600 * 1000).toISOString(),
    symbols: [symbol]
  }));
}

function textValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function fetchMarketNews(symbols: string[]) {
  const cleanSymbols = symbols.map((symbol) => symbol.toUpperCase()).slice(0, 8);
  const cacheKey = `news:${cleanSymbols.join(",")}`;
  const cached = await cacheGet<NewsItem[]>(cacheKey);
  if (cached) {
    return cached;
  }

  if (cleanSymbols.length === 0) {
    return [];
  }

  try {
    const query = encodeURIComponent(
      `${cleanSymbols.join(" OR ")} NSE BSE stock earnings dividend`
    );
    const response = await fetch(
      `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`,
      { next: { revalidate: 900 } }
    );
    if (!response.ok) {
      throw new Error("News response failed");
    }
    const xml = await response.text();
    const parsed = parser.parse(xml) as {
      rss?: { channel?: { item?: Array<Record<string, string>> } };
    };
    const items = asArray(parsed.rss?.channel?.item);
    const news = items.slice(0, 12).map((item, index) => {
      const title = textValue(item.title, "Market update");
      const link = textValue(item.link, "https://news.google.com");
      return {
        id: `${link}-${index}`,
        title,
        source: "Google News",
        url: link,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : undefined,
        symbols: cleanSymbols.filter((symbol) =>
          title.toUpperCase().includes(symbol)
        )
      };
    });
    await cacheSet(cacheKey, news, 900);
    return news;
  } catch {
    return fallbackNews(cleanSymbols);
  }
}
