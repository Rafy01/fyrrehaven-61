import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemapPlugin from "vite-plugin-sitemap";

const sitemapOptions: {
  hostname: string;
  generateRobotsTxt?: boolean;
  transform?: (route: string | string[]) => string | string[] | null;
} = {
  hostname: "https://fyrrehaven-61.dk",
  // Generér robots.txt
  generateRobotsTxt: true,
  // Filtrér ruter og ekskludér fx gæstesider
  transform: (route: string | string[]) => {
    if (route.includes("/guest/")) return null; // exclude
    return route;
  },
};

export default defineConfig({
  plugins: [
    react(),
    sitemapPlugin(sitemapOptions),
  ],
  build: {
    sourcemap: true,
  },
});
