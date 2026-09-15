import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme } from "./theme";
import { ThemeModeProvider, useThemeMode } from "./ThemeModeContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function MuiThemeBridge({ children }) {
  const { themeId } = useThemeMode();
  const muiTheme = useMemo(() => buildTheme(themeId), [themeId]);
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function AppProviders({ children }) {
  return (
    <ThemeModeProvider>
      <MuiThemeBridge>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </MuiThemeBridge>
    </ThemeModeProvider>
  );
}
