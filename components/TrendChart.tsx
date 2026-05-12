"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { RateRow, BankMeta, I18N } from "@/lib/types";
import type { Lang } from "@/app/page";

type T = (typeof I18N)[Lang];

interface Props {
  t: T;
  trend: RateRow[];
  currency: string;
  banks: BankMeta[];
}

const DEFAULT_BANKS = ["BOC", "COMBANK", "SAMPATH", "HNB", "PEOPLES"];

export default function TrendChart({ t, trend, currency, banks }: Props) {
  const [activeBanks, setActiveBanks] = useState<Set<string>>(
    new Set(DEFAULT_BANKS.slice(0, 3))
  );

  // Build chart data: one entry per date, each bank as its own key
  const byDate: Record<string, Record<string, number | string>> = {};
  for (const r of trend) {
    if (!byDate[r.date]) byDate[r.date] = { date: r.date };
    byDate[r.date][r.bank_code] = r.buying;
  }

  const chartData = Object.values(byDate)
    .sort((a, b) => (a.date as string).localeCompare(b.date as string))
    .map((d) => ({
      ...d,
      label: new Date(d.date as string).toLocaleDateString("en-LK", {
        day: "2-digit",
        month: "short",
      }),
    }));

  const availableBanks = DEFAULT_BANKS.filter((code) =>
    trend.some((r) => r.bank_code === code)
  );

  function toggleBank(code: string) {
    setActiveBanks((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  const bankColor = (code: string) =>
    banks.find((b) => b.code === code)?.color ?? "#6b6c80";
  const bankShort = (code: string) =>
    banks.find((b) => b.code === code)?.short ?? code;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span className="text-[11px] font-mono text-muted uppercase tracking-widest">
          {t.trend} — {currency}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {availableBanks.map((code) => (
            <button
              key={code}
              onClick={() => toggleBank(code)}
              className="text-[10px] font-mono px-2 py-1 rounded border transition-all"
              style={{
                borderColor: activeBanks.has(code) ? bankColor(code) : "#2a2b3d",
                color: activeBanks.has(code) ? bankColor(code) : "#6b6c80",
                background: activeBanks.has(code) ? `${bankColor(code)}12` : "transparent",
              }}
            >
              {bankShort(code)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2b3d" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#6b6c80", fontSize: 10, fontFamily: "var(--font-dm-mono)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#6b6c80", fontSize: 10, fontFamily: "var(--font-dm-mono)" }}
              tickLine={false}
              axisLine={false}
              width={55}
              tickFormatter={(v) => v.toFixed(2)}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1b27",
                border: "1px solid #2a2b3d",
                borderRadius: "8px",
                fontFamily: "var(--font-dm-mono)",
                fontSize: "11px",
              }}
              labelStyle={{ color: "#e8e9f0", marginBottom: 4 }}
              formatter={(value: number, name: string) => [
                value.toFixed(2),
                bankShort(name),
              ]}
            />
            {availableBanks
              .filter((code) => activeBanks.has(code))
              .map((code) => (
                <Line
                  key={code}
                  type="monotone"
                  dataKey={code}
                  stroke={bankColor(code)}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
