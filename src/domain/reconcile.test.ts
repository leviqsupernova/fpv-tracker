import { describe, it, expect } from "vitest";
import { reconcileDrones, isNewer } from "./reconcile";
import type { Drone } from "./drone";

function makeDrone(overrides: Partial<Drone> = {}): Drone {
  return {
    id: "d1",
    serial: "TEST-0001",
    prefix: "TEST",
    unit: 1,
    handler: "",
    checklistSteps: [],
    checklist: {},
    faults: [],
    status: null,
    history: [],
    repairFlags: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("reconcileDrones", () => {
  it("inserts a drone not already present, at the front", () => {
    const prev = [makeDrone({ id: "a" })];
    const incoming = makeDrone({ id: "b" });
    const next = reconcileDrones(prev, { type: "insert", drone: incoming });
    expect(next.map((d) => d.id)).toEqual(["b", "a"]);
  });

  it("applies an update newer than local state", () => {
    const prev = [makeDrone({ id: "a", updatedAt: "2026-01-01T00:00:00.000Z", handler: "Tom" })];
    const incoming = makeDrone({ id: "a", updatedAt: "2026-01-01T00:05:00.000Z", handler: "Timur" });
    const next = reconcileDrones(prev, { type: "update", drone: incoming });
    expect(next[0].handler).toBe("Timur");
  });

  it("drops a stale echo of our own write — the checkbox-unchecking bug", () => {
    const prev = [makeDrone({ id: "a", updatedAt: "2026-01-01T00:05:00.000Z", handler: "Timur" })];
    const staleEcho = makeDrone({ id: "a", updatedAt: "2026-01-01T00:00:00.000Z", handler: "Tom" });
    const next = reconcileDrones(prev, { type: "update", drone: staleEcho });
    expect(next[0].handler).toBe("Timur");
  });

  it("removes a drone on delete", () => {
    const prev = [makeDrone({ id: "a" }), makeDrone({ id: "b" })];
    const next = reconcileDrones(prev, { type: "delete", id: "a" });
    expect(next.map((d) => d.id)).toEqual(["b"]);
  });
});

describe("isNewer", () => {
  it("treats a missing timestamp on either side as newer, so a first write always applies", () => {
    expect(isNewer(makeDrone({ updatedAt: "" }), makeDrone({ updatedAt: "2026-01-01T00:00:00.000Z" }))).toBe(true);
    expect(isNewer(makeDrone({ updatedAt: "2026-01-01T00:00:00.000Z" }), makeDrone({ updatedAt: "" }))).toBe(true);
  });

  it("rejects an equal timestamp — not strictly newer", () => {
    const t = "2026-01-01T00:00:00.000Z";
    expect(isNewer(makeDrone({ updatedAt: t }), makeDrone({ updatedAt: t }))).toBe(false);
  });
});
