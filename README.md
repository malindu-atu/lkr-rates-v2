# 🏦 LKR Exchange Rates

> Compare live TT buying and selling exchange rates from all major Sri Lankan banks — updated automatically every morning.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-green?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

**Live demo:** https://lkr-rates-v2.vercel.app

---

## What it does

Most people exchanging money in Sri Lanka visit multiple bank websites to find the best rate. This app scrapes all 10 major banks every morning and shows you the best buying and selling rate at a glance — across 24 currencies, in three languages.

---

## Features

| Feature | Details |
|---|---|
| 🏦 10 banks | BOC, People's Bank, Commercial Bank, Sampath, HNB, NSB, NDB, DFCC, Seylan, Union Bank |
| 💱 24 currencies | USD, EUR, GBP, AUD, CAD, SGD, JPY, CHF, CNY, INR, SAR, AED, MYR, THB, NZD, HKD, SEK, NOK, DKK, KWD, QAR, BHD, OMR, JOD |
| 🏆 Best rate badge | Instantly see which bank offers the best buy and sell rate today |
| 🔄 Converter | Type any amount — see FX → LKR and LKR → FX across all banks simultaneously |
| 📈 30-day chart | Visualise how rates have moved over the last month, per bank |
| 🔃 Sortable table | Sort by buying rate, selling rate, or spread |
| 🔍 Search | Filter banks by name instantly |
| 🔤 Trilingual UI | English, සිංහල, தமிழ் |
| ⚡ Zero cost | Vercel free tier + Supabase free tier + GitHub Actions free tier |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│   GitHub Actions — cron 7:30 AM daily (Sri Lanka time)  │
└───────────────────────┬─────────────────────────────────┘
                        │  POST /api/trigger-scrape
                        │  Authorization: Bearer <secret>
                        ▼
┌─────────────────────────────────────────────────────────┐
│   Vercel Serverless Function                            │
│   Puppeteer loads each bank page (handles JS rendering) │
│   Cheerio parses HTML tables                            │
│   Normalises currency names across all banks            │
└───────────────────────┬─────────────────────────────────┘
                        │  upsert — unique(bank, currency, date)
                        ▼
┌─────────────────────────────────────────────────────────┐
│   Supabase — PostgreSQL                                 │
│   exchange_rates table                                  │
│   One row per bank per currency per day                 │
│   30 days of history for trend charts                   │
└───────────────────────┬─────────────────────────────────┘
                        │  GET /api/rates?currency=USD
                        ▼
┌─────────────────────────────────────────────────────────┐
│   Next.js 14 Frontend                                   │
│   React dashboard — Recharts + Tailwind CSS             │
│   Trilingual — EN / සිං / தமிழ்                          │
└─────────────────────────────────────────────────────────┘
```

---

## The scraping problem

Sri Lankan banks do not provide public APIs for exchange rates. Each bank publishes a daily HTML table on their website with different structures, column orders, and currency name formats.

This project solves that by:

1. Using **Puppeteer** to fully load each bank's page — required for JS-rendered tables
2. Using **Cheerio** to parse the HTML and extract TT buying and selling columns
3. Normalising currency name variants across banks — e.g. `"US DOLLARS"`, `"U.S. Dollar"`, `"United States Dollar (USD)"` all map to `USD`
4. Falling back to currency rates when TT rates show `"-"` (e.g. ComBank Middle East currencies)
5. Upserting into Supabase with a unique `(bank_code, currency, date)` constraint — running the scraper twice in one day updates the row rather than duplicating it

---

## Local setup

### Prerequisites
- Node.js 18 or higher
- A Supabase account (free tier is sufficient)
- Git

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/lkr-rates-v2.git
cd lkr-rates-v2
npm install
```

### 2. Set up Supabase

1. Go to https://supabase.com and create a new project
2. Open **SQL Editor** in the left sidebar
3. Paste the contents of `supabase-schema.sql` and click **Run**
4. Go to **Settings → API** and copy your keys

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SCRAPE_SECRET=any_random_string_you_choose
```

> `SCRAPE_SECRET` is a password that protects the `/api/trigger-scrape` endpoint. Use any random string — e.g. `lkr-secret-abc123xyz`.

### 4. Seed the database

Run the scraper once to populate today's rates:

```bash
npm run scrape
```

You should see output like:

```
🏦  LKR Rate Scraper — 2026-05-12

  → Bank of Ceylon
    ✓ 16 rates
  → People's Bank
    ✓ 11 rates
  → Commercial Bank
    ✓ 17 rates
  ...

