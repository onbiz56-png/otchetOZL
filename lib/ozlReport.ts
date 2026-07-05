export const COL = {
  order: 0, status: 2, comment: 15, category: 31, brand: 33, atDates: 45, bdDate: 55, blDate: 63,
} as const;

export const STATUS = {
  bought: "выкуплен",
  factoryReplace: "замена на фабрике",
  shouldBeWarehouse: "должен быть на складе",
  qcFailed: "не прошел контроль качества",
} as const;

function normStatus(s: string): string {
  return (s || "").toString().toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
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
  return String(cell).split(/[\n\r]+/).map((line) => parseRuDate(line)).filter((d): d is Date => d !== null);
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
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function lastPurchasingComment(cell: string | undefined): string | null {
  if (!cell) return null;
  const lines = String(cell).split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^З\s*\//i.test(lines[i])) return lines[i];
  }
  return null;
}

export interface ReportLine { text: string; bold: boolean; }

function head(row: string[]): string {
  const order = (row[COL.order] || "").toString().trim();
  const category = (row[COL.category] || "").toString().trim();
  const brand = (row[COL.brand] || "").toString().trim();
  const parts = [category, brand].filter(Boolean).join(" ");
  return `#${order} — ${parts}`.replace(/ —\s*$/, "");
}

function buildSnapshotLine(row: string[]): ReportLine | null {
  const status = normStatus(row[COL.status]);
  const t = today();
  if (status === STATUS.bought) {
    const first = firstDate(row[COL.atDates]);
    const last = lastDate(row[COL.atDates]);
    if (!first) return { text: `${head(row)}, плановая дата не указана`, bold: false };
    if (diffDays(t, first) > 0) {
      return { text: `${head(row)}, плановая дата ${formatRuDate(first)}`, bold: false };
    } else {
      const d = last ?? first;
      return { text: `❗${head(row)}, поставщик задерживает отправку, плановая дата ${formatRuDate(d)}`, bold: true };
    }
  }
  if (status === STATUS.factoryReplace) {
    const last = lastDate(row[COL.atDates]);
    if (!last) return { text: `${head(row)}, плановая дата не указана`, bold: false };
    if (diffDays(t, last) > 0) {
      return { text: `${head(row)}, плановая дата ${formatRuDate(last)}`, bold: false };
    } else {
      return { text: `❗${head(row)}, поставщик задерживает отправку, плановая дата ${formatRuDate(last)}`, bold: true };
    }
  }
  }
  if (status === STATUS.shouldBeWarehouse) {
    const bd = firstDate(row[COL.bdDate]);
    if (!bd) return { text: `${head(row)}, дата отправки на склад не указана`, bold: false };
    const planned = addDays(bd, -1);
    if (diffDays(t, planned) < 0) {
      return { text: `⏰${head(row)}, товар ещё не получен на складе, стоит статус Должен быть на складе`, bold: true };
    } else {
      return { text: `${head(row)}, отправлен на склад ${formatRuDate(planned)}`, bold: false };
    }
  }
  return null;
}

const SNAPSHOT_GROUPS = [
  { status: STATUS.bought, title: "ВЫКУПЛЕН" },
  { status: STATUS.factoryReplace, title: "ЗАМЕНА НА ФАБРИКЕ" },
  { status: STATUS.shouldBeWarehouse, title: "ДОЛЖЕН БЫТЬ НА СКЛАДЕ" },
];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildReport(rows: string[][], morningQcOrders: Set<string>): { html: string; count: number } {
  const t = today();
  const dateStr = `${String(t.getDate()).padStart(2, "0")}.${String(t.getMonth() + 1).padStart(2, "0")}`;
  const groups: Record<string, string[]> = {};
  let total = 0;

  for (const row of rows) {
    const line = buildSnapshotLine(row);
    if (!line) continue;
    const status = normStatus(row[COL.status]);
    if (!groups[status]) groups[status] = [];
    groups[status].push(line.bold ? `<b>${esc(line.text)}</b>` : esc(line.text));
    total++;
  }

  const qcInWork: string[] = [];
  const qcProcessed: string[] = [];

  for (const row of rows) {
    if (normStatus(row[COL.status]) === STATUS.qcFailed) {
      const comment = lastPurchasingComment(row[COL.comment]);
      const c = comment ? `, ${comment}` : "";
      qcInWork.push(esc(`${head(row)}${c}`));
    }
  }
  for (const row of rows) {
    const order = (row[COL.order] || "").toString().trim();
    const status = normStatus(row[COL.status]);
    if (morningQcOrders.has(order) && status !== STATUS.qcFailed) {
      const comment = lastPurchasingComment(row[COL.comment]);
      const curStatus = (row[COL.status] || "").toString().trim();
      const c = comment ? `, ${comment}` : "";
      qcProcessed.push(esc(`${head(row)}, ${curStatus}${c}`));
    }
  }

  const parts: string[] = [`<b>Отчёт ОЗЛ · ${dateStr}</b>`];
  for (const g of SNAPSHOT_GROUPS) {
    const lines = groups[g.status];
    if (lines && lines.length) parts.push("", `<b>${g.title}</b>`, ...lines);
  }
  if (qcProcessed.length) parts.push("", `<b>НЕ ПРОШЁЛ КК — обработано за день (${qcProcessed.length})</b>`, ...qcProcessed);
  if (qcInWork.length) parts.push("", `<b>НЕ ПРОШЁЛ КК — ещё в работе (${qcInWork.length})</b>`, ...qcInWork);

  total += qcProcessed.length + qcInWork.length;
  parts.push("", `Всего: ${total}`);
  return { html: parts.join("\n"), count: total };
}
