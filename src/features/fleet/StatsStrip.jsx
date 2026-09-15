import React from "react";
import { computeStatus } from "../../domain/status";
import { Led } from "../../components";
import { STATUS_META } from "../../app/statusMeta";

export function StatsStrip({ drones }) {
  const counts = { NONE: 0, REPAIR: 0, READY: 0 };
  drones.forEach((d) => counts[computeStatus(d)]++);

  const cells = [
    { label: "Total", value: drones.length, color: "var(--accent)" },
    { label: "New", value: counts.NONE, color: STATUS_META.NONE.color },
    { label: "Repair", value: counts.REPAIR, color: STATUS_META.REPAIR.color },
    { label: "Ready", value: counts.READY, color: STATUS_META.READY.color },
  ];

  return (
    <div className="stats-strip">
      {cells.map((c) => (
        <div key={c.label} className="stats-cell">
          <div className="stats-value-row">
            <Led color={c.color} size="sm" />
            <span className="stats-value">{c.value}</span>
          </div>
          <div className="stats-label">{c.label.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}
