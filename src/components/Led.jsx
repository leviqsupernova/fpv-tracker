import React from "react";
import { styled } from "@mui/material/styles";

const SIZES = { xs: 5, sm: 6, md: 8, lg: 11 };

const StyledLed = styled("span", {
  shouldForwardProp: (prop) => !["ledColor", "ledSize", "glow"].includes(prop),
})(({ ledColor, ledSize, glow }) => ({
  display: "inline-block",
  flexShrink: 0,
  width: SIZES[ledSize] ?? SIZES.md,
  height: SIZES[ledSize] ?? SIZES.md,
  backgroundColor: ledColor || "var(--text-faint)",
  transition: "box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxShadow: glow ? `0 0 6px ${ledColor || "transparent"}99` : "none",
}));

export function Led({ color, size = "md", glow = true, className }) {
  return <StyledLed ledColor={color} ledSize={size} glow={glow} className={className} />;
}
