import { z } from "zod";
import { buildPlannerSuggestions } from "@/lib/advisor/fallback";

const requestSchema = z.object({
  amount: z.number(),
  snapshot: z.object({
    holdings: z.array(z.any())
  })
});

export async function POST(req: Request) {
  const body = requestSchema.parse(await req.json());
  const suggestions = buildPlannerSuggestions(
    body.snapshot.holdings as never,
    body.amount
  );
  return Response.json({ suggestions });
}
