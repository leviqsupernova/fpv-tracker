import React, { useState } from "react";
import { ModalShell, Chip, TextInput, Btn } from "../../components";
import { FAULT_POOL } from "./faultPool";

export function FaultyModuleModal({ drone, onClose, onToggle, onAddCustom }) {
  const [customFault, setCustomFault] = useState("");
  return (
    <ModalShell title={`Faulty module — ${drone.serial}`} onClose={onClose} width={440}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {FAULT_POOL.map((tag) => (
            <Chip key={tag} active={drone.faults.includes(tag)} className="fault-chip" onClick={() => onToggle(tag)}>{tag}</Chip>
          ))}
          {drone.faults.filter((f) => !FAULT_POOL.includes(f)).map((tag) => (
            <Chip key={tag} active className="fault-chip" onRemove={() => onToggle(tag)}>{tag}</Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <TextInput
            placeholder="Add custom module…"
            value={customFault}
            onChange={(e) => setCustomFault(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && customFault.trim()) { onAddCustom(customFault.trim()); setCustomFault(""); } }}
          />
          <Btn variant="subtle" disabled={!customFault.trim()} onClick={() => { onAddCustom(customFault.trim()); setCustomFault(""); }}>Add</Btn>
        </div>
        <div className="flex justify-end" style={{ marginTop: 4 }}>
          <Btn variant="primary" onClick={onClose}>Done</Btn>
        </div>
      </div>
    </ModalShell>
  );
}
