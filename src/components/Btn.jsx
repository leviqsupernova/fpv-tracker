import React from "react";
import Button from "@mui/material/Button";

const VARIANT_SX = {
  ghost: {
    color: "var(--text)",
    backgroundColor: "transparent",
    borderColor: "var(--border)",
    "&:hover": { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" },
  },
  primary: {
    color: "var(--on-accent)",
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent)",
    "&:hover": { backgroundColor: "var(--accent)", filter: "brightness(1.08)" },
  },
  danger: {
    color: "var(--repair)",
    backgroundColor: "transparent",
    borderColor: "var(--repair-border)",
    "&:hover": { backgroundColor: "var(--repair-soft)", borderColor: "var(--repair-border)" },
  },
  subtle: {
    color: "var(--text)",
    backgroundColor: "var(--bg-elevated)",
    borderColor: "var(--border)",
    "&:hover": { backgroundColor: "var(--bg-elevated)", borderColor: "var(--border-strong)" },
  },
};

export function Btn({ children, onClick, variant = "ghost", icon: Icon, disabled, size = "md", title, className }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={className}
      variant="outlined"
      disableElevation
      size={size === "sm" ? "small" : "medium"}
      startIcon={Icon ? <Icon size={size === "sm" ? 15 : 16} /> : undefined}
      sx={{
        borderRadius: "4px",
        border: "1px solid",
        fontSize: size === "sm" ? 13 : 14,
        padding: size === "sm" ? "8px 14px" : "11px 18px",
        transition: "background 0.15s, border-color 0.15s, transform 0.1s, opacity 0.15s",
        "&:active": { transform: "scale(0.97)" },
        "&.Mui-disabled": { opacity: 0.4, cursor: "not-allowed", borderColor: "var(--border)", color: "var(--text-faint)" },
        ...VARIANT_SX[variant],
      }}
    >
      {children}
    </Button>
  );
}
