import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import { ModalShell, Field, Chip, Btn } from "../../components";
import { parseWorkbookToDrones } from "./xlsxTransfer";

export function ImportModal({ onClose, onImport }) {
  const [fileName, setFileName] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [mode, setMode] = useState("merge");
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    setFileName(file.name);
    setError(null);
    setParsed(null);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const drones = parseWorkbookToDrones(wb);
      if (!drones.length) { setError("No recognizable fleet rows found (need a Status column)."); return; }
      setParsed(drones);
    } catch (e) {
      setError("Couldn't read that file. Is it a valid .xlsx?");
    }
  };

  return (
    <ModalShell title="Import spreadsheet" onClose={onClose} width={480}>
      <div className="flex flex-col gap-4">
        <div onClick={() => inputRef.current.click()} className="import-dropzone">
          <Upload size={20} className="import-dropzone-icon" />
          {fileName || "Click to choose a .xlsx file"}
          <input
            ref={inputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </div>

        {error && <p className="text-repair" style={{ fontSize: 14 }}>{error}</p>}

        {parsed && (
          <>
            <p className="text-main text-md">Found <b>{parsed.length}</b> drones across the workbook's sheets.</p>
            <Field label="Import mode" group>
              <div className="flex gap-1.5">
                <Chip active={mode === "merge"} onClick={() => setMode("merge")}>Merge</Chip>
                <Chip active={mode === "replace"} onClick={() => setMode("replace")}>Replace fleet</Chip>
              </div>
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2.5" style={{ marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" disabled={!parsed} onClick={() => { onImport(parsed, mode); onClose(); }}>
            Import {parsed ? parsed.length : ""} drones
          </Btn>
        </div>
      </div>
    </ModalShell>
  );
}
