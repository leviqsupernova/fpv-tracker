import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppProviders } from "./app/providers.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <AppProviders>
    <App />
  </AppProviders>
);
