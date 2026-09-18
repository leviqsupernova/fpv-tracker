import React from "react";
import { Led } from "./Led";

export function StatusLabel({ meta }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Led color={meta.color} />
      <span style={{ color: "var(--text)", fontWeight: 500, fontSize: 15, textTransform: "uppercase", letterSpacing: "0.02em" }}>{meta.label}</span>
    </span>
  );
}
