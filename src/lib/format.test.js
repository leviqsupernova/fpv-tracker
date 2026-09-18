import { describe, it, expect } from "vitest";
import { fmtAgo, fmtDateFull } from "./format";

describe("fmtAgo", () => {
  it("returns an empty string for no timestamp", () => {
    expect(fmtAgo(null)).toBe("");
    expect(fmtAgo("")).toBe("");
  });

  it("reports seconds under a minute", () => {
    expect(fmtAgo(new Date(Date.now() - 3000).toISOString())).toBe("3s ago");
    expect(fmtAgo(new Date(Date.now() - 45_000).toISOString())).toBe("45s ago");
  });

  it("reports minutes and seconds under an hour", () => {
    expect(fmtAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5m 00s ago");
    expect(fmtAgo(new Date(Date.now() - (5 * 60_000 + 7000)).toISOString())).toBe("5m 07s ago");
  });

  it("reports hours, minutes and seconds past an hour", () => {
    const ms = 2 * 3600_000 + 3 * 60_000 + 4000;
    expect(fmtAgo(new Date(Date.now() - ms).toISOString())).toBe("2h 03m 04s ago");
  });
});

describe("fmtDateFull", () => {
  it("truncates an ISO timestamp to minute precision with a space separator", () => {
    expect(fmtDateFull("2026-01-01T09:05:30.000Z")).toBe("2026-01-01 09:05");
  });

  it("returns an empty string for no timestamp", () => {
    expect(fmtDateFull(null)).toBe("");
  });
});
