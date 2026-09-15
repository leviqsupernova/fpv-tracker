import React from "react";
import { Led } from "../../components";
import { fmtDateTime } from "../../lib/format";

const HISTORY_TYPE_LABEL = {
  created: "Created", update: "Update", status: "Status",
  repair_start: "Repair", repair_end: "Repair complete", note: "Note", fault: "Fault",
};

export function HistoryItem({ item }) {
  const dotColor =
    item.type === "repair_start" ? "var(--repair)"
    : item.type === "status" || item.type === "repair_end" ? "var(--ready)"
    : "var(--text-faint)";
  return (
    <div className="history-item">
      <div className="history-dot-col"><Led color={dotColor} size="sm" glow={false} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="history-meta">
          <span className="history-person">{item.person}</span>
          <span className="history-sep">·</span>
          <span className="history-date">{fmtDateTime(item.date)}</span>
          <span className="history-sep">·</span>
          <span className="history-type">{HISTORY_TYPE_LABEL[item.type] || item.type}</span>
        </div>
        <div className="history-message">{item.message}</div>
      </div>
    </div>
  );
}
