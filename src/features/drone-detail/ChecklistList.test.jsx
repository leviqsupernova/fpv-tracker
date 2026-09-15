/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { ChecklistList } from "./ChecklistList";
import { nextStep } from "../../domain/status";

// Mirrors App.jsx's window keydown handler exactly. Two bugs live here:
//  1. A checklist row is focusable and toggles itself on Enter, so an
//     unguarded window handler double-toggled the same step right back
//     off — breaking the Enter shortcut entirely once a row was clicked.
//  2. Guarding the *whole* handler (rather than just the Enter branch)
//     then broke the "r" repair shortcut whenever a row had focus.
const appHandler = (drone, openRepair, toggleNext) => (e) => {
  if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  if (e.key.toLowerCase() === "r") { openRepair(); return; }
  if (e.key === "Enter") {
    if (e.target.closest && e.target.closest(".checklist-row")) return;
    const next = nextStep(drone);
    if (next) toggleNext(next);
  }
};

function setup({ onToggle = () => {}, openRepair = () => {}, toggleNext = () => {} } = {}) {
  const drone = { checklistSteps: ["A", "B", "C"], checklist: { A: true } }; // next step is B
  const handler = appHandler(drone, openRepair, toggleNext);
  window.addEventListener("keydown", handler);
  const { container } = render(<ChecklistList drone={drone} onToggle={onToggle} highlightIndex={1} />);
  const rows = container.querySelectorAll(".checklist-row");
  return { rows, cleanup: () => window.removeEventListener("keydown", handler) };
}

describe("checklist keyboard handling", () => {
  it("Enter on a focused row toggles it exactly once — the window shortcut stays out", () => {
    const onToggle = vi.fn();
    const toggleNext = vi.fn();
    const { rows, cleanup } = setup({ onToggle, toggleNext });
    rows[1].focus();
    fireEvent.keyDown(rows[1], { key: "Enter" });
    cleanup();
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith("B");
    expect(toggleNext).not.toHaveBeenCalled();
  });

  it("Enter outside a checklist row still triggers the window 'toggle next step' shortcut", () => {
    const toggleNext = vi.fn();
    const { cleanup } = setup({ toggleNext });
    fireEvent.keyDown(document.body, { key: "Enter" });
    cleanup();
    expect(toggleNext).toHaveBeenCalledWith("B");
  });

  it("'r' still opens the repair modal even when a checklist row has focus", () => {
    const openRepair = vi.fn();
    const { rows, cleanup } = setup({ openRepair });
    rows[1].focus();
    fireEvent.keyDown(rows[1], { key: "r" });
    cleanup();
    expect(openRepair).toHaveBeenCalled();
  });

  it("Space on a focused row toggles it", () => {
    const onToggle = vi.fn();
    const { rows, cleanup } = setup({ onToggle });
    rows[2].focus();
    fireEvent.keyDown(rows[2], { key: " " });
    cleanup();
    expect(onToggle).toHaveBeenCalledWith("C");
  });
});
