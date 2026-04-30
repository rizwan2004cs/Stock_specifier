export type Exchange = "NSE" | "BSE";

export type HoldingInput = {
  id: string;
  symbol: string;
  exchange: Exchange;
  quantity: number;
  averagePrice: number;
  buyDate?: string;
  sector?: string;
  notes?: string;
};

export type PricePoint = {
  date: string;
  close: number;
};

export type Fundamentals = {
  marketCap?: number;
  trailingPe?: number;
  forwardPe?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  debtToEquity?: number;
  returnOnEquity?: number;
  revenueGrowth?: number;
  profitMargins?: number;
};

export type MarketQuote = {
  idKey?: string;
  symbol: string;
  exchange: Exchange;
  yahooSymbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  previousClose?: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fundamentals: Fundamentals;
  history: PricePoint[];
  dataSource: string;
  freshness: "live" | "delayed" | "cached" | "fallback";
  fetchedAt: string;
  warnings: string[];
};

export type EnrichedHolding = HoldingInput & {
  quote?: MarketQuote;
  costBasis: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  allocation: number;
  longTermSignal: "hold" | "accumulate" | "watch" | "trim";
  riskNotes: string[];
};

export type PortfolioSummary = {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  holdingsCount: number;
  concentrationScore: number;
  qualityScore: number;
  topHolding?: string;
};

export type PortfolioSnapshot = {
  holdings: EnrichedHolding[];
  summary: PortfolioSummary;
  refreshedAt: string;
  dataWarnings: string[];
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  symbols: string[];
};

export type PlannerSuggestion = {
  symbol: string;
  exchange: Exchange;
  action: "buy" | "add" | "hold" | "trim" | "watch";
  amount: number;
  rationale: string;
};
