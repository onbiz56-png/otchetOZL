import { getSheetsClient, getSpreadsheetId } from "./googleSheets";

const MONTHS_RU = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

const MONTHS_RU_CAP = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

// Каноничное имя вкладки для новой (создаваемой) вкладки, например "Июль 2026"
export function canonicalTabName(date: Date): string {
  return `${MONTHS_RU_CAP[date.getMonth()]} ${date.getFullYear()}`;
}

// Достаём (месяц, год) из произвольного названия вкладки типа
// "Июнь 2026", "Март 2026 ", "февраль 26", "январь26"
function parseTabTitle(title: string): { month: number; year: number } | null {
  const lower = title.trim().toLowerCase();
  const monthIdx = MONTHS_RU.findIndex((m) => lower.startsWith(m));
  if (monthIdx === -1) return null;
  const rest = lower.slice(MONTHS_RU[monthIdx].length).trim();
  const digits = rest.match(/\d+/);
  if (!digits) return null;
  let year = parseInt(digits[0], 10);
  if (year < 100) year += 2000;
  return { month: monthIdx, year };
}

interface SheetMeta {
  sheetId: number;
  title: string;
}

async function listSheets(): Promise<SheetMeta[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  return (res.data.sheets ?? []).map((s) => ({
    sheetId: s.properties!.sheetId!,
    title: s.properties!.title!,
  }));
}

function findSheetForDate(sheetsList: SheetMeta[], date: Date): SheetMeta | undefined {
  return sheetsList.find((s) => {
    const parsed = parseTabTitle(s.title);
    return parsed && parsed.month === date.getMonth() && parsed.year === date.getFullYear();
  });
}

// Находит вкладку предыдущего месяца относительно date — она используется
// как шаблон (структура/форматирование) при создании новой вкладки.
function findTemplateSheet(sheetsList: SheetMeta[], date: Date): SheetMeta | undefined {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const prevSheet = findSheetForDate(sheetsList, prev);
  if (prevSheet) return prevSheet;
  // запасной вариант — самая свежая вкладка с датой в названии
  const dated = sheetsList
    .map((s) => ({ s, parsed: parseTabTitle(s.title) }))
    .filter((x) => x.parsed) as { s: SheetMeta; parsed: { month: number; year: number } }[];
  dated.sort((a, b) => (b.parsed.year - a.parsed.year) || (b.parsed.month - a.parsed.month));
  return dated[0]?.s;
}

const DATA_FIRST_ROW = 3; // строка 3 — "ЗАПОЛНЕНИЕ ТАБЛИЦ", ниже начинаются данные
const DATA_LAST_ROW = 101; // до конца месячного отчёта
const DATA_LAST_COL = "AN"; // с запасом вправо

/**
 * Возвращает title вкладки для указанной даты. Если вкладки ещё нет —
 * создаёт её копированием структуры предыдущего месяца и очищает
 * значения (оставляя заголовки, формат и текст в колонке A).
 */
export async function ensureTabForDate(date: Date): Promise<string> {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  let sheetsList = await listSheets();
  const existing = findSheetForDate(sheetsList, date);
  if (existing) return existing.title;

  const template = findTemplateSheet(sheetsList, date);
  if (!template) {
    throw new Error("Не найдена вкладка-шаблон для копирования структуры месяца");
  }

  // 1. Дублируем вкладку-шаблон внутри той же таблицы
  const copyRes = await sheets.spreadsheets.sheets.copyTo({
    spreadsheetId,
    sheetId: template.sheetId,
    requestBody: { destinationSpreadsheetId: spreadsheetId },
  });
  const newSheetId = copyRes.data.sheetId!;
  const newTitle = canonicalTabName(date);

  // 2. Переименовываем и переносим в начало списка вкладок
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: { sheetId: newSheetId, title: newTitle, index: 0 },
            fields: "title,index",
          },
        },
      ],
    },
  });

  // 3. Очищаем данные за прошлый месяц, оставляя заголовки (строки 1-2) и колонку A
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${newTitle}'!B${DATA_FIRST_ROW}:${DATA_LAST_COL}${DATA_LAST_ROW}`,
  });

  return newTitle;
}

export async function getTabForDateReadOnly(date: Date): Promise<string | null> {
  const sheetsList = await listSheets();
  const existing = findSheetForDate(sheetsList, date);
  return existing ? existing.title : null;
}
