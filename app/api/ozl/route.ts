import { NextRequest, NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/requireAuth";
import { getOzlBridgeId, readRange } from "@/lib/googleSheets";
import { buildReport } from "@/lib/ozlReport";
import { readMorningSnapshot } from "@/lib/ozlSnapshot";
import { sendTelegramMessage } from "@/lib/telegram";

const BRIDGE_TAB = "отчет для ОЗЛ";

async function loadReport() {
  const bridgeId = getOzlBridgeId();
  const rows = await readRange(bridgeId, `'${BRIDGE_TAB}'!A:BL`);
  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const morning = await readMorningSnapshot();
  return buildReport(dataRows, morning);
}

export async function POST(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;
  try {
    const { html, count } = await loadReport();
    await sendTelegramMessage(html);
    return NextResponse.json({ ok: true, count });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Не удалось сформировать отчёт ОЗЛ.", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;
  try {
    const { html, count } = await loadReport();
    return NextResponse.json({ html, count });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Не удалось сформировать отчёт ОЗЛ.", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
