import { NextRequest, NextResponse } from "next/server";
import { requireTelegramAuth } from "@/lib/requireAuth";
import { getSheetsClient, getSpreadsheetId, cellA1 } from "@/lib/googleSheets";
import { getTabForDateReadOnly } from "@/lib/sheetTab";
import { findField, KEY_REPORT_FIELD_IDS } from "@/lib/categories";

export async function GET(req: NextRequest) {
  const authError = requireTelegramAuth(req);
  if (authError) return authError;

  const today = new Date();
  const day = today.getDate();
  const tabTitle = await getTabForDateReadOnly(today);

  if (!tabTitle) {
    return NextResponse.json({ items: [], warning: null, tabExists: false });
  }

  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const ranges = KEY_REPORT_FIELD_IDS.map((id) => cellA1(tabTitle, findField(id)!.row, day));
  const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });

  const items = KEY_REPORT_FIELD_IDS.map((id, i) => {
    const field = findField(id)!;
    const raw = res.data.valueRanges?.[i]?.values?.[0]?.[0];
    const value = raw === undefined || raw === "" ? null : raw;
    return { id, label: field.label, value };
  });

  const paidItem = items.find((i) => i.id === "paid_items_count");
  const warning =
    paidItem && (paidItem.value === null || Number(paidItem.value) === 0)
      ? "Пополнения сегодня не было !!!"
      : null;

  return NextResponse.json({ items, warning, tabExists: true });
}
