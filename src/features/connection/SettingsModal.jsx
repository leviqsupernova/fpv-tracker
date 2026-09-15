import React, { useState } from "react";
import Alert from "@mui/material/Alert";
import { ModalShell, Field, TextInput, Btn } from "../../components";
import { createSupabaseClient } from "../../data/supabase";
import { fetchDrones } from "../../data/droneRepository";

export function SettingsModal({ initial, onClose, onSave, onDisconnect }) {
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
    <ModalShell title="Connect to Supabase" onClose={onClose} width={480}>
      <div className="flex flex-col gap-4">
        <p className="text-dim text-sm leading-normal">
          One drone per row, in a Supabase table. Everyone who connects
          with these same two values is looking at the same fleet, live.
        </p>
        <Field label="Project URL">
          <TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://xxxxx.supabase.co" />
        </Field>
        <Field label="Anon public key">
          <TextInput value={anonKey} onChange={(e) => setAnonKey(e.target.value)} placeholder="eyJhbGciOi…" autoComplete="off" />
        </Field>
        <p className="text-faint" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          Both from Project Settings → API in your Supabase dashboard. The
          anon key is meant to be used client-side — access is controlled
          by the row-level-security policy from the setup SQL, not by
          hiding this key.
        </p>

        {testMsg && (
          <Alert
            severity={testState === "error" ? "error" : "success"}
            sx={{
              backgroundColor: testState === "error" ? "var(--repair-soft)" : "var(--ready-soft)",
              color: testState === "error" ? "var(--repair)" : "var(--ready)",
              border: "1px solid",
              borderColor: testState === "error" ? "rgba(255, 107, 107, 0.35)" : "rgba(126, 231, 135, 0.35)",
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
