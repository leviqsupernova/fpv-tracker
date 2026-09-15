import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import { X } from "lucide-react";
import { IconBtn } from "./IconBtn";

export function ModalShell({ title, icon: Icon, onClose, children, width = 460 }) {
  return (
    <Dialog
      open
      onClose={onClose}
      PaperProps={{
        sx: {
          width,
          maxWidth: "90vw",
          backgroundColor: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "var(--text)", fontSize: 17, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {Icon && <Icon size={17} />}
          {title}
        </span>
        <IconBtn icon={X} onClick={onClose} title="Close" />
      </DialogTitle>
      <DialogContent sx={{ padding: "24px" }}>{children}</DialogContent>
    </Dialog>
  );
}
