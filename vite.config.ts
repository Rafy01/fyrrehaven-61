import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import sitemapPlugin from "vite-plugin-sitemap";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  return {
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
      chunkSizeWarningLimit: 900,
    },
  };
});
