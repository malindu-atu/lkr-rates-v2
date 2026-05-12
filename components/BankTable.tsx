"use client";

import { useState } from "react";
import type { RateRow, BankMeta, I18N } from "@/lib/types";
import type { Lang } from "@/app/page";

type T = (typeof I18N)[Lang];
type SortKey = "bank" | "buying" | "selling" | "spread";
type SortDir = "asc" | "desc";

interface Props {
  t: T;
  rates: RateRow[];
  loading: boolean;
  error: string | null;
  amount: number;
  direction: "fxtolkr" | "lkrtofx";
  currency: string;
  bestBuyCode: string | null;
  bestSellCode: string | null;
  banks: BankMeta[];
}

function fmt(n: number) {
  return n.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BankTable({
  t, rates, loading, error, amount, direction,
  currency, bestBuyCode, bestSellCode, banks,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("buying");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = rates
    .filter((r) => {
      if (!search) return true;
      return (
        r.bank_name.toLowerCase().includes(search.toLowerCase()) ||
        r.bank_code.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sortKey === "bank")
        return sortDir === "asc"
          ? a.bank_name.localeCompare(b.bank_name)
          : b.bank_name.localeCompare(a.bank_name);
      const av =
        sortKey === "buying" ? a.buying :
        sortKey === "selling" ? a.selling :
        a.selling - a.buying;
      const bv =
        sortKey === "buying" ? b.buying :
        sortKey === "selling" ? b.selling :
        b.selling - b.buying;
      return sortDir === "asc" ? av - bv : bv - av;
    });

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className={`ml-1 text-[10px] ${sortKey === col ? "text-accent" : "text-muted/40"}`}>
      {sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const bankColor = (code: string) =>
    banks.find((b) => b.code === code)?.color ?? "#6b6c80";

  if (error) {
    return (
      <div className="bg-surface border border-sell/30 rounded-xl p-6 text-center mb-6">
        <p className="text-sell font-mono text-sm">⚠ {error}</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <span className="text-[11px] font-mono text-muted uppercase tracking-widest">
          {t.buying} / {t.selling} — {currency}/LKR
        </span>
        <input
          type="text"
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-mono text-white placeholder-muted focus:border-accent focus:outline-none w-44"
        />
      </div>

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-2.5 border-b border-border bg-surface2/50">
          <button onClick={() => handleSort("bank")} className="text-left text-[10px] font-mono text-muted uppercase tracking-widest hover:text-white">
            Bank <SortIcon col="bank" />
          </button>
          <button onClick={() => handleSort("buying")} className="text-right text-[10px] font-mono text-muted uppercase tracking-widest hover:text-white min-w-[80px]">
            {t.buying} <SortIcon col="buying" />
          </button>
          <button onClick={() => handleSort("selling")} className="text-right text-[10px] font-mono text-muted uppercase tracking-widest hover:text-white pl-4 min-w-[80px]">
            {t.selling} <SortIcon col="selling" />
          </button>
          <button onClick={() => handleSort("spread")} className="text-right text-[10px] font-mono text-muted uppercase tracking-widest hover:text-white pl-4 min-w-[60px]">
            Spread <SortIcon col="spread" />
          </button>
          <div className="text-right text-[10px] font-mono text-muted uppercase tracking-widest pl-4 min-w-[80px]">
            {amount} {direction === "fxtolkr" ? currency : "LKR"}
          </div>
        </div>

        {/* Skeleton loading */}
        {loading && Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 border-b border-border/50 last:border-0 animate-pulse">
            <div className="h-4 bg-surface2 rounded w-36" />
            <div className="h-4 bg-surface2 rounded w-16 ml-4" />
            <div className="h-4 bg-surface2 rounded w-16 ml-4" />
            <div className="h-4 bg-surface2 rounded w-10 ml-4" />
            <div className="h-4 bg-surface2 rounded w-16 ml-4" />
          </div>
        ))}

        {/* Data rows */}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-muted font-mono text-sm">
            {t.noData}
          </div>
        )}

        {!loading && filtered.map((r) => {
          const isBestBuy = r.bank_code === bestBuyCode;
          const isBestSell = r.bank_code === bestSellCode;
          const spread = r.selling - r.buying;
          const convertedVal =
            direction === "fxtolkr"
              ? fmt(amount * r.buying)
              : fmt(amount / r.buying);

          return (
            <div
              key={r.bank_code}
              className={`grid grid-cols-[1fr_auto_auto_auto_auto] items-center px-4 py-3 border-b border-border/50 last:border-0 hover:bg-surface2/40 ${
                isBestBuy && !isBestSell ? "bg-accent/[0.03]" : ""
              } ${isBestSell && !isBestBuy ? "bg-sell/[0.03]" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: bankColor(r.bank_code) }}
                  />
                  <span className="font-semibold text-sm">{r.bank_name}</span>
                </div>
                <div className="flex gap-1.5 mt-1 pl-4">
                  {isBestBuy && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 uppercase tracking-wide">
                      {t.bestBuy}
                    </span>
                  )}
                  {isBestSell && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sell/10 text-sell border border-sell/20 uppercase tracking-wide">
                      {t.bestSell}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right pl-4">
                <div className="text-sm font-mono text-buy font-medium">{fmt(r.buying)}</div>
              </div>
              <div className="text-right pl-4">
                <div className="text-sm font-mono text-sell font-medium">{fmt(r.selling)}</div>
              </div>
              <div className="text-right pl-4">
                <div className="text-sm font-mono text-muted">{fmt(spread)}</div>
              </div>
              <div className="text-right pl-4">
                <div className="text-sm font-mono text-white/70">{convertedVal}</div>
                <div className="text-[10px] font-mono text-muted">
                  {direction === "fxtolkr" ? "LKR" : currency}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
