import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import sitemapPlugin from "vite-plugin-sitemap";

async function readRequestBody(request: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function createDevApiPlugin() {
  const routeModules = new Map([
    ["/api/contact", "/api/contact.mjs"],
    ["/api/admin/forms", "/api/admin/forms.mjs"],
  ]);

  return {
    name: "fh61-dev-api-bridge",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next();

        const pathname = req.url.split("?")[0];
        const moduleId = routeModules.get(pathname);
        if (!moduleId) return next();

        try {
          const rawBody =
            req.method && req.method !== "GET" && req.method !== "HEAD"
              ? await readRequestBody(req)
              : "";

          if (rawBody) {
            const contentType = String(req.headers["content-type"] || "");
            if (contentType.includes("application/json")) {
              try {
                (req as import("node:http").IncomingMessage & { body?: unknown }).body =
                  JSON.parse(rawBody);
              } catch {
                (req as import("node:http").IncomingMessage & { body?: unknown }).body =
                  rawBody;
              }
            } else {
              (req as import("node:http").IncomingMessage & { body?: unknown }).body =
                rawBody;
            }
          } else {
            (req as import("node:http").IncomingMessage & { body?: unknown }).body =
              undefined;
          }

          const module = await server.ssrLoadModule(moduleId);
          const handler = module.default;
          if (typeof handler !== "function") {
            throw new Error(`No default handler exported from ${moduleId}`);
          }

          const wrappedRes = res as import("node:http").ServerResponse & {
            status?: (code: number) => typeof wrappedRes;
            json?: (payload: unknown) => void;
          };

          wrappedRes.status = (code: number) => {
            wrappedRes.statusCode = code;
            return wrappedRes;
          };

          wrappedRes.json = (payload: unknown) => {
            if (!wrappedRes.headersSent) {
              wrappedRes.setHeader("Content-Type", "application/json; charset=utf-8");
            }
            wrappedRes.end(JSON.stringify(payload));
          };

          await handler(req, wrappedRes);
        } catch (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              ok: false,
              error: "DEV_API_BRIDGE_FAILED",
              detail: String(error instanceof Error ? error.message : error),
            })
          );
        }
      });
    },
  };
}

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
      createDevApiPlugin(),
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
    optimizeDeps: {
      exclude: [
        "firebase-admin",
        "firebase-admin/app",
        "firebase-admin/auth",
        "firebase-admin/firestore",
      ],
    },
  };
});
