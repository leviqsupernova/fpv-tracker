import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRow } from "./droneRepository";
import type { ReconcileEvent } from "../domain/reconcile";

export type RealtimeStatus = null | "ok" | "error";

/** Subscribes to every INSERT/UPDATE/DELETE on the drones table, from
 *  anyone. Its status is tracked separately from read/write health —
 *  if live updates aren't working but the database itself is fine,
 *  that's not the same failure and shouldn't be reported as one.
 *
 *  Subscribed whenever `client` is non-null — there's no separate
 *  "enabled" condition here, so the caller doesn't need to pass one. */
export function useRealtimeDrones(
  client: SupabaseClient | null,
  onEvent: (event: ReconcileEvent) => void
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!client) {
      setStatus(null);
      return;
    }
    // A client identity change means we're (re)subscribing to a
    // different project — the previous status ("ok"/"error") is
    // stale until the new subscription reports in.
    setStatus(null);
    const channel = client
      .channel("drones-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "drones" }, (payload: any) => {
        try {
          const event: ReconcileEvent =
            payload.eventType === "DELETE"
              ? { type: "delete", id: payload.old.id }
              : { type: payload.eventType === "INSERT" ? "insert" : "update", drone: fromRow(payload.new) };
          onEventRef.current(event);
        } catch (e) {
          // malformed payload — ignore rather than crash the app
        }
      })
      .subscribe((subStatus: string) => {
        if (subStatus === "SUBSCRIBED") setStatus("ok");
        else if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT") setStatus("error");
      });
    return () => {
      client.removeChannel(channel);
    };
  }, [client]);

  return status;
}
