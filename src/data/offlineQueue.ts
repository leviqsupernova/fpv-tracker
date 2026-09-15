import type { Drone } from "../domain/drone";

const STORAGE_PREFIX = "fpvtracker_offline_queue";

export type QueueEntry = { op: "upsert"; drone: Drone } | { op: "delete"; id: string };
type QueueMap = Record<string, QueueEntry>;

// Scoped per Supabase project (keyed by its URL) — otherwise an edit
// queued offline against one project would replay into whichever
// project happens to be connected when the app comes back online.
// Mirrors the same concern useDrones already has for its per-id save
// timers (see the client-change effect there).
function storageKey(projectKey: string): string {
  return `${STORAGE_PREFIX}:${projectKey}`;
}

function readQueue(projectKey: string): QueueMap {
  try {
    const raw = localStorage.getItem(storageKey(projectKey));
    return raw ? (JSON.parse(raw) as QueueMap) : {};
  } catch (e) {
    return {};
  }
}

/** Returns false if the write didn't actually persist (quota exceeded,
 *  storage unavailable, private-browsing lockdown, etc.) — callers
 *  must surface that rather than assume the queue holds what they
 *  just asked it to hold. */
function writeQueue(projectKey: string, map: QueueMap): boolean {
  try {
    localStorage.setItem(storageKey(projectKey), JSON.stringify(map));
    return true;
  } catch (e) {
    return false;
  }
}

export function queueDrone(projectKey: string, drone: Drone): boolean {
  const map = readQueue(projectKey);
  map[drone.id] = { op: "upsert", drone };
  return writeQueue(projectKey, map);
}

export function queueDrones(projectKey: string, drones: Drone[]): boolean {
  const map = readQueue(projectKey);
  drones.forEach((d) => { map[d.id] = { op: "upsert", drone: d }; });
  return writeQueue(projectKey, map);
}

/** A delete queued while offline overwrites any pending upsert for the
 *  same id — the map is keyed by id, so "delete" always wins as the
 *  last-known-intent, same as a second upsert would. */
export function queueDelete(projectKey: string, id: string): boolean {
  const map = readQueue(projectKey);
  map[id] = { op: "delete", id };
  return writeQueue(projectKey, map);
}

/** Removes an id only if its queued entry still matches `expected`
 *  exactly — i.e. nothing re-queued it (a newer offline edit) while a
 *  flush for the old value was in flight. Safer than an unconditional
 *  delete, which would silently drop that newer edit. */
export function dequeueIfUnchanged(projectKey: string, id: string, expected: QueueEntry): void {
  const map = readQueue(projectKey);
  const current = map[id];
  if (current && JSON.stringify(current) === JSON.stringify(expected)) {
    delete map[id];
    writeQueue(projectKey, map);
  }
}

export function getQueueEntries(projectKey: string): QueueEntry[] {
  return Object.values(readQueue(projectKey));
}

export function getQueueSize(projectKey: string): number {
  return Object.keys(readQueue(projectKey)).length;
}

export function clearQueue(projectKey: string): void {
  try {
    localStorage.removeItem(storageKey(projectKey));
  } catch (e) {
    /* ignore */
  }
}
