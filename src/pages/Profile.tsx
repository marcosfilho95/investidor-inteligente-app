import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, LogOut, ChevronRight, Wallet, TrendingUp, PieChart, Camera, GraduationCap, ShieldCheck, BellRing } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { useToast } from "@/hooks/use-toast";
import {
  calculatePortfolioRisk,
  loadInvestorProfileFromStorage,
  normalizeInvestorProfile,
  type InvestorProfileSummary,
} from "@/lib/investorIntelligence";
import { InvestorProfileOnboardingModal } from "@/components/InvestorProfileOnboardingModal";
import { loadInvestorProfileFromDatabase, persistInvestorProfile } from "@/lib/investorProfilePersistence";
import { getAiTaxonomy } from "@/data/investments";

type RiskPolicyType = "conservadora" | "moderada" | "sofisticada";

interface RiskMisalignmentTracker {
  startedAt: string;
  lastDetectedAt: string;
}

const isRiskPolicyType = (value: string | null): value is RiskPolicyType =>
  value === "conservadora" || value === "moderada" || value === "sofisticada";

const getRiskPolicyStorageKey = (id?: string, email?: string) =>
  `ii_risk_policy_${id || email || "anonymous"}`;
const getRiskMisalignmentStorageKey = (id?: string, email?: string) =>
  `ii_risk_misalignment_${id || email || "anonymous"}`;

const DAY_MS = 24 * 60 * 60 * 1000;

const toLocalDayId = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromDayId = (dayId: string) => new Date(`${dayId}T00:00:00`);

const getDayDiff = (startDayId: string, endDayId: string) =>
  Math.floor((fromDayId(endDayId).getTime() - fromDayId(startDayId).getTime()) / DAY_MS);

const mapInvestorProfileToRiskPolicy = (type?: InvestorProfileSummary["type"]): RiskPolicyType => {
  if (type === "Conservador") return "conservadora";
  if (type === "Arrojado") return "sofisticada";
  return "moderada";
};
const AVATAR_BUCKET = "profile-avatars";

const getAvatarStorageKeys = (id?: string, email?: string, name?: string) =>
  Array.from(
    new Set(
      [`ii_profile_avatar_${id || ""}`, `ii_profile_avatar_${email || ""}`, `ii_profile_avatar_${name || ""}`].filter(
        (k) => !k.endsWith("_")
      )
    )
  );

