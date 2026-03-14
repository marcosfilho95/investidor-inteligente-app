import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, LogOut, ChevronRight, Wallet, TrendingUp, PieChart, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { PageTransition, AnimatedCard } from "@/components/PageTransition";
import { useUserHoldings } from "@/hooks/useUserHoldings";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [userName, setUserName] = useState("Investidor");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { enrichedHoldings, totalValue } = useUserHoldings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const avatarStorageKey = `ii_profile_avatar_${userEmail || userName}`;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate("/login");
        return;
      }

      const name = data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Investidor";
      setUserId(data.user.id);
      setUserName(name);
      setUserEmail(data.user.email || "");
      setUserCreatedAt(data.user.created_at || "");
      const persistedAvatar = localStorage.getItem(`ii_profile_avatar_${data.user.email || name}`);
      if (persistedAvatar) setAvatarUrl(persistedAvatar);

      supabase
        .from("profiles")
        .select("username")
        .eq("user_id", data.user.id)
        .maybeSingle()
        .then(({ data: profileData }) => {
          const dbUsername = profileData?.username || "";
          setUsername(dbUsername);
          setUsernameDraft(dbUsername);
        });

      setLoading(false);
    });
  }, [navigate]);

  const normalizeUsername = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 32);

  const handleSaveUsername = async () => {
    const usernameLocked = username.trim().length > 0;
    if (usernameLocked) {
      toast({
        title: "Nome de usuario bloqueado",
        description: "O nome de usuario pode ser definido apenas uma vez.",
      });
      return;
    }

    const normalized = normalizeUsername(usernameDraft.trim());
    if (!normalized || normalized.length < 3) {
      toast({
        title: "Nome de usuario invalido",
        description: "Use ao menos 3 caracteres: letras, numeros, . _ -",
        variant: "destructive",
      });
      return;
    }
    if (!userId) return;

    setSavingUsername(true);
    try {
      const { error } = await supabase.from("profiles").update({ username: normalized }).eq("user_id", userId);
      if (error) throw error;

      await supabase.auth.updateUser({ data: { username: normalized } });
      setUsername(normalized);
      setUsernameDraft(normalized);
      toast({ title: "Nome de usuario salvo", description: "Agora voce pode entrar com usuario ou e-mail." });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error?.message?.includes("profiles_username_unique_idx")
          ? "Esse nome de usuario ja esta em uso."
          : error?.message || "Nao foi possivel atualizar o nome de usuario.",
        variant: "destructive",
      });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleAvatarPick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo invalido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      setAvatarUrl(result);
      localStorage.setItem(avatarStorageKey, result);
      localStorage.setItem("ii_profile_avatar_current", result);
      window.dispatchEvent(new CustomEvent("ii:profile-avatar-updated", { detail: { key: avatarStorageKey, url: result } }));
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi personalizada." });
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  };

  const handleAvatarRemove = () => {
    setAvatarUrl(null);
    localStorage.removeItem(avatarStorageKey);
    localStorage.removeItem("ii_profile_avatar_current");
    window.dispatchEvent(new CustomEvent("ii:profile-avatar-updated", { detail: { key: avatarStorageKey, url: null } }));
    toast({ title: "Foto removida", description: "Avatar voltou para o padrao." });
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
  const usernameLocked = username.trim().length > 0;

  const totalInvested = enrichedHoldings.reduce((s, h) => s + h.avgPrice * h.shares, 0);
  const totalGain = enrichedHoldings.reduce((s, h) => s + (h.totalGainValue ?? (h.price - h.avgPrice) * h.shares), 0);
  const rentabilidade = totalInvested > 0 ? Math.round((totalGain / totalInvested) * 10000) / 100 : 0;
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
                <button
                  type="button"
                  onClick={handleAvatarPick}
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
                </button>
                <input
                  ref={avatarInputRef}
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Resumo do Portfolio</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  icon: Wallet,
                  label: "Patrimonio",
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informacoes da Conta</h2>
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
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="h-9 w-9 rounded-xl bg-accent/80 flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Nome de usuario</p>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={usernameDraft}
                        onChange={(e) => setUsernameDraft(normalizeUsername(e.target.value))}
                        placeholder="ex: marcos123"
                        disabled={usernameLocked}
                        className="w-full max-w-[220px] px-3 py-1.5 rounded-md bg-background/80 border border-border/50 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                      />
                      {!usernameLocked && (
                        <button
                          type="button"
                          onClick={handleSaveUsername}
                          disabled={savingUsername || normalizeUsername(usernameDraft) === username}
                          className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground disabled:opacity-50"
                        >
                          {savingUsername ? "Salvando..." : "Salvar"}
                        </button>
                      )}
                    </div>
                    {usernameLocked && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Nome de usuario definido e bloqueado (edicao unica).
                      </p>
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
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Atalhos</h2>
            </div>

            <AnimatedCard delay={0.3}>
              <div className="glass-card divide-y divide-border/30">
                {[
                  { label: "Minha Carteira", desc: "Ver ativos e alocacao", href: "/carteira", icon: Wallet },
                  { label: "Explorar Ativos", desc: "Analisar acoes da B3", href: "/ativos", icon: PieChart },
                  { label: "Aprender", desc: "Trilhas educativas", href: "/aprender", icon: TrendingUp },
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
                <p className="text-xs text-muted-foreground">Encerrar sessao atual</p>
              </div>
            </button>
          </AnimatedCard>
        </main>
      </PageTransition>
    </div>
  );
};

export default Profile;

