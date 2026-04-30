import { describe, expect, it } from "vitest";
import { fallbackQuote } from "@/lib/market/fallback";

describe("fallbackQuote", () => {
  it("creates deterministic NSE fallback quotes", () => {
    const first = fallbackQuote("INFY", "NSE");
    const second = fallbackQuote("INFY", "NSE");

    expect(first.price).toBe(second.price);
    expect(first.yahooSymbol).toBe("INFY.NS");
    expect(first.warnings[0]).toContain("fallback");
  });
});
