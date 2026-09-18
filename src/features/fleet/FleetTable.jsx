import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { computeStatus, progressOf, latestMessage, hasRepairFlags } from "../../domain/status";
import { StatusLabel, ProgressBar, HandlerTag, Led } from "../../components";
import { STATUS_META } from "../../app/statusMeta";
import { fmtDateTime } from "../../lib/format";
import { HistoryItem } from "../drone-detail/HistoryItem";

/** The history log the chevron reveals: its own panel, rendered in a
 *  row directly beneath the entry it belongs to. Nothing here opens the
 *  side panel. */
function HistoryPanelRow({ drone, colSpan }) {
  const entries = [...drone.history].reverse();
  return (
    <tr className="history-row">
      <td colSpan={colSpan}>
        <div className="history-panel">
          <div className="history-panel-head">HISTORY — {drone.serial}</div>
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

function DroneRow({ drone, onOpen, expanded, onToggleExpand }) {
  const status = computeStatus(drone);
  const meta = STATUS_META[status];
  const { done, total } = progressOf(drone);
  const flagged = hasRepairFlags(drone);

  // The open-side-panel handler lives on the individual data cells, NOT
  // on the <tr>. With no ancestor click handler above it, the chevron
  // button cannot reach one by bubbling — it is structurally incapable
  // of opening the side panel, rather than merely calling
  // stopPropagation and hoping.
  const open = { onClick: () => onOpen(drone.id), className: "cell-open" };

  return (
    <tr className={expanded ? "is-expanded" : ""}>
      <td {...open} className="cell-open cell-serial" data-label="Serial">
        {flagged && (
          <span className="cell-flag-led" title="Has steps flagged for repair">
            <Led color="var(--repair)" size="xs" glow={false} />
          </span>
        )}
        {drone.serial}
      </td>
      <td {...open} data-label="Status"><StatusLabel meta={meta} /></td>
      <td {...open} data-label="Progress"><ProgressBar done={done} total={total} color={meta.color} /></td>
      <td {...open} data-label="Handler"><HandlerTag name={drone.handler} /></td>
      <td {...open} className="cell-open cell-notes" data-label="Notes">{latestMessage(drone)}</td>
      <td {...open} className="cell-open cell-updated" data-label="Updated">{fmtDateTime(drone.updatedAt)}</td>
      <td className="cell-chevron">
        <button
          type="button"
          className={`chevron-btn ${expanded ? "is-open" : ""}`}
          title={expanded ? "Hide history" : "Show history"}
          aria-label={`${expanded ? "Hide" : "Show"} history for ${drone.serial}`}
          aria-expanded={expanded}
          onClick={() => onToggleExpand(drone.id)}
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
                onOpen={onSelect}
                expanded={expandedId === d.id}
                onToggleExpand={toggleExpand}
              />
              {expandedId === d.id && <HistoryPanelRow drone={d} colSpan={headers.length} />}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
