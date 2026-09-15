import React, { useState } from "react";
import Alert from "@mui/material/Alert";
import { ModalShell, Field, TextInput, Btn, SupabaseIcon } from "../../components";
import { createSupabaseClient } from "../../data/supabase";
import { fetchDrones } from "../../data/droneRepository";

export function ConnectModal({ initial, onClose, onSave, onDisconnect }) {
  const [url, setUrl] = useState(initial?.url || "");
  const [anonKey, setAnonKey] = useState(initial?.anonKey || "");
  const [testState, setTestState] = useState(null);
  const [testMsg, setTestMsg] = useState("");

  const cfg = { url: url.trim(), anonKey: anonKey.trim() };
  const complete = cfg.url && cfg.anonKey;

  const test = async () => {
    setTestState("testing");
    setTestMsg("");
    try {
      const client = createSupabaseClient(cfg);
      const data = await fetchDrones(client);
      setTestState("ok");
      setTestMsg(`Connected — ${data?.length ?? 0} drones in the table.`);
    } catch (e) {
      setTestState("error");
      setTestMsg(e.message || "Couldn't connect. Check the URL/key and that the SQL setup ran.");
    }
  };

  return (
    <ModalShell title="Connect to Supabase" icon={SupabaseIcon} onClose={onClose} width={480}>
      <div className="flex flex-col gap-4">
        <Field label="Project URL">
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co" />
        </Field>
        <Field label="Anon public key" hint="Safe to expose client-side — access is governed by the table's row-level security policy, not by keeping this secret.">
          <TextInput value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="eyJhbGciOi…" autoComplete="off" />
        </Field>

        {testMsg && (
          <Alert
            severity={testState === "error" ? "error" : "success"}
            sx={{
              backgroundColor: testState === "error" ? "var(--repair-soft)" : "var(--ready-soft)",
              color: testState === "error" ? "var(--repair)" : "var(--ready)",
              border: "1px solid",
              borderColor: testState === "error" ? "var(--repair-border)" : "var(--ready-border)",
              borderRadius: "4px",
              fontSize: 13.5,
              "& .MuiAlert-icon": { color: "inherit" },
            }}
          >
            {testMsg}
          </Alert>
        )}

        <div className="flex justify-between gap-2" style={{ marginTop: 4 }}>
          <Btn variant="ghost" onClick={test} disabled={!complete || testState === "testing"}>
            {testState === "testing" ? "Testing…" : "Test connection"}
          </Btn>
          <div className="flex gap-2.5">
            {initial && onDisconnect && (
              <Btn variant="danger" onClick={() => { onDisconnect(); onClose(); }}>Disconnect</Btn>
            )}
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" disabled={!complete} onClick={() => { onSave(cfg); onClose(); }}>Save & connect</Btn>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
