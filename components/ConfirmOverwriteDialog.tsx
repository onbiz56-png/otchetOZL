"use client";

import { findField } from "@/lib/categories";

export interface Conflict {
  id: string;
  currentValue: string | number;
  newValue: string;
}

interface Props {
  conflicts: Conflict[];
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmOverwriteDialog({ conflicts, onConfirm, onCancel }: Props) {
  return (
    <div className="overlay">
      <div className="sheet">
        <div className="sheetTitle">Заменить уже внесённые значения?</div>
        {conflicts.map((c) => {
          const field = findField(c.id);
          return (
            <div className="sheetRow" key={c.id}>
              <span>{field?.label}</span>
              <span>
                {c.currentValue} → <b>{c.newValue}</b>
              </span>
            </div>
          );
        })}
        <div className="sheetActions">
          <button className="button buttonSecondary" onClick={onCancel}>
            Отмена
          </button>
          <button className="button buttonPrimary" onClick={onConfirm}>
            Заменить
          </button>
        </div>
      </div>
    </div>
  );
}
