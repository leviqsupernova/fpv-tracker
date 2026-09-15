import React, { useState } from "react";
import { X } from "lucide-react";
import { ModalShell, Led, IconBtn, TextInput, Btn, handlerColor } from "../../components";

export function HandlersModal({ handlers, onClose, onSave }) {
  const [list, setList] = useState(handlers);
  const [newName, setNewName] = useState("");

  const rename = (i, val) => setList((l) => l.map((h, idx) => (idx === i ? val : h)));
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const add = () => {
    const name = newName.trim();
    if (!name || list.includes(name)) return;
    setList((l) => [...l, name]);
    setNewName("");
  };

  return (
    <ModalShell title="Manage handlers" onClose={onClose} width={420}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {list.map((h, i) => (
            <div key={i} className="handler-edit-row">
              <Led color={handlerColor(h)} size="sm" />
              <TextInput size="small" value={h} onChange={(e) => rename(i, e.target.value)} />
              <IconBtn icon={X} onClick={() => remove(i)} title="Remove" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <TextInput
            placeholder="Add a name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          />
          <Btn variant="subtle" disabled={!newName.trim()} onClick={add}>Add</Btn>
        </div>
        <div className="flex justify-end gap-2.5" style={{ marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn
            variant="primary"
            disabled={list.length === 0}
            onClick={() => { onSave(list.filter((h) => h.trim())); onClose(); }}
          >
            Save
          </Btn>
        </div>
      </div>
    </ModalShell>
  );
}
