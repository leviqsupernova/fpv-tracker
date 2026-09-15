import React from "react";
import TextField from "@mui/material/TextField";

export function TextInput({ sx, size, ...props }) {
  const compact = size === "small";
  return (
    <TextField
      variant="outlined"
      fullWidth
      size={size}
      {...props}
      sx={{
        "& .MuiOutlinedInput-root": {
          backgroundColor: "var(--bg-elevated)",
          borderRadius: "4px",
          fontSize: compact ? 14 : 15,
          fontFamily: "inherit",
          color: "var(--text)",
          "& fieldset": { borderColor: "var(--border)" },
          "&:hover fieldset": { borderColor: "var(--border)" },
          "&.Mui-focused fieldset": { borderColor: "var(--border-strong)", borderWidth: "1px" },
        },
        "& .MuiOutlinedInput-input": { padding: compact ? "7px 12px" : "11px 14px" },
        "& .MuiInputBase-input::placeholder": { color: "var(--text-faint)", opacity: 1 },
        ...sx,
      }}
    />
  );
}
