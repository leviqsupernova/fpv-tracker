/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { Chip } from "./Chip";

// Regression test: styled("span")'s custom shouldForwardProp meant a
// component="button" prop was a no-op — every Chip rendered as a
// <span component="button">, silently losing button semantics,
// keyboard focus, and the &:focus-visible rule for every clickable
// chip in the app (filters, tabs, handler picks, fault tags).
describe("Chip", () => {
  it("renders a real <button> when onClick is given", () => {
    const onClick = vi.fn();
    const { container } = render(<Chip onClick={onClick} active>Ready</Chip>);
    const el = container.firstChild;
    expect(el.tagName).toBe("BUTTON");
    expect(el.getAttribute("type")).toBe("button");
    expect(el.hasAttribute("component")).toBe(false);
  });

  it("renders a plain <span> when there's no onClick", () => {
    const { container } = render(<Chip active>Ready</Chip>);
    expect(container.firstChild.tagName).toBe("SPAN");
  });
});
