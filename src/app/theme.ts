import { createTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { THEMES } from "./themes";

// Same tokens as the active theme's entry in themes.js, expressed as
// a real MUI palette so untouched MUI internals (Dialog backdrop,
// disabled-state alpha blending, Select menu paper, etc.) render
// correctly for every theme — not just the original dark one.
// Everything else in the app reads var(--x) custom properties
// directly and repaints on its own via applyThemeVars.
declare module "@mui/material/styles" {
  interface Palette {
    none: Palette["primary"];
  }
  interface PaletteOptions {
    none?: PaletteOptions["primary"];
  }
}

export function buildTheme(themeId: string): Theme {
  const t = THEMES[themeId] || THEMES.dark;
  const tok = t.tokens;

  return createTheme({
    palette: {
      mode: t.mode,
      background: {
        default: tok.bg,
        paper: tok.bgPanel,
      },
      text: {
        primary: tok.text,
        secondary: tok.textDim,
        disabled: tok.textFaint,
      },
      divider: tok.border,
      primary: {
        main: tok.accent,
        contrastText: tok.onAccent,
      },
      success: {
        main: tok.ready,
        contrastText: tok.onReady,
      },
      error: {
        main: tok.repair,
      },
      // The "New / no status" state — not success or error, so it
      // doesn't map onto a standard MUI palette key.
      none: {
        main: tok.none,
        contrastText: tok.onAccent,
      },
    },
    shape: {
      borderRadius: 4,
    },
    typography: {
      fontFamily:
        '"IBM Plex Mono", "SFMono-Regular", ui-monospace, Consolas, Menlo, "Liberation Mono", monospace',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontWeight: 500,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tok.bg,
          },
        },
      },
    },
  });
}
