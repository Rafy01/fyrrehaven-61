import * as React from "react";

type ApiOk = { ok: true; celsius: number; updatedAt?: string };
type ApiErr = { ok: false; error: string };
type ApiResp = ApiOk | ApiErr;

export default function PoolTempCard() {
  const [temp, setTemp] = React.useState<number | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/pool-temp');
        const j = (await r.json()) as ApiResp;
        if (!alive) return;

        if ('ok' in j && j.ok) {
          setTemp(j.celsius);
          setErr(null);
        } else {
          setErr(j.error ?? 'Ukendt fejl');
        }
      } catch (e) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : 'Netværksfejl');
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return (
      <div role="status" style={cardStyle}>
        <strong>Pool:</strong> {err}
      </div>
    );
  }

  if (temp === null) {
    return (
      <div role="status" style={cardStyle}>
        <strong>Pool:</strong> henter…
      </div>
    );
  }

  return (
    <div role="status" style={cardStyle}>
      <div style={{ fontSize: 14, opacity: 0.8 }}>Pool temperatur</div>
      <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
        {temp.toFixed(1)}°C
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.08)',
  boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
  background: '#fff',
  maxWidth: 220,
};