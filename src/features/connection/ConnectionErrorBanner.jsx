import React from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { AlertTriangle } from "lucide-react";
import { Btn } from "../../components";

export function ConnectionErrorBanner({ sync, onRetry }) {
  if (sync.status !== "error") return null;
  return (
    <Alert
      severity="error"
      icon={<AlertTriangle size={18} />}
      action={<Btn variant="subtle" size="sm" onClick={onRetry}>Retry</Btn>}
      sx={{
        alignItems: "center",
        backgroundColor: "var(--repair-soft)",
        border: "1px solid var(--repair-border)",
        borderRadius: "6px",
        marginBottom: "20px",
        "& .MuiAlert-icon": { color: "var(--repair)" },
        "& .MuiAlert-message": { padding: "0" },
        "& .MuiAlert-action": { paddingTop: 0, alignItems: "center" },
      }}
    >
      <AlertTitle sx={{ color: "var(--text)", fontSize: 14.5, fontWeight: 500, margin: 0 }}>Sync error</AlertTitle>
      <span style={{ color: "var(--text-dim)", fontSize: 13.5 }}>{sync.message || "Couldn't reach Supabase."}</span>
    </Alert>
  );
}
