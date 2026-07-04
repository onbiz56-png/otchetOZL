import { google } from "googleapis";

let cachedClient: ReturnType<typeof google.sheets> | null = null;

export function getSheetsClient() {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error(
      "Не заданы GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY в переменных окружения"
    );
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  cachedClient = google.sheets({ version: "v4", auth });
  return cachedClient;
}

export function getSpreadsheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID?.trim();
  if (!id) throw new Error("Не задан GOOGLE_SHEET_ID в переменных окружения");
  return id;
}

export function getOzlBridgeId(): string {
  const id = process.env.OZL_BRIDGE_SHEET_ID?.trim();
  if (!id) throw new Error("Не задан OZL_BRIDGE_SHEET_ID в переменных окружения");
  return id;
}

// Читает диапазон из произвольной таблицы, возвращает матрицу строк.
export async function readRange(spreadsheetId: string, range: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return (res.data.values as string[][]) ?? [];
}

export function cellA1(sheetTitle: string, row: number, day: number): string {
  const colIndex = day + 1;
  const colLetter = columnIndexToLetter(colIndex);
  return `'${sheetTitle}'!${colLetter}${row}`;
}

export function columnIndexToLetter(index: number): string {
  let letters = "";
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}
