import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getRealPricesSync, loadRealPriceData } from "@/data/csvLoader";
import { getMacroDataSync, loadMacroData } from "@/data/macroLoader";
import { setMacroMarketData, setRealMarketData } from "@/data/investments";
import { OnboardingTour } from "@/components/OnboardingTour";
import { AppHeader } from "@/components/AppHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import Education from "./pages/Education";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import ModelPortfolios from "./pages/ModelPortfolios";
import ModelPortfolioDetail from "./pages/ModelPortfolioDetail";
import ValidacaoTcc from "./pages/ValidacaoTcc";

const queryClient = new QueryClient();
const SESSION_START_KEY_PREFIX = "ii_auth_session_started_at_";
const SESSION_MAX_AGE_HOURS_RAW = Number(import.meta.env.VITE_SESSION_MAX_AGE_HOURS ?? "48");
const SESSION_MAX_AGE_HOURS =
  Number.isFinite(SESSION_MAX_AGE_HOURS_RAW) && SESSION_MAX_AGE_HOURS_RAW > 0
    ? SESSION_MAX_AGE_HOURS_RAW
    : 48;
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_HOURS * 60 * 60 * 1000;

function getSessionStartKey(userId: string) {
  return `${SESSION_START_KEY_PREFIX}${userId}`;
}

