import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchHandlers, saveHandlers as saveHandlersRow } from "./droneRepository";

async function loadHandlers(
  client: SupabaseClient | null,
  enabled: boolean,
  fallback: string[]
): Promise<string[]> {
  if (!client || !enabled) return fallback;
  try {
    return await fetchHandlers(client, fallback);
  } catch (e) {
    // soft-fail — same as the old inline version, since this is a
    // small shared setting and shouldn't block the main connection
    return fallback;
  }
}

export function useHandlers(client: SupabaseClient | null, enabled: boolean, defaultHandlers: string[]) {
  const [handlers, setHandlers] = useState<string[]>(defaultHandlers);
  const defaultRef = useRef(defaultHandlers);
  defaultRef.current = defaultHandlers;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await loadHandlers(client, enabled, defaultRef.current);
      if (!cancelled) setHandlers(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [client, enabled]);

  const saveHandlers = useCallback(
    async (list: string[]) => {
      setHandlers(list);
      if (!client) return;
      try {
        await saveHandlersRow(client, list);
      } catch (e) {
        // soft-fail — same as the old inline version, since the local
        // list is already updated and this is a small shared setting
      }
    },
    [client]
  );

  /** Re-fetches the handler list without touching the drones query —
   *  used by the connection error banner's Retry, since the original
   *  connect() always refreshed both drones and handlers together. */
  const retryHandlers = useCallback(async () => {
    const list = await loadHandlers(client, enabled, defaultRef.current);
    setHandlers(list);
  }, [client, enabled]);

  return [handlers, saveHandlers, retryHandlers] as const;
}
