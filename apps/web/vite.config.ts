import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
