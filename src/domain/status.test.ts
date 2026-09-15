import { describe, it, expect } from "vitest";
import { computeStatus, progressOf, nextStep, latestMessage } from "./status";
import type { Drone } from "./drone";

function makeDrone(overrides: Partial<Drone> = {}): Drone {
  return {
    id: "d1",
    serial: "TEST-0001",
    prefix: "TEST",
    unit: 1,
    handler: "",
    checklistSteps: ["A", "B", "C"],
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

describe("computeStatus", () => {
  it("manual status always wins, even over a complete checklist", () => {
    const d = makeDrone({ status: "REPAIR", checklist: { A: true, B: true, C: true } });
    expect(computeStatus(d)).toBe("REPAIR");
  });

  it("falls back to READY when the checklist is complete and no manual status is set", () => {
    const d = makeDrone({ checklist: { A: true, B: true, C: true } });
    expect(computeStatus(d)).toBe("READY");
  });

  it("falls back to NONE when the checklist is incomplete", () => {
    const d = makeDrone({ checklist: { A: true } });
    expect(computeStatus(d)).toBe("NONE");
  });

  it("is NONE for an empty checklist rather than vacuously READY", () => {
    const d = makeDrone({ checklistSteps: [], checklist: {} });
    expect(computeStatus(d)).toBe("NONE");
  });
});

describe("progressOf", () => {
  it("counts done vs total steps", () => {
    const d = makeDrone({ checklist: { A: true, B: false, C: true } });
    expect(progressOf(d)).toEqual({ done: 2, total: 3 });
  });
});

describe("nextStep", () => {
  it("returns the first unchecked step in checklist order", () => {
    const d = makeDrone({ checklist: { A: true, B: false, C: true } });
    expect(nextStep(d)).toBe("B");
  });

  it("returns null once everything is checked", () => {
    const d = makeDrone({ checklist: { A: true, B: true, C: true } });
    expect(nextStep(d)).toBe(null);
  });
});

describe("latestMessage", () => {
  it("returns the most recent history message", () => {
    const d = makeDrone({
      history: [
        { id: "h1", date: "2026-01-01T00:00:00.000Z", person: "Tom", type: "note", message: "first" },
        { id: "h2", date: "2026-01-02T00:00:00.000Z", person: "Tom", type: "note", message: "latest" },
      ],
    });
    expect(latestMessage(d)).toBe("latest");
  });

  it("skips history entries with no message and keeps looking backward", () => {
    const d = makeDrone({
      history: [
        { id: "h1", date: "2026-01-01T00:00:00.000Z", person: "Tom", type: "note", message: "first" },
        { id: "h2", date: "2026-01-02T00:00:00.000Z", person: "Tom", type: "update", message: "" },
      ],
    });
    expect(latestMessage(d)).toBe("first");
  });

  it("falls back to the fault list when there's no message anywhere", () => {
    const d = makeDrone({ history: [], faults: ["AM32", "Compass"] });
    expect(latestMessage(d)).toBe("AM32, Compass");
  });

  it("falls back to an em dash with no history and no faults", () => {
    const d = makeDrone({ history: [], faults: [] });
    expect(latestMessage(d)).toBe("—");
  });
});
