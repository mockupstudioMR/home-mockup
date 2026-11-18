import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorReporting } from "./lib/errorReporting";
import { installI18n } from "./i18n";
import { asset } from "@/lib/asset";

installGlobalErrorReporting();
installI18n();

window.addEventListener("vite:preloadError", () => {
  const reloadKey = "hm_preload_reload_attempted";
  if (sessionStorage.getItem(reloadKey) === "true") return;

  sessionStorage.setItem(reloadKey, "true");
  window.location.reload();
});

window.addEventListener("load", () => {
  sessionStorage.removeItem("hm_preload_reload_attempted");
});

createRoot(document.getElementById("root")!).render(<App />);

// --- PWA service worker registration (production only, never inside iframe/preview) ---
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host === "localhost" ||
  host === "127.0.0.1";

if (isPreviewHost || isInIframe) {
  // Make sure no stale SW from a previous visit interferes inside preview
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if ("serviceWorker" in navigator) {
  // A new version takes over as soon as it is published: the new service worker activates straight away
  // (skipWaiting, clientsClaim), and the page reloads once when it takes control, so nobody keeps seeing the
  // old layout from the cache. The first install doesn't reload (there was no old version to replace).
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(asset("/sw.js")).then((reg) => {
      // look for a new version whenever the app comes back to the front, and every 30 minutes
      const check = () => { reg.update().catch(() => undefined); };
      document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
      window.setInterval(check, 30 * 60 * 1000);
    }).catch(() => {
      /* silent */
    });
  });
}
