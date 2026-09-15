import React, { useState, useMemo } from "react";
import MenuItem from "@mui/material/MenuItem";
import { ModalShell, Chip, Field, TextInput, Select, Btn, HandlerTag, handlerColor } from "../../components";
import { buildSerial, padUnit, expandRange, assignUnits, groupContiguousByHandler } from "../../domain/serial";
import { TEMPLATES, DEFAULT_TEMPLATE } from "../../domain/checklistTemplates";
import { uid } from "../../lib/id";

export function AddDroneModal({ onClose, onCreateSingle, onCreateBatch, existingSerials, handlers }) {
  const [tab, setTab] = useState("single");

  const [prefix, setPrefix] = useState("CHUMAK13-F012");
  const [unit, setUnit] = useState("");
  const [handler, setHandler] = useState(handlers[0] || "");
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const serial = buildSerial(prefix, unit);
  const isDup = serial && existingSerials.has(serial);

  const [bPrefix, setBPrefix] = useState("CHUMAK13-F012");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [bTemplate, setBTemplate] = useState(DEFAULT_TEMPLATE);
  const [assignMode, setAssignMode] = useState("split");
  const [singleHandler, setSingleHandler] = useState(handlers[0] || "");
  const [splitHandlers, setSplitHandlers] = useState([]);

  const s = parseInt(start, 10);
  const e = parseInt(end, 10);
  const units = useMemo(() => expandRange(s, e), [s, e]);
  const validRange = units.length > 0;
  const count = units.length;
  const dupeCount = units.filter((u) => existingSerials.has(buildSerial(bPrefix, u))).length;

  const toggleSplit = (h) => setSplitHandlers((arr) => (arr.includes(h) ? arr.filter((x) => x !== h) : [...arr, h]));

  const assignments = useMemo(() => {
    if (!validRange) return [];
    return assignUnits(units, assignMode, { singleHandler, splitHandlers });
  }, [validRange, units, assignMode, singleHandler, splitHandlers]);

  const rangesByHandler = useMemo(() => groupContiguousByHandler(assignments), [assignments]);

  const submitBatch = () => {
    const steps = TEMPLATES[bTemplate];
    const now = new Date().toISOString();
    const drones = assignments.map(({ unit, handler }) => {
      const checklist = {};
      steps.forEach((st) => (checklist[st] = false));
      return {
        id: uid("drone"), serial: buildSerial(bPrefix, unit), prefix: bPrefix, unit, handler,
        checklistSteps: steps, checklist, faults: [], status: null,
        history: [], repairFlags: {},
        createdAt: now, updatedAt: now,
      };
    });
    onCreateBatch(drones);
    onClose();
  };

  return (
    <ModalShell title="Add drones" onClose={onClose} width={520}>
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        <Chip active={tab === "single"} onClick={() => setTab("single")}>Single</Chip>
        <Chip active={tab === "batch"} onClick={() => setTab("batch")}>Batch reserve</Chip>
      </div>

      {tab === "single" ? (
        <div className="flex flex-col gap-4">
          <Field label="Prefix">
            <TextInput value={prefix} onChange={(e) => setPrefix(e.target.value)} />
          </Field>
          <Field label="Unit #">
            <TextInput value={unit} onChange={(e) => setUnit(e.target.value.replace(/[^0-9]/g, ""))} placeholder="454" />
          </Field>
          <div className="text-dim text-md">
            {serial || "—"}
            {isDup && <span className="dup-warning">already exists</span>}
          </div>
          <Field label="Handler">
            <Select value={handler} onChange={(e) => setHandler(e.target.value)}>
              {handlers.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
            </Select>
          </Field>
          <Field label="Checklist template">
            <Select value={template} onChange={(e) => setTemplate(e.target.value)}>
              {Object.keys(TEMPLATES).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2.5" style={{ marginTop: 6 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn
              variant="primary"
              disabled={!prefix || !unit || isDup}
              onClick={() => { onCreateSingle({ prefix, unit: Number(unit), serial, handler, template }); onClose(); }}
            >
              Create
            </Btn>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Prefix">
            <TextInput value={bPrefix} onChange={(e) => setBPrefix(e.target.value)} />
          </Field>
          <div className="flex gap-3">
            <Field label="From unit">
              <TextInput value={start} onChange={(e) => setStart(e.target.value.replace(/[^0-9]/g, ""))} placeholder="450" />
            </Field>
            <Field label="To unit">
              <TextInput value={end} onChange={(e) => setEnd(e.target.value.replace(/[^0-9]/g, ""))} placeholder="600" />
            </Field>
          </div>
          {validRange && (
            <div className="text-dim text-sm">
              {count} drone{count === 1 ? "" : "s"}, {buildSerial(bPrefix, s)} – {buildSerial(bPrefix, e)}
              {dupeCount > 0 && <span className="dup-warning">{dupeCount} already exist</span>}
            </div>
          )}
          <Field label="Checklist template">
            <Select value={bTemplate} onChange={(e) => setBTemplate(e.target.value)}>
              {Object.keys(TEMPLATES).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </Field>
          <Field label="Assignment" group>
            <div className="flex gap-1.5 flex-wrap">
              <Chip active={assignMode === "split"} onClick={() => setAssignMode("split")}>Split among people</Chip>
              <Chip active={assignMode === "single"} onClick={() => setAssignMode("single")}>One handler</Chip>
              <Chip active={assignMode === "none"} onClick={() => setAssignMode("none")}>Unassigned</Chip>
            </div>
          </Field>

          {assignMode === "single" && (
            <Field label="Handler">
              <Select value={singleHandler} onChange={(e) => setSingleHandler(e.target.value)}>
                {handlers.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
              </Select>
            </Field>
          )}

          {assignMode === "split" && (
            <Field label="Who's splitting this range" group>
              <div className="flex gap-1.5 flex-wrap">
                {handlers.map((h) => (
                  <Chip key={h} active={splitHandlers.includes(h)} color={handlerColor(h)} onClick={() => toggleSplit(h)}>
                    {h}{splitHandlers.includes(h) ? ` #${splitHandlers.indexOf(h) + 1}` : ""}
                  </Chip>
                ))}
              </div>
            </Field>
          )}

          {validRange && rangesByHandler.length > 0 && (
            <div className="range-box flex flex-col gap-1.5">
              {rangesByHandler.map((r, i) => (
                <div key={i} className="flex items-center justify-between" style={{ fontSize: 14 }}>
                  <span className="text-dim">{padUnit(r.start)}–{padUnit(r.end)}</span>
                  <HandlerTag name={r.handler} />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2.5" style={{ marginTop: 6 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" disabled={!validRange || dupeCount === count} onClick={submitBatch}>
              Reserve {count || ""} drone{count === 1 ? "" : "s"}
            </Btn>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
