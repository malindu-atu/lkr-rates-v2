import type { I18N } from "@/lib/types";
import type { Lang } from "@/app/page";

type T = (typeof I18N)[Lang];

export default function Footer({ t }: { t: T }) {
  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="border-l-2 border-border pl-4 py-1">
        <p className="text-xs font-mono text-muted leading-relaxed">{t.notice}</p>
      </div>

      {/* Links to source banks */}
      <div className="pt-2 border-t border-border">
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3">Source pages</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {[
            ["BOC", "https://www.boc.lk/rate-and-tariff/exchange-rates"],
            ["People's", "https://www.peoplesbank.lk/exchange-rates/"],
            ["ComBank", "https://www.combank.lk/rates-tariffs#exchange-rate"],
            ["Sampath", "https://www.sampath.lk/en/exchange-rates"],
            ["HNB", "https://www.hnb.net/rates/exchange-rates"],
            ["NSB", "https://www.nsb.lk/exchange-rates/"],
            ["NDB", "https://www.ndb.lk/rates-tariffs/exchange-rates/"],
            ["DFCC", "https://www.dfcc.lk/personal/exchange-rates/"],
            ["Seylan", "https://www.seylan.lk/personal-banking/exchange-rates"],
            ["Union", "https://www.unionb.com/exchange-rates"],
          ].map(([label, url]) => (
            <a
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
