export type StatusValue = "NONE" | "REPAIR" | "READY" | null;

export interface HistoryItem {
  id: string;
  date: string;
  person: string;
  type: string;
  message: string;
}

export interface Drone {
  id: string;
  serial: string;
  prefix: string;
  unit: number | string;
  handler: string;
  checklistSteps: string[];
  checklist: Record<string, boolean>;
  faults: string[];
  status: StatusValue;
  history: HistoryItem[];
  /** Per-step "needs attention" flag, set by right-clicking a checklist
   *  row. Deliberately independent of checklist/faults/status/history —
   *  a lightweight, reversible visual marker, not a repair workflow. */
  repairFlags: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}
