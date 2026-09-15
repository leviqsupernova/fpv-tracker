import { describe, it, expect } from "vitest";
import { padUnit, buildSerial, expandRange, assignUnits, groupContiguousByHandler } from "./serial";

describe("padUnit / buildSerial", () => {
  it("pads the unit to 4 digits", () => {
    expect(padUnit(7)).toBe("0007");
    expect(padUnit("452")).toBe("0452");
  });

  it("builds a serial from prefix and unit", () => {
    expect(buildSerial("CHUMAK13-F012", 452)).toBe("CHUMAK13-F012-0452");
  });

  it("returns an empty string with no prefix or no unit", () => {
    expect(buildSerial("", 452)).toBe("");
    expect(buildSerial("X", "")).toBe("");
  });
});

describe("expandRange", () => {
  it("expands an inclusive range", () => {
    expect(expandRange(450, 453)).toEqual([450, 451, 452, 453]);
  });

  it("rejects an end before the start", () => {
    expect(expandRange(500, 400)).toEqual([]);
  });

  it("rejects a range over the max count", () => {
    expect(expandRange(1, 1002)).toEqual([]);
  });

  it("allows a range exactly at the max count", () => {
    expect(expandRange(1, 1000)).toHaveLength(1000);
  });
});

describe("assignUnits", () => {
  const units = [1, 2, 3, 4, 5];

  it("single mode assigns every unit to one handler", () => {
    const out = assignUnits(units, "single", { singleHandler: "Tom" });
    expect(out.every((a) => a.handler === "Tom")).toBe(true);
  });

  it("none mode leaves every unit unassigned", () => {
    const out = assignUnits(units, "none");
    expect(out.every((a) => a.handler === "")).toBe(true);
  });

  it("split mode divides into contiguous blocks — lowest numbers to the first pick", () => {
    const out = assignUnits(units, "split", { splitHandlers: ["Vladiq", "Rost"] });
    expect(out.map((a) => a.handler)).toEqual(["Vladiq", "Vladiq", "Vladiq", "Rost", "Rost"]);
  });

  it("split mode with nobody picked leaves every unit unassigned", () => {
    const out = assignUnits(units, "split", { splitHandlers: [] });
    expect(out.every((a) => a.handler === "")).toBe(true);
  });
});

describe("groupContiguousByHandler", () => {
  it("collapses consecutive same-handler units into one range", () => {
    const assignments = [
      { unit: 1, handler: "Vladiq" },
      { unit: 2, handler: "Vladiq" },
      { unit: 3, handler: "Rost" },
    ];
    expect(groupContiguousByHandler(assignments)).toEqual([
      { handler: "Vladiq", start: 1, end: 2 },
      { handler: "Rost", start: 3, end: 3 },
    ]);
  });

  it("does not merge non-contiguous units even with the same handler", () => {
    const assignments = [
      { unit: 1, handler: "Vladiq" },
      { unit: 3, handler: "Vladiq" },
    ];
    expect(groupContiguousByHandler(assignments)).toEqual([
      { handler: "Vladiq", start: 1, end: 1 },
      { handler: "Vladiq", start: 3, end: 3 },
    ]);
  });
});
