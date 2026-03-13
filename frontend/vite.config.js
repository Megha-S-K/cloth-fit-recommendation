import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy API calls to FastAPI backend (avoids CORS issues during dev)
    proxy: {
      "/auth": "http://localhost:8000",
      "/options": "http://localhost:8000",
      "/recommend": "http://localhost:8000",
      "/debug": "http://localhost:8000",
    },
  },
});