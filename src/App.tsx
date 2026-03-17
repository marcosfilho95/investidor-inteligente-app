import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getRealPricesSync, loadRealPriceData } from "@/data/csvLoader";
import { getMacroDataSync, loadMacroData } from "@/data/macroLoader";
import { setMacroMarketData, setRealMarketData } from "@/data/investments";
import { OnboardingTour } from "@/components/OnboardingTour";
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

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function AppContent() {
  const [dataVersion, setDataVersion] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const location = useLocation();
  const isPublicRoute = location.pathname === "/" || location.pathname === "/login";

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setCurrentUserId(data.user?.id ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
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
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/carteira" element={<Portfolio />} />
          <Route path="/ativos" element={<Assets />} />
          <Route path="/ativos/:symbol" element={<AssetDetail />} />
          <Route path="/aprender" element={<Education />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
