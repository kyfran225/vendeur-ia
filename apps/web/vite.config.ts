import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Vendeur IA OS",
        short_name: "VendeurIA",
        description: "Votre machine de vente intelligente",
        theme_color: "#052e16", // Emeraude Foncé / Coal
        background_color: "#0a0a0a",
        display: "standalone",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put all node_modules into a vendor chunk
          if (id.includes('node_modules')) {
            // Split big libraries into their own chunks
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('framer-motion')) return 'vendor-animation';
            if (id.includes('axios') || id.includes('socket.io')) return 'vendor-network';
            if (id.includes('react')) return 'vendor-react';

            return 'vendor'; // all other deps
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit as we are now splitting
  }
});
