/**
 * scripts/scrape.mjs
 *
 * Puppeteer-based scraper for Sri Lankan bank exchange rates.
 * Each bank has its own function tuned to its exact HTML table structure.
 *
 * Run: npm run scrape
 */

import { createClient } from "@supabase/supabase-js";
import { load as cheerioLoad } from "cheerio";
import puppeteer from "puppeteer";

// ── Supabase setup ────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing Supabase env vars. Copy .env.local.example to .env.local and fill in your keys.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

// ── Currency name normalisation ───────────────────────────────────────────────
// Banks spell currency names differently — this maps all variants to ISO codes.

const CURRENCY_MAP = {
  // USD
  "us dollar": "USD", "us dollars": "USD", "u.s. dollar": "USD",
  "usd": "USD", "united states dollar": "USD", "united states dollar (usd)": "USD",
  // EUR
  "euro": "EUR", "eur": "EUR", "euro (eur)": "EUR",
  // GBP
  "pound sterling": "GBP", "sterling pound": "GBP", "sterling pounds": "GBP",
  "british pound": "GBP", "british pounds": "GBP", "uk pound": "GBP",
  "gbp": "GBP", "great britain pound": "GBP", "great british pound": "GBP",
  "great british pound (gbp)": "GBP",
  // AUD
  "australian dollar": "AUD", "australian dollars": "AUD",
  "aud": "AUD", "australian dollar (aud)": "AUD",
  // CAD
  "canadian dollar": "CAD", "canadian dollars": "CAD",
  "cad": "CAD", "canadian dollar (cad)": "CAD",
  // SGD
  "singapore dollar": "SGD", "singapore dollars": "SGD",
  "sgd": "SGD", "singapore dollar (sgd)": "SGD",
  // JPY
  "japanese yen": "JPY", "yen": "JPY", "jpy": "JPY",
  "japanese yen (jpy)": "JPY",
  // CHF
  "swiss franc": "CHF", "swiss francs": "CHF",
  "chf": "CHF", "swiss franc (chf)": "CHF",
  // CNY
  "chinese yuan": "CNY", "cny": "CNY",
  "chinese yuan (cnh)": "CNY", "cnh": "CNY", "renminbi": "CNY",
  // INR
  "indian rupee": "INR", "indian rupees": "INR",
  "inr": "INR", "indian rupee (inr)": "INR",
  // SAR
  "saudi riyal": "SAR", "sar": "SAR",
  "saudi arabian riyal": "SAR", "saudi arabian riyals": "SAR",
  // AED
  "uae dirham": "AED", "uae dirhams": "AED",
  "aed": "AED", "united arab emirates dirham": "AED",
  // MYR
  "malaysian ringgit": "MYR", "myr": "MYR",
  // THB
  "thai baht": "THB", "thb": "THB",
  // NZD
  "new zealand dollar": "NZD", "new zealand dollars": "NZD",
  "nzd": "NZD", "new zealand dollar (nzd)": "NZD",
  // HKD
  "hong kong dollar": "HKD", "hongkong dollar": "HKD",
  "hkd": "HKD", "hong kong dollar (hkd)": "HKD",
  // SEK
  "swedish krona": "SEK", "sek": "SEK",
  // NOK
  "norwegian krone": "NOK", "nok": "NOK",
  // DKK
  "danish krone": "DKK", "dkk": "DKK",
  // KWD
  "kuwaiti dinar": "KWD", "kuwaiti dinars": "KWD", "kwd": "KWD",
  // QAR
  "qatari riyal": "QAR", "qatar riyals": "QAR", "qatari riyals": "QAR", "qar": "QAR",
  // BHD
  "bahraini dinar": "BHD", "bahrain dinars": "BHD", "bhd": "BHD",
  // OMR
  "omani rial": "OMR", "omani riyals": "OMR", "omr": "OMR",
  // JOD
  "jordanian dinar": "JOD", "jordanian dinars": "JOD", "jod": "JOD",
};

function normCurrency(raw) {
  return CURRENCY_MAP[raw.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;
}

// Parses a rate string like "318.50" or "1,056.12" — returns null if < 1 (invalid)
function parseRate(str) {
  if (!str) return null;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) || n < 1 ? null : n;
}

function makeRow(code, name, currency, buying, selling) {
  return {
    bank_code: code, bank_name: name, currency,
    buying, selling, date: TODAY,
    scraped_at: new Date().toISOString(),
  };
}

// ── Puppeteer helpers ─────────────────────────────────────────────────────────

async function fetchPage(browser, url, waitMs = 3000) {
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, waitMs));
  const html = await page.content();
  await page.close();
  return html;
}

function cells(ch, trEl) {
  return ch(trEl)
    .find("td,th")
    .map((_, td) => ch(td).text().trim().replace(/\s+/g, " "))
    .get();
}

// ── Per-bank scrapers ─────────────────────────────────────────────────────────

