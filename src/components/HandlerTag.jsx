import React from "react";
import { Led } from "./Led";

export const HANDLER_PALETTE = ["#7AA2F7", "#6EE7A8", "#C58BFF", "#FF9E7A", "#6EE7D8", "#F2CB61", "#FF8BC4", "#9AD16B"];

export function handlerColor(name) {
  if (!name) return "#8A8D97";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return HANDLER_PALETTE[hash % HANDLER_PALETTE.length];
}

export function HandlerTag({ name }) {
  if (!name) return <span style={{ color: "var(--text-faint)" }}>—</span>;
  const c = handlerColor(name);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Led color={c} size="sm" />
      <span style={{ color: "var(--text-dim)", fontSize: 14.5, textTransform: "uppercase", letterSpacing: "0.02em" }}>{name}</span>
    </span>
  );
}
