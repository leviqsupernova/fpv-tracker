import React, { useState, useEffect, useRef } from "react";
import MenuItem from "@mui/material/MenuItem";
import { Pencil, AlertTriangle, RotateCcw, Wrench, Trash2, Check, CheckCheck, FileCode2 } from "lucide-react";
import { Chip, Btn, HandlerTag, ProgressBar, Select, TextInput } from "../../components";
import { computeStatus, progressOf, nextStep } from "../../domain/status";
import { STATUS_META } from "../../app/statusMeta";
import { fmtDateTime } from "../../lib/format";
import { ChecklistList } from "./ChecklistList";
import { HistoryItem } from "./HistoryItem";

export function DroneDetail({ drone, onToggleStep, onToggleAllSteps, onToggleStepFlag, onToggleFault, onAddNote, onSetStatus, onSetHandler, onStartRepair, onFinishRepair, onDelete, onFaultyModule, onFinish, handlers, initialSection }) {
  const [noteText, setNoteText] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [editingHandler, setEditingHandler] = useState(false);
  const savedFlashTimer = useRef(null);
  const historyRef = useRef(null);
  const flashSaved = () => {
    setSavedFlash(true);
    if (savedFlashTimer.current) clearTimeout(savedFlashTimer.current);
    savedFlashTimer.current = setTimeout(() => setSavedFlash(false), 1400);
  };
  useEffect(() => () => clearTimeout(savedFlashTimer.current), []);
  // Opened via the fleet-table history button rather than the row
  // itself — jump straight to the history log instead of making
  // people scroll past the checklist to find it.
  useEffect(() => {
    if (initialSection === "history" && historyRef.current) {
      historyRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drone.id, initialSection]);
  const status = computeStatus(drone);
  const meta = STATUS_META[status];
  const { done, total } = progressOf(drone);
  const next = nextStep(drone);
  const nextIndex = next ? drone.checklistSteps.indexOf(next) : -1;
  const allChecked = total > 0 && done === total;

  return (
    <>
      <div className="detail-header">
        <div className="flex items-center justify-between" style={{ paddingRight: 44 }}>
          <div className="detail-serial">{drone.serial}</div>
          <span className="status-badge" style={{ "--badge-bg": meta.soft, "--badge-color": meta.color, "--badge-border": `${meta.color}55` }}>
            {meta.label.toUpperCase()}
          </span>
        </div>
        <div className="detail-meta-row">
          {editingHandler ? (
            <Select
              size="small"
              className="handler-select"
              value={drone.handler}
              autoFocus
              onChange={(e) => { onSetHandler(e.target.value); setEditingHandler(false); }}
              onClose={() => setEditingHandler(false)}
              onBlur={() => setEditingHandler(false)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {handlers.map((h) => <MenuItem key={h} value={h}>{h}</MenuItem>)}
            </Select>
          ) : (
            <span onClick={() => setEditingHandler(true)} className="handler-edit-trigger" title="Reassign">
              <HandlerTag name={drone.handler} />
              <Pencil size={11} className="handler-edit-icon" />
            </span>
          )}
          <span className="detail-meta-item">Unit {drone.unit}</span>
          <span className="detail-meta-item">· Updated {fmtDateTime(drone.updatedAt)}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <ProgressBar done={done} total={total} color={meta.color} />
        </div>
        <div className="detail-status-row">
          <Chip active={status === "NONE"} color="var(--none)" onClick={() => onSetStatus("NONE")}>New</Chip>
          <Chip active={status === "READY"} color="var(--ready)" onClick={() => onSetStatus("READY")}>Ready</Chip>
          <Chip active={status === "REPAIR"} color="var(--repair)" onClick={onStartRepair}>Repair</Chip>
        </div>
      </div>

      <div className="detail-body">
        <div className={`next-banner ${next ? "pending" : "complete"}`}>
          {next ? `Next: ${next}` : "Checklist complete."}
        </div>

        <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
          <span className="section-label">CHECKLIST</span>
          <Btn
            size="sm"
            variant="subtle"
            icon={CheckCheck}
            title="Shortcut: A"
            onClick={() => onToggleAllSteps(!allChecked)}
          >
            {allChecked ? "Uncheck all" : "Check all"}
          </Btn>
        </div>
        <ChecklistList drone={drone} onToggle={onToggleStep} onToggleFlag={onToggleStepFlag} highlightIndex={nextIndex} />

        <div className="section-block">
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span className="section-label">FAULTS</span>
            <Btn size="sm" variant="subtle" icon={AlertTriangle} onClick={onFaultyModule}>+ Faulty module</Btn>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {drone.faults.length === 0 && <span className="section-empty">None flagged.</span>}
            {drone.faults.map((tag) => (
              <Chip key={tag} active className="fault-chip" onRemove={() => onToggleFault(tag)}>{tag}</Chip>
            ))}
          </div>
        </div>

        <div className="section-block">
          <div className="section-label" style={{ marginBottom: 10 }}>FIRMWARE & CONFIG</div>
          <div className="firmware-list">
            <div className="firmware-row">
              <FileCode2 size={15} />
              <span className="firmware-name">No files attached yet</span>
              <span className="firmware-tag">Coming soon</span>
            </div>
          </div>
        </div>

        <div className="section-block">
          <div className="section-label" style={{ marginBottom: 10 }}>NOTE</div>
          <div className="note-input-wrap">
            <TextInput
              placeholder="What happened… saves automatically"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && noteText.trim()) { onAddNote(noteText.trim()); setNoteText(""); flashSaved(); } }}
              onBlur={() => { if (noteText.trim()) { onAddNote(noteText.trim()); setNoteText(""); flashSaved(); } }}
            />
            {savedFlash && <span className="note-saved-flash">Saved</span>}
          </div>
        </div>

        <div className="action-row">
          {status === "REPAIR" ? (
            <Btn variant="primary" icon={RotateCcw} onClick={onFinishRepair}>Finish repair</Btn>
          ) : (
            <Btn variant="danger" icon={Wrench} onClick={onStartRepair}>Mark for repair</Btn>
          )}
          <Btn variant="ghost" icon={Trash2} onClick={onDelete}>Delete</Btn>
        </div>

        <div className="history-block" ref={historyRef}>
          <div className="section-label" style={{ marginBottom: 4 }}>HISTORY</div>
          {drone.history.length === 0 && <div className="section-empty">Nothing logged yet.</div>}
          {[...drone.history].reverse().map((h) => <HistoryItem key={h.id} item={h} />)}
        </div>

        <Btn variant="primary" className="finish-btn" icon={Check} onClick={onFinish}>Finish</Btn>
      </div>
    </>
  );
}
