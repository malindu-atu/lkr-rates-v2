"use client";

import type { Lang } from "@/app/page";
import type { I18N } from "@/lib/types";

type T = (typeof I18N)[Lang];

interface HeaderProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
  fetchedAt: string | null;
}

export default function Header({ lang, setLang, t, fetchedAt }: HeaderProps) {
  const langs: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "si", label: "සිං" },
    { code: "ta", label: "தமிழ்" },
  ];

  const formatted = fetchedAt
    ? new Intl.DateTimeFormat("en-LK", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(fetchedAt))
    : null;

  return (
    <header className="flex items-start justify-between mb-8 pb-6 border-b border-border">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-mono text-muted uppercase tracking-widest">
            Live
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted mt-1 font-mono">{t.subtitle}</p>
        {formatted && (
          <p className="text-xs text-muted mt-1 font-mono">
            {t.updated}: {formatted} (Sri Lanka time)
          </p>
        )}
      </div>

      <div className="flex gap-1.5 mt-1 shrink-0">
        {langs.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setLang(code)}
            className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
              lang === code
                ? "border-accent text-accent bg-accent/10"
                : "border-border text-muted hover:border-white/20 hover:text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
