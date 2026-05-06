import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare const __APP_VERSION__: string;

const APP_VERSION_KEY = "ii_app_version";
const APP_REFRESH_GUARD_KEY = "ii_app_refresh_guard";
const REFRESH_GUARD_TTL_MS = 30_000;

async function forceRefreshOnNewVersion() {
  if (!import.meta.env.PROD) return;
  const currentVersion = String(__APP_VERSION__ || "");
  if (!currentVersion) return;

  const previousVersion = localStorage.getItem(APP_VERSION_KEY);
  const guardRaw = sessionStorage.getItem(APP_REFRESH_GUARD_KEY);
  const guardTs = guardRaw ? Number(guardRaw) : 0;
  const guardActive = Number.isFinite(guardTs) && Date.now() - guardTs < REFRESH_GUARD_TTL_MS;

  if (!previousVersion) {
    localStorage.setItem(APP_VERSION_KEY, currentVersion);
    return;
  }

  if (previousVersion === currentVersion) return;
  if (guardActive) return;

  sessionStorage.setItem(APP_REFRESH_GUARD_KEY, String(Date.now()));
  localStorage.setItem(APP_VERSION_KEY, currentVersion);

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // best effort
  }

  window.location.reload();
}

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    if (import.meta.env.PROD) {
      void forceRefreshOnNewVersion();
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((registration) => {
          registration.update();
          registration.addEventListener("updatefound", () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.addEventListener("statechange", () => {
              if (worker.state === "activated") {
                // Service worker novo ativo: recarrega para garantir assets atuais.
                void forceRefreshOnNewVersion();
              }
            });
          });
        })
        .catch((error) => {
        console.warn("[PWA] Service worker registration failed:", error);
        });
      return;
    }

    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister()))
      )
      .catch(() => undefined);
  });
}
