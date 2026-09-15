import type { SupabaseClient } from "@supabase/supabase-js";
import type { Drone } from "../domain/drone";

const DRONES_TABLE = "drones";
const SETTINGS_TABLE = "app_settings";

export function toRow(d: Drone) {
  return {
    id: d.id,
    serial: d.serial,
    prefix: d.prefix,
    unit: d.unit,
    handler: d.handler || "",
    checklist_steps: d.checklistSteps,
    checklist: d.checklist,
    faults: d.faults,
    status: d.status || null,
    history: d.history,
    repair_flags: d.repairFlags || {},
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

export function fromRow(r: any): Drone {
  return {
    id: r.id,
    serial: r.serial,
    prefix: r.prefix,
    unit: r.unit,
    handler: r.handler || "",
    checklistSteps: r.checklist_steps || [],
    checklist: r.checklist || {},
    faults: r.faults || [],
    status: r.status || null,
    history: r.history || [],
    // Falls back to {} for rows written before the migration added this
    // column, or against a project that hasn't run it yet.
    repairFlags: r.repair_flags || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function fetchDrones(client: SupabaseClient): Promise<Drone[]> {
  const { data, error } = await client.from(DRONES_TABLE).select("*");
  if (error) throw error;
  return (data || []).map(fromRow);
}

/** Used by the offline-queue flush to check what's currently on the
 *  server, for just the rows it's about to replay, before overwriting
 *  anything — see reconcileOfflineQueue in useDrones.ts. */
export async function fetchDronesByIds(client: SupabaseClient, ids: string[]): Promise<Drone[]> {
  if (!ids.length) return [];
  const { data, error } = await client.from(DRONES_TABLE).select("*").in("id", ids);
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function upsertDrone(client: SupabaseClient, drone: Drone): Promise<void> {
  const { error } = await client.from(DRONES_TABLE).upsert(toRow(drone));
  if (error) throw error;
}

export async function upsertDrones(client: SupabaseClient, drones: Drone[]): Promise<void> {
  if (!drones.length) return;
  const { error } = await client.from(DRONES_TABLE).upsert(drones.map(toRow));
  if (error) throw error;
}

export async function deleteDrone(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from(DRONES_TABLE).delete().eq("id", id);
  if (error) throw error;
}

/** Batch delete, used to replay tombstones queued while offline. */
export async function deleteDrones(client: SupabaseClient, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await client.from(DRONES_TABLE).delete().in("id", ids);
  if (error) throw error;
}

export async function deleteAllDrones(client: SupabaseClient): Promise<void> {
  const { error } = await client.from(DRONES_TABLE).delete().neq("id", "__none__");
  if (error) throw error;
}

/** Shared handler list. Throws on a real failure so a caller can
 *  decide how to handle it. In practice the only current caller
 *  (useHandlers) catches this and soft-fails to defaults — same as
 *  the old inline version — so a missing app_settings table still
 *  looks identical to "no handlers saved yet" today. Throwing here
 *  keeps that choice available rather than deciding it in this
 *  function. */
export async function fetchHandlers(client: SupabaseClient, fallback: string[]): Promise<string[]> {
  const { data: row, error } = await client
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", "handlers")
    .maybeSingle();
  if (error) throw error;
  if (row && Array.isArray(row.value) && row.value.length) return row.value;
  await saveHandlers(client, fallback);
  return fallback;
}

export async function saveHandlers(client: SupabaseClient, list: string[]): Promise<void> {
  const { error } = await client.from(SETTINGS_TABLE).upsert({ key: "handlers", value: list });
  if (error) throw error;
}
