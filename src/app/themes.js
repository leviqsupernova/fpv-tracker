/* ============================================================
   THEME DEFINITIONS
   One token set per theme. `applyThemeVars` pushes these onto
   :root as CSS custom properties, so every existing var(--x)
   reference in styles.css / component sx props repaints for
   free — no per-theme CSS blocks to maintain.

   Soft/border alpha variants are derived from the base hex at
   render time (see hexToRgba) rather than hand-specified per
   theme, so a new theme only needs the ~13 base tokens below.
   ============================================================ */

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const THEMES = {
  dark: {
    label: "Dark",
    mode: "dark",
    tokens: {
      bg: "#17181B", bgPanel: "#1D1E22", bgElevated: "#25262B", bgHover: "#2C2D33",
      border: "#303136", borderStrong: "#43454C",
      text: "#E7E7EA", textDim: "#96979F", textFaint: "#5A5B62",
      accent: "#6EE7D8", ready: "#7EE787", repair: "#FF6B6B", none: "#8A8D97",
      onAccent: "#031006", onReady: "#03100A",
    },
  },
  light: {
    label: "Light",
    mode: "light",
    tokens: {
      // Bone / warm-brown — the one non-dark theme in the set.
      bg: "#F6EFE4", bgPanel: "#EFE4D2", bgElevated: "#E6D7BE", bgHover: "#DCC9A8",
      border: "#D6C3A1", borderStrong: "#B99D71",
      text: "#3B2E20", textDim: "#6B5A42", textFaint: "#9C8867",
      accent: "#A15C25", ready: "#4F7A3D", repair: "#B33F2C", none: "#8A7A61",
      onAccent: "#FCF6EC", onReady: "#FCF6EC",
    },
  },
  nord: {
    label: "Nord",
    mode: "dark",
    tokens: {
      bg: "#2E3440", bgPanel: "#333A47", bgElevated: "#3B4252", bgHover: "#434C5E",
      border: "#434C5E", borderStrong: "#4C566A",
      text: "#ECEFF4", textDim: "#D8DEE9", textFaint: "#7B88A1",
      accent: "#88C0D0", ready: "#A3BE8C", repair: "#BF616A", none: "#81A1C1",
      onAccent: "#161A21", onReady: "#161A21",
    },
  },
  dracula: {
    label: "Dracula",
    mode: "dark",
    tokens: {
      bg: "#282A36", bgPanel: "#2C2E3D", bgElevated: "#343746", bgHover: "#3B3E52",
      border: "#44475A", borderStrong: "#565973",
      text: "#F8F8F2", textDim: "#C4C6E0", textFaint: "#6272A4",
      accent: "#BD93F9", ready: "#50FA7B", repair: "#FF5555", none: "#8BE9FD",
      onAccent: "#161520", onReady: "#161520",
    },
  },
  catppuccin: {
    label: "Catppuccin",
    mode: "dark",
    tokens: {
      bg: "#11111B", bgPanel: "#1E1E2E", bgElevated: "#313244", bgHover: "#45475A",
      border: "#313244", borderStrong: "#585B70",
      text: "#CDD6F4", textDim: "#A6ADC8", textFaint: "#6C7086",
      accent: "#CBA6F7", ready: "#A6E3A1", repair: "#F38BA8", none: "#89B4FA",
      onAccent: "#181825", onReady: "#181825",
    },
  },
};

export const THEME_LIST = Object.keys(THEMES).map((id) => ({ id, label: THEMES[id].label, mode: THEMES[id].mode }));

const VAR_MAP = {
  bg: "--bg", bgPanel: "--bg-panel", bgElevated: "--bg-elevated", bgHover: "--bg-hover",
  border: "--border", borderStrong: "--border-strong",
  text: "--text", textDim: "--text-dim", textFaint: "--text-faint",
  accent: "--accent", ready: "--ready", repair: "--repair", none: "--none",
  onAccent: "--on-accent", onReady: "--on-ready",
};

/** Pushes a theme's tokens onto :root as CSS custom properties,
 *  including the derived soft-fill (10%) and border-alpha (35%)
 *  variants every existing stylesheet rule already expects. */
export function applyThemeVars(id) {
  const t = THEMES[id] || THEMES.dark;
  const root = document.documentElement.style;
  Object.entries(t.tokens).forEach(([key, hex]) => {
    root.setProperty(VAR_MAP[key], hex);
  });
  root.setProperty("--accent-soft", hexToRgba(t.tokens.accent, 0.1));
  root.setProperty("--ready-soft", hexToRgba(t.tokens.ready, 0.1));
  root.setProperty("--repair-soft", hexToRgba(t.tokens.repair, 0.1));
  root.setProperty("--none-soft", hexToRgba(t.tokens.none, 0.1));
  root.setProperty("--accent-border", hexToRgba(t.tokens.accent, 0.35));
  root.setProperty("--ready-border", hexToRgba(t.tokens.ready, 0.35));
  root.setProperty("--repair-border", hexToRgba(t.tokens.repair, 0.4));
  document.documentElement.setAttribute("data-theme", id);
  document.documentElement.setAttribute("data-theme-mode", t.mode);
}

export { hexToRgba };
