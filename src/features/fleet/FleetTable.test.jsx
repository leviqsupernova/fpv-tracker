/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, within, cleanup } from "@testing-library/react";
import { FleetTable } from "./FleetTable";

// This project has no vitest setup file, so testing-library's automatic
// per-test cleanup isn't wired up — without this, one test's DOM leaks
// into the next and queries match stale nodes.
afterEach(cleanup);

const drone = {
  id: "d1",
  serial: "CHUMAK13-F012-0452",
  prefix: "CHUMAK13-F012",
  unit: 452,
  handler: "Tom",
  checklistSteps: ["Config", "Serial"],
  checklist: { Config: true, Serial: false },
  repairFlags: {},
  faults: [],
  status: null,
  history: [
    { id: "h1", date: "2026-09-01T10:00:00.000Z", person: "Tom", type: "created", message: "Created." },
    { id: "h2", date: "2026-09-02T10:00:00.000Z", person: "Rost", type: "note", message: "Swapped the VTX." },
  ],
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-02T10:00:00.000Z",
};

function setup(onSelect = vi.fn()) {
  const utils = render(<FleetTable drones={[drone]} onSelect={onSelect} />);
  const chevron = () => within(utils.container).getByRole("button", { name: /history for/i });
  const panel = () => utils.container.querySelector(".history-panel");
  return { ...utils, onSelect, chevron, panel };
}

describe("FleetTable history disclosure", () => {
  it("does not open the side panel when the chevron is clicked", () => {
    const { chevron, onSelect } = setup();
    fireEvent.click(chevron());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("toggles the drone's full history open and closed", () => {
    const { container, chevron, panel } = setup();
    // "Created." appears only in the log; the newest message is already
    // on the row itself, in the Notes cell.
    expect(within(container).queryByText(/Created\./)).toBeNull();

    fireEvent.click(chevron());
    expect(panel()).toBeTruthy();
    expect(within(panel()).getByText(/Created\./)).toBeTruthy();
    expect(within(panel()).getByText(/Swapped the VTX/)).toBeTruthy();

    fireEvent.click(chevron());
    expect(panel()).toBeNull();
  });

  it("renders the history panel in a row directly below its own entry", () => {
    const { container, chevron } = setup();
    fireEvent.click(chevron());
    const rows = [...container.querySelectorAll("tbody tr")];
    expect(rows).toHaveLength(2);
    expect(rows[1].classList.contains("history-row")).toBe(true);
    expect(rows[1].querySelector(".history-panel")).toBeTruthy();
  });

  it("still opens the side panel when a data cell is clicked", () => {
    const { container, onSelect } = setup();
    fireEvent.click(container.querySelector(".cell-serial"));
    expect(onSelect).toHaveBeenCalledWith("d1");
  });
});
