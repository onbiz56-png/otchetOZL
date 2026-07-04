"use client";

import { useState } from "react";
import { BlockDef } from "@/lib/categories";

interface Props {
  block: BlockDef;
  values: Record<string, string>;
  filled: Record<string, boolean>;
  onChange: (id: string, value: string) => void;
  defaultOpen?: boolean;
}

export default function BlockSection({ block, values, filled, onChange, defaultOpen }: Props) {
  const [open, setOpen] = useState(!!defaultOpen);
  const filledCount = block.fields.filter((f) => filled[f.id]).length;

  return (
    <div className="block">
      <div className="blockHeader" onClick={() => setOpen((o) => !o)}>
        <span>{block.title}</span>
        <div className="blockHeaderRight">
          <span className="blockBadge">
            {filledCount}/{block.fields.length}
          </span>
          <span className={`chevron ${open ? "chevronOpen" : ""}`}>▾</span>
        </div>
      </div>
      {open && (
        <div className="blockBody">
          {block.fields.map((field) => (
            <div className="fieldCard" key={field.id}>
              <span className="fieldLabel">
                {filled[field.id] && <span className="fieldFilledDot" />}
                {field.label}
              </span>
              <input
                className="fieldInput"
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={values[field.id] ?? ""}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
