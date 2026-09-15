import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const STORAGE_KEY = "fpvtracker_supabase_config";

export function loadStoredConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SupabaseConfig) : null;
  } catch (e) {
    return null;
  }
}

export function storeConfig(cfg: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearStoredConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createSupabaseClient(cfg: SupabaseConfig): SupabaseClient {
  return createClient(cfg.url, cfg.anonKey);
}
