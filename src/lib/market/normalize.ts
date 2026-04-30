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
 * Comprehensive ISIN → NSE ticker mapping for major Indian stocks.
 * This allows Groww / Zerodha / Angel One / CDSL exports
 * (which contain ISIN numbers, not ticker symbols) to be imported correctly.
 */
export const isinToTicker: Record<string, { symbol: string; exchange: Exchange }> = {
  // Nifty 50 core
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
  // Newer / Mid-cap stocks
  "INE148O01028": { symbol: "DELHIVERY", exchange: "NSE" },
  "INE0OV601013": { symbol: "EMSLIMITED", exchange: "NSE" },
  "INE758T01015": { symbol: "ETERNAL", exchange: "NSE" },
  "INE0ONG01011": { symbol: "NTPCGREEN", exchange: "NSE" },
  "INE12UN01015": { symbol: "SHADOWFAX", exchange: "NSE" },
  "INE00H001014": { symbol: "SWIGGY", exchange: "NSE" },
  "INE1TAE01010": { symbol: "TATAMTRDVR", exchange: "NSE" },
  "INE2KCE01013": { symbol: "KWALITYWALL", exchange: "NSE" },
  // Mutual Funds (will get fallback quotes — that's okay)
  "INF666M01IO8": { symbol: "GROWWDEFNC", exchange: "NSE" },
  "INF666M01OE7": { symbol: "GROWWGOLD", exchange: "NSE" },
  // More Nifty / large-cap
  "INE176A01028": { symbol: "BAJFINANCE", exchange: "NSE" },
  "INE296A01024": { symbol: "BHARTIARTL", exchange: "NSE" },
  "INE860A01027": { symbol: "HCLTECH", exchange: "NSE" },
  "INE774D01024": { symbol: "WIPRO", exchange: "NSE" },
  "INE019A01038": { symbol: "SUNPHARMA", exchange: "NSE" },
  "INE117A01022": { symbol: "AXISBANK", exchange: "NSE" },
  "INE726G01019": { symbol: "ULTRACEMCO", exchange: "NSE" },
  "INE101A01026": { symbol: "KOTAKBANK", exchange: "NSE" },
  "INE160A01022": { symbol: "MARUTI", exchange: "NSE" },
  "INE774D01024": { symbol: "WIPRO", exchange: "NSE" },
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
  "INE040301027": { symbol: "HDFC", exchange: "NSE" },
  "INE238A01034": { symbol: "M&M", exchange: "NSE" },
  "INE397D01024": { symbol: "NESTLEIND", exchange: "NSE" },
  "INE042A01014": { symbol: "ASIANPAINT", exchange: "NSE" },
  "INE010B01027": { symbol: "TATASTEEL", exchange: "NSE" },
  "INE038A01020": { symbol: "BAJAJFINSV", exchange: "NSE" },
  "INE261F01026": { symbol: "ONGC", exchange: "NSE" },
  "INE114A01011": { symbol: "BRITANNIA", exchange: "NSE" },
  "INE528G01035": { symbol: "SHREECEM", exchange: "NSE" },
  "INE860A01027": { symbol: "HCLTECH", exchange: "NSE" },
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
 * Map common full company names from broker exports to NSE ticker symbols.
 */
export const companyNameToTicker: Record<string, string> = {
  "BHARAT PETROLEUM CORP": "BPCL",
  "BHARAT PETROLEUM CORP LT": "BPCL",
  "BHARAT PETROLEUM CORPORATION": "BPCL",
  "DELHIVERY LIMITED": "DELHIVERY",
  "DELHIVERY LTD": "DELHIVERY",
  "EMS LIMITED": "EMSLIMITED",
  "ETERNAL LIMITED": "ETERNAL",
  "HDFC BANK LTD": "HDFCBANK",
  "HDFC BANK LIMITED": "HDFCBANK",
  "HINDUSTAN AERONAUTICS LTD": "HAL",
  "HINDUSTAN AERONAUTICS LIMITED": "HAL",
  "HINDUSTAN UNILEVER LTD": "HINDUNILVR",
  "HINDUSTAN UNILEVER LTD.": "HINDUNILVR",
  "HINDUSTAN UNILEVER LIMITED": "HINDUNILVR",
  "HINDUSTAN ZINC LIMITED": "HINDZINC",
  "HINDUSTAN ZINC LTD": "HINDZINC",
  "ICICI BANK LTD": "ICICIBANK",
  "ICICI BANK LTD.": "ICICIBANK",
  "ICICI BANK LIMITED": "ICICIBANK",
  "ITC LTD": "ITC",
  "ITC LIMITED": "ITC",
  "KWALITY WALL'S (INDIA) L": "KWALITYWALL",
  "LARSEN & TOUBRO LTD": "LT",
  "LARSEN & TOUBRO LTD.": "LT",
  "LARSEN & TOUBRO LIMITED": "LT",
  "LARSEN AND TOUBRO LTD": "LT",
  "MARICO LIMITED": "MARICO",
  "MARICO LTD": "MARICO",
  "NCC LIMITED": "NCC",
  "NCC LTD": "NCC",
  "NTPC GREEN ENERGY LIMITED": "NTPCGREEN",
  "NTPC LTD": "NTPC",
  "NTPC LIMITED": "NTPC",
  "SHADOWFAX TECHNOLOGIES L": "SHADOWFAX",
  "SHADOWFAX TECHNOLOGIES LTD": "SHADOWFAX",
  "STATE BANK OF INDIA": "SBIN",
  "SWIGGY LIMITED": "SWIGGY",
  "SWIGGY LTD": "SWIGGY",
  "TATA MOTORS LIMITED": "TATAMOTORS",
  "TATA MOTORS LTD": "TATAMOTORS",
  "TATA MOTORS PASS VEH LTD": "TATAMTRDVR",
  "TITAN COMPANY LIMITED": "TITAN",
  "TITAN COMPANY LTD": "TITAN",
  "VEDANTA LIMITED": "VEDL",
  "VEDANTA LTD": "VEDL",
  "RELIANCE INDUSTRIES LTD": "RELIANCE",
  "RELIANCE INDUSTRIES LIMITED": "RELIANCE",
  "INFOSYS LTD": "INFY",
  "INFOSYS LIMITED": "INFY",
  "TATA CONSULTANCY SERVICES LTD": "TCS",
  "TATA CONSULTANCY SERVICES": "TCS",
  "BAJAJ FINANCE LTD": "BAJFINANCE",
  "BAJAJ FINANCE LIMITED": "BAJFINANCE",
  "BHARTI AIRTEL LTD": "BHARTIARTL",
  "BHARTI AIRTEL LIMITED": "BHARTIARTL",
  "HCL TECHNOLOGIES LTD": "HCLTECH",
  "HCL TECHNOLOGIES LIMITED": "HCLTECH",
  "WIPRO LTD": "WIPRO",
  "WIPRO LIMITED": "WIPRO",
  "SUN PHARMACEUTICAL IND LTD": "SUNPHARMA",
  "SUN PHARMA": "SUNPHARMA",
  "AXIS BANK LTD": "AXISBANK",
  "AXIS BANK LIMITED": "AXISBANK",
  "KOTAK MAHINDRA BANK LTD": "KOTAKBANK",
  "KOTAK MAHINDRA BANK LIMITED": "KOTAKBANK",
  "MARUTI SUZUKI INDIA LTD": "MARUTI",
  "MARUTI SUZUKI INDIA LIMITED": "MARUTI",
  "ASIAN PAINTS LTD": "ASIANPAINT",
  "ASIAN PAINTS LIMITED": "ASIANPAINT",
  "TATA STEEL LTD": "TATASTEEL",
  "TATA STEEL LIMITED": "TATASTEEL",
  "POWER GRID CORP OF INDIA LTD": "POWERGRID",
  "POWER GRID CORPORATION": "POWERGRID",
  "COAL INDIA LTD": "COALINDIA",
  "COAL INDIA LIMITED": "COALINDIA",
  "DR REDDYS LABORATORIES LTD": "DRREDDY",
  "DR. REDDYS LABORATORIES": "DRREDDY",
  "CIPLA LTD": "CIPLA",
  "CIPLA LIMITED": "CIPLA",
  "JSW STEEL LTD": "JSWSTEEL",
  "JSW STEEL LIMITED": "JSWSTEEL",
  "TECH MAHINDRA LTD": "TECHM",
  "TECH MAHINDRA LIMITED": "TECHM",
  "MAHINDRA & MAHINDRA LTD": "M&M",
  "MAHINDRA AND MAHINDRA": "M&M",
  "NESTLE INDIA LTD": "NESTLEIND",
  "NESTLE INDIA LIMITED": "NESTLEIND",
  "ADANI ENTERPRISES LTD": "ADANIENT",
  "ADANI PORTS AND SPECIAL": "ADANIPORTS",
  "HERO MOTOCORP LTD": "HEROMOTOCO",
  "BAJAJ AUTO LTD": "BAJAJ-AUTO",
  "EICHER MOTORS LTD": "EICHERMOT",
  "HINDALCO INDUSTRIES LTD": "HINDALCO",
  "APOLLO HOSPITALS ENTERPRISE": "APOLLOHOSP",
  "ULTRATECH CEMENT LTD": "ULTRACEMCO",
  "GRASIM INDUSTRIES LTD": "GRASIM",
  "BRITANNIA INDUSTRIES LTD": "BRITANNIA",
  "SHREE CEMENT LTD": "SHREECEM",
  "INDUSIND BANK LTD": "INDUSINDBK",
  "ONGC LTD": "ONGC",
  "OIL AND NATURAL GAS CORP": "ONGC",
  "SBI LIFE INSURANCE CO LTD": "SBILIFE",
  "HDFC LIFE INSURANCE CO LTD": "HDFCLIFE",
  "BAJAJ FINSERV LTD": "BAJAJFINSV",
  // Groww MF naming
  "GROWWAMC - GROWWDEFNC": "GROWWDEFNC",
  "GROWWAMC - GROWWGOLD": "GROWWGOLD",
};

/**
 * Try to resolve a raw string (could be ISIN, company name, or ticker)
 * into a proper NSE/BSE ticker symbol.
 */
export function resolveToTicker(raw: string, isinHint?: string): { symbol: string; exchange: Exchange } {
  const trimmed = raw.trim();

  // 1. Check if an ISIN column was provided
  if (isinHint) {
    const cleaned = isinHint.trim().toUpperCase();
    const match = isinToTicker[cleaned];
    if (match) return match;
  }

  // 2. Check if the raw value itself is an ISIN
  if (/^INE[A-Z0-9]{9,}$/i.test(trimmed) || /^INF[A-Z0-9]{9,}$/i.test(trimmed)) {
    const match = isinToTicker[trimmed.toUpperCase()];
    if (match) return match;
  }

  // 3. Check the company name map
  const upper = trimmed.toUpperCase();
  const nameMatch = companyNameToTicker[upper];
  if (nameMatch) {
    return { symbol: nameMatch, exchange: "NSE" };
  }

  // 3b. Try partial matching for truncated names
  for (const [name, ticker] of Object.entries(companyNameToTicker)) {
    if (upper.startsWith(name) || name.startsWith(upper)) {
      return { symbol: ticker, exchange: "NSE" };
    }
  }

  // 4. If it looks like a ticker already (short, no spaces), use it directly
  const cleaned = cleanSymbol(trimmed);
  if (cleaned.length <= 15 && !cleaned.includes(" ")) {
    return { symbol: cleaned, exchange: inferExchange(trimmed) };
  }

  // 5. Last resort: take first word as potential ticker
  const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
  return { symbol: cleanSymbol(firstWord), exchange: "NSE" };
}
