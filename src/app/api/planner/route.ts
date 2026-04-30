import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { buildPlannerSuggestions } from "@/lib/advisor/fallback";
import { buildPlannerSystemPrompt } from "@/lib/advisor/prompt";

export const maxDuration = 30;

const requestSchema = z.object({
  amount: z.number(),
  month: z.string().optional(),
  snapshot: z.object({
    holdings: z.array(z.any()),
    summary: z.any().optional(),
    dataWarnings: z.array(z.string()).optional()
  })
});

const suggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      symbol: z.string(),
      exchange: z.enum(["NSE", "BSE"]),
      action: z.enum(["add", "buy", "watch"]),
      amount: z.number(),
      rationale: z.string()
    })
  )
});

export async function POST(req: Request) {
  const body = requestSchema.parse(await req.json());

  if (!process.env.GROQ_API_KEY || !body.snapshot.holdings.length) {
    const suggestions = buildPlannerSuggestions(
      body.snapshot.holdings as never,
      body.amount
    );
    return Response.json({ suggestions });
  }

  const compactHoldings = body.snapshot.holdings.map((h: Record<string, unknown>) => ({
    symbol: h.symbol,
    exchange: h.exchange,
    quantity: h.quantity,
    averagePrice: h.averagePrice,
    livePrice: (h as Record<string, unknown> & { quote?: { price?: number } }).quote?.price ?? null,
    allocation: typeof h.allocation === "number" ? Number(h.allocation.toFixed(2)) : 0,
    gainLossPercent: typeof h.gainLossPercent === "number" ? Number(h.gainLossPercent.toFixed(2)) : 0,
    marketValue: typeof h.marketValue === "number" ? Number(h.marketValue.toFixed(2)) : 0,
    trailingPe: (h as Record<string, unknown> & { quote?: { fundamentals?: { trailingPe?: number } } }).quote?.fundamentals?.trailingPe ?? null,
    signal: h.longTermSignal
  }));

  const userMessage = JSON.stringify({
    investmentAmount: body.amount,
    month: body.month ?? new Date().toISOString().slice(0, 7),
    holdings: compactHoldings,
    dataSource: "Alpha Vantage + Yahoo Finance (live)"
  }, null, 2);

  try {
    const result = await generateObject({
      model: groq(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"),
      system: buildPlannerSystemPrompt(),
      prompt: userMessage,
      schema: suggestionSchema
    });

    return Response.json({ suggestions: result.object.suggestions });
  } catch {
    const suggestions = buildPlannerSuggestions(
      body.snapshot.holdings as never,
      body.amount
    );
    return Response.json({ suggestions });
  }
}
