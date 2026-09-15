import { describe, it, expect } from "vitest";
import { toRow, fromRow } from "./droneRepository";
import type { Drone } from "../domain/drone";

const drone: Drone = {
  id: "drone_1",
  serial: "CHUMAK13-F012-0452",
  prefix: "CHUMAK13-F012",
  unit: 452,
  handler: "Timur",
  checklistSteps: ["Config", "Serial", "Engines"],
  checklist: { Config: true, Serial: false, Engines: false },
  faults: ["AM32"],
  status: "REPAIR",
  history: [{ id: "hist_1", date: "2026-01-01T00:00:00.000Z", person: "Timur", type: "repair_start", message: "AM32 — flaky arm." }],
  repairFlags: { Serial: true },
  createdAt: "2025-12-30T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("toRow / fromRow", () => {
  it("round-trips a drone through the Supabase row shape unchanged", () => {
    expect(fromRow(toRow(drone))).toEqual(drone);
  });

  it("defaults a missing handler to an empty string on the way in", () => {
    const row = toRow({ ...drone, handler: "" });
    expect(row.handler).toBe("");
  });

  it("defaults missing array/object columns on the way out, for rows from an older schema", () => {
    const bareRow = { id: "x", serial: "S-0001", prefix: "S", unit: 1, created_at: "t", updated_at: "t" };
    const out = fromRow(bareRow);
    expect(out.checklistSteps).toEqual([]);
    expect(out.checklist).toEqual({});
    expect(out.faults).toEqual([]);
    expect(out.history).toEqual([]);
    expect(out.status).toBe(null);
    expect(out.repairFlags).toEqual({});
  });
});
