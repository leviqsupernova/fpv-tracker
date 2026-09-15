import React from "react";
import { styled } from "@mui/material/styles";
import { X } from "lucide-react";

const shouldForwardProp = (prop) => !["active", "chipColor"].includes(prop);

// MUI's styled() only switches the rendered tag via its own
// `component`/slot machinery, which this custom shouldForwardProp
// doesn't opt into — passing component="button" here would render a
// literal <span component="button"> rather than a <button>. Defining
// two thin styled primitives against the same style function and
// picking one at render time sidesteps that entirely.
const chipStyle = ({ active, chipColor }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 13px",
  borderRadius: 3,
  fontSize: 14,
  fontFamily: "inherit",
  border: "1px solid",
  borderColor: active ? chipColor || "var(--accent)" : "var(--border)",
  backgroundColor: active ? (chipColor ? `${chipColor}1F` : "var(--accent-soft)") : "transparent",
  color: active ? "var(--text)" : "var(--text-dim)",
  cursor: "pointer",
  userSelect: "none",
  whiteSpace: "nowrap",
  outline: "none",
  transition: "background 0.15s, border-color 0.15s, color 0.15s",
  "&:hover": { borderColor: active ? chipColor || "var(--accent)" : "var(--border-strong)" },
  "&:focus-visible": { outline: "2px solid var(--accent)", outlineOffset: 2 },
});

const ChipSpan = styled("span", { shouldForwardProp })(chipStyle);
const ChipButton = styled("button", { shouldForwardProp })(chipStyle);

export function Chip({ children, active, color, onClick, onRemove, className }) {
  const Root = onClick ? ChipButton : ChipSpan;
  return (
    <Root
      {...(onClick ? { type: "button", onClick } : {})}
      active={active}
      chipColor={color}
      className={className}
    >
      {children}
      {onRemove && (
        <X
          size={13}
          style={{ cursor: "pointer", opacity: 0.75, flexShrink: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </Root>
  );
}
