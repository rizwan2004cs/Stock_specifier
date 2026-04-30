import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { buildPlannerSuggestions } from "@/lib/advisor/fallback";
import { buildPlannerSystemPrompt } from "@/lib/advisor/prompt";
import { fetchMarketNews } from "@/lib/news/service";

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

  // Fetch news for context
  const symbols = body.snapshot.holdings
    .map((h: Record<string, unknown>) => h.symbol as string)
    .filter(Boolean);
  const news = await fetchMarketNews(symbols.slice(0, 8)).catch(() => []);
  const newsContext = news
    .slice(0, 10)
    .map((n) => `- [${n.source}] ${n.title}`)
    .join("\n");

  const compactHoldings = body.snapshot.holdings.map((h: Record<string, unknown>) => {
    const quote = h.quote as Record<string, unknown> | undefined;
    const fundamentals = quote?.fundamentals as Record<string, unknown> | undefined;
    const alloc = Number(h.allocation) || 0;
    const glPct = Number(h.gainLossPercent) || 0;
    const mv = Number(h.marketValue) || 0;
    return {
      symbol: h.symbol,
      exchange: h.exchange,
      quantity: h.quantity,
      averagePrice: h.averagePrice,
      livePrice: quote?.price ?? null,
      allocation: Math.round(alloc * 100) / 100,
      gainLossPercent: Math.round(glPct * 100) / 100,
      marketValue: Math.round(mv),
      trailingPe: fundamentals?.trailingPe ?? null,
      forwardPe: fundamentals?.forwardPe ?? null,
      signal: h.longTermSignal
    };
  });

  const userMessage = JSON.stringify({
    investmentAmount: body.amount,
    month: body.month ?? new Date().toISOString().slice(0, 7),
    currentHoldings: compactHoldings,
    portfolioSummary: body.snapshot.summary,
    recentNews: newsContext,
    instruction: "Allocate the investment amount across the best long-term growth stocks. You may include stocks NOT in the current portfolio. Focus on fundamental quality, not momentum. Cite actual data.",
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
  } catch (error) {
    console.error("[Planner] AI call failed, using fallback:", error);
    const suggestions = buildPlannerSuggestions(
      body.snapshot.holdings as never,
      body.amount
    );
    return Response.json({ suggestions, _fallback: true });
  }
}
