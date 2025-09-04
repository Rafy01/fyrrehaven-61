// /api/chat-unknown.mjs (ESM)
import { kv } from "@vercel/kv";

/* Keys */
const ZSET = "chat:unknown:ids"; // sorted set over ids (score = ts)
const HKEY = (id) => `chat:unknown:${id}`; // hash pr. id

/* Admin auth */
function isAdmin(req) {
  const want = process.env.ADMIN_TOKEN || "";
  const got = req.headers?.authorization || "";
  return want && got === `Bearer ${want}`;
}

/* Small helpers */
const ok = (res, data) => res.status(200).json({ ok: true, ...data });
const bad = (res, code, error, detail) =>
  res.status(code).json({ ok: false, error, ...(detail ? { detail } : {}) });

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      // Create new unknown
      const { q, lang = "da", page = "" } = req.body || {};
      if (!q || typeof q !== "string") {
        return bad(res, 400, "VALIDATION_ERROR", "Missing 'q'");
      }
      const id =
        (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const ts = Date.now();
      const item = { id, q, lang, page, ts, done: false };

      await kv.hset(HKEY(id), item);
      await kv.zadd(ZSET, { score: ts, member: id });

      return ok(res, { id });
    }

    if (req.method === "GET") {
      if (!isAdmin(req)) return bad(res, 401, "UNAUTHORIZED");
      const url = new URL(req.url, "https://x");
      const limit = Math.min(
        Number(url.searchParams.get("limit") || 500),
        1000
      );
      const lang = url.searchParams.get("lang") || ""; // "da" | "en" | ""
      const onlyOpen = url.searchParams.get("onlyOpen") === "1";
      const q = (url.searchParams.get("q") || "").toLowerCase().trim();

      const ids = await kv.zrange(ZSET, -limit, -1); // newest last → vi sorterer efterfølgende
      const items = await Promise.all(
        ids.map(async (id) => (await kv.hgetall(HKEY(id))) || null)
      );

      const filtered = (items.filter(Boolean) || [])
        .filter((r) => (lang ? r.lang === lang : true))
        .filter((r) => (onlyOpen ? !r.done : true))
        .filter((r) => (q ? String(r.q).toLowerCase().includes(q) : true))
        .sort((a, b) => Number(b.ts) - Number(a.ts));

      return ok(res, { items: filtered });
    }

    if (req.method === "PATCH") {
      if (!isAdmin(req)) return bad(res, 401, "UNAUTHORIZED");
      const { id, done } = req.body || {};
      if (!id) return bad(res, 400, "VALIDATION_ERROR", "Missing 'id'");

      const key = HKEY(id);
      const item = await kv.hgetall(key);
      if (!item) return bad(res, 404, "NOT_FOUND");

      const next = {
        ...item,
        done: typeof done === "boolean" ? done : !item.done,
      };
      await kv.hset(key, next);
      return ok(res, { item: next });
    }

    if (req.method === "DELETE") {
      if (!isAdmin(req)) return bad(res, 401, "UNAUTHORIZED");
      const url = new URL(req.url, "https://x");
      const id = url.searchParams.get("id");
      const all = url.searchParams.get("all") === "1";

      if (id) {
        await kv.del(HKEY(id));
        await kv.zrem(ZSET, id);
        return ok(res, { removed: id });
      }

      if (all) {
        const ids = await kv.zrange(ZSET, 0, -1);
        if (ids.length) {
          await Promise.all(ids.map((x) => kv.del(HKEY(x))));
          await kv.zremrangebyrank(ZSET, 0, -1);
        }
        return ok(res, { removedAll: ids.length });
      }

      return bad(res, 400, "VALIDATION_ERROR", "Provide ?id=... or ?all=1");
    }

    return bad(res, 405, "METHOD_NOT_ALLOWED");
  } catch (err) {
    console.error("CHAT_UNKNOWN_API_ERROR", err);
    return bad(
      res,
      500,
      "SERVER_ERROR",
      String(err && err.message ? err.message : err)
    );
  }
}
