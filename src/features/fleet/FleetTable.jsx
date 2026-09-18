import React from "react";
import { ChevronRight } from "lucide-react";
import { computeStatus, progressOf, latestMessage, hasRepairFlags } from "../../domain/status";
import { StatusLabel, ProgressBar, HandlerTag, Led } from "../../components";
import { STATUS_META } from "../../app/statusMeta";
import { fmtDateTime } from "../../lib/format";

function DroneRow({ drone, onClick, onOpenHistory }) {
  const status = computeStatus(drone);
  const meta = STATUS_META[status];
  const { done, total } = progressOf(drone);
  const flagged = hasRepairFlags(drone);
  return (
    <tr onClick={onClick}>
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
          className="chevron-btn"
          title="View history"
          aria-label={`View history for ${drone.serial}`}
          onClick={(e) => { e.stopPropagation(); onOpenHistory(drone.id); }}
        >
          <ChevronRight size={16} />
        </button>
      </td>
    </tr>
  );
}

export function FleetTable({ drones, onSelect, onOpenHistory }) {
  if (!drones.length) {
    return <div className="empty-panel">No drones match here yet.</div>;
  }
  return (
    <div className="fleet-table-wrap">
      <table className="fleet-table">
        <thead>
          <tr>
            {["Serial", "Status", "Progress", "Handler", "Notes", "Updated", ""].map((h) => (
              <th key={h} className={h === "Updated" ? "align-right" : ""}>{h.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {drones.map((d) => (
            <DroneRow key={d.id} drone={d} onClick={() => onSelect(d.id)} onOpenHistory={onOpenHistory} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
