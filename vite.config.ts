import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NOTE: base must match your repo name exactly, e.g. if the repo is
// github.com/you/fpv-tracker served at you.github.io/fpv-tracker/,
// this stays '/fpv-tracker/'. If it's a user/org root Pages site
// (you.github.io itself), change this to '/'.
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
          mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
        },
      },
    },
  },
});
