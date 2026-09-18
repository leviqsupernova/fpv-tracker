import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { computeStatus, progressOf, latestMessage, hasRepairFlags } from "../../domain/status";
import { StatusLabel, ProgressBar, HandlerTag, Led } from "../../components";
import { STATUS_META } from "../../app/statusMeta";
import { fmtDateTime } from "../../lib/format";
import { HistoryItem } from "../drone-detail/HistoryItem";

function HistoryRow({ drone, colSpan }) {
  const entries = [...drone.history].reverse();
  return (
    <tr className="history-row">
      <td colSpan={colSpan}>
        <div className="history-row-inner">
          <div className="section-label" style={{ marginBottom: 6 }}>HISTORY — {drone.serial}</div>
          {entries.length === 0 ? (
            <div className="section-empty">Nothing logged yet.</div>
          ) : (
            entries.map((h) => <HistoryItem key={h.id} item={h} />)
          )}
        </div>
      </td>
    </tr>
  );
}

function DroneRow({ drone, onClick, expanded, onToggleExpand }) {
  const status = computeStatus(drone);
  const meta = STATUS_META[status];
  const { done, total } = progressOf(drone);
  const flagged = hasRepairFlags(drone);
  return (
    <tr onClick={onClick} className={expanded ? "is-expanded" : ""}>
      <td className="cell-serial" data-label="Serial">
        {flagged && (
          <span className="cell-flag-led" title="Has steps flagged for repair">
            <Led color="var(--repair)" size="xs" glow={false} />
          </span>
        )}
        {drone.serial}
      </td>
      <td data-label="Status"><StatusLabel meta={meta} /></td>
      <td data-label="Progress"><ProgressBar done={done} total={total} color={meta.color} /></td>
      <td data-label="Handler"><HandlerTag name={drone.handler} /></td>
      <td className="cell-notes" data-label="Notes">{latestMessage(drone)}</td>
      <td className="cell-updated" data-label="Updated">{fmtDateTime(drone.updatedAt)}</td>
      <td className="cell-chevron">
        <button
          type="button"
          className={`chevron-btn ${expanded ? "is-open" : ""}`}
          title={expanded ? "Hide history" : "Show history"}
          aria-label={`${expanded ? "Hide" : "Show"} history for ${drone.serial}`}
          aria-expanded={expanded}
          /* Stops the click reaching the row, which would open the side
             panel — this control only expands the history below. */
          onClick={(e) => { e.stopPropagation(); onToggleExpand(drone.id); }}
        >
          <ChevronRight size={16} />
        </button>
      </td>
    </tr>
  );
}

export function FleetTable({ drones, onSelect }) {
  const [expandedId, setExpandedId] = useState(null);
  const toggleExpand = (id) => setExpandedId((cur) => (cur === id ? null : id));

  if (!drones.length) {
    return <div className="empty-panel">No drones match here yet.</div>;
  }
  const headers = ["Serial", "Status", "Progress", "Handler", "Notes", "Updated", ""];
  return (
    <div className="fleet-table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} className={h === "Updated" ? "align-right" : ""}>{h.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drones.map((d) => (
            <React.Fragment key={d.id}>
              <DroneRow
                drone={d}
                onClick={() => onSelect(d.id)}
                expanded={expandedId === d.id}
                onToggleExpand={toggleExpand}
              />
              {expandedId === d.id && <HistoryRow drone={d} colSpan={headers.length} />}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
