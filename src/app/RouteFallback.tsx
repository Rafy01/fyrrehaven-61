export default function RouteFallback() {
  return (
    <div className="routeFallback" aria-live="polite" aria-busy="true">
      <div className="routeFallbackPulse" />
    </div>
  );
}
