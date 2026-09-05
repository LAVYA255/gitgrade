import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repo from /gitgrade/, so built asset URLs need that prefix.
// Local dev and any root-domain host (Vercel, Cloudflare Pages) stay at "/".
const base = process.env.GITHUB_PAGES === "true" ? "/gitgrade/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
  build: { outDir: "dist" },
});
