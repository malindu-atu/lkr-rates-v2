import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 3600;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = (searchParams.get("currency") ?? "USD").toUpperCase();

  const { data: latest, error: e1 } = await supabase
    .from("exchange_rates")
    .select("bank_code, bank_name, currency, buying, selling, date, scraped_at")
    .eq("currency", currency)
    .order("date", { ascending: false })
    .limit(100);

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const seen = new Set<string>();
  const todayRates = (latest ?? []).filter((r) => {
    if (seen.has(r.bank_code)) return false;
    seen.add(r.bank_code);
    return true;
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: trend, error: e2 } = await supabase
    .from("exchange_rates")
    .select("bank_code, bank_name, currency, buying, selling, date")
    .eq("currency", currency)
    .gte("date", thirtyDaysAgo.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  return NextResponse.json({
    currency,
    todayRates,
    trend: trend ?? [],
    fetchedAt: new Date().toISOString(),
  });
}
