// Логика отчёта ОЗЛ.

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

// Эталонные статусы (в нижнем регистре, сравнение регистронезависимое).
export const STATUS = {
  bought: "выкуплен",
  factoryReplace: "замена на фабрике",
  shouldBeWarehouse: "должен быть на складе",
  qcFailed: "не прошел контроль качества",
} as const;

// Нормализация статуса для сравнения: нижний регистр, ё->е, схлопнуть пробелы.
function normStatus(s: string): string {
  return (s || "")
    .toString()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

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

export function today(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function diffDays(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / MS);
}

export function lastPurchasingComment(cell: string | undefined): string | null {
  if (!cell) return null;
  const lines = String(cell).split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^З\s*\//i.test(lines[i])) return lines[i];
  }
  return null;
}

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

export function buildLine(row: string[]): ReportLine | null {
  const status = normStatus(row[COL.status]);
  const t = today();

 if (status === STATUS.bought) {
    const first = firstDate(row[COL.atDates]);
    const last = lastDate(row[COL.atDates]);
    if (!first) {
      return { text: `${head(row)}, плановая дата не указана`, bold: false };
    }
    if (diffDays(t, first) > 0) {
      return { text: `${head(row)}, плановая дата ${formatRuDate(first)}`, bold: false };
    } else {
      const d = last ?? first;
      return { text: `❗${head(row)}, поставщик задерживает отправку, плановая дата ${formatRuDate(d)}`, bold: true };
    }
  }
  if (status === STATUS.factoryReplace) {
    const bl = firstDate(row[COL.blDate]);
    if (!bl) return null;
    const planned = addDays(bl, 7);
    if (diffDays(t, planned) <= -1) {
      const last = lastDate(row[COL.atDates]);
      const d = last ?? planned;
      return { text: `❗${head(row)}, поставщик задерживает отправку, плановая дата ${formatRuDate(d)}`, bold: true };
    } else {
      return { text: `${head(row)}, плановая дата ${formatRuDate(planned)}`, bold: false };
    }
  }

  if (status === STATUS.shouldBeWarehouse) {
    const bd = firstDate(row[COL.bdDate]);
    if (!bd) return null;
    const planned = addDays(bd, -1);
    if (diffDays(t, planned) < 0) {
      return { text: `⏰${head(row)}, товар ещё не получен на складе, стоит статус Должен быть на складе`, bold: true };
    } else {
      return { text: `${head(row)}, отправлен на склад ${formatRuDate(planned)}`, bold: false };
    }
  }

  if (status === STATUS.qcFailed) {
    const comment = lastPurchasingComment(row[COL.comment]);
    if (!comment) return null;
    return { text: `${head(row)}, ${comment}`, bold: false };
  }

  return null;
}

const GROUP_ORDER: { status: string; title: string }[] = [
  { status: STATUS.bought, title: "ВЫКУПЛЕН" },
  { status: STATUS.factoryReplace, title: "ЗАМЕНА НА ФАБРИКЕ" },
  { status: STATUS.shouldBeWarehouse, title: "ДОЛЖЕН БЫТЬ НА СКЛАДЕ" },
  { status: STATUS.qcFailed, title: "НЕ ПРОШЁЛ КОНТРОЛЬ КАЧЕСТВА" },
];

export function buildReport(rows: string[][]): { html: string; count: number } {
  const t = today();
  const dateStr = `${String(t.getDate()).padStart(2, "0")}.${String(t.getMonth() + 1).padStart(2, "0")}`;

  const groups: Record<string, string[]> = {};
  let total = 0;

  for (const row of rows) {
    const status = normStatus(row[COL.status]);
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
