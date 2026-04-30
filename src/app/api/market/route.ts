import { z } from "zod";
import { buildPortfolioSnapshot } from "@/lib/portfolio/analytics";
import { getQuotesForHoldings } from "@/lib/market/service";

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
  return Response.json(buildPortfolioSnapshot(holdings, quotes));
}
