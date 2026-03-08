import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { loadRealPriceData } from "@/data/csvLoader";
import { loadMacroData } from "@/data/macroLoader";
import { setMacroMarketData, setRealMarketData } from "@/data/investments";
import { OnboardingTour } from "@/components/OnboardingTour";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import Education from "./pages/Education";
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
  const location = useLocation();

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_completed");
    const forced = sessionStorage.getItem("force_onboarding_tour") === "1";
    if (!seen || forced) {
      setShowTour(true);
      if (forced) sessionStorage.removeItem("force_onboarding_tour");
    }
  }, []);

  useEffect(() => {
    const startTour = () => setShowTour(true);
    window.addEventListener("ii:start-tour", startTour as EventListener);
    return () => window.removeEventListener("ii:start-tour", startTour as EventListener);
  }, []);

  useEffect(() => {
    const refreshAllData = async (forceRefresh = false) => {
      try {
        // Preload CSV + macro data and inject into market history cache.
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

    const intervalId = window.setInterval(() => {
      void refreshAllData(true);
    }, 5 * 60 * 1000);

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        void refreshAllData(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityOrFocus);
    window.addEventListener("focus", onVisibilityOrFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
      window.removeEventListener("focus", onVisibilityOrFocus);
    };
  }, []);

  return (
    <>
      <AnimatePresence>{showTour && <OnboardingTour onComplete={() => { localStorage.setItem("onboarding_completed", "true"); setShowTour(false); }} />}</AnimatePresence>
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
