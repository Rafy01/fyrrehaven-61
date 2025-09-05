// /api/chat-unknown.mjs  (ESM, Vercel serverless)
import { google } from "googleapis";

/* ---------- Sheets client ---------- */
function getSheetsClient() {
  const sheetId = process.env.GSHEET_ID || "";
  const tab = process.env.GSHEET_TAB || "Unknowns";
  if (!sheetId) throw new Error("GSHEET_ID missing");

  let clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
  let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
  const json = process.env.GOOGLE_SHEETS_CREDENTIALS_JSON || "";

  if (json) {
    try {
      const parsed = JSON.parse(json);
      clientEmail = parsed.client_email || clientEmail;
      privateKey = parsed.private_key || privateKey;
    } catch {
      // ignore, fall back to individual envs
    }
  }
  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_SHEETS credentials missing");
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, sheetId, tab };
}

/* ---------- Helpers ---------- */
const ok = (res, data) => res.status(200).json({ ok: true, ...data });
const bad = (res, code, error, detail) =>
  res.status(code).json({ ok: false, error, ...(detail ? { detail } : {}) });

function isAdmin(req) {
  const want = process.env.ADMIN_TOKEN || "";
  const got = req.headers?.authorization || "";
  return want && got === `Bearer ${want}`;
}

function rid() {
  return (
    (typeof crypto !== "undefined" && crypto.randomUUID?.()) ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
  );
}

/* Find data-rækker + deres rowIndex (2-baseret pga. header) */
async function readAll({ q = "", lang = "", onlyOpen = false, limit = 500 }) {
  const { sheets, sheetId, tab } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:H`,
    majorDimension: "ROWS",
  });

  const rows = res.data.values || [];
  if (rows.length === 0) return [];

  const [header, ...data] = rows;
  // header: ts_iso | id | lang | question | page | user_agent | ip | status
  const ix = {
    ts_iso: header.indexOf("ts_iso"),
    id: header.indexOf("id"),
    lang: header.indexOf("lang"),
    question: header.indexOf("question"),
    page: header.indexOf("page"),
    user_agent: header.indexOf("user_agent"),
    ip: header.indexOf("ip"),
    status: header.indexOf("status"),
  };

  const qlc = q.toLowerCase().trim();

  const parsed = data
    .map((r, i) => {
      const rowIndex = i + 2; // data starter i række 2
      const tsStr = (r[ix.ts_iso] || "").toString();
      const ts = Date.parse(tsStr) || Date.now();
      const status = ((r[ix.status] || "") + "").toLowerCase();
      return {
        rowIndex,
        id: (r[ix.id] || "").toString(),
        lang: (r[ix.lang] || "da").toString(),
        q: (r[ix.question] || "").toString(),
        page: (r[ix.page] || "").toString(),
        ua: (r[ix.user_agent] || "").toString(),
        ip: (r[ix.ip] || "").toString(),
        ts,
        done: status.startsWith("done"),
      };
    })
    .filter((x) => x.id && x.q);

  const filtered = parsed
    .filter((r) => (lang ? r.lang === lang : true))
    .filter((r) => (onlyOpen ? !r.done : true))
    .filter((r) => (qlc ? r.q.toLowerCase().includes(qlc) : true))
    .sort((a, b) => b.ts - a.ts)
    .slice(0, Math.min(limit, 1000));

  return filtered;
}

async function appendRow(item) {
  const { sheets, sheetId, tab } = getSheetsClient();
  const values = [
    [
      new Date(item.ts).toISOString(), // ts_iso
      item.id, // id
      item.lang, // lang
      item.q, // question
      item.page || "", // page
      item.ua || "", // user_agent
      item.ip || "", // ip
      item.done ? "done" : "open", // status
    ],
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${tab}!A:A`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

async function updateStatusById(id, nextStatus /* "open" | "done" */) {
  const items = await readAll({ limit: 2000 });
  const hit = items.find((x) => x.id === id);
  if (!hit) return false;

  const { sheets, sheetId, tab } = getSheetsClient();
  // status er kolonne H
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${tab}!H${hit.rowIndex}:H${hit.rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[nextStatus]] },
  });
  return true;
}

async function deleteById(id) {
  const items = await readAll({ limit: 2000 });
  const hit = items.find((x) => x.id === id);
  if (!hit) return false;

  const { sheets, sheetId, tab } = getSheetsClient();

  // Slet selve rækken
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getSheetGid(sheets, sheetId, tab),
              dimension: "ROWS",
              startIndex: hit.rowIndex - 1,
              endIndex: hit.rowIndex,
            },
          },
        },
      ],
    },
  });
  return true;
}

async function getSheetGid(sheets, spreadsheetId, tabName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = (meta.data.sheets || []).find(
    (s) => s.properties?.title === tabName
  );
  if (!sheet || typeof sheet.properties?.sheetId !== "number") {
    throw new Error(`Tab '${tabName}' not found`);
  }
  return sheet.properties.sheetId;
}

/* ---------- API handler ---------- */
export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { q, lang = "da", page = "" } = req.body || {};
      if (!q || typeof q !== "string") {
        return bad(res, 400, "VALIDATION_ERROR", "Missing 'q'");
      }
      const id = rid();
      const ts = Date.now();

      const ip =
        (req.headers["x-forwarded-for"] || "")
          .toString()
          .split(",")[0]
          .trim() || "";
      const ua = (req.headers["user-agent"] || "").toString();

      await appendRow({ id, q, lang, page, ts, ip, ua, done: false });
      return ok(res, { id });
    }

    if (req.method === "GET") {
      if (!isAdmin(req)) return bad(res, 401, "UNAUTHORIZED");
      const url = new URL(req.url, "https://x");
      const limit = Math.min(
        Number(url.searchParams.get("limit") || 500),
        1000
      );
      const lang = url.searchParams.get("lang") || "";
      const onlyOpen = url.searchParams.get("onlyOpen") === "1";
      const q = (url.searchParams.get("q") || "").trim();

      const items = await readAll({ q, lang, onlyOpen, limit });
      return ok(res, { items, source: "sheets" });
    }

    if (req.method === "PATCH") {
      if (!isAdmin(req)) return bad(res, 401, "UNAUTHORIZED");
      const { id, done } = req.body || {};
      if (!id) return bad(res, 400, "VALIDATION_ERROR", "Missing 'id'");
      const next =
        typeof done === "boolean" ? (done ? "done" : "open") : "done";
      const okUpd = await updateStatusById(id, next);
      if (!okUpd) return bad(res, 404, "NOT_FOUND");
      return ok(res, { id, status: next });
    }

    if (req.method === "DELETE") {
      if (!isAdmin(req)) return bad(res, 401, "UNAUTHORIZED");
      const url = new URL(req.url, "https://x");
      const id = url.searchParams.get("id");
      if (!id) return bad(res, 400, "VALIDATION_ERROR", "Missing ?id");
      const okDel = await deleteById(id);
      if (!okDel) return bad(res, 404, "NOT_FOUND");
      return ok(res, { removed: id });
    }

    return bad(res, 405, "METHOD_NOT_ALLOWED");
  } catch (err) {
    console.error("CHAT_SHEETS_API_ERROR", err);
    return bad(res, 500, "SERVER_ERROR", String(err?.message || err));
  }
}
