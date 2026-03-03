import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { loadRealPriceData } from "@/data/csvLoader";
import { loadMacroData } from "@/data/macroLoader";
import { setMacroMarketData, setRealMarketData } from "@/data/investments";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Index";
import Portfolio from "./pages/Portfolio";
import Assets from "./pages/Assets";
import AssetDetail from "./pages/AssetDetail";
import Education from "./pages/Education";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    // Preload real CSV price data and inject into market history cache
    Promise.all([loadRealPriceData(), loadMacroData()])
      .then(([priceData, macroData]) => {
        if (Object.keys(priceData).length > 0) {
          setRealMarketData(priceData);
        }
        if (macroData) {
          setMacroMarketData(macroData);
        }
        // Force re-render/remount so UI recomputes values with latest loaded prices/macros
        setDataVersion((v) => v + 1);
      })
      .catch((e) => {
        console.warn("[App] preload failed:", e);
      });
  }, []);

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes key={dataVersion}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/carteira" element={<Portfolio />} />
          <Route path="/ativos" element={<Assets />} />
          <Route path="/ativos/:symbol" element={<AssetDetail />} />
          <Route path="/aprender" element={<Education />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
