import { fetchMarketNews } from "@/lib/news/service";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbols = (url.searchParams.get("symbols") ?? "")
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean);

  const news = await fetchMarketNews(symbols);
  return Response.json({ news });
}
