import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Wallet, PieChart, BookOpen, Bell, LogOut, User, HelpCircle, Database, Menu, X, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { fetchDataStatus, type DataStatus } from "@/data/dataStatus";
import { useTheme } from "next-themes";

interface AppHeaderProps {
  activePage: "dashboard" | "carteira" | "ativos" | "aprender";
}
const AVATAR_BUCKET = "profile-avatars";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", key: "dashboard" as const },
  { label: "Carteira", icon: Wallet, href: "/carteira", key: "carteira" as const },
  { label: "Ativos", icon: PieChart, href: "/ativos", key: "ativos" as const },
  { label: "Aprender", icon: BookOpen, href: "/aprender", key: "aprender" as const },
];

const AVATAR_STORAGE_PREFIX = "ii_profile_avatar_";
const getAvatarStorageKeys = (id?: string) => (id ? [`${AVATAR_STORAGE_PREFIX}${id}`] : []);
const getCurrentAvatarFromCache = () => {
  const cached = localStorage.getItem("ii_profile_avatar_current");
  return typeof cached === "string" && cached.length > 0 ? cached : null;
};
const clearAllAvatarCache = () => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(AVATAR_STORAGE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem("ii_profile_avatar_current");
};

export function AppHeader({ activePage }: AppHeaderProps) {
  const [userName, setUserName] = useState(() => localStorage.getItem("ii_user_name") || "IN");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => getCurrentAvatarFromCache());
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTourMenu, setShowTourMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(
    () => sessionStorage.getItem("ii_tour_keep_mobile_menu_open") === "1"
  );
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(
    () => localStorage.getItem("ii_has_unread_notifications") !== "0"
  );
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const isTourMenuLocked = sessionStorage.getItem("ii_tour_keep_mobile_menu_open") === "1";
  const lastVersionDateLabel =
    dataStatus?.last_version_date && !Number.isNaN(new Date(dataStatus.last_version_date).getTime())
      ? new Date(dataStatus.last_version_date).toLocaleDateString("pt-BR")
      : null;

  const syncUserAndAvatar = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data.user;

    if (error || !user) {
      setUserName("IN");
      setAvatarUrl(null);
      localStorage.removeItem("ii_user_name");
      clearAllAvatarCache();
      return;
    }

    const name = user.user_metadata?.name;
    const firstName =
      (typeof name === "string" && name.trim().length > 0 ? name.split(" ")[0] : user.email?.split("@")[0]) || "IN";
    setUserName(firstName);
    localStorage.setItem("ii_user_name", firstName);

    const avatarKeys = getAvatarStorageKeys(user.id);
    const localAvatar = avatarKeys.map((k) => localStorage.getItem(k)).find((v) => typeof v === "string" && v.length > 0) || null;
    if (localAvatar) {
      setAvatarUrl(localAvatar);
      localStorage.setItem("ii_profile_avatar_current", localAvatar);
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      if (localAvatar) {
        setAvatarUrl(localAvatar);
      } else {
        setAvatarUrl(null);
        for (const key of avatarKeys) localStorage.removeItem(key);
        localStorage.removeItem("ii_profile_avatar_current");
      }
      return;
    }

    let resolvedAvatar = profileData?.avatar_url ?? null;

    if (!resolvedAvatar) {
      const { data: avatarObjects } = await supabase.storage
        .from(AVATAR_BUCKET)
        .list(user.id, { limit: 10, search: "avatar.jpg" });
      const hasAvatar = (avatarObjects || []).some((obj) => obj.name === "avatar.jpg");
      if (hasAvatar) {
        const avatarPath = `${user.id}/avatar.jpg`;
        const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
        resolvedAvatar = `${publicUrlData.publicUrl}?v=${Date.now()}`;
      }
    }

    if (resolvedAvatar) {
      setAvatarUrl(resolvedAvatar);
      for (const key of avatarKeys) localStorage.setItem(key, resolvedAvatar);
      localStorage.setItem("ii_profile_avatar_current", resolvedAvatar);
      return;
    }

    if (localAvatar) {
      setAvatarUrl(localAvatar);
      localStorage.setItem("ii_profile_avatar_current", localAvatar);
      return;
    }

    setAvatarUrl(null);
    for (const key of avatarKeys) localStorage.removeItem(key);
    localStorage.removeItem("ii_profile_avatar_current");
  }, []);

  useEffect(() => {
    void syncUserAndAvatar();
    fetchDataStatus().then(setDataStatus).catch(() => {});
  }, [syncUserAndAvatar]);

  useEffect(() => {
    const onAvatarUpdated = () => {
      void syncUserAndAvatar();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("ii_profile_avatar_")) {
        void syncUserAndAvatar();
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void syncUserAndAvatar();
    });

    window.addEventListener("ii:profile-avatar-updated", onAvatarUpdated as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("ii:profile-avatar-updated", onAvatarUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncUserAndAvatar]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const isTourMenuLocked = sessionStorage.getItem("ii_tour_keep_mobile_menu_open") === "1";
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (tourRef.current && !tourRef.current.contains(e.target as Node)) setShowTourMenu(false);
      if (!isTourMenuLocked && mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const openMobileMenu = () => setShowMobileMenu(true);
    const closeMobileMenu = () => {
      const isTourMenuLocked = sessionStorage.getItem("ii_tour_keep_mobile_menu_open") === "1";
      if (isTourMenuLocked) return;
      setShowMobileMenu(false);
    };
    window.addEventListener("ii:tour-open-mobile-menu", openMobileMenu as EventListener);
    window.addEventListener("ii:tour-close-mobile-menu", closeMobileMenu as EventListener);
    return () => {
      window.removeEventListener("ii:tour-open-mobile-menu", openMobileMenu as EventListener);
      window.removeEventListener("ii:tour-close-mobile-menu", closeMobileMenu as EventListener);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("ii_user_name");
    clearAllAvatarCache();
    toast({ title: "Até logo! 👋", description: "Você saiu da sua conta." });
    navigate("/login");
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">Investidor Inteligente</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.key} to={item.href}
                data-tour={`nav-${item.key}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  item.key === activePage ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            data-tour="theme-toggle"
            title={resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            aria-label={resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            className="hidden md:flex h-8 px-2.5 rounded-lg items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {resolvedTheme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span className="text-[11px] font-medium">
              {resolvedTheme === "dark" ? "Claro" : "Escuro"}
            </span>
          </button>

          <div className="md:hidden relative" ref={mobileMenuRef}>
            <button
              onClick={() => {
                const isTourMenuLocked = sessionStorage.getItem("ii_tour_keep_mobile_menu_open") === "1";
                if (isTourMenuLocked) {
                  setShowMobileMenu(true);
                  return;
                }
                setShowMobileMenu((v) => !v);
              }}
              data-tour="mobile-menu-toggle"
              aria-label="Abrir menu de navegação"
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                showMobileMenu
                  ? "bg-primary/20 text-primary ring-1 ring-primary/50 shadow-[0_0_18px_rgba(34,197,94,0.28)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <AnimatePresence>
              {showMobileMenu && (
                <motion.div
                  initial={isTourMenuLocked ? false : { opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={`absolute right-0 top-10 w-56 rounded-2xl border border-border p-2 shadow-xl z-50 ${
                    isTourMenuLocked ? "bg-card/85 backdrop-blur-md" : "bg-card"
                  }`}
                >
                  {navItems.map((item) => (
                    <Link
                      key={`mobile-${item.key}`}
                      to={item.href}
                      data-tour={`nav-${item.key}`}
                      onClick={() => {
                        const isTourMenuLocked = sessionStorage.getItem("ii_tour_keep_mobile_menu_open") === "1";
                        if (!isTourMenuLocked) setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm transition-colors ${
                        item.key === activePage
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-foreground/80 hover:text-foreground hover:bg-accent/80"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            data-tour="theme-toggle"
            title={resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            aria-label={resolvedTheme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
            className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {resolvedTheme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Data status indicator */}
          {dataStatus && (
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-muted-foreground" title={
              dataStatus.health === "ok"
                ? (lastVersionDateLabel ? `Dados atualizados em ${lastVersionDateLabel}` : "Dados atualizados")
                : dataStatus.health === "no_data"
                  ? "Usando dados locais (fallback)"
                  : "Pipeline degradado - usando último dataset válido"
            }>
              <Database className="h-3 w-3" />
              <span>
                {dataStatus.health === "ok" && dataStatus.last_version_date
                  ? `Dados: ${new Date(dataStatus.last_version_date).toLocaleDateString("pt-BR")}`
                  : dataStatus.health === "degraded"
                    ? "Dados: fallback"
                    : "Dados: local"}
              </span>
              <div className={`h-1.5 w-1.5 rounded-full ${
                dataStatus.health === "ok" ? "bg-green-500" : dataStatus.health === "degraded" ? "bg-yellow-500" : "bg-muted-foreground"
              }`} />
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef} data-tour="notifications">
            <button onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
              if (hasUnreadNotifications) {
                setHasUnreadNotifications(false);
                localStorage.setItem("ii_has_unread_notifications", "0");
              }
            }}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative">
              <Bell className="h-4 w-4" />
              {hasUnreadNotifications && (
                <div className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-10 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 origin-top-right"
                >
                  <h4 className="text-sm font-semibold mb-3">Notificações</h4>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-muted/50 text-xs">
                      <p className="font-medium">📈 PETR4 subiu 2.5% hoje</p>
                      <p className="text-muted-foreground mt-0.5">Há 2 horas</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/50 text-xs">
                      <p className="font-medium">💰 Dividendos de BBAS3 creditados</p>
                      <p className="text-muted-foreground mt-0.5">Há 1 dia</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/50 text-xs">
                      <p className="font-medium">📊 Novo conteúdo na aba Aprender</p>
                      <p className="text-muted-foreground mt-0.5">Há 3 dias</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tutorial replay */}
          <div className="relative" ref={tourRef}>
            <button onClick={() => setShowTourMenu(!showTourMenu)}
              data-tour="help-tutorial"
              title="Ajuda"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <HelpCircle className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showTourMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-10 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 origin-top-right"
                >
                  <button
                    onClick={() => {
                      setShowTourMenu(false);
                      localStorage.removeItem("onboarding_completed");
                      sessionStorage.setItem("force_onboarding_tour", "1");
                      window.dispatchEvent(new CustomEvent("ii:start-tour"));
                      navigate("/dashboard");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    🎓 Gostaria de rever o tutorial?
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef} data-tour="user-menu">
            <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-xs font-bold text-primary ml-1 hover:bg-primary/30 transition-colors cursor-pointer">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar do usuário"
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                userName.slice(0, 2).toUpperCase()
              )}
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 top-10 w-48 rounded-2xl border border-border bg-card p-2 shadow-xl z-50 origin-top-right"
                >
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-[10px] text-muted-foreground">Investidor</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/perfil");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    <User className="h-3.5 w-3.5" /> Meu perfil
                  </button>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors">
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}



