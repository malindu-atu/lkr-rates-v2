// ── Database row shape ────────────────────────────────────────────────────────
export interface RateRow {
  id?: number;
  bank_code: string;
  bank_name: string;
  currency: string;
  buying: number;
  selling: number;
  scraped_at: string;
  date: string;
}

// ── Bank metadata ─────────────────────────────────────────────────────────────
export interface BankMeta {
  code: string;
  name: string;
  short: string;
  color: string;
}

export const BANKS: BankMeta[] = [
  { code: "BOC",     name: "Bank of Ceylon",           short: "BOC",      color: "#4ade80" },
  { code: "PEOPLES", name: "People's Bank",             short: "People's", color: "#60a5fa" },
  { code: "COMBANK", name: "Commercial Bank",           short: "ComBank",  color: "#f472b6" },
  { code: "SAMPATH", name: "Sampath Bank",              short: "Sampath",  color: "#fb923c" },
  { code: "HNB",     name: "Hatton National Bank",      short: "HNB",      color: "#a78bfa" },
  { code: "NSB",     name: "National Savings Bank",     short: "NSB",      color: "#34d399" },
  { code: "NDB",     name: "National Dev. Bank",        short: "NDB",      color: "#facc15" },
  { code: "DFCC",    name: "DFCC Bank",                 short: "DFCC",     color: "#f87171" },
  { code: "SEYLAN",  name: "Seylan Bank",               short: "Seylan",   color: "#38bdf8" },
  { code: "UNION",   name: "Union Bank",                short: "Union",    color: "#e879f9" },
];

// ── Supported currencies ──────────────────────────────────────────────────────
export const CURRENCIES = [
  { code: "USD", name: "US Dollar",          symbol: "$",    flag: "🇺🇸" },
  { code: "EUR", name: "Euro",               symbol: "€",    flag: "🇪🇺" },
  { code: "GBP", name: "British Pound",      symbol: "£",    flag: "🇬��" },
  { code: "AUD", name: "Australian Dollar",  symbol: "A$",   flag: "🇦🇺" },
  { code: "CAD", name: "Canadian Dollar",    symbol: "C$",   flag: "🇨🇦" },
  { code: "SGD", name: "Singapore Dollar",   symbol: "S$",   flag: "🇸🇬" },
  { code: "JPY", name: "Japanese Yen",       symbol: "¥",    flag: "🇯🇵" },
  { code: "CHF", name: "Swiss Franc",        symbol: "Fr",   flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan",       symbol: "¥",    flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee",       symbol: "₹",    flag: "🇮🇳" },
  { code: "SAR", name: "Saudi Riyal",        symbol: "﷼",    flag: "🇸🇦" },
  { code: "AED", name: "UAE Dirham",         symbol: "د.إ",  flag: "🇦🇪" },
  { code: "MYR", name: "Malaysian Ringgit",  symbol: "RM",   flag: "🇲🇾" },
  { code: "THB", name: "Thai Baht",          symbol: "฿",    flag: "🇹🇭" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$",  flag: "🇳🇿" },
  { code: "HKD", name: "Hong Kong Dollar",   symbol: "HK$",  flag: "🇭🇰" },
  { code: "SEK", name: "Swedish Krona",      symbol: "kr",   flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone",    symbol: "kr",   flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone",       symbol: "kr",   flag: "🇩🇰" },
  { code: "KWD", name: "Kuwaiti Dinar",      symbol: "د.ك",  flag: "🇰🇼" },
  { code: "QAR", name: "Qatari Riyal",       symbol: "﷼",    flag: "🇶🇦" },
  { code: "BHD", name: "Bahraini Dinar",     symbol: ".د.ب", flag: "🇧🇭" },
  { code: "OMR", name: "Omani Rial",         symbol: "﷼",    flag: "🇴🇲" },
  { code: "JOD", name: "Jordanian Dinar",    symbol: "JD",   flag: "🇯🇴" },
];

// ── i18n strings ──────────────────────────────────────────────────────────────
export const I18N = {
  en: {
    title: "LKR Exchange Rates",
    subtitle: "Live TT rates from all major Sri Lankan banks",
    amount: "Amount", currency: "Currency", direction: "Direction",
    fxtolkr: "FX → LKR", lkrtofx: "LKR → FX",
    bestBuy: "Best buy", bestSell: "Best sell",
    buying: "Buying", selling: "Selling", converted: "Converted",
    updated: "Updated", trend: "30-day buying rate trend",
    notice: "TT (Telegraphic Transfer) rates only. Sourced from each bank's public rate page. Verify with the bank for large transactions.",
    search: "Search banks…", noData: "No rates available", loading: "Loading…",
  },
  si: {
    title: "LKR විදේශ විනිමය",
    subtitle: "ශ්‍රී ලංකාවේ ප්‍රධාන බැංකු වලින් TT අනුපාත",
    amount: "ප්‍රමාණය", currency: "මුදල", direction: "දිශාව",
    fxtolkr: "FX → LKR", lkrtofx: "LKR → FX",
    bestBuy: "හොඳම ගැනුම", bestSell: "හොඳම විකිණීම",
    buying: "ගැනීම", selling: "විකිනීම", converted: "පරිවර්තිත",
    updated: "යාවත්කාලීන", trend: "දින 30 ප්‍රවණතාව",
    notice: "TT අනුපාත පමණි. අනුපාත දිනය පුරා වෙනස් විය හැකිය.",
    search: "බැංකු සොයන්න…", noData: "දත්ත නොමැත", loading: "පූරණය වේ…",
  },
  ta: {
    title: "LKR மாற்று வீதங்கள்",
    subtitle: "இலங்கையின் அனைத்து பெரிய வங்கிகளிலும் TT வீதங்கள்",
    amount: "தொகை", currency: "நாணயம்", direction: "திசை",
    fxtolkr: "FX → LKR", lkrtofx: "LKR → FX",
    bestBuy: "சிறந்த வாங்கல்", bestSell: "சிறந்த விற்பனை",
    buying: "வாங்கல்", selling: "விற்பனை", converted: "மாற்றப்பட்டது",
    updated: "புதுப்பிக்கப்பட்டது", trend: "30 நாள் போக்கு",
    notice: "TT வீதங்கள் மட்டுமே. வீதங்கள் நாள் முழுவதும் மாறலாம்.",
    search: "வங்கிகளை தேடுங்கள்…", noData: "தரவு இல்லை", loading: "ஏற்றுகிறது…",
  },
};
