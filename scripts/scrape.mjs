/**
 * scripts/scrape.mjs
 *
 * Custom per-bank scrapers for Sri Lankan exchange rates.
 * Each bank has its own function matching its exact table structure.
 *
 * Run: node --env-file=.env.local scripts/scrape.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { load as cheerioLoad } from "cheerio";
import puppeteer from "puppeteer";

// ── Supabase ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const TODAY = new Date().toISOString().slice(0, 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

const CURRENCY_MAP = {
  // USD
  "us dollar": "USD", "us dollars": "USD", "u.s. dollar": "USD", "usd": "USD",
  "united states dollar": "USD", "united states dollar (usd)": "USD",
  // EUR
  "euro": "EUR", "eur": "EUR", "euro (eur)": "EUR",
  // GBP
  "pound sterling": "GBP", "sterling pound": "GBP", "sterling pounds": "GBP",
  "british pound": "GBP", "british pounds": "GBP", "uk pound": "GBP", "gbp": "GBP",
  "great britain pound": "GBP", "great british pound": "GBP",
  "great british pound (gbp)": "GBP",
  // AUD
  "australian dollar": "AUD", "australian dollars": "AUD", "aud": "AUD",
  "australian dollar (aud)": "AUD",
  // CAD
  "canadian dollar": "CAD", "canadian dollars": "CAD", "cad": "CAD",
  "canadian dollar (cad)": "CAD",
  // SGD
  "singapore dollar": "SGD", "singapore dollars": "SGD", "sgd": "SGD",
  "singapore dollar (sgd)": "SGD",
  // JPY
  "japanese yen": "JPY", "yen": "JPY", "jpy": "JPY", "japanese yen (jpy)": "JPY",
  // CHF
  "swiss franc": "CHF", "swiss francs": "CHF", "chf": "CHF", "swiss franc (chf)": "CHF",
  // CNY
  "chinese yuan": "CNY", "cny": "CNY", "chinese yuan (cnh)": "CNY", "cnh": "CNY",
  "renminbi": "CNY",
  // INR
  "indian rupee": "INR", "inr": "INR", "indian rupee (inr)": "INR",
  // SAR
  "saudi riyal": "SAR", "sar": "SAR", "saudi arabian riyal": "SAR",
  "saudi arabian riyals": "SAR", "saudi arabian riyal (sar)": "SAR",
  // AED
  "uae dirham": "AED", "aed": "AED", "united arab emirates dirham": "AED",
  "uae dirhams": "AED", "uae dirham (aed)": "AED",
  // MYR
  "malaysian ringgit": "MYR", "myr": "MYR", "malaysian ringgit (myr)": "MYR",
  // THB
  "thai baht": "THB", "thb": "THB", "thai baht (thb)": "THB",
  // NZD
  "new zealand dollar": "NZD", "nzd": "NZD", "new zealand dollar (nzd)": "NZD",
  // HKD
  "hong kong dollar": "HKD", "hongkong dollar": "HKD", "hkd": "HKD",
  "hong kong dollar (hkd)": "HKD",
  // SEK
  "swedish krona": "SEK", "sek": "SEK", "swedish krona (sek)": "SEK",
  // NOK
  "norwegian krone": "NOK", "nok": "NOK", "norwegian krone (nok)": "NOK",
  // DKK
  "danish krone": "DKK", "dkk": "DKK", "danish krone (dkk)": "DKK",
  // KWD
  "kuwaiti dinar": "KWD", "kwd": "KWD", "kuwaiti dinars": "KWD",
  "kuwaiti dinar (kwd)": "KWD",
  // QAR
  "qatari riyal": "QAR", "qar": "QAR", "qatar riyals": "QAR", "qatari riyals": "QAR",
  "qatari riyal (qar)": "QAR",
  // BHD
  "bahraini dinar": "BHD", "bhd": "BHD", "bahraini dinar (bhd)": "BHD",
  // OMR
  "omani rial": "OMR", "omr": "OMR", "omani riyals": "OMR", "omani rial (omr)": "OMR",
  // JOD
  "jordanian dinar": "JOD", "jod": "JOD", "jordanian dinars": "JOD",
  "jordanian dinar (jod)": "JOD",
};

function normCurrency(raw) {
  return CURRENCY_MAP[raw.trim().toLowerCase().replace(/\s+/g, " ")] ?? null;
}

function parseRate(str) {
  if (!str) return null;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) || n < 1 ? null : n;
}

function makeRow(code, name, currency, buying, selling) {
  return {
    bank_code: code, bank_name: name, currency,
    buying, selling, date: TODAY, scraped_at: new Date().toISOString(),
  };
}

async function fetchPage(browser, url, waitMs = 3000) {
  const page = await browser.newPage();
  await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, waitMs));
  const html = await page.content();
  await page.close();
  return html;
}

function cells(ch, trEl) {
  return ch(trEl).find("td,th").map((_, td) => ch(td).text().trim().replace(/\s+/g, " ")).get();
}

// ── Per-bank scrapers ─────────────────────────────────────────────────────────

// BOC — table[0], 3 header rows, cols: 0=Currency, 4=TT Buying, 5=TT Selling
async function scrapeBOC(browser) {
  console.log("  → Bank of Ceylon");
  const html = await fetchPage(browser, "https://www.boc.lk/rates-tariff");
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(3).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[4]);
    const selling = parseRate(c[5]);
    if (currency && buying && selling) rows.push(makeRow("BOC", "Bank of Ceylon", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// PEOPLES — table[0], 2 header rows, cols: 1=Currency, 3=TT Buying, 4=TT Selling
async function scrapePeoples(browser) {
  console.log("  → People's Bank");
  const html = await fetchPage(browser, "https://www.peoplesbank.lk/exchange-rates/", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[1] ?? "");
    const buying = parseRate(c[3]);
    const selling = parseRate(c[4]);
    if (currency && buying && selling) rows.push(makeRow("PEOPLES", "People's Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// COMBANK — table[15], 3 header rows, cols: 0=Currency, 5=TT Buying, 6=TT Selling
// Table has 3 section groups: Currency rates | Cheques | Telegraphic Transfers
// Each section has Buying + Selling = 6 value cols total (indices 1-6), TT is last pair
async function scrapeComBank(browser) {
  console.log("  → Commercial Bank");
  const html = await fetchPage(browser, "https://www.combank.lk/rates-tariff#exchange-rates");
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(15).find("tr").slice(3).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    // Prefer TT cols (5/6), fall back to Currency cols (1/2) when TT shows "-"
    const buying = parseRate(c[5]) || parseRate(c[1]);
    const selling = parseRate(c[6]) || parseRate(c[2]);
    if (currency && buying && selling) rows.push(makeRow("COMBANK", "Commercial Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// SAMPATH — table[21], 1 header row, cols: 1=Currency Name, 2=TT Buying, 4=TT Selling
async function scrapeSampath(browser) {
  console.log("  → Sampath Bank");
  const html = await fetchPage(browser, "https://www.sampath.lk/rates-and-charges?activeTab=exchange-rates", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(21).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[1] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[4]);
    if (currency && buying && selling) rows.push(makeRow("SAMPATH", "Sampath Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// HNB — table[0], 1 header row, cols: 0=Currency, 2=TT Buying, 3=TT Selling
async function scrapeHNB(browser) {
  console.log("  → Hatton National Bank");
  const html = await fetchPage(browser, "https://www.hnb.lk/exchange-rates", 3000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[3]);
    if (currency && buying && selling) rows.push(makeRow("HNB", "Hatton National Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// NSB — table[0], 2 header rows, cols: 1=Currency ("Name (CODE)" format), 2=TT Buying, 3=TT Selling
async function scrapeNSB(browser) {
  console.log("  → National Savings Bank");
  const html = await fetchPage(browser, "https://www.nsb.lk/rates-tarriffs/nsb-exchange-rates/", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    // NSB format: "United States Dollar (USD)" — CURRENCY_MAP handles this
    const currency = normCurrency(c[1] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[3]);
    if (currency && buying && selling) rows.push(makeRow("NSB", "National Savings Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// NDB — table[0], 2 header rows, cols: 0=Currency, 6=TT Buying, 7=TT Selling
async function scrapeNDB(browser) {
  console.log("  → National Development Bank");
  const html = await fetchPage(browser, "https://www.ndbbank.com/rates/exchange-rates", 3000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[6]);
    const selling = parseRate(c[7]);
    if (currency && buying && selling) rows.push(makeRow("NDB", "National Development Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// DFCC — table[0], 1 header row, cols: 0=Currency Code, 3=TT Buying, 4=TT Selling
async function scrapeDFCC(browser) {
  console.log("  → DFCC Bank");
  const html = await fetchPage(browser, "https://www.dfcc.lk/rates-and-tariff/exchange-rates", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[3]);
    const selling = parseRate(c[4]);
    if (currency && buying && selling) rows.push(makeRow("DFCC", "DFCC Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// SEYLAN — table[0], 2 header rows, cols: 0=Currency, 6=TT Buying, 7=TT Selling
async function scrapeSeylan(browser) {
  console.log("  → Seylan Bank");
  const html = await fetchPage(browser, "https://www.seylan.lk/exchange-rates", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(0).find("tr").slice(2).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[6]);
    const selling = parseRate(c[7]);
    if (currency && buying && selling) rows.push(makeRow("SEYLAN", "Seylan Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// UNION — table[1], 1 header row, cols: 0=Currency, 2=TT Buying, 3=TT Selling
async function scrapeUnion(browser) {
  console.log("  → Union Bank");
  const html = await fetchPage(browser, "https://www.unionb.com/exchange-rates", 4000);
  const ch = cheerioLoad(html);
  const rows = [];
  ch("table").eq(1).find("tr").slice(1).each((_, tr) => {
    const c = cells(ch, tr);
    const currency = normCurrency(c[0] ?? "");
    const buying = parseRate(c[2]);
    const selling = parseRate(c[3]);
    if (currency && buying && selling) rows.push(makeRow("UNION", "Union Bank", currency, buying, selling));
  });
  console.log(`    ✓ ${rows.length} rates`);
  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏦  LKR Rate Scraper — ${TODAY}\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
  });

  const scrapers = [
    scrapeBOC, scrapePeoples, scrapeComBank, scrapeSampath,
    scrapeHNB, scrapeNSB, scrapeNDB, scrapeDFCC, scrapeSeylan, scrapeUnion,
  ];

  // Deduplicate by bank_code + currency before upsert
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
      await new Promise(r => setTimeout(r, 1000));
    }
  } finally {
    await browser.close();
  }

  const allRows = [...seen.values()];

  if (allRows.length === 0) {
    console.error("\n❌  No rates scraped. Aborting.");
    process.exit(1);
  }

  const banks = new Set(allRows.map(r => r.bank_code));
  console.log(`\n📊  Total: ${allRows.length} rates from ${banks.size} banks (${[...banks].join(", ")})`);
  console.log("📤  Upserting to Supabase…");

  const { error } = await supabase
    .from("exchange_rates")
    .upsert(allRows, { onConflict: "bank_code,currency,date", ignoreDuplicates: false });

  if (error) {
    console.error("❌  Supabase upsert error:", error.message);
    process.exit(1);
  }

  console.log("✅  Done!\n");
}

main();
