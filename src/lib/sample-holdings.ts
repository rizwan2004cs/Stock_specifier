import type { HoldingInput } from "@/lib/types";

export const sampleHoldings: HoldingInput[] = [
  {
    id: "NSE:RELIANCE",
    symbol: "RELIANCE",
    exchange: "NSE",
    quantity: 12,
    averagePrice: 2380,
    sector: "Energy",
    notes: "Core large-cap holding"
  },
  {
    id: "NSE:TCS",
    symbol: "TCS",
    exchange: "NSE",
    quantity: 8,
    averagePrice: 3460,
    sector: "IT Services"
  },
  {
    id: "NSE:HDFCBANK",
    symbol: "HDFCBANK",
    exchange: "NSE",
    quantity: 18,
    averagePrice: 1510,
    sector: "Financials"
  },
  {
    id: "NSE:INFY",
    symbol: "INFY",
    exchange: "NSE",
    quantity: 15,
    averagePrice: 1435,
    sector: "IT Services"
  },
  {
    id: "NSE:ITC",
    symbol: "ITC",
    exchange: "NSE",
    quantity: 64,
    averagePrice: 408,
    sector: "Consumer"
  }
];
