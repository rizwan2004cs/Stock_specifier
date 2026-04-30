import type { Exchange } from "@/lib/types";

export function inferExchange(raw: string): Exchange {
  const value = raw.trim().toUpperCase();
  if (value.endsWith(".BO") || value.includes("BSE")) {
    return "BSE";
  }
  return "NSE";
}

export function cleanSymbol(raw: string) {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/\.NS$/, "")
    .replace(/\.BO$/, "")
    .replace(/^NSE:/, "")
    .replace(/^BSE:/, "");
}

export function toYahooSymbol(symbol: string, exchange: Exchange) {
  const clean = cleanSymbol(symbol);
  return `${clean}.${exchange === "BSE" ? "BO" : "NS"}`;
}

export function makeHoldingId(symbol: string, exchange: Exchange) {
  return `${exchange}:${cleanSymbol(symbol)}`;
}

/**
 * Normalize a company name for matching:
 * collapse whitespace, uppercase, strip common suffixes.
 */
function normalizeName(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/&AMP;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.$/, "")
    .replace(/\s+(LIMITED|LTD|LT)\.?$/i, "")
    .trim();
}

/**
 * ISIN → NSE ticker mapping for major Indian stocks.
 */
export const isinToTicker: Record<string, { symbol: string; exchange: Exchange }> = {
  "INE002A01018": { symbol: "RELIANCE", exchange: "NSE" },
  "INE040A01034": { symbol: "HDFCBANK", exchange: "NSE" },
  "INE090A01021": { symbol: "ICICIBANK", exchange: "NSE" },
  "INE009A01021": { symbol: "INFY", exchange: "NSE" },
  "INE467B01029": { symbol: "TCS", exchange: "NSE" },
  "INE154A01025": { symbol: "ITC", exchange: "NSE" },
  "INE018A01030": { symbol: "LT", exchange: "NSE" },
  "INE062A01020": { symbol: "SBIN", exchange: "NSE" },
  "INE030A01027": { symbol: "HINDUNILVR", exchange: "NSE" },
  "INE155A01022": { symbol: "TATAMOTORS", exchange: "NSE" },
  "INE280A01028": { symbol: "TITAN", exchange: "NSE" },
  "INE029A01011": { symbol: "BPCL", exchange: "NSE" },
  "INE066F01020": { symbol: "HAL", exchange: "NSE" },
  "INE267A01025": { symbol: "HINDZINC", exchange: "NSE" },
  "INE733E01010": { symbol: "NTPC", exchange: "NSE" },
  "INE196A01026": { symbol: "MARICO", exchange: "NSE" },
  "INE868B01028": { symbol: "NCC", exchange: "NSE" },
  "INE205A01025": { symbol: "VEDL", exchange: "NSE" },
  "INE148O01028": { symbol: "DELHIVERY", exchange: "NSE" },
  "INE0OV601013": { symbol: "EMSLIMITED", exchange: "NSE" },
  "INE758T01015": { symbol: "ETERNAL", exchange: "NSE" },
  "INE0ONG01011": { symbol: "NTPCGREEN", exchange: "NSE" },
  "INE12UN01015": { symbol: "SHADOWFAX", exchange: "NSE" },
  "INE00H001014": { symbol: "SWIGGY", exchange: "NSE" },
  "INE1TAE01010": { symbol: "TATAMTRDVR", exchange: "NSE" },
  "INE2KCE01013": { symbol: "KWALITYWALL", exchange: "NSE" },
  "INF666M01IO8": { symbol: "GROWWDEFNC", exchange: "NSE" },
  "INF666M01OE7": { symbol: "GROWWGOLD", exchange: "NSE" },
  "INE176A01028": { symbol: "BAJFINANCE", exchange: "NSE" },
  "INE296A01024": { symbol: "BHARTIARTL", exchange: "NSE" },
  "INE860A01027": { symbol: "HCLTECH", exchange: "NSE" },
  "INE774D01024": { symbol: "WIPRO", exchange: "NSE" },
  "INE019A01038": { symbol: "SUNPHARMA", exchange: "NSE" },
  "INE117A01022": { symbol: "AXISBANK", exchange: "NSE" },
  "INE726G01019": { symbol: "ULTRACEMCO", exchange: "NSE" },
  "INE101A01026": { symbol: "KOTAKBANK", exchange: "NSE" },
  "INE160A01022": { symbol: "MARUTI", exchange: "NSE" },
  "INE669E01016": { symbol: "POWERGRID", exchange: "NSE" },
  "INE752E01010": { symbol: "COALINDIA", exchange: "NSE" },
  "INE020B01018": { symbol: "ADANIENT", exchange: "NSE" },
  "INE742F01042": { symbol: "ADANIPORTS", exchange: "NSE" },
  "INE121A01024": { symbol: "DRREDDY", exchange: "NSE" },
  "INE522F01014": { symbol: "DIVISLAB", exchange: "NSE" },
  "INE476A01014": { symbol: "CIPLA", exchange: "NSE" },
  "INE237A01028": { symbol: "GRASIM", exchange: "NSE" },
  "INE585B01010": { symbol: "HEROMOTOCO", exchange: "NSE" },
  "INE081A01012": { symbol: "BAJAJ-AUTO", exchange: "NSE" },
  "INE092T01019": { symbol: "JSWSTEEL", exchange: "NSE" },
  "INE028A01039": { symbol: "TECHM", exchange: "NSE" },
  "INE238A01034": { symbol: "M&M", exchange: "NSE" },
  "INE397D01024": { symbol: "NESTLEIND", exchange: "NSE" },
  "INE042A01014": { symbol: "ASIANPAINT", exchange: "NSE" },
  "INE010B01027": { symbol: "TATASTEEL", exchange: "NSE" },
  "INE038A01020": { symbol: "BAJAJFINSV", exchange: "NSE" },
  "INE261F01026": { symbol: "ONGC", exchange: "NSE" },
  "INE114A01011": { symbol: "BRITANNIA", exchange: "NSE" },
  "INE528G01035": { symbol: "SHREECEM", exchange: "NSE" },
  "INE797F01012": { symbol: "INDUSINDBK", exchange: "NSE" },
  "INE256A01028": { symbol: "EICHERMOT", exchange: "NSE" },
  "INE848E01016": { symbol: "HINDALCO", exchange: "NSE" },
  "INE795G01014": { symbol: "APOLLOHOSP", exchange: "NSE" },
  "INE219K01020": { symbol: "ADANIGREEN", exchange: "NSE" },
  "INE885A01032": { symbol: "TORNTPHARM", exchange: "NSE" },
  "INE721A01013": { symbol: "SBILIFE", exchange: "NSE" },
  "INE860H01022": { symbol: "HDFCLIFE", exchange: "NSE" },
};

