import { NextRequest, NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/requireAuth";
import { getSheetsClient, getSpreadsheetId, cellA1 } from "@/lib/googleSheets";
import { ensureTabForDate } from "@/lib/sheetTab";
import { findField } from "@/lib/categories";

interface EntryInput {
  id: string;
  value: number;
  force?: boolean; // true = подтверждено пользователем перезаписать
}

export async function POST(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const entries: EntryInput[] = body.entries ?? [];
  if (!entries.length) {
    return NextResponse.json({ error: "Пустой список полей для сохранения" }, { status: 400 });
  }

  for (const e of entries) {
    if (!findField(e.id)) {
      return NextResponse.json({ error: `Неизвестное поле: ${e.id}` }, { status: 400 });
    }
  }

  const today = new Date();
  const day = today.getDate();
  const tabTitle = await ensureTabForDate(today);

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  // 1. Проверяем текущие значения по всем запрошенным полям
  const ranges = entries.map((e) => cellA1(tabTitle, findField(e.id)!.row, day));
  const currentRes = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });

  const conflicts: { id: string; currentValue: string | number }[] = [];
  const toWrite: { range: string; value: number }[] = [];

  entries.forEach((e, i) => {
    const field = findField(e.id)!;
    const currentCell = currentRes.data.valueRanges?.[i]?.values?.[0]?.[0];
    const hasExisting = currentCell !== undefined && currentCell !== "" && currentCell !== null;

    if (hasExisting && !e.force) {
      conflicts.push({ id: e.id, currentValue: currentCell });
      return;
    }
    toWrite.push({ range: cellA1(tabTitle, field.row, day), value: e.value });
  });

  let saved: string[] = [];
  if (toWrite.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: toWrite.map((w) => ({ range: w.range, values: [[w.value]] })),
      },
    });
    saved = entries.filter((e) => !conflicts.find((c) => c.id === e.id)).map((e) => e.id);
  }

  return NextResponse.json({ saved, conflicts, tabTitle });
}
