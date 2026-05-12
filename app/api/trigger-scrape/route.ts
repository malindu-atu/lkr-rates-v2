import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  if (!process.env.SCRAPE_SECRET || token !== process.env.SCRAPE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ success: true, message: "Use npm run scrape locally or GitHub Actions in production" });
}
