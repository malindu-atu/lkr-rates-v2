import type { I18N } from "@/lib/types";
import type { Lang } from "@/app/page";

type T = (typeof I18N)[Lang];

export default function Footer({ t }: { t: T }) {
  const sources = [
    ["BOC",      "https://www.boc.lk/rates-tariff"],
    ["People's", "https://www.peoplesbank.lk/exchange-rates/"],
    ["ComBank",  "https://www.combank.lk/rates-tariff#exchange-rates"],
    ["Sampath",  "https://www.sampath.lk/rates-and-charges?activeTab=exchange-rates"],
    ["HNB",      "https://www.hnb.lk/exchange-rates"],
    ["NSB",      "https://www.nsb.lk/rates-tarriffs/nsb-exchange-rates/"],
    ["NDB",      "https://www.ndbbank.com/rates/exchange-rates"],
    ["DFCC",     "https://www.dfcc.lk/rates-and-tariff/exchange-rates"],
    ["Seylan",   "https://www.seylan.lk/exchange-rates"],
    ["Union",    "https://www.unionb.com/exchange-rates"],
  ];

  return (
    <div className="space-y-4 mt-4">
      <div className="border-l-2 border-border pl-4">
        <p className="text-xs font-mono text-muted leading-relaxed">{t.notice}</p>
      </div>

      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3">
          Source pages
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {sources.map(([label, url]) => (
            
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-muted hover:text-accent transition-colors"
            >
              {label} ↗
            </a>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-mono text-muted/40 text-center pt-2">
        Built with Next.js · Supabase · Recharts · Deployed on Vercel
      </p>
    </div>
  );
}
