import { groq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { z } from "zod";
import { requireUserId } from "@/lib/auth";
import { buildFallbackAdvice } from "@/lib/advisor/fallback";
import {
  buildAdvisorSystemPrompt,
  buildAdvisorUserPrompt
} from "@/lib/advisor/prompt";
import {
  loadPortfolio,
  saveAdvisorMemory
} from "@/lib/repositories/portfolio-repository";
import { fetchMarketNews } from "@/lib/news/service";

export const maxDuration = 30;

const requestSchema = z.object({
  prompt: z.string().default(""),
  snapshot: z.any()
});

export async function POST(req: Request) {
  const userId = await requireUserId();

  const body = requestSchema.parse(await req.json());
  const portfolio = await loadPortfolio(userId);

  // Fetch relevant news for the user's holdings
  const symbols = ((body.snapshot as { holdings?: Array<{ symbol?: string }> })?.holdings ?? [])
    .map((h) => h.symbol)
    .filter(Boolean) as string[];
  const news = await fetchMarketNews(symbols.slice(0, 8)).catch(() => []);
  const newsContext = news
    .slice(0, 10)
    .map((n) => `- [${n.source}] ${n.title}`)
    .join("\n");

  const prompt = buildAdvisorUserPrompt(
    body.snapshot as never,
    body.prompt,
    portfolio.advisorMemory,
    newsContext
  );

  if (!process.env.GROQ_API_KEY) {
    const fallback = buildFallbackAdvice(body.snapshot as never, body.prompt);
    return new Response(fallback, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  const result = streamText({
    model: groq(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"),
    system: buildAdvisorSystemPrompt(),
    prompt
  });

  // Save conversation memory (last 4000 chars)
  const memorySeed = [
    portfolio.advisorMemory,
    `\nUser: ${body.prompt}`,
    `\nContext: ${symbols.slice(0, 5).join(", ")} portfolio`
  ].join("").slice(-4000);
  void saveAdvisorMemory(userId, memorySeed);

  return result.toTextStreamResponse();
}