/**
 * Normalized company name → ticker.
 * Keys are run through normalizeName() so "BHARAT PETROLEUM CORP  LT"
 * and "BHARAT PETROLEUM CORP LTD." both match.
 */
const companyNameMap: Record<string, string> = {};

const rawNameEntries: [string, string][] = [
  ["BHARAT PETROLEUM CORP", "BPCL"],
  ["BHARAT PETROLEUM CORPORATION", "BPCL"],
  ["DELHIVERY", "DELHIVERY"],
  ["EMS", "EMSLIMITED"],
  ["ETERNAL", "ETERNAL"],
  ["HDFC BANK", "HDFCBANK"],
  ["HINDUSTAN AERONAUTICS", "HAL"],
  ["HINDUSTAN UNILEVER", "HINDUNILVR"],
  ["HINDUSTAN ZINC", "HINDZINC"],
  ["ICICI BANK", "ICICIBANK"],
  ["ITC", "ITC"],
  ["KWALITY WALL'S (INDIA)", "KWALITYWALL"],
  ["LARSEN & TOUBRO", "LT"],
  ["LARSEN AND TOUBRO", "LT"],
  ["L&T", "LT"],
  ["MARICO", "MARICO"],
  ["NCC", "NCC"],
  ["NTPC GREEN ENERGY", "NTPCGREEN"],
  ["NTPC", "NTPC"],
  ["SHADOWFAX TECHNOLOGIES", "SHADOWFAX"],
  ["STATE BANK OF INDIA", "SBIN"],
  ["SBI", "SBIN"],
  ["SWIGGY", "SWIGGY"],
  ["TATA MOTORS", "TATAMOTORS"],
  ["TATA MOTORS PASS VEH", "TATAMTRDVR"],
  ["TITAN COMPANY", "TITAN"],
  ["VEDANTA", "VEDL"],
  ["RELIANCE INDUSTRIES", "RELIANCE"],
  ["INFOSYS", "INFY"],
  ["TATA CONSULTANCY SERVICES", "TCS"],
  ["BAJAJ FINANCE", "BAJFINANCE"],
  ["BHARTI AIRTEL", "BHARTIARTL"],
  ["HCL TECHNOLOGIES", "HCLTECH"],
  ["WIPRO", "WIPRO"],
  ["SUN PHARMACEUTICAL", "SUNPHARMA"],
  ["SUN PHARMA", "SUNPHARMA"],
  ["AXIS BANK", "AXISBANK"],
  ["KOTAK MAHINDRA BANK", "KOTAKBANK"],
  ["MARUTI SUZUKI", "MARUTI"],
  ["ASIAN PAINTS", "ASIANPAINT"],
  ["TATA STEEL", "TATASTEEL"],
  ["POWER GRID CORP", "POWERGRID"],
  ["POWER GRID CORPORATION", "POWERGRID"],
  ["COAL INDIA", "COALINDIA"],
  ["DR REDDYS LABORATORIES", "DRREDDY"],
  ["DR. REDDYS", "DRREDDY"],
  ["CIPLA", "CIPLA"],
  ["JSW STEEL", "JSWSTEEL"],
  ["TECH MAHINDRA", "TECHM"],
  ["MAHINDRA & MAHINDRA", "M&M"],
  ["MAHINDRA AND MAHINDRA", "M&M"],
  ["NESTLE INDIA", "NESTLEIND"],
  ["ADANI ENTERPRISES", "ADANIENT"],
  ["ADANI PORTS", "ADANIPORTS"],
  ["HERO MOTOCORP", "HEROMOTOCO"],
  ["BAJAJ AUTO", "BAJAJ-AUTO"],
  ["EICHER MOTORS", "EICHERMOT"],
  ["HINDALCO INDUSTRIES", "HINDALCO"],
  ["HINDALCO", "HINDALCO"],
  ["APOLLO HOSPITALS", "APOLLOHOSP"],
  ["ULTRATECH CEMENT", "ULTRACEMCO"],
  ["GRASIM INDUSTRIES", "GRASIM"],
  ["GRASIM", "GRASIM"],
  ["BRITANNIA INDUSTRIES", "BRITANNIA"],
  ["BRITANNIA", "BRITANNIA"],
  ["SHREE CEMENT", "SHREECEM"],
  ["INDUSIND BANK", "INDUSINDBK"],
  ["OIL AND NATURAL GAS", "ONGC"],
  ["ONGC", "ONGC"],
  ["SBI LIFE INSURANCE", "SBILIFE"],
  ["HDFC LIFE INSURANCE", "HDFCLIFE"],
  ["BAJAJ FINSERV", "BAJAJFINSV"],
  ["GROWWAMC - GROWWDEFNC", "GROWWDEFNC"],
  ["GROWWAMC - GROWWGOLD", "GROWWGOLD"],
];

