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

export const maxDuration = 30;

const requestSchema = z.object({
  prompt: z.string().default(""),
  snapshot: z.any()
});

export async function POST(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = requestSchema.parse(await req.json());
  const portfolio = await loadPortfolio(userId);
  const prompt = buildAdvisorUserPrompt(
    body.snapshot as never,
    body.prompt,
    portfolio.advisorMemory
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

  const memorySeed = `${portfolio.advisorMemory}\nLatest request: ${body.prompt}`.slice(
    -4000
  );
  void saveAdvisorMemory(userId, memorySeed);

  return result.toTextStreamResponse();
}
