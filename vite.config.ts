import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  optimizeDeps: {
    // MapLibre v6 worker bundling can fail during dependency pre-bundling.
    exclude: ["maplibre-gl"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "stamp-logo.svg"],
      manifest: {
        name: "ParkStamp",
        short_name: "ParkStamp",
        description: "Stamp the U.S. state parks you’ve visited",
        theme_color: "#1B2A4A",
        background_color: "#F3EFE6",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "stamp-logo.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,ico,woff2}"],
        globIgnores: ["**/data/states/**"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/data/"),
            handler: "CacheFirst",
            options: {
              cacheName: "parkstamp-data",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.hostname.includes("openfreemap.org") ||
              url.hostname.includes("tiles.openfreemap.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "parkstamp-map-tiles",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
    }),
  ],
});
