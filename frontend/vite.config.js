/**
 * vite.config.js — Vite Build & Dev Server Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Vite replaces Create React App as the build tool. Key benefits:
 *   - Near-instant dev server startup (no upfront bundling)
 *   - Lightning-fast Hot Module Replacement (HMR)
 *   - Faster production builds via Rollup
 *
 * This file is only used during development and build — it's not shipped
 * to the browser.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // enables JSX transform and Fast Refresh

export default defineConfig({
  plugins: [
    // @vitejs/plugin-react enables:
    //   - Automatic JSX transform (no need to import React in every file)
    //   - React Fast Refresh (component state is preserved on hot reload)
    react(),
  ],

  server: {
    port: 3000, // match the port the browser expects (same as CRA default)

    proxy: {
      // During development, forward any request starting with /api to the
      // Express backend on port 3001. This avoids CORS issues and means the
      // frontend code never needs to know the backend's host/port.
      //
      // e.g. fetch("/api/transactions") in the browser →
      //       http://localhost:3001/api/transactions on the server
      "/api": {
        target:       "http://localhost:3001",
        changeOrigin: true, // rewrites the Host header to match the target
      },
    },
  },

  build: {
    // Output production files to /build (matches what CRA produced,
    // so any deployment scripts that expect a "build" folder still work)
    outDir: "build",
  },
});
