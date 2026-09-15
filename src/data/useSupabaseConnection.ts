import { useCallback, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStoredConfig, storeConfig, clearStoredConfig, createSupabaseClient } from "./supabase";
import type { SupabaseConfig } from "./supabase";

export function useSupabaseConnection(): {
  config: SupabaseConfig | null;
  client: SupabaseClient | null;
  connect: (cfg: SupabaseConfig) => void;
  disconnect: () => void;
} {
  const [config, setConfig] = useState<SupabaseConfig | null>(() => loadStoredConfig());
  const client = useMemo(() => (config ? createSupabaseClient(config) : null), [config]);

  const connect = useCallback((cfg: SupabaseConfig) => {
    storeConfig(cfg);
    setConfig(cfg);
  }, []);

  const disconnect = useCallback(() => {
    clearStoredConfig();
    setConfig(null);
  }, []);

  return { config, client, connect, disconnect };
}
