/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as serial from "../../domain/serial";
import { AddDroneModal } from "./AddDroneModal";

// Regression test: `units` used to be a fresh array every render
// (expandRange() called inline, not memoized), so the assignUnits /
// groupContiguousByHandler memos downstream never bailed — editing an
// unrelated field (e.g. the prefix) recomputed the whole assignment
// on every keystroke. Memoizing `units` on [s, e] should stop that.
describe("AddDroneModal batch tab", () => {
  it("does not recompute assignUnits when an unrelated field changes", () => {
    let assignCalls = 0;
    const real = serial.assignUnits;
    const spy = vi.spyOn(serial, "assignUnits").mockImplementation((...args) => {
      assignCalls++;
      return real(...args);
    });

    const { getByPlaceholderText, getByText } = render(
      <AddDroneModal onClose={() => {}} onCreateSingle={() => {}} onCreateBatch={() => {}} existingSerials={new Set()} handlers={["Tom", "Rost"]} />
    );
    fireEvent.click(getByText("Batch reserve"));
    fireEvent.change(getByPlaceholderText("450"), { target: { value: "1" } });
    fireEvent.change(getByPlaceholderText("600"), { target: { value: "5" } });
    const callsAfterRange = assignCalls;
    expect(callsAfterRange).toBeGreaterThan(0);

    // Editing the prefix (which doesn't affect start/end/mode/handlers)
    // should not trigger another assignUnits call.
    const prefixInput = document.querySelectorAll('input[type="text"], input:not([type])')[0];
    fireEvent.change(prefixInput, { target: { value: "NEWPREFIX" } });
    expect(assignCalls).toBe(callsAfterRange);

    spy.mockRestore();
  });
});
