import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { THEMES, THEME_LIST, applyThemeVars } from "./themes";

const STORAGE_KEY = "fpvtracker_theme";
const DEFAULT_THEME = "dark";

function loadStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && THEMES[v] ? v : DEFAULT_THEME;
  } catch (e) {
    return DEFAULT_THEME;
  }
}

const ThemeModeContext = createContext(null);

export function ThemeModeProvider({ children }) {
  const [themeId, setThemeIdState] = useState(loadStoredTheme);

  useEffect(() => {
    applyThemeVars(themeId);
  }, [themeId]);

  const setThemeId = (id) => {
    if (!THEMES[id]) return;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      /* ignore — theme still applies for this session */
    }
    setThemeIdState(id);
  };

  const value = useMemo(
    () => ({ themeId, theme: THEMES[themeId], themes: THEME_LIST, setThemeId }),
    [themeId]
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error("useThemeMode must be used within ThemeModeProvider");
  return ctx;
}
