"use client";

import { useState, useEffect, useCallback } from "react";
import { CURRENCIES, BANKS, I18N, type RateRow } from "@/lib/types";
import Header from "@/components/Header";
import Converter from "@/components/Converter";
import BankTable from "@/components/BankTable";
import TrendChart from "@/components/TrendChart";
import BestRateBanner from "@/components/BestRateBanner";
import Footer from "@/components/Footer";

export type Lang = "en" | "si" | "ta";

export default function HomePage() {
  const [lang, setLang] = useState<Lang>("en");
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState(100);
  const [direction, setDirection] = useState<"fxtolkr" | "lkrtofx">("fxtolkr");
  const [rates, setRates] = useState<RateRow[]>([]);
  const [trend, setTrend] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = I18N[lang];

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rates?currency=${currency}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRates(json.todayRates ?? []);
      setTrend(json.trend ?? []);
      setFetchedAt(json.fetchedAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load rates");
    } finally {
      setLoading(false);
    }
  }, [currency]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const bestBuy = rates.reduce<RateRow | null>(
    (best, r) => (!best || r.buying > best.buying ? r : best),
    null
  );
  const bestSell = rates.reduce<RateRow | null>(
    (best, r) => (!best || r.selling < best.selling ? r : best),
    null
  );

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
        <Header lang={lang} setLang={setLang} t={t} fetchedAt={fetchedAt} />

        <Converter
          t={t}
          amount={amount}
          setAmount={setAmount}
          currency={currency}
          setCurrency={setCurrency}
          direction={direction}
          setDirection={setDirection}
          bestBuy={bestBuy}
          bestSell={bestSell}
        />

        {!loading && bestBuy && bestSell && (
          <BestRateBanner
            t={t}
            bestBuy={bestBuy}
            bestSell={bestSell}
            amount={amount}
            direction={direction}
          />
        )}

        <BankTable
          t={t}
          rates={rates}
          loading={loading}
          error={error}
          amount={amount}
          direction={direction}
          currency={currency}
          bestBuyCode={bestBuy?.bank_code ?? null}
          bestSellCode={bestSell?.bank_code ?? null}
          banks={BANKS}
        />

        {!loading && trend.length > 0 && (
          <TrendChart
            t={t}
            trend={trend}
            currency={currency}
            banks={BANKS}
          />
        )}

        <Footer t={t} />
      </div>
    </main>
  );
}