📊  101 rates from 10 banks
📤  Upserting to Supabase…
✅  Done!
```

### 5. Start the development server

```bash
npm run dev
```

Open http://localhost:3000

---

## Deployment

### Deploy to Vercel

```bash
npx vercel
```

Follow the prompts and accept all defaults. Once deployed, add your environment variables:

**Vercel Dashboard → Project → Settings → Environment Variables**

Add all four:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SCRAPE_SECRET`

Then redeploy:

```bash
npx vercel --prod
```

### Activate the daily cron (GitHub Actions)

Add two secrets in your GitHub repo:

**GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `SCRAPE_SECRET` | Same value as in your `.env.local` |
| `SITE_URL` | Your Vercel URL — e.g. `https://lkr-rates-v2.vercel.app` |

The workflow `.github/workflows/daily-scrape.yml` activates automatically once these secrets exist. It runs every day at **7:30 AM Sri Lanka time**.

To test it immediately without waiting:

**GitHub repo → Actions tab → Daily Exchange Rate Scrape → Run workflow → Run workflow**

A green tick means everything is working.

---

## Project structure

```
lkr-rates-v2/
├── app/
│   ├── api/
│   │   ├── rates/
│   │   │   └── route.ts              # GET /api/rates?currency=USD
│   │   └── trigger-scrape/
│   │       └── route.ts              # POST /api/trigger-scrape (cron endpoint)
│   ├── globals.css                   # Dark theme base styles
│   ├── layout.tsx                    # Root layout with Google Fonts
│   └── page.tsx                      # Main dashboard — wires all components
├── components/
│   ├── Header.tsx                    # Title, live pulse, EN/SI/TA toggle
│   ├── Converter.tsx                 # Amount input + currency dropdown + direction
│   ├── BestRateBanner.tsx            # Best buy rate / best sell rate cards
│   ├── BankTable.tsx                 # Sortable table with search and skeleton loader
│   ├── TrendChart.tsx                # 30-day Recharts line chart with bank toggles
│   └── Footer.tsx                    # TT disclaimer + source links
├── lib/
│   ├── supabase.ts                   # Browser client + admin client
│   └── types.ts                      # RateRow, BankMeta, BANKS, CURRENCIES, I18N
├── scripts/
│   └── scrape.mjs                    # Puppeteer scraper — run with npm run scrape
├── .github/
│   └── workflows/
│       └── daily-scrape.yml          # GitHub Actions cron job
├── supabase-schema.sql               # Run once in Supabase SQL Editor
├── .env.local.example                # Copy to .env.local and fill in your keys
└── README.md
```

---

## Updating a bank scraper

Bank websites change their HTML structure occasionally. If a bank stops returning data:

1. Open the bank's exchange rate page in Chrome
2. Right-click the rates table → **Inspect**
3. Note the table index (0, 1, 2...), number of header rows, and which column holds currency name, buying rate, and selling rate
4. Update the matching `scrape___()` function in `scripts/scrape.mjs`
5. Test with `npm run scrape`

Each bank function has a comment showing exactly which table index and columns it uses — e.g.:

```js
// Table 15, skip 3 header rows. Cols: 0=currency, 5=TT buying, 6=TT selling
```

---

## FAQ

**Why does the chart only show one day of data?**
The trend chart fills in automatically as the daily cron runs. After 7 days you'll see a week of data, after 30 days a full month.

**Can I run the scraper more than once a day?**
Yes. The upsert uses a unique constraint on `(bank_code, currency, date)` so running it twice updates the existing row rather than creating a duplicate.

**Why are some banks showing fewer currencies than others?**
Banks publish different sets of currencies. NSB only publishes 4 currencies. ComBank Middle East currencies don't have TT rates so the scraper falls back to their currency rates.

**How do I add a new bank?**
Add a new entry to `BANKS` in `lib/types.ts` and a new `scrapeXXX()` function in `scripts/scrape.mjs` following the same pattern as the existing ones.

**Is this free to run?**
Yes. Vercel free tier handles the frontend and API routes. Supabase free tier (500MB) can store years of daily rate data. GitHub Actions gives 2000 free minutes per month — this cron uses about 2 minutes per day.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Charts | Recharts |
| Fonts | Syne, DM Mono (Google Fonts) |
| Scraping | Puppeteer, Cheerio |
| Database | Supabase (PostgreSQL) |
| Auth | Row-level security, service role key |
| CI/CD | GitHub Actions |
| Hosting | Vercel |

---

## License

MIT — use this however you like.
