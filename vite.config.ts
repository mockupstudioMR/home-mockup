import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Disable in dev to avoid stale caching inside Lovable preview iframe
      devOptions: { enabled: false },
      injectRegister: null, // we register manually with iframe/preview guard in main.tsx
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
      ],
      manifest: false, // we ship our own /manifest.webmanifest
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/, /^\/auth/],
        cleanupOutdatedCaches: true,
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
        // Don't make every visitor download export libraries (PDF, screenshot)
        // and staff-only dashboards up front; they load on demand when used.
        globIgnores: [
          "**/jspdf*.js",
          "**/html2canvas*.js",
          "**/purify.es*.js",
          "**/index.es-*.js",
          "**/AdminDashboard-*.js",
          "**/DesignerDashboard-*.js",
          "**/ShopDashboard-*.js",
          "**/AnalyticsDashboard-*.js",
        ],
        // Raise precache limit to 5 MiB so large style images don't break the build
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-tooltip", "@radix-ui/react-popover"],
        },
      },
    },
  },
}));
