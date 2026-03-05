import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const DEFAULT_PROJECT_ID = "qjocvozhlycmqcodwzqp";
const DEFAULT_SUPABASE_URL = `https://${DEFAULT_PROJECT_ID}.supabase.co`;
const DEFAULT_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb2N2b3pobHljbXFjb2R3enFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzM2NDcsImV4cCI6MjA4NzY0OTY0N30.U2rXEUdBBmuED64BVaLhTaxTNutvfzm5KfPlzSUQdzk";

const projectId =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ||
  import.meta.env.SUPABASE_PROJECT_ID ||
  DEFAULT_PROJECT_ID;

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  (projectId ? `https://${projectId}.supabase.co` : DEFAULT_SUPABASE_URL);

const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  DEFAULT_PUBLISHABLE_KEY;

function createDisabledClient() {
  const disabledError = { message: "Backend não configurado neste ambiente." };
  const qb = {
    select: () => qb,
    eq: () => qb,
    in: () => qb,
    maybeSingle: async () => ({ data: null, error: disabledError }),
    single: async () => ({ data: null, error: disabledError }),
    insert: async () => ({ data: null, error: disabledError }),
    update: async () => ({ data: null, error: disabledError }),
    delete: async () => ({ data: null, error: disabledError }),
    upsert: async () => ({ data: null, error: disabledError }),
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: disabledError }),
      signUp: async () => ({ data: { user: null, session: null }, error: disabledError }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    },
    from: () => qb,
    functions: {
      invoke: async () => ({ data: null, error: disabledError }),
    },
  } as any;
}

const hasConfig =
  typeof supabaseUrl === "string" &&
  supabaseUrl.length > 0 &&
  typeof supabasePublishableKey === "string" &&
  supabasePublishableKey.length > 0;

if (!hasConfig) {
  console.warn("[cloudClient] Backend URL/chave ausentes. Entrando em modo degradado.");
}

export const supabase = hasConfig
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createDisabledClient();
