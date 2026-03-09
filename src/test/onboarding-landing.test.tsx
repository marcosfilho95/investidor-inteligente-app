import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import App from "../App";

vi.mock("@/data/csvLoader", () => ({
  loadRealPriceData: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/data/macroLoader", () => ({
  loadMacroData: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/data/investments", () => ({
  setMacroMarketData: vi.fn(),
  setRealMarketData: vi.fn(),
}));

vi.mock("@/components/OnboardingTour", () => ({
  OnboardingTour: () => <div data-testid="onboarding-tour">onboarding</div>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe("onboarding guard on public routes", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("does not show onboarding on landing page even with forced flag", async () => {
    window.history.pushState({}, "", "/");
    sessionStorage.setItem("force_onboarding_tour", "1");

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByTestId("onboarding-tour")).not.toBeInTheDocument();
    });
  });
});

