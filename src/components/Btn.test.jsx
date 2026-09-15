/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Btn } from "./Btn";

// Regression test: Btn silently dropped className (inherited from the
// original app.jsx's Btn, which had the same gap). DroneDetail's
// "Finish" button passes className="finish-btn" expecting the
// .finish-btn CSS rule (width:100%, centered, margin-top) — with the
// prop dropped, that rule never applied.
describe("Btn", () => {
  it("forwards a caller-supplied className onto the rendered button", () => {
    const { container } = render(<Btn className="finish-btn">Finish</Btn>);
    const el = container.querySelector("button");
    expect(el.classList.contains("finish-btn")).toBe(true);
  });
});
