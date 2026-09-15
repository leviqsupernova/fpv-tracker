import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchDrones, fetchDronesByIds, upsertDrone, upsertDrones,
  deleteDrone as deleteDroneRow, deleteDrones, deleteAllDrones,
} from "./droneRepository";
import { useRealtimeDrones } from "./useRealtimeDrones";
import { reconcileDrones, isNewer } from "../domain/reconcile";
import {
  queueDrone, queueDrones, queueDelete, dequeueIfUnchanged,
  getQueueEntries, getQueueSize,
} from "./offlineQueue";
import type { QueueEntry } from "./offlineQueue";
import { useOnlineStatus } from "../lib/useOnlineStatus";
import type { Drone } from "../domain/drone";

const SAVE_DEBOUNCE_MS = 700;
const STORAGE_FAIL_MESSAGE = "Couldn't save that change locally — this browser's storage is full or unavailable. It'll be lost if you leave this page before reconnecting.";

export type SyncStatus = "unconfigured" | "loading" | "saving" | "synced" | "offline" | "error";
export interface SyncState {
  status: SyncStatus;
  message: string;
  lastSyncedAt: string | null;
}

export function useDrones(client: SupabaseClient | null, queryKey: readonly unknown[]) {
  const queryClient = useQueryClient();
  const online = useOnlineStatus();
  const onlineRef = useRef(online);
  onlineRef.current = online;

  // Scopes the offline queue to this specific project (see
  // offlineQueue.ts) — reusing queryKey's own identity means it stays
  // correct without a second source of truth for "which project".
  const projectKey = useMemo(() => JSON.stringify(queryKey), [queryKey]);
  const projectKeyRef = useRef(projectKey);
  projectKeyRef.current = projectKey;

  const query = useQuery({
    queryKey,
    queryFn: () => fetchDrones(client as SupabaseClient),
    enabled: !!client,
    // Realtime keeps this fresh; a background refetch racing a local
    // optimistic edit is exactly the "checkbox un-checks itself" bug
    // the reconcile rule exists to prevent, so this cache never goes
    // stale on its own — only writes and realtime events touch it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // The original's connect() made a single fetch attempt and went
    // straight to an error state on failure. The QueryClient default
    // (retry: 1) would keep this in "loading" for a second attempt
    // first — same eventual state, different timing. Match the
    // original here rather than inherit the app-wide default.
    retry: false,
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState<number>(() => getQueueSize(projectKey));
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showNotice = useCallback((text: string) => {
    setOfflineNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setOfflineNotice(null), 5000);
  }, []);
  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  /** A `client` identity change means we're now talking to a different
   *  project (or none). Any error/sync timestamp from the old
   *  connection is stale and would otherwise leak into the new one
   *  (e.g. a "Sync error" banner surviving a Disconnect). Any pending
   *  per-drone save timers were scheduled against the old client and
   *  must not fire against a different one — that would silently
   *  write one project's edit into another project's table. */
  useEffect(() => {
    setSaveError(null);
    setLastSyncedAt(null);
    setQueuedCount(getQueueSize(projectKey));
    return () => {
      Object.values(pendingTimers.current).forEach(clearTimeout);
      pendingTimers.current = {};
    };
  }, [client, projectKey]);

  /** The original's connect() set lastSyncedAt right after the initial
   *  fetch resolved. `client` is a dependency as well as isSuccess:
   *  the effect above blanks lastSyncedAt on every client change, and
   *  a client can change while isSuccess stays true (a warm cache
   *  under staleTime: Infinity), which would otherwise leave the
   *  timestamp blank until the next write. Local optimistic edits
   *  change neither dependency, so they don't fake a sync time. */
  useEffect(() => {
    if (query.isSuccess) setLastSyncedAt(new Date().toISOString());
  }, [client, query.isSuccess]);

  // A stale error from before the connection dropped shouldn't linger
  // once we know *why* writes are failing — offline explains it better.
  // (A fresh error raised *while* offline — e.g. local storage full —
  // still surfaces normally; see the `sync` memo below.)
  const prevOnline = useRef(online);
  useEffect(() => {
    if (prevOnline.current && !online) {
      setSaveError(null);
      showNotice("You're offline — changes are being saved locally until you're back.");
    }
    prevOnline.current = online;
  }, [online, showNotice]);

  const setDrones = useCallback(
    (updater: Drone[] | ((prev: Drone[]) => Drone[])) =>
      queryClient.setQueryData<Drone[]>(queryKey, (prev = []) =>
        typeof updater === "function" ? (updater as (p: Drone[]) => Drone[])(prev) : updater
      ),
    [queryClient, queryKey]
  );

  const realtimeStatus = useRealtimeDrones(client, (event) => {
    setDrones((prev) => reconcileDrones(prev, event));
  });

  /** Whatever's queued from a previous offline stretch (this session
   *  or the last one — the queue lives in localStorage) gets replayed
   *  as soon as there's both a client and a connection. Safe to call
   *  whenever either changes; it's a no-op on an empty queue.
   *
   *  Upserts are checked against the server's current copy first —
   *  isNewer() is the same rule the realtime reconciler already uses,
   *  so a teammate's newer edit made while we were offline wins rather
   *  than being silently overwritten by our stale local one. Anything
   *  queued *during* this flush (another offline edit slipping in
   *  concurrently) is left alone rather than swept up in the same
   *  clear — see dequeueIfUnchanged. */
  const flushQueue = useCallback(async () => {
    if (!client || !onlineRef.current) return;
    const key = projectKeyRef.current;
    const entries = getQueueEntries(key);
    if (!entries.length) return;

    setIsSaving(true);
    try {
      const deletes = entries.filter((e): e is Extract<QueueEntry, { op: "delete" }> => e.op === "delete");
      const upserts = entries.filter((e): e is Extract<QueueEntry, { op: "upsert" }> => e.op === "upsert");

      if (deletes.length) {
        await deleteDrones(client, deletes.map((e) => e.id));
        deletes.forEach((e) => dequeueIfUnchanged(key, e.id, e));
      }

      let skipped = 0;
      if (upserts.length) {
        const serverRows = await fetchDronesByIds(client, upserts.map((e) => e.drone.id));
        const serverById = new Map(serverRows.map((d) => [d.id, d]));
        const toSend: Drone[] = [];
        upserts.forEach((e) => {
          const serverDrone = serverById.get(e.drone.id);
          if (!serverDrone || isNewer(e.drone, serverDrone)) {
            toSend.push(e.drone);
          } else {
            skipped++;
          }
          // Resolved either way — sent, or intentionally superseded by
          // a newer server row — so this entry comes off the queue.
          dequeueIfUnchanged(key, e.drone.id, e);
        });
        if (toSend.length) await upsertDrones(client, toSend);
      }

      setQueuedCount(getQueueSize(key));
      setLastSyncedAt(new Date().toISOString());
      const total = deletes.length + upserts.length;
      const parts = [`synced ${total} offline change${total === 1 ? "" : "s"}`];
      if (skipped) parts.push(`${skipped} ${skipped === 1 ? "was" : "were"} overwritten by a newer online edit and discarded`);
      showNotice(`Back online — ${parts.join("; ")}.`);
    } catch (e: any) {
      // Leave whatever's left in the queue intact; it retries on the
      // next reconnect or the next write that touches one of these drones.
      setSaveError(e?.message || String(e));
    } finally {
      setIsSaving(false);
    }
  }, [client, showNotice]);

  useEffect(() => {
    flushQueue();
  }, [client, online, flushQueue]);

  /** Single-row debounced save, keyed by drone id so unrelated drones
   *  never block or race each other. Offline at the moment the timer
   *  fires, the drone is cached to localStorage instead of attempted
   *  over the network — flushQueue() replays it once back online. */
  const commitDrone = useCallback(
    (id: string, fn: (d: Drone) => Drone) => {
      setDrones((prev) => prev.map((d) => (d.id === id ? { ...fn(d), updatedAt: new Date().toISOString() } : d)));
      if (pendingTimers.current[id]) clearTimeout(pendingTimers.current[id]);
      pendingTimers.current[id] = setTimeout(async () => {
        delete pendingTimers.current[id];
        if (!client) return;
        const current = queryClient.getQueryData<Drone[]>(queryKey) || [];
        const drone = current.find((d) => d.id === id);
        if (!drone) return;
        const key = projectKeyRef.current;
        if (!onlineRef.current) {
          const ok = queueDrone(key, drone);
          setQueuedCount(getQueueSize(key));
          if (!ok) setSaveError(STORAGE_FAIL_MESSAGE);
          return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
          await upsertDrone(client, drone);
          setLastSyncedAt(new Date().toISOString());
        } catch (e: any) {
          setSaveError(e?.message || String(e));
        } finally {
          setIsSaving(false);
        }
      }, SAVE_DEBOUNCE_MS);
    },
    [client, queryClient, queryKey, setDrones]
  );

  /** Batch remote writes (create / batch-create / import), used outside
   *  the per-id debounce. Same offline fallback as commitDrone. */
  const writeMany = useCallback(
    async (list: Drone[]) => {
      if (!client || !list.length) return;
      const key = projectKeyRef.current;
      if (!onlineRef.current) {
        const ok = queueDrones(key, list);
        setQueuedCount(getQueueSize(key));
        if (!ok) setSaveError(STORAGE_FAIL_MESSAGE);
        return;
      }
      setIsSaving(true);
      setSaveError(null);
      try {
        await upsertDrones(client, list);
        setLastSyncedAt(new Date().toISOString());
      } catch (e: any) {
        setSaveError(e?.message || String(e));
      } finally {
        setIsSaving(false);
      }
    },
    [client]
  );

  const createDrone = useCallback(
    (drone: Drone) => {
      setDrones((prev) => [drone, ...prev]);
      writeMany([drone]);
    },
    [setDrones, writeMany]
  );

  const createDrones = useCallback(
    (newDrones: Drone[]) => {
      setDrones((prev) => [...newDrones, ...prev]);
      writeMany(newDrones);
    },
    [setDrones, writeMany]
  );

  const removeDrone = useCallback(
    async (id: string) => {
      setDrones((prev) => prev.filter((d) => d.id !== id));
      if (!client) return;
      const key = projectKeyRef.current;
      if (!onlineRef.current) {
        // A tombstone, not just a local removal — without this the
        // drone reappears on the next fetch/realtime event, since the
        // server never heard about the delete.
        const ok = queueDelete(key, id);
        setQueuedCount(getQueueSize(key));
        if (!ok) setSaveError(STORAGE_FAIL_MESSAGE);
        return;
      }
      try {
        await deleteDroneRow(client, id);
      } catch (e: any) {
        setSaveError(e?.message || String(e));
      }
    },
    [client, setDrones]
  );

  const importDrones = useCallback(
    async (finalList: Drone[], mode: "merge" | "replace") => {
      const prevList = queryClient.getQueryData<Drone[]>(queryKey) || [];
      setDrones(finalList);
      if (!client) return;
      const key = projectKeyRef.current;
      if (!onlineRef.current) {
        // Replay a "replace" the same way the online path expresses
        // it — a delete for everything that's gone, an upsert for
        // everything in the new list — since the queue has no
        // separate "wipe the table" op of its own.
        if (mode === "replace") {
          const finalIds = new Set(finalList.map((d) => d.id));
          prevList.forEach((d) => { if (!finalIds.has(d.id)) queueDelete(key, d.id); });
        }
        const ok = queueDrones(key, finalList);
        setQueuedCount(getQueueSize(key));
        if (!ok) setSaveError(STORAGE_FAIL_MESSAGE);
        return;
      }
      setIsSaving(true);
      setSaveError(null);
      try {
        if (mode === "replace") await deleteAllDrones(client);
        await upsertDrones(client, finalList);
        setLastSyncedAt(new Date().toISOString());
      } catch (e: any) {
        setSaveError(e?.message || String(e));
      } finally {
        setIsSaving(false);
      }
    },
    [client, setDrones, queryClient, queryKey]
  );

  const retry = useCallback(() => {
    setSaveError(null);
    query.refetch();
  }, [query]);

  const sync: SyncState = useMemo(() => {
    if (!client) return { status: "unconfigured", message: "", lastSyncedAt: null };
    if (!online) {
      // A genuine failure (e.g. local storage full) still needs to be
      // seen even while offline — it changes what the person should do
      // (free up space / reconnect now) rather than just wait it out.
      if (saveError) return { status: "error", message: saveError, lastSyncedAt };
      return {
        status: "offline",
        message: queuedCount
          ? `${queuedCount} change${queuedCount === 1 ? "" : "s"} saved locally — will sync once you're back online.`
          : "You're offline — changes are saved locally.",
        lastSyncedAt,
      };
    }
    if (saveError) return { status: "error", message: saveError, lastSyncedAt: null };
    if (query.isError) return { status: "error", message: (query.error as any)?.message || String(query.error), lastSyncedAt: null };
    if (query.isLoading) return { status: "loading", message: "", lastSyncedAt: null };
    if (isSaving) return { status: "saving", message: "", lastSyncedAt };
    return { status: "synced", message: "", lastSyncedAt };
  }, [client, online, queuedCount, saveError, query.isError, query.error, query.isLoading, isSaving, lastSyncedAt]);

  return {
    drones: query.data ?? [],
    sync,
    realtimeStatus,
    online,
    offlineNotice,
    commitDrone,
    createDrone,
    createDrones,
    removeDrone,
    importDrones,
    retry,
  };
}
