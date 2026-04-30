import { describe, expect, it } from "vitest";
import { rowsToHoldings } from "@/lib/portfolio/excel";

describe("rowsToHoldings", () => {
  it("maps broker rows and merges duplicate symbols", () => {
    const result = rowsToHoldings(
      [
        { Ticker: "RELIANCE.NS", Qty: 2, Avg: 2400 },
        { Ticker: "RELIANCE", Qty: 3, Avg: 2500 }
      ],
      { symbol: "Ticker", quantity: "Qty", averagePrice: "Avg" }
    );

    expect(result.rejected).toHaveLength(0);
    expect(result.holdings).toHaveLength(1);
    expect(result.holdings[0]).toMatchObject({
      symbol: "RELIANCE",
      exchange: "NSE",
      quantity: 5
    });
    expect(Math.round(result.holdings[0].averagePrice)).toBe(2460);
  });

  it("rejects rows without usable quantities", () => {
    const result = rowsToHoldings(
      [{ Symbol: "TCS", Qty: 0, Avg: 3200 }],
      { symbol: "Symbol", quantity: "Qty", averagePrice: "Avg" }
    );

    expect(result.holdings).toHaveLength(0);
    expect(result.rejected[0].reason).toContain("Invalid");
  });
});
