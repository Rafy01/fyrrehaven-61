// src/components/PoolTemp/PoolTempCard.tsx
import * as React from "react";

export default function PoolTempCard() {
  const [temp, setTemp] = React.useState<number | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/pool-temp");
        const j: { ok: boolean; celsius?: number; error?: string } =
          await r.json();
        if (!alive) return;
        if (!j.ok || typeof j.celsius !== "number") {
          setErr(j.error || "Ukendt fejl");
        } else {
          setTemp(j.celsius);
        }
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "Netværksfejl");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (err) return <div role="status">Pool: {err}</div>;
  if (temp === null) return <div role="status">Pool: henter…</div>;
  return <div aria-live="polite">Pool: {temp.toFixed(1)} °C</div>;
}
