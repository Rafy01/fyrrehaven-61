import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemapPlugin from "vite-plugin-sitemap";

export default defineConfig({
  plugins: [
    react(),
    sitemapPlugin({
      hostname: "https://fyrrehaven-61.dk",
      generateRobotsTxt: false,
      exclude: ["/guest/**"], // udeluk gæstesider
    }),
  ],
  build: {
    sourcemap: true,
  },
});
