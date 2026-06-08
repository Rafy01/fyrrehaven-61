// components/Analytics/Gtag.tsx
const MID = "G-4XD1D0JK9D"; // dit Measurement ID

export default function Gtag() {
  return (
    <>
      {/* gtag.js – deferred indtil analytics er accepteret */}
      <script
        type="text/plain"
        data-category="analytics"
        data-src={`https://www.googletagmanager.com/gtag/js?id=${MID}`}
      />

      {/* Init + Consent Mode (default=denied). Aktiveres af enableScriptsForConsent */}
      <script type="text/plain" data-category="analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}

          // Consent Mode default — alt denied indtil update
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });

          gtag('js', new Date());
          gtag('config', '${MID}', {
            anonymize_ip: true,
            allow_ad_personalization_signals: false,
            linker: { domains: ['fyrrehaven-61.dk','booking.fyrrehaven-61.dk'] }
          });

          function applyFh61Consent() {
            try {
              var c = (window.fh61Consent && window.fh61Consent()) || {analytics:false, marketing:false};
              gtag('consent', 'update', {
                analytics_storage: c.analytics ? 'granted' : 'denied',
                ad_storage:       c.marketing ? 'granted' : 'denied',
                ad_user_data:     c.marketing ? 'granted' : 'denied',
                ad_personalization: c.marketing ? 'granted' : 'denied'
              });
            } catch(e) {}
          }

          applyFh61Consent();
          window.addEventListener('fh61:consentchange', applyFh61Consent);
        `}
      </script>
    </>
  );
}
