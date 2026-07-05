import { NextRequest, NextResponse } from "next/server";
import { takeMorningSnapshot } from "@/lib/ozlSnapshot";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const count = await takeMorningSnapshot();
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}
