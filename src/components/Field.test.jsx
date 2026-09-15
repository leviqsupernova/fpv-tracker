/** @vitest-environment jsdom */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Field } from "./Field";
import { Chip } from "./Chip";
import { TextInput } from "./TextInput";

// Regression test: Field's root is a <label>, which implicitly labels
// its first *labelable* descendant. Once Chip started rendering a real
// <button> (itself a fix), every chip-group Field gained an activation
// target — clicking the label's own text fired the first chip's
// onClick and silently changed state (assignment mode, import mode,
// repair reason). `group` renders a role="group" div instead.
describe("Field", () => {
  it("group mode: clicking the label text does not activate the first chip", () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <Field label="Assignment" group>
        <div><Chip onClick={onClick}>Split among people</Chip></div>
      </Field>
    );
    fireEvent.click(getByText("ASSIGNMENT"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("group mode renders a role=group div with an accessible name", () => {
    const { container } = render(
      <Field label="Import mode" group><div><Chip onClick={() => {}}>Merge</Chip></div></Field>
    );
    expect(container.firstChild.tagName).toBe("DIV");
    expect(container.firstChild.getAttribute("role")).toBe("group");
    expect(container.firstChild.getAttribute("aria-label")).toBe("Import mode");
  });

  it("default mode still renders a <label> wrapping its single control", () => {
    const { container } = render(<Field label="Prefix"><TextInput /></Field>);
    expect(container.firstChild.tagName).toBe("LABEL");
    expect(container.querySelector("label input")).not.toBe(null);
  });
});
