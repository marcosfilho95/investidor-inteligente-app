import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Get latest successful dataset entries
    const { data: datasets, error } = await supabase
      .from("dataset_meta")
      .select("dataset_name, version_date, file_path, row_count, created_at, status, message")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Group by dataset_name, take latest per name
    const latestByName: Record<string, any> = {};
    let lastSuccessAt: string | null = null;
    let lastVersionDate: string | null = null;
    let hasFailure = false;

    for (const d of datasets || []) {
      if (!latestByName[d.dataset_name]) {
        latestByName[d.dataset_name] = d;
        if (d.status === "ok") {
          if (!lastSuccessAt || d.created_at > lastSuccessAt) lastSuccessAt = d.created_at;
          if (!lastVersionDate || d.version_date > lastVersionDate) lastVersionDate = d.version_date;
        }
        if (d.status === "failed") hasFailure = true;
      }
    }

    const datasetList = Object.values(latestByName).map((d: any) => ({
      name: d.dataset_name,
      version_date: d.version_date,
      file_path: d.file_path,
      row_count: d.row_count,
      status: d.status,
    }));

    // If no datasets at all, report as "no_data" (front uses fallback)
    const health = datasetList.length === 0
      ? "no_data"
      : hasFailure
        ? "degraded"
        : "ok";

    return new Response(
      JSON.stringify({
        health,
        last_success_at: lastSuccessAt,
        last_version_date: lastVersionDate,
        datasets: datasetList,
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
