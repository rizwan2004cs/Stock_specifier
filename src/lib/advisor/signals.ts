import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import type { EnrichedHolding, PortfolioSnapshot } from "@/lib/types";
import { fetchMarketNews } from "@/lib/news/service";

const signalSchema = z.object({
  signals: z.array(
    z.object({
      symbol: z.string(),
      signal: z.enum(["hold", "accumulate", "watch", "trim"]),
      rationale: z.string()
    })
  )
});

/**
 * Use Groq AI to generate fact-grounded signals for each holding,
 * using live market data and recent news.
 */
export async function enrichSignalsWithAI(
  snapshot: PortfolioSnapshot,
  symbols: string[]
): Promise<PortfolioSnapshot> {
  if (!process.env.GROQ_API_KEY || !snapshot.holdings.length) {
    return snapshot;
  }

  // Fetch news for context
  const news = await fetchMarketNews(symbols).catch(() => []);
  const newsContext = news
    .slice(0, 15)
    .map((n) => `- ${n.title}`)
    .join("\n");

  const holdingsSummary = snapshot.holdings.map((h) => ({
    symbol: h.symbol,
    exchange: h.exchange,
    quantity: h.quantity,
    avgPrice: h.averagePrice,
    livePrice: h.quote?.price ?? null,
    gainLossPercent: Number(h.gainLossPercent.toFixed(2)),
    allocation: Number(h.allocation.toFixed(2)),
    trailingPe: h.quote?.fundamentals.trailingPe ?? null,
    forwardPe: h.quote?.fundamentals.forwardPe ?? null,
    beta: h.quote?.fundamentals.beta ?? null,
    dataSource: h.quote?.dataSource ?? "unknown"
  }));

  try {
    const result = await generateObject({
      model: groq(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"),
      system: [
        "You are a long-term Indian equity analyst. Analyze each holding using REAL market data provided.",
        "For each stock, assign a signal: hold (fundamentals strong, keep), accumulate (undervalued/underweight, add more),",
        "watch (uncertain data or concerning trend), trim (overweight or deteriorating fundamentals).",
        "Provide a SHORT rationale (1 sentence) citing actual numbers from the data.",
        "Focus on long-term fundamental quality, not short-term momentum.",
        "If P/E data is missing, note that in your rationale."
      ].join("\n"),
      prompt: JSON.stringify({
        holdings: holdingsSummary,
        recentNews: newsContext,
        portfolioSummary: snapshot.summary
      }),
      schema: signalSchema
    });

    // Merge AI signals into the snapshot
    const signalMap = new Map(
      result.object.signals.map((s) => [s.symbol.toUpperCase(), s])
    );

    const enrichedHoldings: EnrichedHolding[] = snapshot.holdings.map((h) => {
      const aiSignal = signalMap.get(h.symbol.toUpperCase());
      if (aiSignal) {
        return {
          ...h,
          longTermSignal: aiSignal.signal,
          riskNotes: [aiSignal.rationale, ...h.riskNotes.slice(0, 2)]
        };
      }
      return h;
    });

    return {
      ...snapshot,
      holdings: enrichedHoldings
    };
  } catch {
    return snapshot;
  }
}
