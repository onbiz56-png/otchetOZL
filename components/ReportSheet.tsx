"use client";

interface ReportItem {
  id: string;
  label: string;
  value: string | number | null;
}

interface Props {
  items: ReportItem[];
  warning: string | null;
  sending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ReportSheet({ items, warning, sending, onConfirm, onCancel }: Props) {
  return (
    <div className="overlay">
      <div className="sheet">
        <div className="sheetTitle">Сводка перед отправкой отчёта</div>
        {items.map((item) => (
          <div className="sheetRow" key={item.id}>
            <span>{item.label}</span>
            <b>{item.value ?? "—"}</b>
          </div>
        ))}
        {warning && <div className="warningBanner">⚠️ {warning}</div>}
        <div className="sheetActions">
          <button className="button buttonSecondary" onClick={onCancel} disabled={sending}>
            Назад
          </button>
          <button className="button buttonPrimary" onClick={onConfirm} disabled={sending}>
            {sending ? "Отправка..." : "Отчёт сдан, отправить"}
          </button>
        </div>
      </div>
    </div>
  );
}
