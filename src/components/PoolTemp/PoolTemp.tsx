import * as React from "react";

type Resp =
  | { ok: true; celsius: number; updatedAt: string }
  | { ok: false; error: string };

export default function PoolTemp() {
  const [data, setData] = React.useState<Resp | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/pool-temp");
        const j: Resp = await r.json();
        if (alive) setData(j);
      } catch (e) {
        if (alive)
          setData({
            ok: false,
            error: e instanceof Error ? e.message : "Network error",
          });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return <div role="status">Pool: henter…</div>;
  if (!data.ok) return <div role="status">Pool: {data.error}</div>;

  return (
    <div aria-live="polite" style={card}>
      <div style={label}>Pool</div>
      <div style={value}>{data.celsius.toFixed(1)}°C</div>
      <div style={hint}>
        opdateret {new Date(data.updatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

/** Lille inline-styling – byt evt. til CSS module */
const card: React.CSSProperties = {
  display: "inline-grid",
  gap: 2,
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  background: "#fff",
  minWidth: 120,
};
const label: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
  fontWeight: 700,
};
const value: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1.1,
};
const hint: React.CSSProperties = { fontSize: 11, color: "#888" };
