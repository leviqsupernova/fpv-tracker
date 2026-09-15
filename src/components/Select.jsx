import React from "react";
import MuiSelect from "@mui/material/Select";

export function Select({ sx, size, children, ...props }) {
  const compact = size === "small";
  return (
    <MuiSelect
      variant="outlined"
      fullWidth
      size={size}
      {...props}
      sx={{
        backgroundColor: "var(--bg-elevated)",
        borderRadius: "4px",
        fontSize: compact ? 14 : 15,
        fontFamily: "inherit",
        color: "var(--text)",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border)" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border)" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-strong)", borderWidth: "1px" },
        "& .MuiSelect-select": { padding: compact ? "7px 12px" : "11px 14px" },
        ...sx,
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            "& .MuiMenuItem-root": { fontSize: compact ? 14 : 15, fontFamily: "inherit", color: "var(--text)" },
            "& .MuiMenuItem-root:hover": { backgroundColor: "var(--bg-hover)" },
            "& .MuiMenuItem-root.Mui-selected": { backgroundColor: "var(--accent-soft)" },
            "& .MuiMenuItem-root.Mui-selected:hover": { backgroundColor: "var(--accent-soft)" },
          },
        },
      }}
    >
      {children}
    </MuiSelect>
  );
}
