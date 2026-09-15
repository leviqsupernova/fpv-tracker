import { describe, it, expect } from "vitest";
import { isNewer } from "./reconcile";
import type { Drone } from "./drone";

function makeDrone(overrides: Partial<Drone> = {}): Drone {
  return {
    id: "d1", serial: "TEST-0001", prefix: "TEST", unit: 1, handler: "",
    checklistSteps: [], checklist: {}, faults: [], status: null, history: [], repairFlags: {},
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// Regression test: the original inline app compared dates with a `<=`
// guard that is never true for NaN, so an unparseable timestamp on
// either side always fell through and applied the incoming row.
// isNewer()'s first draft computed `NaN > NaN` (= false) instead,
// which silently flipped that case to "reject the incoming row".
describe("isNewer with an unparseable timestamp", () => {
  it("treats it as newer (matches the original's fall-through-and-apply behavior), not as older", () => {
    expect(isNewer(makeDrone({ updatedAt: "not-a-date" }), makeDrone())).toBe(true);
    expect(isNewer(makeDrone(), makeDrone({ updatedAt: "not-a-date" }))).toBe(true);
    expect(isNewer(makeDrone({ updatedAt: "not-a-date" }), makeDrone({ updatedAt: "not-a-date" }))).toBe(true);
  });
});
