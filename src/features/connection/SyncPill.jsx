import React, { useEffect, useState } from "react";
import { Cloud, AlertTriangle, WifiOff } from "lucide-react";
import { Led, SupabaseIcon } from "../../components";
import { ConnectionLed } from "./ConnectionLed";
import { fmtAgo } from "../../lib/format";

export function SyncPill({ sync, connected, realtimeStatus, online = true }) {
  const healthy = connected && online && sync.status !== "error" && sync.status !== "offline" && realtimeStatus !== "error";

  // The elapsed-time readout is derived from sync.lastSyncedAt at render
  // time, so it only moves when something else re-renders this component
  // — which is why it previously appeared to change only when a button
  // was clicked. This ticks once a second whenever there's a timestamp to
  // count from, regardless of the current status, so the readout advances
  // on its own.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!connected || !sync.lastSyncedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [connected, sync.lastSyncedAt]);

  if (!connected) {
    return (
      <span className="sync-pill">
        <ConnectionLed configured={false} healthy={false} />
        <span className="sync-pill-main text-faint">
          <SupabaseIcon size={15} /> Not connected
        </span>
      </span>
    );
  }

  const map = {
    loading: { icon: Cloud, cls: "text-dim", text: "Loading…" },
    saving: { icon: Cloud, cls: "text-accent", text: "Saving…" },
    synced: { icon: Cloud, cls: "text-ready", text: sync.lastSyncedAt ? `Synced ${fmtAgo(sync.lastSyncedAt)}` : "Synced" },
    offline: { icon: WifiOff, cls: "text-repair", text: "Offline" },
    error: { icon: AlertTriangle, cls: "text-repair", text: "Sync error" },
  };
  const m = map[sync.status] || map.synced;
  const Icon = m.icon;
  return (
    <span className={`sync-pill ${sync.status === "saving" ? "sync-saving" : ""}`}>
      <ConnectionLed configured={connected} healthy={healthy} />
      <span className={`sync-pill-main ${m.cls}`} title={sync.message || ""}>
        <Icon size={15} /> {m.text}
      </span>
      {sync.status !== "error" && sync.status !== "offline" && realtimeStatus && (
        <span
          className={`sync-pill-live ${realtimeStatus === "ok" ? "text-faint" : "text-repair"}`}
          title={realtimeStatus === "ok" ? "Live updates from teammates are working" : "Live updates aren't connecting — check that realtime is enabled for the drones table"}
        >
          <Led color={realtimeStatus === "ok" ? "var(--ready)" : "var(--repair)"} size="xs" glow={false} />
          LIVE
        </span>
      )}
    </span>
  );
}
