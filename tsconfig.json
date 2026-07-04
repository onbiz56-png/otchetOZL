"use client";

import { useEffect, useMemo, useState } from "react";
import { BLOCKS, ALL_FIELDS } from "@/lib/categories";
import { useTelegram } from "@/lib/useTelegram";
import BlockSection from "@/components/BlockSection";
import ConfirmOverwriteDialog, { Conflict } from "@/components/ConfirmOverwriteDialog";
import ReportSheet from "@/components/ReportSheet";

type ValuesMap = Record<string, string>;

export default function Home() {
  const { ready, apiFetch } = useTelegram();

  const [values, setValues] = useState<ValuesMap>({});
  const [filled, setFilled] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportItems, setReportItems] = useState<any[]>([]);
  const [reportWarning, setReportWarning] = useState<string | null>(null);
  const [reportSending, setReportSending] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const res = await apiFetch("/api/state");
        const data = await res.json();
        const filledMap: Record<string, boolean> = {};
        Object.entries(data.values || {}).forEach(([id, v]) => {
          filledMap[id] = v !== null && v !== "";
        });
        setFilled(filledMap);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready]);

  function handleChange(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  const editedEntries = useMemo(
    () =>
      Object.entries(values)
        .filter(([, v]) => v !== "" && v !== undefined)
        .map(([id, v]) => ({ id, value: Number(v) })),
    [values]
  );

  async function doSave(entries: { id: string; value: number; force?: boolean }[]) {
    setSaving(true);
    try {
      const res = await apiFetch("/api/save", {
        method: "POST",
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();

      if (data.conflicts?.length) {
        setConflicts(
          data.conflicts.map((c: any) => ({
            id: c.id,
            currentValue: c.currentValue,
            newValue: values[c.id],
          }))
        );
      } else {
        const savedIds: string[] = data.saved || [];
        setFilled((prev) => {
          const next = { ...prev };
          savedIds.forEach((id) => (next[id] = true));
          return next;
        });
        setValues((prev) => {
          const next = { ...prev };
          savedIds.forEach((id) => delete next[id]);
          return next;
        });
        setToast("Сохранено");
        setTimeout(() => setToast(null), 1800);
      }
    } catch (e) {
      console.error(e);
      setToast("Ошибка сохранения");
      setTimeout(() => setToast(null), 2000);
    } finally {
      setSaving(false);
    }
  }

  function handleSaveClick() {
    if (!editedEntries.length) return;
    doSave(editedEntries);
  }

  function handleConfirmOverwrite() {
    if (!conflicts) return;
    const forced = conflicts.map((c) => ({ id: c.id, value: Number(c.newValue), force: true }));
    setConflicts(null);
    doSave(forced);
  }

  async function openReportPreview() {
    try {
      const res = await apiFetch("/api/report/preview");
      const data = await res.json();
      setReportItems(data.items || []);
      setReportWarning(data.warning);
      setReportOpen(true);
    } catch (e) {
      console.error(e);
    }
  }

  async function confirmSendReport() {
    setReportSending(true);
    try {
      await apiFetch("/api/report", { method: "POST" });
      setReportOpen(false);
      setToast("Отчёт отправлен");
      setTimeout(() => setToast(null), 1800);
    } catch (e) {
      console.error(e);
      setToast("Не удалось отправить отчёт");
      setTimeout(() => setToast(null), 2000);
    } finally {
      setReportSending(false);
    }
  }

  return (
    <div className="page">
      <div className="pageTitle">Ежедневный отчёт</div>
      <div className="pageSubtitle">
        {loading ? "Загрузка..." : "Заполни любые карточки в любом порядке и нажми «Сохранить»"}
      </div>

      {!loading &&
        BLOCKS.map((block) => (
          <BlockSection
            key={block.id}
            block={block}
            values={values}
            filled={filled}
            onChange={handleChange}
          />
        ))}

      {!loading && (
        <button
          className="button buttonSecondary"
          style={{ width: "100%", marginTop: 4 }}
          onClick={openReportPreview}
        >
          Ежедневный отчёт сдан
        </button>
      )}

      <div className="footer">
        <button
          className="button buttonPrimary"
          disabled={!editedEntries.length || saving}
          onClick={handleSaveClick}
        >
          {saving ? "Сохраняю..." : `Сохранить${editedEntries.length ? ` (${editedEntries.length})` : ""}`}
        </button>
      </div>

      {conflicts && (
        <ConfirmOverwriteDialog
          conflicts={conflicts}
          onConfirm={handleConfirmOverwrite}
          onCancel={() => setConflicts(null)}
        />
      )}

      {reportOpen && (
        <ReportSheet
          items={reportItems}
          warning={reportWarning}
          sending={reportSending}
          onConfirm={confirmSendReport}
          onCancel={() => setReportOpen(false)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
