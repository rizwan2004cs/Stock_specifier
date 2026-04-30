import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import {
  loadPortfolio,
  savePortfolio
} from "@/lib/repositories/portfolio-repository";

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

export async function GET() {
  const userId = await requireUserId();
  const portfolio = await loadPortfolio(userId);
  return Response.json(portfolio);
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  const body = await req.json();
  const holdings = z.array(holdingSchema).parse(body.holdings ?? []);
  const persisted = await savePortfolio(userId, holdings);
  return Response.json({ persisted });
}
