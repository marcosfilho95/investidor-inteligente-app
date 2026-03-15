import { supabase } from "@/integrations/supabase/client";
import {
  normalizeInvestorProfile,
  saveInvestorProfileToStorage,
  type InvestorProfileSummary,
} from "@/lib/investorIntelligence";

export async function loadInvestorProfileFromDatabase(userId: string) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("investor_profile_type, investor_profile_score, investor_profile_answers, investor_profile_created_at, investor_profile_updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data || !data.investor_profile_answers) return null;

    return normalizeInvestorProfile({
      type: data.investor_profile_type,
      score: data.investor_profile_score,
      answers: data.investor_profile_answers,
      updatedAt: data.investor_profile_updated_at || data.investor_profile_created_at || null,
    });
  } catch {
    return null;
  }
}

export async function persistInvestorProfile(
  user: { id: string; email?: string | null; user_metadata?: { name?: string; [key: string]: unknown } },
  profile: InvestorProfileSummary
) {
  const nowIso = new Date().toISOString();
  const userId = user.id;
  const email = user.email || "";
  const name = String(user.user_metadata?.name || "");

  await supabase.auth.updateUser({
    data: { investor_profile: profile },
  });

  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("investor_profile_created_at")
      .eq("user_id", userId)
      .maybeSingle();

    const createdAt = existing?.investor_profile_created_at || nowIso;

    await supabase
      .from("profiles")
      .upsert(
        {
          user_id: userId,
          email,
          name,
          investor_profile_type: profile.type,
          investor_profile_score: profile.score,
          investor_profile_answers: profile.answers,
          investor_profile_created_at: createdAt,
          investor_profile_updated_at: nowIso,
        },
        { onConflict: "user_id" }
      );
  } catch {
    // keep auth metadata/local storage as fallback when DB fields are unavailable
  }

  saveInvestorProfileToStorage(userId, profile);
  if (email) saveInvestorProfileToStorage(email, profile);
}

