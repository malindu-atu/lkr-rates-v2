import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

/**
 * POST /api/trigger-scrape
 * Header: Authorization: Bearer <SCRAPE_SECRET>
 *
 * Called by GitHub Actions every morning at 7:30 AM Sri Lanka time.
 * Runs the full scraper inline and upserts results to Supabase.
 * Protected by a secret token so only the cron job can trigger it.
 */
export async function POST(request: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = (request.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!process.env.SCRAPE_SECRET || token !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const TODAY = new Date().toISOString().slice(0, 10);
  const cheerio = await import("cheerio");

  // ── Currency map ──────────────────────────────────────────────────────────
  const CURRENCY_MAP: Record<string, string> = {
    "us dollar": "USD", "us dollars": "USD", "usd": "USD", "united states dollar": "USD", "united states dollar (usd)": "USD",
    "euro": "EUR", "eur": "EUR", "euro (eur)": "EUR",
    "pound sterling": "GBP", "sterling pound": "GBP", "sterling pounds": "GBP",
    "british pound": "GBP", "gbp": "GBP", "great britain pound": "GBP", "great british pound": "GBP", "great british pound (gbp)": "GBP",
    "australian dollar": "AUD", "australian dollars": "AUD", "aud": "AUD", "australian dollar (aud)": "AUD",
    "canadian dollar": "CAD", "canadian dollars": "CAD", "cad": "CAD",
    "singapore dollar": "SGD", "singapore dollars": "SGD", "sgd": "SGD",
    "japanese yen": "JPY", "yen": "JPY", "jpy": "JPY",
    "swiss franc": "CHF", "swiss francs": "CHF", "chf": "CHF",
    "chinese yuan": "CNY", "cny": "CNY", "renminbi": "CNY",
    "indian rupee": "INR", "indian rupees": "INR", "inr": "INR",
    "saudi riyal": "SAR", "saudi arabian riyal": "SAR", "saudi arabian riyals": "SAR", "sar": "SAR",
    "uae dirham": "AED", "uae dirhams": "AED", "aed": "AED",
    "malaysian ringgit": "MYR", "myr": "MYR",
    "thai baht": "THB", "thb": "THB",
    "new zealand dollar": "NZD", "new zealand dollars": "NZD", "nzd": "NZD",
    "hong kong dollar": "HKD", "hongkong dollar": "HKD", "hkd": "HKD",
    "swedish krona": "SEK", "sek": "SEK",
    "norwegian krone": "NOK", "nok": "NOK",
    "danish krone": "DKK", "dkk": "DKK",
    "kuwaiti dinar": "KWD", "kuwaiti dinars": "KWD", "kwd": "KWD",
    "qatari riyal": "QAR", "qatar riyals": "QAR", "qar": "QAR",
    "bahraini dinar": "BHD", "bahrain dinars": "BHD", "bhd": "BHD",
    "omani rial": "OMR", "omani riyals": "OMR", "omr": "OMR",
    "jordanian dinar": "JOD", "jordanian dinars": "JOD", "jod": "JOD",
  };

  const SCRAPERS = [
    { code: "BOC",     name: "Bank of Ceylon",           url: "https://www.boc.lk/rates-tariff",                                        tableIdx: 0,  headerRows: 3, currencyCol: 0, buyingCol: 4,  sellingCol: 5,  fallbackBuy: null, fallbackSell: null },
    { code: "PEOPLES", name: "People's Bank",             url: "https://www.peoplesbank.lk/exchange-rates/",                             tableIdx: 0,  headerRows: 2, currencyCol: 1, buyingCol: 3,  sellingCol: 4,  fallbackBuy: null, fallbackSell: null },
    { code: "COMBANK", name: "Commercial Bank",           url: "https://www.combank.lk/rates-tariff#exchange-rates",                     tableIdx: 15, headerRows: 3, currencyCol: 0, buyingCol: 5,  sellingCol: 6,  fallbackBuy: 1,    fallbackSell: 2    },
    { code: "SAMPATH", name: "Sampath Bank",              url: "https://www.sampath.lk/rates-and-charges?activeTab=exchange-rates",      tableIdx: 21, headerRows: 1, currencyCol: 1, buyingCol: 2,  sellingCol: 4,  fallbackBuy: null, fallbackSell: null },
    { code: "HNB",     name: "Hatton National Bank",      url: "https://www.hnb.lk/exchange-rates",                                     tableIdx: 0,  headerRows: 1, currencyCol: 0, buyingCol: 2,  sellingCol: 3,  fallbackBuy: null, fallbackSell: null },
    { code: "NSB",     name: "National Savings Bank",     url: "https://www.nsb.lk/rates-tarriffs/nsb-exchange-rates/",                 tableIdx: 0,  headerRows: 2, currencyCol: 1, buyingCol: 2,  sellingCol: 3,  fallbackBuy: null, fallbackSell: null },
    { code: "NDB",     name: "National Development Bank", url: "https://www.ndbbank.com/rates/exchange-rates",                          tableIdx: 0,  headerRows: 2, currencyCol: 0, buyingCol: 6,  sellingCol: 7,  fallbackBuy: null, fallbackSell: null },
    { code: "DFCC",    name: "DFCC Bank",                 url: "https://www.dfcc.lk/rates-and-tariff/exchange-rates",                   tableIdx: 0,  headerRows: 1, currencyCol: 0, buyingCol: 3,  sellingCol: 4,  fallbackBuy: null, fallbackSell: null },
    { code: "SEYLAN",  name: "Seylan Bank",               url: "https://www.seylan.lk/exchange-rates",                                  tableIdx: 0,  headerRows: 2, currencyCol: 0, buyingCol: 6,  sellingCol: 7,  fallbackBuy: null, fallbackSell: null },
    { code: "UNION",   name: "Union Bank",                url: "https://www.unionb.com/exchange-rates",                                 tableIdx: 1,  headerRows: 1, currencyCol: 0, buyingCol: 2,  sellingCol: 3,  fallbackBuy: null, fallbackSell: null },
  ];

  const allRows: object[] = [];
  const errors: string[] = [];

  for (const s of SCRAPERS) {
    try {
      const res = await fetch(s.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LKRRateScraper/1.0)" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);

      $("table").eq(s.tableIdx).find("tr").slice(s.headerRows).each((_, tr) => {
        const c = $(tr).find("td,th").map((_, td) => $(td).text().trim()).get();
        const currency = CURRENCY_MAP[c[s.currencyCol]?.toLowerCase().replace(/\s+/g, " ")] ?? null;
        const parseRate = (str: string) => {
          const n = parseFloat(str?.replace(/[^0-9.]/g, ""));
          return isNaN(n) || n < 1 ? null : n;
        };
        const buying = parseRate(c[s.buyingCol]) ?? (s.fallbackBuy !== null ? parseRate(c[s.fallbackBuy!]) : null);
        const selling = parseRate(c[s.sellingCol]) ?? (s.fallbackSell !== null ? parseRate(c[s.fallbackSell!]) : null);
        if (currency && buying && selling) {
          allRows.push({ bank_code: s.code, bank_name: s.name, currency, buying, selling, date: TODAY, scraped_at: new Date().toISOString() });
        }
      });
    } catch (err) {
      errors.push(`${s.code}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  if (allRows.length === 0) {
    return NextResponse.json({ success: false, error: "No rates scraped", errors }, { status: 500 });
  }

  const { error: dbError } = await getAdminClient()
    .from("exchange_rates")
    .upsert(allRows, { onConflict: "bank_code,currency,date", ignoreDuplicates: false });

  if (dbError) {
    return NextResponse.json({ success: false, error: dbError.message, errors }, { status: 500 });
  }

  return NextResponse.json({ success: true, rowsWritten: allRows.length, errors, date: TODAY });
}
