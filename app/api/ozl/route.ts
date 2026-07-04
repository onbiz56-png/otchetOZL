import { NextRequest, NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/requireAuth";
import { getOzlBridgeId, readRange } from "@/lib/googleSheets";
import { buildReport } from "@/lib/ozlReport";
import { sendTelegramMessage } from "@/lib/telegram";

// Вкладка в таблице-мосте, куда IMPORTRANGE тянет данные из закрытой таблицы.
const BRIDGE_TAB = "отчет для ОЗЛ";

export async function POST(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;

  const bridgeId = getOzlBridgeId();

  let rows: string[][];
  try {
    rows = await readRange(bridgeId, `'${BRIDGE_TAB}'!A:BL`);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Не удалось прочитать таблицу-мост ОЗЛ. Проверьте доступ и формулу IMPORTRANGE.", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }

  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const { html, count } = buildReport(dataRows);

  await sendTelegramMessage(html);

  return NextResponse.json({ ok: true, count });
}

export async function GET(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;

  const bridgeId = getOzlBridgeId();
  let rows: string[][];
  try {
    rows = await readRange(bridgeId, `'${BRIDGE_TAB}'!A:BL`);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Не удалось прочитать таблицу-мост ОЗЛ.", detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }

  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const { html, count } = buildReport(dataRows);
  return NextResponse.json({ html, count });
}
