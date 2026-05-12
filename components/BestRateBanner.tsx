"use client";

import type { RateRow, I18N } from "@/lib/types";
import type { Lang } from "@/app/page";

type T = (typeof I18N)[Lang];

interface Props {
  t: T;
  bestBuy: RateRow;
  bestSell: RateRow;
  amount: number;
  direction: "fxtolkr" | "lkrtofx";
}

function fmt(n: number) {
  return n.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BestRateBanner({ t, bestBuy, bestSell, amount, direction }: Props) {
  const buyConverted =
    direction === "fxtolkr"
      ? `= LKR ${fmt(amount * bestBuy.buying)}`
      : `= ${fmt(amount / bestBuy.buying)} ${bestBuy.currency}`;

  const sellConverted =
    direction === "fxtolkr"
      ? `= LKR ${fmt(amount * bestSell.selling)}`
      : `= ${fmt(amount / bestSell.selling)} ${bestSell.currency}`;

  return (
    <div className="flex flex-wrap gap-3 mb-5">
      <div className="flex-1 min-w-[200px] bg-accent/5 border border-accent/20 rounded-xl px-4 py-3">
        <div className="text-[10px] font-mono text-accent/70 uppercase tracking-widest mb-1">
          {t.bestBuy} rate
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold font-mono text-accent">
            {fmt(bestBuy.buying)}
          </span>
          <span className="text-xs text-muted font-mono">
            LKR per {bestBuy.currency}
          </span>
        </div>
        <div className="text-xs text-muted font-mono mt-0.5">
          {bestBuy.bank_name} · {buyConverted}
        </div>
      </div>

      <div className="flex-1 min-w-[200px] bg-sell/5 border border-sell/20 rounded-xl px-4 py-3">
        <div className="text-[10px] font-mono text-sell/70 uppercase tracking-widest mb-1">
          {t.bestSell} rate
        </div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-bold font-mono text-sell">
            {fmt(bestSell.selling)}
          </span>
          <span className="text-xs text-muted font-mono">
            LKR per {bestSell.currency}
          </span>
        </div>
        <div className="text-xs text-muted font-mono mt-0.5">
          {bestSell.bank_name} · {sellConverted}
        </div>
      </div>
    </div>
  );
}
