import { z } from "zod";
import { buildPortfolioSnapshot } from "@/lib/portfolio/analytics";
import { getQuotesForHoldings } from "@/lib/market/service";
import { fetchMarketNews } from "@/lib/news/service";
import { enrichSignalsWithAI } from "@/lib/advisor/signals";

export const maxDuration = 30;

const holdingSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  exchange: z.enum(["NSE", "BSE"]),
  quantity: z.number(),
  averagePrice: z.number(),
  buyDate: z.string().optional(),
  sector: z.string().optional(),
  notes: z.string().optional()
});

export async function POST(req: Request) {
  const body = await req.json();
  const holdings = z.array(holdingSchema).parse(body.holdings ?? []);
  const quotes = await getQuotesForHoldings(holdings);
  const snapshot = buildPortfolioSnapshot(holdings, quotes);

  // Fetch news and enrich signals with AI in parallel
  const symbols = holdings.map((h) => h.symbol);
  const [news, enrichedSnapshot] = await Promise.all([
    fetchMarketNews(symbols).catch(() => []),
    enrichSignalsWithAI(snapshot, symbols).catch(() => snapshot)
  ]);

  return Response.json({
    ...enrichedSnapshot,
    _news: news // pass news along for use by other routes
  });
}
