import { NextRequest, NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/requireAuth";
import { getSheetsClient, getSpreadsheetId, cellA1 } from "@/lib/googleSheets";
import { getTabForDateReadOnly } from "@/lib/sheetTab";
import { ALL_FIELDS } from "@/lib/categories";

export async function GET(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;

  const today = new Date();
  const day = today.getDate();

  const tabTitle = await getTabForDateReadOnly(today);
  if (!tabTitle) {
    // вкладки месяца ещё нет — значит все поля пустые
    const empty: Record<string, null> = {};
    for (const f of ALL_FIELDS) empty[f.id] = null;
    return NextResponse.json({ values: empty, tabExists: false });
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const ranges = ALL_FIELDS.map((f) => cellA1(tabTitle, f.row, day));
  const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });

  const values: Record<string, string | number | null> = {};
  ALL_FIELDS.forEach((f, i) => {
    const cell = res.data.valueRanges?.[i]?.values?.[0]?.[0];
    values[f.id] = cell === undefined || cell === "" ? null : cell;
  });

  return NextResponse.json({ values, tabExists: true });
}
