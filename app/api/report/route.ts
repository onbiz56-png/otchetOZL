import { NextRequest, NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/requireAuth";
import { getSheetsClient, getSpreadsheetId, cellA1 } from "@/lib/googleSheets";
import { ensureTabForDate } from "@/lib/sheetTab";
import { findField, KEY_REPORT_FIELD_IDS, REPORT_SUBMITTED_ROW } from "@/lib/categories";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;

  const today = new Date();
  const day = today.getDate();
  const tabTitle = await ensureTabForDate(today);

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const ranges = KEY_REPORT_FIELD_IDS.map((id) => cellA1(tabTitle, findField(id)!.row, day));
  const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });

  const dateStr = today.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const lines: string[] = [`<b>Ежедневный отчёт — ${dateStr}</b>`, ""];

  let paidCount: number | null = null;

  KEY_REPORT_FIELD_IDS.forEach((id, i) => {
    const field = findField(id)!;
    const raw = res.data.valueRanges?.[i]?.values?.[0]?.[0];
    const value = raw === undefined || raw === "" ? null : raw;
    if (id === "paid_items_count") paidCount = value === null ? 0 : Number(value);
    lines.push(`• ${field.label}: <b>${value ?? "—"}</b>`);
  });

  if (paidCount === 0) {
    lines.push("", "⚠️ <b>Пополнения сегодня не было !!!</b>");
  }

  await sendTelegramMessage(lines.join("\n"));

  // Отмечаем в таблице, что отчёт сдан
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: cellA1(tabTitle, REPORT_SUBMITTED_ROW, day),
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[true]] },
  });

  return NextResponse.json({ ok: true });
}
