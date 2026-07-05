import { getSheetsClient, getOzlBridgeId, readRange } from "./googleSheets";

const SNAPSHOT_TAB = "_срез_КК";
const SOURCE_TAB = "отчет для ОЗЛ";
const COL_ORDER = 0;
const COL_STATUS = 2;

function normStatus(s: string): string {
  return (s || "").toString().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}
const QC_STATUS = "не прошел контроль качества";

function todayStr(): string {
  const n = new Date();
  const ekb = new Date(n.getTime() + 5 * 60 * 60 * 1000);
  const dd = String(ekb.getUTCDate()).padStart(2, "0");
  const mm = String(ekb.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = ekb.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

async function ensureSnapshotTab(): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = getOzlBridgeId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const exists = (meta.data.sheets ?? []).some((s) => s.properties?.title === SNAPSHOT_TAB);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: SNAPSHOT_TAB } } }] },
    });
  }
}

export async function takeMorningSnapshot(): Promise<number> {
  await ensureSnapshotTab();
  const sheets = getSheetsClient();
  const spreadsheetId = getOzlBridgeId();
  const rows = await readRange(spreadsheetId, `'${SOURCE_TAB}'!A:BL`);
  const dataRows = rows.length > 1 ? rows.slice(1) : [];
  const date = todayStr();
  const snapshotRows: string[][] = [];
  for (const row of dataRows) {
    if (normStatus(row[COL_STATUS]) === QC_STATUS) {
      const order = (row[COL_ORDER] || "").toString().trim();
      if (order) snapshotRows.push([date, order]);
    }
  }
  await sheets.spreadsheets.values.clear({ spreadsheetId, range: `'${SNAPSHOT_TAB}'!A:B` });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SNAPSHOT_TAB}'!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [["дата", "номер"], ...snapshotRows] },
  });
  return snapshotRows.length;
}

export async function readMorningSnapshot(): Promise<Set<string>> {
  const spreadsheetId = getOzlBridgeId();
  let rows: string[][];
  try {
    rows = await readRange(spreadsheetId, `'${SNAPSHOT_TAB}'!A:B`);
  } catch {
    return new Set();
  }
  const date = todayStr();
  const set = new Set<string>();
  for (const row of rows.slice(1)) {
    const rowDate = (row[0] || "").toString().trim();
    const order = (row[1] || "").toString().trim();
    if (rowDate === date && order) set.add(order);
  }
  return set;
}