function getSessionStart(userId: string): number | null {
  const raw = localStorage.getItem(getSessionStartKey(userId));
  if (!raw) return null;
  const timestamp = Number(raw);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function AuthenticatedLayout() {
  const { pathname } = useLocation();
  const activePage =
    pathname.startsWith("/carteira")
      ? "carteira"
      : pathname.startsWith("/ativos")
        ? "ativos"
        : pathname.startsWith("/aprender")
          ? "aprender"
          : "dashboard";

  return (
    <>
      <AppHeader activePage={activePage} />
      <Outlet />
    </>
  );
}

function AppContent() {
  const [dataVersion, setDataVersion] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null | undefined>(undefined);
  const location = useLocation();
  const isAuthResolved = currentUserId !== undefined;
  const isPublicRoute = location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session;
      const userId = session?.user?.id ?? null;
      if (!userId) {
        setCurrentUserId(null);
        return;
      }

      const currentStart = getSessionStart(userId);
      const now = Date.now();
      if (currentStart == null) {
        localStorage.setItem(getSessionStartKey(userId), String(now));
      } else if (now - currentStart > SESSION_MAX_AGE_MS) {
        await supabase.auth.signOut({ scope: "local" });
        localStorage.removeItem(getSessionStartKey(userId));
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(userId);
    });

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      const userId = session?.user?.id ?? null;

      if (!userId) {
        setCurrentUserId(null);
        return;
      }

      const key = getSessionStartKey(userId);
      const now = Date.now();
      const currentStart = getSessionStart(userId);

      if (event === "SIGNED_IN") {
        localStorage.setItem(key, String(now));
        setCurrentUserId(userId);
        return;
      }

      if (currentStart == null) {
        localStorage.setItem(key, String(now));
        setCurrentUserId(userId);
        return;
      }

      if (now - currentStart > SESSION_MAX_AGE_MS) {
        await supabase.auth.signOut({ scope: "local" });
        localStorage.removeItem(key);
        setCurrentUserId(null);
        return;
      }

      setCurrentUserId(userId);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const startTour = () => {
      if (isPublicRoute || !currentUserId) return;
      setShowTour(true);
    };
    window.addEventListener("ii:start-tour", startTour as EventListener);
    return () => window.removeEventListener("ii:start-tour", startTour as EventListener);
  }, [isPublicRoute, currentUserId]);

  useEffect(() => {
    const refreshAllData = async (forceRefresh = false) => {
      try {
        // Load datasets (version-aware; only downloads when a new version is available).
        const [priceData, macroData] = await Promise.all([
          loadRealPriceData(forceRefresh),
          loadMacroData(forceRefresh),
        ]);
        if (Object.keys(priceData).length > 0) {
          setRealMarketData(priceData);
        }
        if (macroData) {
          setMacroMarketData(macroData);
        }
        // Force re-render/remount so UI recomputes values with latest loaded prices/macros.
        setDataVersion((v) => v + 1);
      } catch (e) {
        console.warn("[App] preload failed:", e);
      }
    };

    void refreshAllData(false);

    const onPricesUpdated = () => {
      const latest = getRealPricesSync();
      if (!latest || Object.keys(latest).length === 0) return;
      setRealMarketData(latest);
      setDataVersion((v) => v + 1);
    };

    const onMacroUpdated = () => {
      const latest = getMacroDataSync();
      if (!latest) return;
      setMacroMarketData(latest);
      setDataVersion((v) => v + 1);
    };

    // Light version check every hour (no 5-minute/full refresh loops).
    const intervalId = window.setInterval(() => {
      void refreshAllData(true);
    }, 60 * 60 * 1000);
    window.addEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
    window.addEventListener("ii:macro-data-updated", onMacroUpdated as EventListener);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("ii:prices-data-updated", onPricesUpdated as EventListener);
      window.removeEventListener("ii:macro-data-updated", onMacroUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    const forceTour = sessionStorage.getItem("force_onboarding_tour") === "1";

    if (!currentUserId || isPublicRoute) {
      setShowTour(false);
      return;
    }

    const legacySeen = localStorage.getItem("onboarding_completed") === "true";
    const userSeenKey = `onboarding_completed_${currentUserId}`;

    if (legacySeen && localStorage.getItem(userSeenKey) !== "true") {
      localStorage.setItem(userSeenKey, "true");
    }

    if (forceTour) {
      setShowTour(true);
      sessionStorage.removeItem("force_onboarding_tour");
      return;
    }

    // Keep the tour open while navigating through guided steps.
    if (showTour) return;

    const userSeen = localStorage.getItem(userSeenKey) === "true";
    setShowTour(!userSeen);
  }, [currentUserId, isPublicRoute, showTour]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("ii:tour-visibility", {
        detail: { open: showTour },
      })
    );
  }, [showTour]);

  const handleTourComplete = () => {
    if (currentUserId) {
      localStorage.setItem(`onboarding_completed_${currentUserId}`, "true");
    }
    localStorage.setItem("onboarding_completed", "true");
    window.dispatchEvent(
      new CustomEvent("ii:onboarding-tour-complete", {
        detail: { userId: currentUserId },
      })
    );
    setShowTour(false);
  };

  return (
    <>
      <AnimatePresence>{showTour && currentUserId && !isPublicRoute && <OnboardingTour onComplete={handleTourComplete} />}</AnimatePresence>
      <Toaster />
      <Sonner />
      <ScrollToTop />
      <AnimatePresence mode="sync">
        <Routes location={location}>
          <Route
            path="/"
            element={
              !isAuthResolved ? null : currentUserId ? <Navigate to="/dashboard" replace /> : <Landing />
            }
          />
          <Route
            path="/login"
            element={!isAuthResolved ? null : currentUserId ? <Navigate to="/dashboard" replace /> : <Login />}
          />
          <Route path="/validacaotcc" element={<ValidacaoTcc />} />
          <Route path="/validacao-tcc" element={<ValidacaoTcc />} />
          <Route element={<AuthenticatedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/carteira" element={<Portfolio />} />
            <Route path="/ativos" element={<Assets />} />
            <Route path="/ativos/carteiras-modelo" element={<ModelPortfolios />} />
            <Route path="/ativos/carteiras-modelo/:id" element={<ModelPortfolioDetail />} />
            <Route path="/ativos/:symbol" element={<AssetDetail />} />
            <Route path="/aprender" element={<Education />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="ii_theme">
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


