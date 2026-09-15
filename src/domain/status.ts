import type { Drone } from "./drone";

export const STATUS_LABELS: Record<"NONE" | "REPAIR" | "READY", string> = {
  NONE: "New",
  REPAIR: "Repair",
  READY: "Ready",
};

/** Status is manual-first: if drone.status is set, that wins outright.
 *  Otherwise it falls back to automatic — checklist fully checked means
 *  ready, anything else is "no status". Manual and automatic coexist:
 *  nobody has to touch the buttons for the common case, but anyone can
 *  override at any point and it sticks until changed again. */
export function computeStatus(drone: Drone): "NONE" | "REPAIR" | "READY" {
  if (drone.status) return drone.status;
  const total = drone.checklistSteps.length;
  if (total > 0 && drone.checklistSteps.every((s) => drone.checklist[s])) return "READY";
  return "NONE";
}

export function progressOf(drone: Drone): { done: number; total: number } {
  const total = drone.checklistSteps.length;
  const done = drone.checklistSteps.filter((s) => drone.checklist[s]).length;
  return { done, total };
}

export function nextStep(drone: Drone): string | null {
  return drone.checklistSteps.find((s) => !drone.checklist[s]) || null;
}

/** Whether any checklist step has been right-click-flagged for
 *  attention. Independent of status/faults — see Drone.repairFlags. */
export function hasRepairFlags(drone: Drone): boolean {
  return Object.values(drone.repairFlags || {}).some(Boolean);
}

/** The most recent history message, falling back to the fault list for
 *  a drone that has faults logged but no note text yet. */
export function latestMessage(drone: Drone): string {
  for (let i = drone.history.length - 1; i >= 0; i--) {
    if (drone.history[i].message) return drone.history[i].message;
  }
  return drone.faults.length ? drone.faults.join(", ") : "—";
}
