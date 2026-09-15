import { describe, it, expect } from "vitest";
import { fmtAgo, fmtDateFull } from "./format";

describe("fmtAgo", () => {
  it("returns an empty string for no timestamp", () => {
    expect(fmtAgo(null)).toBe("");
    expect(fmtAgo("")).toBe("");
  });

  it("reports just now for a timestamp seconds ago", () => {
    expect(fmtAgo(new Date(Date.now() - 3000).toISOString())).toBe("just now");
  });

  it("reports seconds for under a minute", () => {
    expect(fmtAgo(new Date(Date.now() - 45_000).toISOString())).toBe("45s ago");
  });

  it("reports minutes for under an hour", () => {
    expect(fmtAgo(new Date(Date.now() - 5 * 60_000).toISOString())).toBe("5m ago");
  });

  it("falls back to a full date/time past an hour", () => {
    const iso = new Date(Date.now() - 2 * 3600_000).toISOString();
    expect(fmtAgo(iso)).toMatch(/·/);
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