const Profile = () => {
  const [userName, setUserName] = useState("Investidor");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameFinalized, setUsernameFinalized] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfileSummary | null>(null);
  const [riskPolicy, setRiskPolicy] = useState<RiskPolicyType>("moderada");
  const [misalignmentTracker, setMisalignmentTracker] = useState<RiskMisalignmentTracker | null>(null);
  const [showProfileOnboarding, setShowProfileOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const { enrichedHoldings, totalValue, portfolioMetrics } = useUserHoldings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getUsernameStorageKey = (id?: string, email?: string) =>
    `ii_profile_username_${id || email || "anonymous"}`;

  const normalizeUsername = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 32);

  const buildFallbackUsername = () => {
    const fromState = normalizeUsername(usernameDraft || username);
    if (fromState) return fromState;
    const fromEmail = normalizeUsername((userEmail || "").split("@")[0] || "usuario");
    return fromEmail || "usuario";
  };

  const resizeImageToBlob = (file: File, maxSize = 320): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = typeof reader.result === "string" ? reader.result : null;
        if (!src) {
          reject(new Error("Falha ao ler imagem"));
          return;
        }

        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Falha ao processar imagem"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Falha ao processar imagem"));
                return;
              }
              resolve(blob);
            },
            "image/jpeg",
            0.86
          );
        };
        img.onerror = () => reject(new Error("Falha ao carregar imagem"));
        img.src = src;
      };
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;

        if (!data.user) {
          navigate("/login");
          return;
        }

        const name = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Investidor";
        setUserId(data.user.id);
        setUserName(name);
        setUserEmail(data.user.email || "");
        setUserCreatedAt(data.user.created_at || "");

        const profileFromDatabase = await loadInvestorProfileFromDatabase(data.user.id);
        const profileFromMetadata = normalizeInvestorProfile(data.user.user_metadata?.investor_profile);
        const profileFromStorage =
          loadInvestorProfileFromStorage(data.user.id) ||
          loadInvestorProfileFromStorage(data.user.email || "");
        const initialProfile = profileFromDatabase || profileFromMetadata || profileFromStorage;
        if (initialProfile && mounted) {
          setInvestorProfile(initialProfile);
        }

        const riskPolicyStorageKey = getRiskPolicyStorageKey(data.user.id, data.user.email || "");
        const storedRiskPolicy = localStorage.getItem(riskPolicyStorageKey);
        if (initialProfile?.type) {
          setRiskPolicy(mapInvestorProfileToRiskPolicy(initialProfile.type));
        } else if (isRiskPolicyType(storedRiskPolicy)) {
          setRiskPolicy(storedRiskPolicy);
        } else {
          setRiskPolicy("moderada");
        }

        const authUsername = normalizeUsername(String(data.user.user_metadata?.username || ""));
        const usernameStorageKey = getUsernameStorageKey(data.user.id, data.user.email || "");
        const cachedUsername = normalizeUsername(localStorage.getItem(usernameStorageKey) || "");

        const initialResolvedUsername = authUsername || cachedUsername;
        if (mounted && initialResolvedUsername) {
          setUsername(initialResolvedUsername);
          setUsernameDraft(initialResolvedUsername);
          setUsernameFinalized(true);
        }

        let profileData: { username?: string | null; avatar_url?: string | null } | null = null;
        const profileQuery = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (profileQuery.error) {
          const fallbackQuery = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", data.user.id)
            .maybeSingle();
          profileData = (fallbackQuery.data ?? null) as { username?: string | null; avatar_url?: string | null } | null;
        } else {
          profileData = (profileQuery.data ?? null) as { username?: string | null; avatar_url?: string | null } | null;
        }

        if (!mounted) return;

        const dbUsername = normalizeUsername(profileData?.username || "");
        const resolvedUsername = dbUsername || authUsername || cachedUsername;

        setUsername(resolvedUsername);
        setUsernameDraft(resolvedUsername);
        setUsernameFinalized(resolvedUsername.trim().length > 0);

        if (resolvedUsername) {
          localStorage.setItem(usernameStorageKey, resolvedUsername);
        }

        const avatarKeys = getAvatarStorageKeys(data.user.id, data.user.email || "", name);
        let resolvedAvatar = profileData?.avatar_url ?? null;
        if (!resolvedAvatar) {
          const { data: avatarObjects } = await supabase.storage
            .from(AVATAR_BUCKET)
            .list(data.user.id, { limit: 10, search: "avatar.jpg" });
          const hasAvatar = (avatarObjects || []).some((obj) => obj.name === "avatar.jpg");
          if (hasAvatar) {
            const avatarPath = `${data.user.id}/avatar.jpg`;
            const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
            resolvedAvatar = `${publicUrlData.publicUrl}?v=${Date.now()}`;
          }
        }
        if (resolvedAvatar) {
          setAvatarUrl(resolvedAvatar);
          for (const key of avatarKeys) localStorage.setItem(key, resolvedAvatar);
          localStorage.setItem("ii_profile_avatar_current", resolvedAvatar);
        } else {
          const cachedAvatar = [localStorage.getItem("ii_profile_avatar_current"), ...avatarKeys.map((k) => localStorage.getItem(k))]
            .find((v) => typeof v === "string" && v.length > 0) || null;
          if (cachedAvatar) setAvatarUrl(cachedAvatar);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!userId && !userEmail) return;
    localStorage.setItem(getRiskPolicyStorageKey(userId, userEmail), riskPolicy);
  }, [riskPolicy, userEmail, userId]);

  useEffect(() => {
    if (!investorProfile?.type) return;
    setRiskPolicy(mapInvestorProfileToRiskPolicy(investorProfile.type));
  }, [investorProfile?.type]);

  const handleSaveUsername = async () => {
    const usernameLocked = usernameFinalized || username.trim().length > 0;
    if (usernameLocked) {
      toast({
        title: "Nome de usuário bloqueado",
        description: "O nome de usuário pode ser definido apenas uma vez.",
      });
      return;
    }

    const normalized = normalizeUsername(usernameDraft.trim());
    if (!normalized || normalized.length < 3) {
      toast({
        title: "Nome de usuário inválido",
        description: "Use ao menos 3 caracteres: letras, números, . _ -",
        variant: "destructive",
      });
      return;
    }
    if (!userId) return;

    setSavingUsername(true);
    try {
      const { data: currentProfile, error: readError } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();
      if (readError) throw readError;

      const currentUsername = normalizeUsername(currentProfile?.username || "");
      if (currentUsername) {
        toast({
          title: "Nome de usuário bloqueado",
          description: "Este usuário já foi definido anteriormente e não pode ser alterado.",
        });
        setUsername(currentUsername);
        setUsernameDraft(currentUsername);
        setUsernameFinalized(true);
        localStorage.setItem(getUsernameStorageKey(userId, userEmail), currentUsername);
        return;
      }

      const { data: upsertedProfile, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            name: userName || "",
            email: userEmail || "",
            username: normalized,
          },
          { onConflict: "user_id" }
        )
        .select("username")
        .maybeSingle();

      if (upsertError) throw upsertError;
      let persistedUsername = upsertedProfile?.username ?? null;

      if (!persistedUsername) {
        // Fallback de consistência: em alguns cenários de RLS, upsert pode não retornar linha.
        const { data: afterUpsertProfile, error: afterReadError } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", userId)
          .maybeSingle();
        if (afterReadError) throw afterReadError;
        persistedUsername = normalizeUsername(afterUpsertProfile?.username || "") || normalized;
      }

      await supabase.auth.updateUser({ data: { username: normalized } });
      setUsername(persistedUsername);
      setUsernameDraft(persistedUsername);
      setUsernameFinalized(true);
      localStorage.setItem(getUsernameStorageKey(userId, userEmail), persistedUsername);
      toast({ title: "Nome de usuário salvo", description: "Agora você pode entrar com usuário ou e-mail." });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error || "");
      toast({
        title: "Erro ao salvar",
        description: errMsg.includes("profiles_username_unique_idx")
          ? "Esse nome de usuário já está em uso."
          : errMsg.includes("username_locked_once_set")
            ? "Nome de usuário já foi definido e não pode mais ser alterado."
            : errMsg || "Não foi possível atualizar o nome de usuário.",
        variant: "destructive",
      });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = e.target.files?.[0];
    if (!file) return;
    if (!userId) {
      toast({ title: "Perfil indisponível", description: "Tente novamente em instantes.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo invalido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    try {
      const blob = await resizeImageToBlob(file);
      const avatarPath = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(avatarPath, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
      const storageUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

      const { data: upserted, error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: userId,
            name: userName || "",
            email: userEmail || "",
            username: buildFallbackUsername(),
            avatar_url: storageUrl,
          },
          { onConflict: "user_id" }
        )
        .select("avatar_url")
        .maybeSingle();
      if (error) throw error;
      const persistedAvatar = upserted?.avatar_url ?? storageUrl;

      setAvatarUrl(persistedAvatar);
      const avatarKeys = getAvatarStorageKeys(userId, userEmail, userName);
      for (const key of avatarKeys) localStorage.setItem(key, persistedAvatar);
      localStorage.setItem("ii_profile_avatar_current", persistedAvatar);
      window.dispatchEvent(new CustomEvent("ii:profile-avatar-updated", { detail: { keys: avatarKeys, url: persistedAvatar } }));
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi sincronizada entre dispositivos." });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error || "");
      const normalizedErr = errMsg.toLowerCase();
      toast({
        title: "Erro ao salvar foto",
        description: normalizedErr.includes("bucket not found")
          ? "Bucket de avatar não encontrado no Supabase. Aplique a migration de storage e tente novamente."
          : normalizedErr.includes("row-level security") || normalizedErr.includes("new row violates")
            ? "Permissao negada pelo RLS do Storage para avatar. Aplique a migration de bucket/policies de profile-avatars no ambiente atual."
            : errMsg || "Nao foi possivel salvar a foto no perfil.",
        variant: "destructive",
      });
    }
    if (input) input.value = "";
  };

  const handleAvatarRemove = async () => {
    try {
      if (userId) {
        const avatarPath = `${userId}/avatar.jpg`;
        await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
      }
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", userId);
      if (error) throw error;
      setAvatarUrl(null);
      const avatarKeys = getAvatarStorageKeys(userId, userEmail, userName);
      for (const key of avatarKeys) localStorage.removeItem(key);
      localStorage.removeItem("ii_profile_avatar_current");
      window.dispatchEvent(new CustomEvent("ii:profile-avatar-updated", { detail: { keys: avatarKeys, url: null } }));
      toast({ title: "Foto removida", description: "Avatar voltou para o padrao." });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error || "");
      toast({
        title: "Erro ao remover foto",
        description: errMsg || "Nao foi possivel remover a foto.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("ii_user_name");
    toast({ title: "Ate logo!", description: "Voce saiu da sua conta." });
    navigate("/login");
  };

  const memberSince = userCreatedAt
    ? new Date(userCreatedAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })
    : "-";
  const usernameLocked = usernameFinalized || username.trim().length > 0;
  const portfolioRisk = useMemo(() => {
    const riskInput = enrichedHoldings.map((h) => {
      const tax = getAiTaxonomy(h.symbol, h.sector, h.subsetor);
      return {
        symbol: h.symbol,
        setor_macro: tax.setor_macro,
        subsetor: tax.subsetor,
        modeloNegocio: tax.modelo_negocio,
        perfilDividendos: tax.perfil_dividendos,
        perfilDefensivo: tax.perfil_defensivo,
        riscoEstatal: tax.risco_estatal,
        allocationPct: h.allocation,
        score: h.score ?? null,
        upsidePct: h.upside ?? null,
        dividendPct: h.dividend ?? null,
        pe: h.pe ?? null,
        pvp: h.pvp ?? null,
        roePct: h.roe ?? null,
        roicPct: h.roic ?? null,
        margemLiquidaPct: h.margemLiquida ?? null,
        margemEbitPct: h.margemEbit ?? null,
        divLiqEbitda: h.divLiqEbitda ?? null,
        divLiqPl: h.divLiqPl ?? null,
        liqCorrente: h.liqCorrente ?? null,
        basileia: h.basileia ?? null,
        lpa: h.lpa ?? null,
        cLucro5aPct: h.cLucro5a ?? null,
        cReceita5aPct: h.cReceita5a ?? null,
        payoutPct: h.payout ?? null,
      };
    });
    return calculatePortfolioRisk(riskInput, investorProfile);
  }, [enrichedHoldings, investorProfile]);

  const policyMeta = useMemo(() => {
    const weightedScore = portfolioRisk.totalScore;
    const highRiskPct = portfolioRisk.riskExposure?.alto ?? 0;
    if (riskPolicy === "conservadora") {
      const within = weightedScore <= 30 && highRiskPct <= 30;
      return {
        label: "Conservadora",
        range: "0-30 pontos",
        highRiskRule: "Alto risco até 30%",
        status: within ? "Dentro da política" : "Acima da política",
      };
    }
    if (riskPolicy === "moderada") {
      const below = weightedScore < 31 || highRiskPct < 40;
      const within = weightedScore >= 31 && weightedScore <= 60 && highRiskPct >= 40 && highRiskPct <= 50;
      return {
        label: "Moderada",
        range: "31-60 pontos",
        highRiskRule: "Alto risco entre 40% e 50%",
        status: within ? "Dentro da política" : below ? "Abaixo da política" : "Acima da política",
      };
    }
    if (riskPolicy === "sofisticada") {
      const within = weightedScore > 60 && highRiskPct > 60;
      return {
        label: "Sofisticada",
        range: "61-100 pontos",
        highRiskRule: "Alto risco acima de 60%",
        status: within ? "Dentro da política" : "Abaixo da política",
      };
    }
    return {
      label: "Moderada",
      range: "31-60 pontos",
      highRiskRule: "Alto risco entre 40% e 50%",
      status: "Abaixo da política",
    };
  }, [portfolioRisk.riskExposure?.alto, portfolioRisk.totalScore, riskPolicy]);
  const currentRiskScore = Math.min(100, Math.max(0, portfolioRisk.totalScore));
  const riskPointerColor =
    portfolioRisk.classification === "Baixo"
      ? "bg-gain"
      : portfolioRisk.classification === "Moderado"
        ? "bg-warning"
        : "bg-loss";
  const incompatibleWithPolicy = policyMeta.status === "Abaixo da política" || policyMeta.status === "Acima da política";
  useEffect(() => {
    if (!userId && !userEmail) return;
    const storageKey = getRiskMisalignmentStorageKey(userId, userEmail);
    const today = toLocalDayId(new Date());
    const raw = localStorage.getItem(storageKey);
    let current: RiskMisalignmentTracker | null = null;
    if (raw) {
      try {
        current = JSON.parse(raw) as RiskMisalignmentTracker;
      } catch {
        current = null;
      }
    }

    if (!incompatibleWithPolicy) {
      localStorage.removeItem(storageKey);
      setMisalignmentTracker(null);
      return;
    }

    if (!current || !current.startedAt || !current.lastDetectedAt) {
      const initial = { startedAt: today, lastDetectedAt: today };
      localStorage.setItem(storageKey, JSON.stringify(initial));
      setMisalignmentTracker(initial);
      return;
    }

    if (current.lastDetectedAt === today) {
      setMisalignmentTracker(current);
      return;
    }

    const gapDays = getDayDiff(current.lastDetectedAt, today);
    const updated: RiskMisalignmentTracker =
      gapDays <= 1
        ? { ...current, lastDetectedAt: today }
        : { startedAt: today, lastDetectedAt: today };
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setMisalignmentTracker(updated);
  }, [incompatibleWithPolicy, userEmail, userId]);

  const misalignmentDays = useMemo(() => {
    if (!misalignmentTracker) return 0;
    const today = toLocalDayId(new Date());
    return Math.max(1, getDayDiff(misalignmentTracker.startedAt, today) + 1);
  }, [misalignmentTracker]);
  const shouldSuggestProfileRedefinition =
    incompatibleWithPolicy && misalignmentDays >= 10;

  const riskStatusClass =
    policyMeta.status === "Dentro da política"
      ? "text-gain bg-gain/10 border-gain/25"
      : policyMeta.status === "Acima da política"
        ? "text-loss bg-loss/10 border-loss/25"
        : "text-warning bg-warning/10 border-warning/25";

  const rentabilidade = portfolioMetrics.totalGainPercent;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader activePage="dashboard" />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-pulse text-muted-foreground text-sm">Carregando perfil...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activePage="dashboard" />
      <PageTransition>
        <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-card/80 via-card/50 to-primary/[0.04]">
            <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-primary/[0.07] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-primary/[0.05] blur-3xl pointer-events-none" />

            <div className="relative z-10 p-8 flex flex-col sm:flex-row items-center gap-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col items-center gap-2"
              >
                <label
                  htmlFor="profile-avatar-input"
                  className="relative h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-[0_0_32px_-8px] shadow-primary/20 overflow-hidden group cursor-pointer"
                  title="Alterar foto de perfil"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto de perfil" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-primary">{initials}</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/25 transition-colors">
                    <Camera className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="absolute top-[68px] right-0 h-6 w-6 rounded-lg bg-primary flex items-center justify-center border-2 border-card shadow-[0_0_14px_-2px] shadow-primary/70">
                  <Camera className="h-3 w-3 text-primary-foreground" />
                </div>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Remover foto
                  </button>
                )}
              </motion.div>

              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold">{userName}</h1>
                <p className="text-sm text-muted-foreground mt-1">{userEmail}</p>
                <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Membro desde {memberSince}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resumo do Portfólio</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Wallet,
                  label: "Patrimônio",
                  value: `R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                  compact: true,
                },
                {
                  icon: TrendingUp,
                  label: "Rentabilidade",
                  value: `${rentabilidade}%`,
                  color: rentabilidade >= 0 ? "text-gain" : "text-loss",
                },
                { icon: PieChart, label: "Ativos", value: String(enrichedHoldings.length) },
              ].map((item, i) => (
                <AnimatedCard key={item.label} delay={i * 0.06}>
                  <div className="glass-card p-4 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className={`text-lg whitespace-nowrap font-bold font-mono mt-0.5 leading-none tracking-tight ${item.color || "text-foreground"}`}>{item.value}</p>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informações da Conta</h2>
            </div>

            <AnimatedCard delay={0.2}>
              <div className="glass-card divide-y divide-border/30">
                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-accent/80 flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="text-sm font-medium">{userName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-accent/80 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium">{userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-accent/80 flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Nome de usuário</p>
                    {usernameLocked ? (
                      <p className="text-sm font-medium">{username}</p>
                    ) : (
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={usernameDraft}
                          onChange={(e) => setUsernameDraft(normalizeUsername(e.target.value))}
                          placeholder="ex: marcos123"
                          className="w-full max-w-[220px] px-3 py-1.5 rounded-md bg-background/80 border border-border/50 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleSaveUsername}
                          disabled={savingUsername || normalizeUsername(usernameDraft) === username}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50"
                        >
                          {savingUsername ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-accent/80 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Membro desde</p>
                    <p className="text-sm font-medium">{memberSince}</p>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Perfil do Investidor</h2>
            </div>

            <AnimatedCard delay={0.18}>
              <div className="glass-card p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/12 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-base font-semibold leading-tight">
                        {investorProfile ? investorProfile.type : "Perfil não definido"}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      {investorProfile ? (
                        <>
                          <span className="inline-flex items-center rounded-full bg-muted/50 px-2.5 py-1 text-muted-foreground">
                            {investorProfile.horizon}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-muted/50 px-2.5 py-1 text-muted-foreground">
                            {investorProfile.mainGoal}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Responda o questionário para personalizar as análises da IA.
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowProfileOnboarding(true)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    {investorProfile ? "Redefinir perfil" : "Responder questionário"}
                  </button>
                </div>

                <div className="mt-5 pt-5 border-t border-border/30 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Risco atual da carteira</p>
                      <p className="text-2xl font-bold font-mono leading-tight mt-1">
                        {portfolioRisk.totalScore.toFixed(1)} pts
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Faixa atual: {portfolioRisk.classification} | Alto risco: {(portfolioRisk.riskExposure?.alto ?? 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/35 bg-background/35 p-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
                      <span>Termômetro de risco da carteira</span>
                      <span>{currentRiskScore.toFixed(1)} / 100 pts</span>
                    </div>
                    <div className="relative">
                      <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400/85 via-amber-400/85 to-rose-400/85" />
                      <div
                        className="absolute top-1/2 -translate-y-1/2"
                        style={{ left: `calc(${currentRiskScore}% - 6px)` }}
                      >
                        <div className={`h-3 w-3 rounded-full border-2 border-background shadow-[0_0_0_2px_rgba(15,23,42,0.35)] ${riskPointerColor}`} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Conservador (0-30)</span>
                      <span>Moderado (31-60)</span>
                      <span>Arrojado (61-100)</span>
                    </div>
                  </div>

                  {incompatibleWithPolicy && (
                    <div className="rounded-xl border border-warning/30 bg-warning/10 p-3">
                      <div className="flex items-start gap-2">
                        <BellRing className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Compatibilidade em monitoramento</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Sua carteira está fora do perfil de risco definido. Se persistir, vale revisar sua estratégia ou atualizar seu perfil.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {shouldSuggestProfileRedefinition && (
                    <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/8 to-transparent p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">Hora de revisar seu perfil?</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Já são {misalignmentDays} dias com a carteira fora da política. Refazer o perfil pode deixar as recomendações da IA mais alinhadas ao seu comportamento real.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowProfileOnboarding(true)}
                          className="px-3 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                        >
                          Redefinir perfil agora
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AnimatedCard>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Atalhos</h2>
            </div>

            <AnimatedCard delay={0.3}>
              <div className="glass-card divide-y divide-border/30">
                {[
                  { label: "Minha Carteira", desc: "Ver ativos e alocação", href: "/carteira", icon: Wallet },
                  { label: "Explorar Ativos", desc: "Analisar ações da B3", href: "/ativos", icon: PieChart },
                  { label: "Aprender", desc: "Trilhas educativas", href: "/aprender", icon: GraduationCap },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </AnimatedCard>
          </div>

          <AnimatedCard delay={0.4}>
            <button
              onClick={handleLogout}
              className="w-full glass-card p-4 flex items-center gap-4 hover:bg-destructive/5 hover:border-destructive/20 transition-all group"
            >
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-destructive">Sair da conta</p>
                <p className="text-xs text-muted-foreground">Encerrar sessão atual</p>
              </div>
            </button>
          </AnimatedCard>
        </main>
      </PageTransition>

      <InvestorProfileOnboardingModal
        open={showProfileOnboarding}
        initialAnswers={investorProfile?.answers}
        onOpenChange={setShowProfileOnboarding}
        onComplete={async (profile) => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          await persistInvestorProfile(
            { id: user.id, email: user.email, user_metadata: user.user_metadata as { name?: string; [key: string]: unknown } },
            profile
          );
          setInvestorProfile(profile);
          toast({
            title: "Perfil atualizado",
            description: `${profile.type}.`,
          });
        }}
      />
    </div>
  );
};

export default Profile;




