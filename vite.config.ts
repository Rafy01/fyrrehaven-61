import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import sitemapPlugin from "vite-plugin-sitemap";

type HumanVerifyRequest = IncomingMessage & {
  body?: unknown;
};

type HumanVerifyResponse = ServerResponse & {
  json: (payload: unknown) => HumanVerifyResponse;
  status: (statusCode: number) => HumanVerifyResponse;
};

type HumanVerifyHandler = (
  req: HumanVerifyRequest,
  res: HumanVerifyResponse
) => Promise<void>;

function readRequestBody(req: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function createJsonResponse(res: ServerResponse): HumanVerifyResponse {
  const response = res as HumanVerifyResponse;

  response.status = (statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  };

  response.json = (payload: unknown) => {
    if (!response.headersSent) {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    response.end(JSON.stringify(payload));
    return response;
  };

  return response;
}

function humanVerifyDevApi(): Plugin {
  return {
    name: "fh61-human-verify-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/human-verify")) {
          next();
          return;
        }

        try {
          const handlerUrl = `${new URL("./api/human-verify.mjs", import.meta.url).href}?t=${Date.now()}`;
          const module = (await import(handlerUrl)) as { default: HumanVerifyHandler };
          const apiReq = req as HumanVerifyRequest;
          apiReq.body = await readRequestBody(req);
          await module.default(apiReq, createJsonResponse(res));
        } catch {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
          }
          res.end(JSON.stringify({ ok: false, error: "DEV_API_ERROR" }));
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
      humanVerifyDevApi(),
      sitemapPlugin({
        hostname: "https://fyrrehaven-61.dk",
        generateRobotsTxt: false,
        exclude: ["/guest/**"], // udeluk gæstesider
      }),
    ],
    build: {
      sourcemap: true,
    },
  };
});
