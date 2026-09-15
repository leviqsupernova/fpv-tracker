import * as XLSX from "xlsx";
import { uid } from "../../lib/id";
import { fmtDateFull } from "../../lib/format";
import { computeStatus, latestMessage, STATUS_LABELS } from "../../domain/status";

function normHeader(h) {
  return String(h == null ? "" : h).trim();
}

export function parseWorkbookToDrones(wb) {
  const allRows = [];
  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
    if (!rows.length) return;
    const header = rows[0].map(normHeader);
    const statusIdx = header.findIndex((h) => h.toLowerCase() === "status");
    if (statusIdx < 5) return;
    const checklistHeaders = header.slice(5, statusIdx);
    const faultsIdx = header.findIndex((h) => h.toLowerCase().includes("fault"));
    const notesIdx = header.findIndex((h) => h.toLowerCase().includes("note"));
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.every((c) => c === "" || c == null)) continue;
      const dateVal = row[0];
      const name = normHeader(row[1]);
      const prefix = normHeader(row[2]);
      const unit = row[3] === "" ? "" : row[3];
      const serialFull = normHeader(row[4]);
      if (!serialFull && !prefix && unit === "") continue;
      const checklist = {};
      checklistHeaders.forEach((h, i) => {
        const v = row[5 + i];
        checklist[h] = v === true || v === "TRUE" || v === 1 || v === "1";
      });
      const status = normHeader(row[statusIdx]);
      const faults =
        faultsIdx >= 0
          ? String(row[faultsIdx] || "").split(",").map((s) => s.trim()).filter(Boolean)
          : [];
      const note = notesIdx >= 0 ? String(row[notesIdx] || "").trim() : "";
      let dateIso = null;
      if (dateVal instanceof Date && !isNaN(dateVal)) dateIso = dateVal.toISOString();
      allRows.push({
        sheet: sheetName, date: dateIso, name, prefix, unit, serialFull,
        checklist, checklistSteps: checklistHeaders, status, faults, note,
        order: allRows.length,
      });
    }
  });

  const groups = new Map();
  allRows.forEach((row) => {
    const key = row.serialFull || `${row.prefix}-${row.unit}`;
    if (!key) return;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  const drones = [];
  groups.forEach((rows, serial) => {
    rows.sort((a, b) => {
      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.order - b.order;
    });
    const first = rows[0];
    const last = rows[rows.length - 1];
    const history = rows.map((row, i) => {
      const statusNorm = row.status.toLowerCase();
      let type = "update";
      if (i === 0) type = "created";
      else if (statusNorm === "repair") type = "repair_start";
      else if (statusNorm === "ready") type = "status";
      let message = row.note;
      if (!message) {
        const doneCount = row.checklistSteps.filter((s) => row.checklist[s]).length;
        if (statusNorm === "ready") message = "Marked ready.";
        else if (statusNorm === "repair") message = "Sent to repair.";
        else message = `Checklist updated (${doneCount}/${row.checklistSteps.length}).`;
      }
      return {
        id: uid("hist"),
        date: row.date || first.date || new Date().toISOString(),
        person: row.name || "Unknown",
        type,
        message,
      };
    });
    drones.push({
      id: uid("drone"),
      serial,
      prefix: last.prefix || first.prefix,
      unit: last.unit !== "" ? last.unit : first.unit,
      handler: last.name || first.name || "",
      checklistSteps: last.checklistSteps,
      checklist: last.checklist,
      faults: last.faults,
      status: String(last.status).trim().toLowerCase() === "repair" ? "REPAIR"
        : String(last.status).trim().toLowerCase() === "ready" ? "READY" : null,
      history,
      repairFlags: {},
      createdAt: first.date || new Date().toISOString(),
      updatedAt: last.date || new Date().toISOString(),
    });
  });

  return drones;
}

export function exportWorkbook(drones) {
  const allSteps = Array.from(new Set(drones.flatMap((d) => d.checklistSteps)));
  const fleetHeader = [
    "Serial", "Prefix", "Unit #", "Handler", "Status",
    ...allSteps, "Faults", "Latest Note", "Created", "Updated",
  ];
  const fleetRows = drones.map((d) => {
    const status = STATUS_LABELS[computeStatus(d)];
    const stepVals = allSteps.map((s) =>
      d.checklistSteps.includes(s) ? (d.checklist[s] ? "TRUE" : "FALSE") : ""
    );
    return [
      d.serial, d.prefix, d.unit, d.handler, status,
      ...stepVals, d.faults.join(", "), latestMessage(d),
      fmtDateFull(d.createdAt), fmtDateFull(d.updatedAt),
    ];
  });
  const historyHeader = ["Serial", "Date", "Person", "Type", "Message"];
  const historyRows = [];
  drones.forEach((d) =>
    d.history.forEach((h) =>
      historyRows.push([d.serial, fmtDateFull(h.date), h.person, h.type, h.message])
    )
  );

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet([fleetHeader, ...fleetRows]);
  const ws2 = XLSX.utils.aoa_to_sheet([historyHeader, ...historyRows]);
  XLSX.utils.book_append_sheet(wb, ws1, "Fleet");
  XLSX.utils.book_append_sheet(wb, ws2, "History");
  XLSX.writeFile(wb, `fpv-tracker-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
