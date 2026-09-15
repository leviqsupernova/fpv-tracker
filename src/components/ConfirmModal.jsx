import React from "react";
import { ModalShell } from "./ModalShell";
import { Btn } from "./Btn";

export function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose }) {
  return (
    <ModalShell title={title} onClose={onClose} width={400}>
      <p className="text-dim text-md leading-relaxed">{message}</p>
      <div className="flex justify-end gap-2.5" style={{ marginTop: 22 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
      </div>
    </ModalShell>
  );
}
