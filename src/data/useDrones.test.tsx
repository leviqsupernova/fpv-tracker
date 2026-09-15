/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { useDrones } from "./useDrones";
import { getQueueSize } from "./offlineQueue";

function fakeClient({ failUpsert = false, failSelect = false, rows = [] as any[] } = {}) {
  return {
    from: () => ({
      select: () => ({
        // Plain `select("*")` (fetchDrones) awaits this object directly.
        then: (resolve: any) =>
          resolve(failSelect ? { data: null, error: { message: "select failed" } } : { data: rows, error: null }),
        // `select("*").in("id", ids)` (fetchDronesByIds) chains one more call.
        in: async (_col: string, ids: string[]) => ({
          data: rows.filter((r: any) => ids.includes(r.id)),
          error: null,
        }),
      }),
      upsert: async () => ({ error: failUpsert ? { message: "boom" } : null }),
      delete: () => ({ eq: async () => ({ error: null }), neq: async () => ({ error: null }), in: async () => ({ error: null }) }),
    }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
    removeChannel: () => {},
  } as any;
}

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { value, writable: true, configurable: true });
  // @tanstack/react-query's own onlineManager is a module-level
  // singleton that tears down its window listener once the last
  // active query unsubscribes (e.g. between tests, after cleanup()).
  // A dispatched event can land with nobody listening at that moment,
  // leaving its internal flag stuck — set it directly so query
  // fetching (paused/resumed by *its* notion of online, independently
  // of our own useOnlineStatus hook below) is reliably in sync too.
  onlineManager.setOnline(value);
  window.dispatchEvent(new Event(value ? "online" : "offline"));
}

beforeEach(() => {
  localStorage.clear();
  // Not just the navigator.onLine property: @tanstack/react-query ships
  // its own global onlineManager that listens for real 'online'/'offline'
  // window events and caches its own boolean independently of
  // navigator.onLine. A test that goes offline and never dispatches a
  // real 'online' event leaves every *later* test's queries permanently
  // paused — this bit us during development (see the commit history for
  // this file). Route the reset through the same dispatcher so both
  // that manager and useOnlineStatus are actually back in sync.
  setOnline(true);
});

afterEach(() => {
  // Without this, a hook rendered in one test — and its window
  // online/offline listeners with it — stays mounted into the next
  // test. That's normally harmless, but combined with vi.useFakeTimers()
  // being a *global* mock, a still-mounted ghost component's own
  // pending timers get swept up by a later test's advanceTimersByTimeAsync
  // too.
  cleanup();
  vi.useRealTimers();
});

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const drone1 = (id: string) => ({
  id, serial: id, prefix: "P", unit: 1, handler: "", checklistSteps: ["A"], checklist: {},
  faults: [], status: null, history: [], repairFlags: {}, createdAt: "t", updatedAt: "t",
});

describe("useDrones sync state machine — fixes from the migration review", () => {
  it("sets lastSyncedAt after the initial successful load, not only after a write", async () => {
    const client = fakeClient();
    const { result } = renderHook(() => useDrones(client, ["drones", "p1"]), { wrapper: wrap() });
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));
    expect(result.current.sync.lastSyncedAt).not.toBe(null);
  });

  it("clears a stale save error and lastSyncedAt when the client changes (disconnect, or a new project)", async () => {
    const Wrapper = wrap();
    const { result, rerender } = renderHook(
      ({ client, key }) => useDrones(client, key),
      { wrapper: Wrapper, initialProps: { client: fakeClient({ failUpsert: true }), key: ["drones", "p1"] } }
    );
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));
    await act(async () => { await result.current.createDrone(drone1("d1")); });
    await waitFor(() => expect(result.current.sync.status).toBe("error"));

    // Disconnect.
    rerender({ client: null as any, key: ["drones", null] });
    expect(result.current.sync.status).toBe("unconfigured");

    // Connect to a different project — should not inherit the old error.
    rerender({ client: fakeClient(), key: ["drones", "p2"] });
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));
    expect(result.current.sync.message).toBe("");
  });

  it("cancels a pending per-drone save timer when the client changes, so it never writes to the new client", async () => {
    const firstClient = fakeClient();
    const secondClientUpserts: string[] = [];
    const secondClient = fakeClient();
    secondClient.from = () => ({
      select: async () => ({ data: [], error: null }),
      upsert: async (row: any) => {
        secondClientUpserts.push(Array.isArray(row) ? row[0]?.id : row.id);
        return { error: null };
      },
      delete: () => ({ eq: async () => ({ error: null }), neq: async () => ({ error: null }) }),
    });

    const Wrapper = wrap();
    const { result, rerender } = renderHook(
      ({ client, key }) => useDrones(client, key),
      { wrapper: Wrapper, initialProps: { client: firstClient, key: ["drones", "p1"] } }
    );
    // Let the initial load settle on real timers before faking them.
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));

    vi.useFakeTimers();
    act(() => {
      result.current.commitDrone("ghost", (d: any) => d); // schedules a 700ms timer against firstClient
    });
    rerender({ client: secondClient, key: ["drones", "p2"] }); // swap clients mid-debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    vi.useRealTimers();

    expect(secondClientUpserts).toEqual([]); // the cancelled timer never fired against the new client
  });

  it("goes straight to error on a single failed fetch, without a retry delay (retry: false)", async () => {
    const client = fakeClient({ failSelect: true });
    const { result } = renderHook(() => useDrones(client, ["drones", "p1"]), { wrapper: wrap() });
    await waitFor(() => expect(result.current.sync.status).toBe("error"));
  });

  it("keeps lastSyncedAt set when the client identity changes but the queryKey does not", async () => {
    // useSupabaseConnection derives `client` from a useMemo, which React
    // is permitted to discard — that produces a new client object with
    // an unchanged config/queryKey. The reset effect blanks lastSyncedAt
    // on any client change, so the re-set effect has to key on `client`
    // too, not just on the query's success edge (which never flips here).
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
    const SAME_KEY = ["drones", "p1"];
    const { result, rerender } = renderHook(
      ({ client }) => useDrones(client, SAME_KEY),
      { wrapper: Wrapper, initialProps: { client: fakeClient() } }
    );
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));
    expect(result.current.sync.lastSyncedAt).not.toBe(null);

    rerender({ client: fakeClient() });
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));
    expect(result.current.sync.lastSyncedAt).not.toBe(null);
  });

  it("an optimistic local edit does not by itself move lastSyncedAt", async () => {
    const client = fakeClient();
    const { result } = renderHook(() => useDrones(client, ["drones", "p1"]), { wrapper: wrap() });
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));
    const before = result.current.sync.lastSyncedAt;
    await new Promise((r) => setTimeout(r, 5));
    act(() => { result.current.commitDrone("nope", (d: any) => d); });
    expect(result.current.sync.lastSyncedAt).toBe(before);
  });
});

