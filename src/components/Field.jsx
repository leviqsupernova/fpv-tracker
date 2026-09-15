import React from "react";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";

/** Labelled form field.
 *
 *  `group` matters for correctness, not just semantics. The default
 *  root is a <label>, which implicitly labels the *first labelable
 *  descendant* — and <button> is labelable. So a <label> wrapping a
 *  row of button-backed Chips makes clicking the label's own text
 *  activate the first chip, silently changing state. Pass `group` for
 *  any Field whose children are a set of chips/toggles rather than
 *  one control; it renders a role="group" div instead, which has no
 *  activation behavior. */
export function Field({ label, children, hint, group = false }) {
  const labelText = (
    <span style={{ color: "var(--text-dim)", fontSize: 13.5, letterSpacing: "0.03em" }}>{label.toUpperCase()}</span>
  );
  return (
    <FormControl
      component={group ? "div" : "label"}
      {...(group ? { role: "group", "aria-label": label } : {})}
      fullWidth
      sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
    >
      {labelText}
      {children}
      {hint && (
        <FormHelperText sx={{ color: "var(--text-faint)", fontSize: 12.5, margin: 0 }}>{hint}</FormHelperText>
      )}
    </FormControl>
  );
}
