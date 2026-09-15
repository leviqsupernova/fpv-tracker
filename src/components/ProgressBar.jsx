import React from "react";
import LinearProgress from "@mui/material/LinearProgress";

export function ProgressBar({ done, total, color }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          width: 84,
          height: 6,
          borderRadius: 0,
          backgroundColor: "var(--bg-elevated)",
          "& .MuiLinearProgress-bar": { backgroundColor: color || "var(--accent)", transition: "transform 0.3s" },
        }}
      />
      <span style={{ color: "var(--text-dim)", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
        {done}/{total}
      </span>
    </div>
  );
}
