import React from "react";
import { ChevronRight } from "lucide-react";
import { computeStatus, progressOf, latestMessage, hasRepairFlags } from "../../domain/status";
import { StatusLabel, ProgressBar, HandlerTag, Led } from "../../components";
import { STATUS_META } from "../../app/statusMeta";
import { fmtDateTime } from "../../lib/format";

function DroneRow({ drone, onClick }) {
  const status = computeStatus(drone);
  const meta = STATUS_META[status];
  const { done, total } = progressOf(drone);
  const flagged = hasRepairFlags(drone);
  return (
    <tr onClick={onClick}>
      <td className="cell-serial">
        {flagged && (
          <span className="cell-flag-led" title="Has steps flagged for repair">
            <Led color="var(--repair)" size="xs" glow={false} />
          </span>
        )}
        {drone.serial}
      </td>
      <td><StatusLabel meta={meta} /></td>
      <td><ProgressBar done={done} total={total} color={meta.color} /></td>
      <td><HandlerTag name={drone.handler} /></td>
      <td className="cell-notes">{latestMessage(drone)}</td>
      <td className="cell-updated">{fmtDateTime(drone.updatedAt)}</td>
      <td className="cell-chevron"><ChevronRight size={17} /></td>
    </tr>
  );
}

export function FleetTable({ drones, onSelect }) {
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
          {drones.map((d) => <DroneRow key={d.id} drone={d} onClick={() => onSelect(d.id)} />)}
        </tbody>
      </table>
    </div>
  );
}