describe("useDrones — offline queueing", () => {
  it("a write made while offline is queued locally instead of hitting the network, and reports 'offline' not 'error'", async () => {
    const client = fakeClient({ rows: [{ id: "d1", serial: "d1", prefix: "P", unit: 1, updated_at: "2026-01-01T00:00:00.000Z" }] });
    const { result } = renderHook(() => useDrones(client, ["drones", "off1"]), { wrapper: wrap() });
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));

    setOnline(false);
    await waitFor(() => expect(result.current.sync.status).toBe("offline"));

    vi.useFakeTimers();
    act(() => { result.current.commitDrone("d1", (d: any) => ({ ...d, handler: "Tom" })); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    vi.useRealTimers();

    expect(getQueueSize(JSON.stringify(["drones", "off1"]))).toBe(1);
    expect(result.current.sync.status).toBe("offline");
  });

  it("reconnecting flushes the queue: a stale offline edit is discarded in favor of the server's newer row; a brand-new local drone still sends", async () => {
    // Far-future so it's newer than whatever real "now" commitDrone
    // stamps on the local edit below, without having to fight Date
    // mocking across the awaited steps in this test.
    const serverRow = { id: "d1", serial: "d1", prefix: "P", unit: 1, handler: "Server", updated_at: "2099-01-01T00:00:00.000Z" };
    const upserted: any[] = [];
    const client = fakeClient({ rows: [serverRow] });
    client.from = () => ({
      select: () => ({
        then: (resolve: any) => resolve({ data: [serverRow], error: null }),
        in: async (_c: string, ids: string[]) => ({ data: [serverRow].filter((r) => ids.includes(r.id)), error: null }),
      }),
      upsert: async (row: any) => { upserted.push(...(Array.isArray(row) ? row : [row])); return { error: null }; },
      delete: () => ({ eq: async () => ({ error: null }), neq: async () => ({ error: null }), in: async () => ({ error: null }) }),
    });

    const projectKey = JSON.stringify(["drones", "off2"]);
    const { result } = renderHook(() => useDrones(client, ["drones", "off2"]), { wrapper: wrap() });
    await waitFor(() => expect(result.current.sync.status).toBe("synced"));

    setOnline(false);
    await waitFor(() => expect(result.current.sync.status).toBe("offline"));

    // Stale: older than the server's row — must be discarded, not sent.
    vi.useFakeTimers();
    act(() => { result.current.commitDrone("d1", (d: any) => ({ ...d, handler: "StaleLocal" })); });
    // Brand-new locally, doesn't exist on the server at all — must send.
    act(() => { result.current.createDrone(drone1("d2")); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    vi.useRealTimers();
    expect(getQueueSize(projectKey)).toBe(2);

    setOnline(true);
    await waitFor(() => expect(getQueueSize(projectKey)).toBe(0));

    expect(upserted.find((r) => r.id === "d1")).toBeUndefined(); // discarded, not sent
    expect(upserted.find((r) => r.id === "d2")).toBeDefined();   // sent
    expect(result.current.offlineNotice).toMatch(/overwritten by a newer online edit/);
  });
});
