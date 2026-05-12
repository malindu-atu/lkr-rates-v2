"use client";

import { CURRENCIES, type I18N } from "@/lib/types";
import type { Lang } from "@/app/page";
import type { RateRow } from "@/lib/types";

type T = (typeof I18N)[Lang];

interface ConverterProps {
  t: T;
  amount: number;
  setAmount: (n: number) => void;
  currency: string;
  setCurrency: (c: string) => void;
  direction: "fxtolkr" | "lkrtofx";
  setDirection: (d: "fxtolkr" | "lkrtofx") => void;
  bestBuy: RateRow | null;
  bestSell: RateRow | null;
}

export default function Converter({
  t, amount, setAmount, currency, setCurrency,
  direction, setDirection, bestBuy, bestSell,
}: ConverterProps) {
  const bestRate =
    direction === "fxtolkr" ? bestBuy?.buying : bestSell?.selling;

  const converted = bestRate
    ? direction === "fxtolkr"
      ? (amount * bestRate).toLocaleString("en-LK", { maximumFractionDigits: 2 })
      : (amount / bestRate).toLocaleString("en-LK", { maximumFractionDigits: 4 })
    : null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 mb-5">
      <div className="flex gap-3 flex-wrap">
        {/* Amount */}
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[11px] font-mono text-muted uppercase tracking-widest mb-2">
            {t.amount}
          </label>
          <input
            type="number"
            value={amount}
            min={0}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-lg font-mono text-white focus:border-accent focus:outline-none"
          />
        </div>

        {/* Currency */}
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] font-mono text-muted uppercase tracking-widest mb-2">
            {t.currency}
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-base font-mono text-white focus:border-accent focus:outline-none cursor-pointer"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code} style={{ background: "#1a1b27" }}>
                {c.flag} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Direction */}
        <div className="flex-none">
          <label className="block text-[11px] font-mono text-muted uppercase tracking-widest mb-2">
            {t.direction}
          </label>
          <button
            onClick={() =>
              setDirection(direction === "fxtolkr" ? "lkrtofx" : "fxtolkr")
            }
            className="bg-surface2 border border-border rounded-lg px-4 py-2.5 text-sm text-white hover:border-accent/50 hover:text-accent whitespace-nowrap"
          >
            {direction === "fxtolkr" ? t.fxtolkr : t.lkrtofx}
          </button>
        </div>
      </div>

      {/* Converted result */}
      {converted && bestRate && (
        <div className="mt-4 pt-4 border-t border-border flex items-baseline gap-3 flex-wrap">
          <span className="text-sm text-muted font-mono">
            {direction === "fxtolkr" ? `${amount} ${currency} =` : `${amount} LKR =`}
          </span>
          <span className="text-3xl font-bold tracking-tight text-accent">
            {converted}
          </span>
          <span className="text-sm text-muted font-mono">
            {direction === "fxtolkr" ? "LKR" : currency}
          </span>
          <span className="text-xs font-mono text-muted ml-auto">
            best available rate
          </span>
        </div>
      )}
    </div>
  );
}
