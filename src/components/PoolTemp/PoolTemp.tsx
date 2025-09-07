import * as React from "react";
import { Card } from "@radix-ui/themes"; // hvis du bruger Radix Themes
// eller lav dit eget kort – pointen er fetch + visning

export default function PoolTempCard() {
  const [temp, setTemp] = React.useState<number | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/pool-temp");
        const j = await r.json();
        if (!alive) return;
        if (j.ok) setTemp(j.tempC);
        else setErr(j.error ?? "Fejl");
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Netværksfejl");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (err) return <div role="status">Pool: {err}</div>;
  if (temp == null) return <div role="status">Pool: henter…</div>;

  return (
    <Card
      style={{
        padding: 12,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span aria-hidden>🌡️</span>
      <strong>Pool</strong>
      <span style={{ fontSize: 22, fontWeight: 800 }}>{temp.toFixed(1)}°C</span>
    </Card>
  );
}
