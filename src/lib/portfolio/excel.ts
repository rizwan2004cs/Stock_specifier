import * as XLSX from "xlsx";
import type { Exchange, HoldingInput } from "@/lib/types";
import { cleanSymbol, inferExchange, makeHoldingId } from "@/lib/market/normalize";

export type ImportField =
  | "symbol"
  | "exchange"
  | "quantity"
  | "averagePrice"
  | "buyDate"
  | "sector"
  | "notes";

export type ColumnMapping = Partial<Record<ImportField, string>>;

export type ParsedWorkbook = {
  headers: string[];
  rows: Record<string, unknown>[];
  mapping: ColumnMapping;
};

const aliases: Record<ImportField, string[]> = {
  symbol: ["symbol", "ticker", "scrip", "tradingsymbol", "security", "stock"],
  exchange: ["exchange", "segment", "market"],
  quantity: ["qty", "quantity", "shares", "units", "holding qty", "net qty"],
  averagePrice: [
    "avg",
    "avg price",
    "average price",
    "buy avg",
    "cost price",
    "average cost"
  ],
  buyDate: ["buy date", "purchase date", "date", "trade date"],
  sector: ["sector", "industry"],
  notes: ["notes", "remarks", "comment"]
};

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function detectMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map((header) => ({
    header,
    normalized: normalizeHeader(header)
  }));
  const mapping: ColumnMapping = {};

  for (const field of Object.keys(aliases) as ImportField[]) {
    const match = normalized.find(({ normalized: candidate }) =>
      aliases[field].some((alias) => candidate === normalizeHeader(alias))
    );
    if (match) {
      mapping[field] = match.header;
    }
  }

  return mapping;
}

function coerceNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value !== "string") {
    return 0;
  }
  const parsed = Number(value.replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function coerceString(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

export async function parsePortfolioWorkbook(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: ""
  });
  const headers = rows[0] ? Object.keys(rows[0]) : [];

  return {
    headers,
    rows,
    mapping: detectMapping(headers)
  };
}

export function rowsToHoldings(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping
) {
  const rejected: { row: number; reason: string }[] = [];
  const holdings = new Map<string, HoldingInput>();

  rows.forEach((row, index) => {
    const rawSymbol = mapping.symbol ? coerceString(row[mapping.symbol]) : "";
    if (!rawSymbol) {
      rejected.push({ row: index + 2, reason: "Missing symbol" });
      return;
    }

    const exchangeValue = mapping.exchange
      ? coerceString(row[mapping.exchange])
      : rawSymbol;
    const exchange: Exchange =
      exchangeValue.toUpperCase().includes("BSE") ||
      rawSymbol.toUpperCase().endsWith(".BO")
        ? "BSE"
        : inferExchange(rawSymbol);

    const quantity = mapping.quantity ? coerceNumber(row[mapping.quantity]) : 0;
    const averagePrice = mapping.averagePrice
      ? coerceNumber(row[mapping.averagePrice])
      : 0;

    if (quantity <= 0 || averagePrice < 0) {
      rejected.push({ row: index + 2, reason: "Invalid quantity or average price" });
      return;
    }

    const symbol = cleanSymbol(rawSymbol);
    const id = makeHoldingId(symbol, exchange);
    const existing = holdings.get(id);

    if (existing) {
      const combinedQuantity = existing.quantity + quantity;
      const combinedCost =
        existing.quantity * existing.averagePrice + quantity * averagePrice;
      holdings.set(id, {
        ...existing,
        quantity: combinedQuantity,
        averagePrice: combinedCost / combinedQuantity
      });
      return;
    }

    holdings.set(id, {
      id,
      symbol,
      exchange,
      quantity,
      averagePrice,
      buyDate: mapping.buyDate ? coerceString(row[mapping.buyDate]) : undefined,
      sector: mapping.sector ? coerceString(row[mapping.sector]) : undefined,
      notes: mapping.notes ? coerceString(row[mapping.notes]) : undefined
    });
  });

  return {
    holdings: Array.from(holdings.values()),
    rejected
  };
}
