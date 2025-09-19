import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// components/Analytics/Gtag.tsx
const MID = "G-4XD1D0JK9D"; // dit Measurement ID
export default function Gtag() {
    return (_jsxs(_Fragment, { children: [_jsx("script", { type: "text/plain", "data-category": "analytics", "data-src": `https://www.googletagmanager.com/gtag/js?id=${MID}` }), _jsx("script", { type: "text/plain", "data-category": "analytics", children: `
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

          // Opdater consent når banneret ændres
          window.addEventListener('fh61:consentchange', function() {
            try {
              var c = (window.fh61Consent && window.fh61Consent()) || {analytics:false, marketing:false};
              gtag('consent', 'update', {
                analytics_storage: c.analytics ? 'granted' : 'denied',
                ad_storage:       c.marketing ? 'granted' : 'denied',
                ad_user_data:     c.marketing ? 'granted' : 'denied',
                ad_personalization: c.marketing ? 'granted' : 'denied'
              });
            } catch(e) {}
          });
        ` })] }));
}
