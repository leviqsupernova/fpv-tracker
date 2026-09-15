import React from "react";
import IconButton from "@mui/material/IconButton";

export function IconBtn({ icon: Icon, onClick, title, size = 18 }) {
  return (
    <IconButton
      onClick={onClick}
      title={title}
      sx={{
        width: 42,
        height: 42,
        borderRadius: "4px",
        color: "var(--text-dim)",
        border: "1px solid transparent",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
        "&:hover": { backgroundColor: "var(--bg-elevated)", color: "var(--text)", borderColor: "var(--border)" },
        "&:active": { transform: "scale(0.94)" },
      }}
    >
      <Icon size={size} />
    </IconButton>
  );
}