// Build the lookup map with normalized keys
for (const [name, ticker] of rawNameEntries) {
  companyNameMap[normalizeName(name)] = ticker;
}

/**
 * Resolve a raw string (ISIN, company name, or ticker) into a proper
 * NSE/BSE ticker symbol. Tries ISIN first, then company name, then
 * treats it as a raw ticker.
 */
export function resolveToTicker(
  raw: string,
  isinHint?: string
): { symbol: string; exchange: Exchange } {
  // 1. ISIN lookup (most reliable)
  if (isinHint) {
    const cleaned = isinHint.trim().toUpperCase();
    const match = isinToTicker[cleaned];
    if (match) return match;
  }

  const trimmed = raw.trim();

  // 2. Check if the raw value itself is an ISIN
  if (/^IN[EF][A-Z0-9]{9,}$/i.test(trimmed)) {
    const match = isinToTicker[trimmed.toUpperCase()];
    if (match) return match;
  }

  // 3. Company name lookup (normalized)
  const normalized = normalizeName(trimmed);

  // 3a. Exact normalized match
  const exactMatch = companyNameMap[normalized];
  if (exactMatch) {
    return { symbol: exactMatch, exchange: "NSE" };
  }

  // 3b. Prefix match — "BHARAT PETROLEUM CORP" matches "BHARAT PETROLEUM"
  for (const [mapName, ticker] of Object.entries(companyNameMap)) {
    if (normalized.startsWith(mapName) || mapName.startsWith(normalized)) {
      return { symbol: ticker, exchange: "NSE" };
    }
  }

  // 4. If short and no spaces → treat as ticker directly
  const cleaned = cleanSymbol(trimmed);
  if (cleaned.length <= 15 && !/\s/.test(cleaned)) {
    return { symbol: cleaned, exchange: inferExchange(trimmed) };
  }

  // 5. Last resort: first word
  const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
  return { symbol: cleanSymbol(firstWord), exchange: "NSE" };
}
