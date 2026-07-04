// Логика отчёта ОЗЛ.
// Читает таблицу-мост (IMPORTRANGE из закрытой таблицы, вкладка "общий"),
// отбирает заказы по 4 статусам и собирает текстовый отчёт по карте статусов.
//
// Индексы столбцов (0-based) в диапазоне A:BL:
// A=0 номер, C=2 статус, P=15 комментарий, AF=31 категория, AH=33 бренд,
// AT=45 крайняя дата отправки, BD=55 дата на склад, BL=63 дата отправки поставщику.

export const COL = {
  order: 0,     // A
  status: 2,    // C
  comment: 15,  // P
  category: 31, // AF
  brand: 33,    // AH
  atDates: 45,  // AT
  bdDate: 55,   // BD
  blDate: 63,   // BL
} as const;

export const STATUS = {
  bought: "Выкуплен",
  factoryReplace: "Замена на фабрике",
  shouldBeWarehouse: "Должен быть на складе",
  qcFailed: "Не прошёл КК",
} as const;

// ---- Работа с датами ----

// Парсит дату формата ДД.ММ.ГГГГ в объект Date (локально, полночь).
export function parseRuDate(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})$/);
  if (!m) return null;
  let [, dd, mm, yyyy] = m;
  let year = parseInt(yyyy, 10);
  if (year < 100) year += 2000;
  const d = new Date(year, parseInt(mm, 10) - 1, parseInt(dd, 10));
  return isNaN(d.getTime()) ? null : d;
}

export function formatRuDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

// Из ячейки AT (несколько дат с новой строки) достаёт список дат по порядку.
export function extractDates(cell: string | undefined): Date[] {
  if (!cell) return [];
  return String(cell)
    .split(/[\n\r]+/)
    .map((line) => parseRuDate(line))
    .filter((d): d is Date => d !== null);
}

export function firstDate(cell: string | undefined): Date | null {
  const list = extractDates(cell);
  return list.length ? list[0] : null;
}
export function lastDate(cell: string | undefined): Date | null {
  const list = extractDates(cell);
  return list.length ? list[list.length - 1] : null;
}

// Сегодняшняя дата в полночь (для сравнения без времени).
export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// Разница в днях (b - a) по календарным дням.
export function diffDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS);
}

// ---- Последний комментарий закупок из столбца P ----
// Берём последнюю строку (сверху вниз), начинающуюся с "З/".
export function lastPurchasingComment(cell: string | undefined): string | null {
  if (!cell) return null;
  const lines = String(cell).split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^З\s*\//i.test(lines[i])) return lines[i];
  }
  return null;
}

// ---- Построение строки отчёта по одному заказу ----

export interface ReportLine {
  text: string;
  bold: boolean;
}

function head(row: string[]): string {
  const order = (row[COL.order] || "").toString().trim();
  const category = (row[COL.category] || "").toString().trim();
  const brand = (row[COL.brand] || "").toString().trim();
  const parts = [category, brand].filter(Boolean).join(" ");
  return `#${order} — ${parts}`.replace(/ —\s*$/, "");
}

// Возвращает строку отчёта для заказа или null, если статус не наш / данных нет.
export function buildLine(row: string[]): ReportLine | null {
  const status = (row[COL.status] || "").toString().trim();
  const t = today();

  // 1. Выкуплен
  if (status === STATUS.bought) {
    const first = firstDate(row[COL.atDates]);
    const last = lastDate(row[COL.atDates]);
    if (!first) return null;
    // срок > сегодня+3 → обычная (первая дата); иначе жирная (последняя)
    if (diffDays(t, first) > 3) {
      return { text: `${head(row)}, плановая дата ${formatRuDate(first)}`, bold: false };
    } else {
      const d = last ?? first;
      return { text: `❗${head(row)}, поставщик задерживает отправку, плановая дата ${formatRuDate(d)}`, bold: true };
    }
  }

  // 2. Замена на фабрике
  if (status === STATUS.factoryReplace) {
    const bl = firstDate(row[COL.blDate]);
    if (!bl) return null;
    const planned = addDays(bl, 7); // BL + 7 дней
    // просрочка: BL+7 ≤ сегодня−1
    if (diffDays(t, planned) <= -1) {
      const last = lastDate(row[COL.atDates]);
      const d = last ?? planned;
      return { text: `❗${head(row)}, поставщик задерживает отправку, плановая дата ${formatRuDate(d)}`, bold: true };
    } else {
      return { text: `${head(row)}, плановая дата ${formatRuDate(planned)}`, bold: false };
    }
  }

  // 3. Должен быть на складе
  if (status === STATUS.shouldBeWarehouse) {
    const bd = firstDate(row[COL.bdDate]);
    if (!bd) return null;
    const planned = addDays(bd, -1); // BD − 1 день
    // просрочка: BD−1 < сегодня (вчера или раньше)
    if (diffDays(t, planned) < 0) {
      return { text: `⏰${head(row)}, товар ещё не получен на складе, стоит статус Должен быть на складе`, bold: true };
    } else {
      return { text: `${head(row)}, отправлен на склад ${formatRuDate(planned)}`, bold: false };
    }
  }

  // 4. Не прошёл КК
  if (status === STATUS.qcFailed) {
    const comment = lastPurchasingComment(row[COL.comment]);
    if (!comment) return null;
    return { text: `${head(row)}, ${comment}`, bold: false };
  }

  return null;
}

// ---- Сборка полного отчёта ----

const GROUP_ORDER: { status: string; title: string }[] = [
  { status: STATUS.bought, title: "ВЫКУПЛЕН" },
  { status: STATUS.factoryReplace, title: "ЗАМЕНА НА ФАБРИКЕ" },
  { status: STATUS.shouldBeWarehouse, title: "ДОЛЖЕН БЫТЬ НА СКЛАДЕ" },
  { status: STATUS.qcFailed, title: "НЕ ПРОШЁЛ КК" },
];

// rows — массив строк таблицы (каждая строка — массив ячеек), без строки заголовка.
// Возвращает готовый HTML-текст для Telegram (parse_mode: HTML).
export function buildReport(rows: string[][]): { html: string; count: number } {
  const t = today();
  const dateStr = `${String(t.getDate()).padStart(2, "0")}.${String(t.getMonth() + 1).padStart(2, "0")}`;

  const groups: Record<string, string[]> = {};
  let total = 0;

  for (const row of rows) {
    const status = (row[COL.status] || "").toString().trim();
    const line = buildLine(row);
    if (!line) continue;
    if (!groups[status]) groups[status] = [];
    groups[status].push(line.bold ? `<b>${escapeHtml(line.text)}</b>` : escapeHtml(line.text));
    total++;
  }

  const parts: string[] = [`<b>Отчёт ОЗЛ · ${dateStr}</b>`];
  for (const g of GROUP_ORDER) {
    const lines = groups[g.status];
    if (lines && lines.length) {
      parts.push("", `<b>${g.title}</b>`, ...lines);
    }
  }
  parts.push("", `Всего: ${total}`);

  return { html: parts.join("\n"), count: total };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
