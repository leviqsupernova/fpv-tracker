/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  queueDrone, queueDrones, queueDelete, dequeueIfUnchanged,
  getQueueEntries, getQueueSize, clearQueue,
} from "./offlineQueue";
import type { Drone } from "../domain/drone";

const drone = (id: string, over: Partial<Drone> = {}): Drone => ({
  id, serial: id, prefix: "P", unit: 1, handler: "", checklistSteps: [], checklist: {},
  faults: [], status: null, history: [], repairFlags: {}, createdAt: "t", updatedAt: "t",
  ...over,
});

beforeEach(() => {
  localStorage.clear();
});

describe("offline queue — project scoping", () => {
  it("keeps queues for different projects separate, so a flush against one never touches the other's rows", () => {
    queueDrone("projectA", drone("d1"));
    queueDrone("projectB", drone("d2"));
    expect(getQueueEntries("projectA").map((e) => e.op === "upsert" && e.drone.id)).toEqual(["d1"]);
    expect(getQueueEntries("projectB").map((e) => e.op === "upsert" && e.drone.id)).toEqual(["d2"]);
  });

  it("clearing one project's queue leaves the other untouched", () => {
    queueDrone("projectA", drone("d1"));
    queueDrone("projectB", drone("d2"));
    clearQueue("projectA");
    expect(getQueueSize("projectA")).toBe(0);
    expect(getQueueSize("projectB")).toBe(1);
  });
});

describe("offline queue — id-keyed collapsing", () => {
  it("a second edit to the same drone replaces the first rather than piling up", () => {
    queueDrone("p1", drone("d1", { handler: "Tom" }));
    queueDrone("p1", drone("d1", { handler: "Timur" }));
    expect(getQueueSize("p1")).toBe(1);
    const entry = getQueueEntries("p1")[0];
    expect(entry.op === "upsert" && entry.drone.handler).toBe("Timur");
  });

  it("a delete queued after an edit wins — the drone is not silently re-created on flush", () => {
    queueDrone("p1", drone("d1"));
    queueDelete("p1", "d1");
    const entry = getQueueEntries("p1")[0];
    expect(entry).toEqual({ op: "delete", id: "d1" });
  });
});

describe("offline queue — dequeueIfUnchanged", () => {
  it("removes the entry when it still matches exactly", () => {
    const d = drone("d1");
    queueDrone("p1", d);
    const entry = getQueueEntries("p1")[0];
    dequeueIfUnchanged("p1", "d1", entry);
    expect(getQueueSize("p1")).toBe(0);
  });

  it("leaves a re-queued (newer) entry alone, rather than dropping it — the flush-vs-concurrent-edit race", () => {
    const original = drone("d1", { handler: "Tom" });
    queueDrone("p1", original);
    const staleSnapshot = getQueueEntries("p1")[0]; // what a flush would have captured

    // A new offline edit lands while that flush is (hypothetically) in flight.
    queueDrone("p1", drone("d1", { handler: "Timur" }));

    dequeueIfUnchanged("p1", "d1", staleSnapshot);
    expect(getQueueSize("p1")).toBe(1);
    const remaining = getQueueEntries("p1")[0];
    expect(remaining.op === "upsert" && remaining.drone.handler).toBe("Timur");
  });
});

describe("offline queue — storage failure", () => {
  it("reports failure rather than pretending the write succeeded, when localStorage.setItem throws", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    });
    const ok = queueDrone("p1", drone("d1"));
    expect(ok).toBe(false);
    spy.mockRestore();
  });
});