async function scrapeBOC(browser) {
  console.log("  → Bank of Ceylon");
  const html = await fetchPage(browser, "https://www.boc.lk/rates-tariff");
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 3 header rows. Cols: 0=currency, 4=TT buying, 5=TT selling
  ch("table").eq(0).find("tr").slice(3).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[4]);
    const selling = parseRate(c[5]);
    if (currency && buying && selling)
      rows.push(makeRow("BOC", "Bank of Ceylon", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapePeoples(browser) {
  console.log("  → People's Bank");
  const html = await fetchPage(browser, "https://www.peoplesbank.lk/exchange-rates/", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 2 header rows. Cols: 1=currency, 3=TT buying, 4=TT selling
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[1] ?? "");
    const buying = parseRate(c[3]);
    const selling = parseRate(c[4]);
    if (currency && buying && selling)
      rows.push(makeRow("PEOPLES", "People's Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeComBank(browser) {
  console.log("  → Commercial Bank");
  const html = await fetchPage(browser, "https://www.combank.lk/rates-tariff#exchange-rates");
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 15, skip 3 header rows. Cols: 0=currency, 5=TT buying, 6=TT selling
  // For Middle East currencies TT cols are "-" — fall back to currency cols 1/2
  ch("table").eq(15).find("tr").slice(3).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[5]) || parseRate(c[1]);
    const selling = parseRate(c[6]) || parseRate(c[2]);
    if (currency && buying && selling)
      rows.push(makeRow("COMBANK", "Commercial Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeSampath(browser) {
  console.log("  → Sampath Bank");
  const html = await fetchPage(
    browser,
    "https://www.sampath.lk/rates-and-charges?activeTab=exchange-rates",
    4000
  );
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 21, skip 1 header row. Cols: 1=currency name, 2=TT buying, 4=TT selling
  ch("table").eq(21).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[1] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[4]);
    if (currency && buying && selling)
      rows.push(makeRow("SAMPATH", "Sampath Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeHNB(browser) {
  console.log("  → Hatton National Bank");
  const html = await fetchPage(browser, "https://www.hnb.lk/exchange-rates", 3000);
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 1 header row. Cols: 0=currency, 2=TT buying, 3=TT selling
  ch("table").eq(0).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[3]);
    if (currency && buying && selling)
      rows.push(makeRow("HNB", "Hatton National Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeNSB(browser) {
  console.log("  → National Savings Bank");
  const html = await fetchPage(
    browser,
    "https://www.nsb.lk/rates-tarriffs/nsb-exchange-rates/",
    4000
  );
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 2 header rows. Cols: 1=currency "Name (CODE)", 2=TT buying, 3=TT selling
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[1] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[3]);
    if (currency && buying && selling)
      rows.push(makeRow("NSB", "National Savings Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeNDB(browser) {
  console.log("  → National Development Bank");
  const html = await fetchPage(browser, "https://www.ndbbank.com/rates/exchange-rates", 3000);
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 2 header rows. Cols: 0=currency, 6=TT buying, 7=TT selling
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[6]);
    const selling = parseRate(c[7]);
    if (currency && buying && selling)
      rows.push(makeRow("NDB", "National Development Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeDFCC(browser) {
  console.log("  → DFCC Bank");
  const html = await fetchPage(
    browser,
    "https://www.dfcc.lk/rates-and-tariff/exchange-rates",
    4000
  );
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 1 header row. Cols: 0=currency code, 3=TT buying, 4=TT selling
  ch("table").eq(0).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[3]);
    const selling = parseRate(c[4]);
    if (currency && buying && selling)
      rows.push(makeRow("DFCC", "DFCC Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeSeylan(browser) {
  console.log("  → Seylan Bank");
  const html = await fetchPage(browser, "https://www.seylan.lk/exchange-rates", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 0, skip 2 header rows. Cols: 0=currency, 6=TT buying, 7=TT selling
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[6]);
    const selling = parseRate(c[7]);
    if (currency && buying && selling)
      rows.push(makeRow("SEYLAN", "Seylan Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

async function scrapeUnion(browser) {
  console.log("  → Union Bank");
  const html = await fetchPage(browser, "https://www.unionb.com/exchange-rates", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  // Table 1, skip 1 header row. Cols: 0=currency, 2=TT buying, 3=TT selling
  ch("table").eq(1).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[3]);
    if (currency && buying && selling)
      rows.push(makeRow("UNION", "Union Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏦  LKR Rate Scraper — ${TODAY}\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  });

  const scrapers = [
    scrapeBOC, scrapePeoples, scrapeComBank, scrapeSampath,
    scrapeHNB, scrapeNSB, scrapeNDB, scrapeDFCC, scrapeSeylan, scrapeUnion,
  ];

  // Deduplicate by bank+currency — keep first occurrence
  const seen = new Map();

  try {
    for (const scraper of scrapers) {
      try {
        const rows = await scraper(browser);
        for (const row of rows) {
          const key = `${row.bank_code}|${row.currency}`;
          if (!seen.has(key)) seen.set(key, row);
        }
      } catch (e) {
        console.error(`  ❌  ${e.message.split("\n")[0]}`);
      }
      // Polite delay between banks
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    await browser.close();
  }

  const allRows = [...seen.values()];

  if (allRows.length === 0) {
    console.error("\n❌  No rates scraped. Check bank URLs and selectors.");
    process.exit(1);
  }

  const banks = new Set(allRows.map((r) => r.bank_code));
  console.log(
    `\n📊  ${allRows.length} rates from ${banks.size} banks: ${[...banks].join(", ")}`
  );
  console.log("📤  Upserting to Supabase…");

  const { error } = await supabase.from("exchange_rates").upsert(allRows, {
    onConflict: "bank_code,currency,date",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error("❌  Supabase error:", error.message);
    process.exit(1);
  }

  console.log("✅  Done!\n");
}

main();
