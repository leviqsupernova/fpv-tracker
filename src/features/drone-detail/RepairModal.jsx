import React, { useState } from "react";
import { ModalShell, Field, Chip, TextInput, Btn } from "../../components";
import { FAULT_POOL } from "./faultPool";

export function RepairModal({ drone, onClose, onSubmit }) {
  const [reasons, setReasons] = useState(drone.faults || []);
  const [note, setNote] = useState("");
  const toggle = (tag) => setReasons((r) => (r.includes(tag) ? r.filter((x) => x !== tag) : [...r, tag]));
  const customFaults = drone.faults.filter((f) => !FAULT_POOL.includes(f));

  return (
    <ModalShell title={`Mark ${drone.serial} for repair`} onClose={onClose} width={480}>
      <div className="flex flex-col gap-4">
        <Field label="Reason" group>
          <div className="flex flex-wrap gap-1.5">
            {FAULT_POOL.map((tag) => (
              <Chip key={tag} active={reasons.includes(tag)} onClick={() => toggle(tag)}>{tag}</Chip>
            ))}
            {customFaults.map((tag) => (
              <Chip key={tag} active={reasons.includes(tag)} className="fault-chip" onClick={() => toggle(tag)}>{tag}</Chip>
            ))}
          </div>
        </Field>
        <Field label="Notes">
          <TextInput
            multiline
            minRows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's wrong, what needs to happen…"
          />
        </Field>
        <div className="flex justify-end gap-2.5" style={{ marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn
            variant="danger"
            disabled={reasons.length === 0 && !note.trim()}
            onClick={() => { onSubmit(reasons, note.trim()); onClose(); }}
          >
            Send to repair
          </Btn>
        </div>
      </div>
    </ModalShell>
  );
}
