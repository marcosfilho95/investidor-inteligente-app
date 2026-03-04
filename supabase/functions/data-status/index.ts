// @ts-nocheck
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({
          health: "ok",
          last_success_at: null,
          last_version_date: null,
          datasets: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query latest dataset_meta entries
    const { data: metas, error } = await supabase
      .from("dataset_meta")
      .select("dataset_name, version_date, file_path, row_count, status, created_at")
      .eq("status", "ok")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error || !metas || metas.length === 0) {
      return new Response(
        JSON.stringify({
          health: "no_data",
          last_success_at: null,
          last_version_date: null,
          datasets: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduplicate: latest entry per dataset_name
    const seen = new Set<string>();
    const datasets = [];
    let lastSuccessAt: string | null = null;
    let lastVersionDate: string | null = null;

    for (const m of metas) {
      if (seen.has(m.dataset_name)) continue;
      seen.add(m.dataset_name);
      datasets.push({
        name: m.dataset_name,
        version_date: m.version_date,
        file_path: m.file_path,
        row_count: m.row_count,
        status: m.status,
      });
      if (!lastSuccessAt || m.created_at > lastSuccessAt) lastSuccessAt = m.created_at;
      if (!lastVersionDate || m.version_date > lastVersionDate) lastVersionDate = m.version_date;
    }

    return new Response(
      JSON.stringify({
        health: "ok",
        last_success_at: lastSuccessAt,
        last_version_date: lastVersionDate,
        datasets,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("data-status error:", e);
    return new Response(
      JSON.stringify({ health: "error", error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
