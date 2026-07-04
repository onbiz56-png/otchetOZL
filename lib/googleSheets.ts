import { google } from "googleapis";

let cachedClient: ReturnType<typeof google.sheets> | null = null;

export function getSheetsClient() {
  if (cachedClient) return cachedClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // В Vercel переносы строк в переменных окружения нужно хранить как \n и разэкранировать
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
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Не задан GOOGLE_SHEET_ID в переменных окружения");
  return id;
}

// A1-нотация для одной ячейки на листе по номеру строки и номеру дня месяца.
// День 1 -> столбец B (индекс 2), день 2 -> C, и т.д.
export function cellA1(sheetTitle: string, row: number, day: number): string {
  const colIndex = day + 1; // A=1, B=2 -> день 1 = колонка 2
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
