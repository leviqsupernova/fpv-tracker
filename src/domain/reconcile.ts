import type { Drone } from "./drone";

/** Supabase echoes our own writes back to us over the realtime channel.
 *  If we've made a newer local edit since the row that's echoing back
 *  was written (e.g. someone clicked several checkboxes while the first
 *  save was still in flight), applying that stale payload reverts the
 *  newer edit — checkboxes "un-checking themselves". Missing timestamps
 *  are treated as newer, so a first-ever write always applies. */
export function isNewer(incoming: Drone, existing: Drone): boolean {
  if (!existing.updatedAt || !incoming.updatedAt) return true;
  const incomingTime = new Date(incoming.updatedAt).getTime();
  const existingTime = new Date(existing.updatedAt).getTime();
  // An unparseable timestamp on either side makes the comparison
  // inconclusive rather than false — the original's `<=` guard is
  // never true for NaN, so it always fell through and applied the
  // incoming row. Match that: only withhold on a real, decided "not
  // newer", never on "can't tell".
  if (Number.isNaN(incomingTime) || Number.isNaN(existingTime)) return true;
  return incomingTime > existingTime;
}

export type ReconcileEvent =
  | { type: "insert"; drone: Drone }
  | { type: "update"; drone: Drone }
  | { type: "delete"; id: string };

export function reconcileDrones(prev: Drone[], event: ReconcileEvent): Drone[] {
  if (event.type === "delete") {
    return prev.filter((d) => d.id !== event.id);
  }
  const incoming = event.drone;
  const idx = prev.findIndex((d) => d.id === incoming.id);
  if (idx === -1) return [incoming, ...prev];
  const existing = prev[idx];
  if (!isNewer(incoming, existing)) return prev;
  const copy = [...prev];
  copy[idx] = incoming;
  return copy;
}
