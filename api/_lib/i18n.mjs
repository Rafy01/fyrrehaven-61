const resources = {
  da: {
    common: {
      yes: "Ja",
      no: "Nej",
    },
    checkin: {
      subject: "Tjek-{{type}} aflæsning fra {{name}}",
      type: {
        checkin: "ind",
        checkout: "ud",
        checkinLabel: "Tjek-ind",
        checkoutLabel: "Tjek-ud",
      },
      fields: {
        name: "Navn",
        email: "Email",
        keycode: "Nøglekode",
        type: "Type",
        electricity: "EL",
        waterHouse: "Vand (hus)",
        waterPool: "Vand (pool)",
        consent: "Samtykke",
        comment: "Kommentar",
      },
    },
    contact: {
      subjectUser: "Tak for din henvendelse – {{siteName}}",
      extraServicesSubjectUser: "Ekstra services til dit ophold – {{siteName}}",
      greeting: "Hej {{name}},",
      thanks: "Tak for din {{type}}.",
      extraServicesThanksWithItems:
        "Tak for din besked. Vi har modtaget din forespørgsel om ekstra services til dit kommende ophold i sommerhuset.",
      extraServicesThanksNoItems:
        "Tak for din besked. Vi har noteret, at du ikke ønsker ekstra services til dit kommende ophold i sommerhuset.",
      extraServicesApprovalNote:
        "Vi har også registreret, at du har læst og accepteret vores husregler og gebyroversigt.",
      type: {
        booking: "bookingforespørgsel",
        message: "henvendelse",
      },
      replySoon: "Vi vender snarest tilbage (typisk inden for 24 timer).",
      quickSummary: "Hurtigt overblik",
      period: "Periode",
      estimatedTotal: "Estimeret total",
      questions: "Har du spørgsmål imens, kan du svare direkte på denne mail.",
      replyText: "Svar blot på denne mail, hvis du har spørgsmål.",
      introAdmin: "Ny indsendelse fra websitet:",
      bookingDetails: "Bookingoplysninger",
      arrivalDate: "Ankomstdato",
      extraServices: "Ekstra services",
      extrasTotal: "Ekstra i alt",
      totalInclExtras: "Estimeret total inkl. ekstra",
      priceNights: "Pris (overnatninger)",
      cleaning: "Rengøring",
      guests: "Gæster",
      adults: "Voksne",
      children: "Børn",
      babies: "Babyer",
      purposeOfStay: "Formål med opholdet",
      approvals: "Godkendelser",
      consentGdpr: "Samtykke (GDPR)",
      feeListAccepted: "Gebyroversigt accepteret",
      message: "Besked",
      nights: "nætter",
      fields: {
        name: "Navn",
        email: "E-mail",
        phone: "Telefon",
        country: "Land",
        language: "Sprog",
        context: "Kontekst",
      },
    },
  },
  en: {
    common: {
      yes: "Yes",
      no: "No",
    },
    checkin: {
      subject: "Check-{{type}} reading from {{name}}",
      type: {
        checkin: "in",
        checkout: "out",
        checkinLabel: "Check-in",
        checkoutLabel: "Check-out",
      },
      fields: {
        name: "Name",
        email: "Email",
        keycode: "Keybox code",
        type: "Type",
        electricity: "Electricity",
        waterHouse: "Water (house)",
        waterPool: "Water (pool)",
        consent: "Consent",
        comment: "Comment",
      },
    },
    contact: {
      subjectUser: "Thanks for your message – {{siteName}}",
      extraServicesSubjectUser: "Extra services for your stay – {{siteName}}",
      greeting: "Hi {{name}},",
      thanks: "Thanks for your {{type}}.",
      extraServicesThanksWithItems:
        "Thanks for your message. We have received your request for extra services for your upcoming stay at the summer house.",
      extraServicesThanksNoItems:
        "Thanks for your message. We have noted that you do not need extra services for your upcoming stay at the summer house.",
      extraServicesApprovalNote:
        "We have also registered that you have read and accepted our house rules and fee list.",
      type: {
        booking: "booking request",
        message: "message",
      },
      replySoon: "We'll get back to you shortly (typically within 24 hours).",
      quickSummary: "Quick summary",
      period: "Period",
      estimatedTotal: "Estimated total",
      questions: "If you have any questions meanwhile, just reply to this email.",
      replyText: "Just reply to this email if you have any questions.",
      introAdmin: "New submission from the website:",
      bookingDetails: "Booking details",
      arrivalDate: "Arrival date",
      extraServices: "Extra services",
      extrasTotal: "Extras total",
      totalInclExtras: "Estimated total incl. extras",
      priceNights: "Price (nights)",
      cleaning: "Cleaning",
      guests: "Guests",
      adults: "Adults",
      children: "Children",
      babies: "Babies",
      purposeOfStay: "Purpose of stay",
      approvals: "Approvals",
      consentGdpr: "Consent (GDPR)",
      feeListAccepted: "Fee list accepted",
      message: "Message",
      nights: "nights",
      fields: {
        name: "Name",
        email: "E-mail",
        phone: "Phone",
        country: "Country",
        language: "Language",
        context: "Context",
      },
    },
  },
  de: {
    common: {
      yes: "Ja",
      no: "Nein",
    },
    checkin: {
      subject: "Check-{{type}} Ablesung von {{name}}",
      type: {
        checkin: "in",
        checkout: "out",
        checkinLabel: "Check-in",
        checkoutLabel: "Check-out",
      },
      fields: {
        name: "Name",
        email: "Email",
        keycode: "Schlüsselkasten-Code",
        type: "Typ",
        electricity: "Strom",
        waterHouse: "Wasser (Haus)",
        waterPool: "Wasser (Pool)",
        consent: "Einwilligung",
        comment: "Kommentar",
      },
    },
    contact: {
      subjectUser: "Danke für Ihre Nachricht – {{siteName}}",
      extraServicesSubjectUser: "Zusatzleistungen für Ihren Aufenthalt – {{siteName}}",
      greeting: "Hallo {{name}},",
      thanks: "Danke für Ihre {{type}}.",
      extraServicesThanksWithItems:
        "Danke für Ihre Nachricht. Wir haben Ihre Anfrage zu Zusatzleistungen für Ihren bevorstehenden Aufenthalt im Ferienhaus erhalten.",
      extraServicesThanksNoItems:
        "Danke für Ihre Nachricht. Wir haben notiert, dass Sie für Ihren bevorstehenden Aufenthalt im Ferienhaus keine Zusatzleistungen benötigen.",
      extraServicesApprovalNote:
        "Wir haben außerdem registriert, dass Sie unsere Hausregeln und Gebührenübersicht gelesen und akzeptiert haben.",
      type: {
        booking: "Buchungsanfrage",
        message: "Nachricht",
      },
      replySoon: "Wir melden uns bald zurück (normalerweise innerhalb von 24 Stunden).",
      quickSummary: "Kurzer Überblick",
      period: "Zeitraum",
      estimatedTotal: "Geschätzter Gesamtpreis",
      questions: "Wenn Sie inzwischen Fragen haben, antworten Sie einfach auf diese E-Mail.",
      replyText: "Antworten Sie einfach auf diese E-Mail, wenn Sie Fragen haben.",
      introAdmin: "Neue Einsendung von der Website:",
      bookingDetails: "Buchungsdetails",
      arrivalDate: "Anreisedatum",
      extraServices: "Zusatzleistungen",
      extrasTotal: "Zusatzleistungen gesamt",
      totalInclExtras: "Geschätzter Gesamtpreis inkl. Zusatzleistungen",
      priceNights: "Preis (Nächte)",
      cleaning: "Reinigung",
      guests: "Gäste",
      adults: "Erwachsene",
      children: "Kinder",
      babies: "Babys",
      purposeOfStay: "Zweck des Aufenthalts",
      approvals: "Bestätigungen",
      consentGdpr: "Einwilligung (DSGVO)",
      feeListAccepted: "Gebührenübersicht akzeptiert",
      message: "Nachricht",
      nights: "Nächte",
      fields: {
        name: "Name",
        email: "E-Mail",
        phone: "Telefon",
        country: "Land",
        language: "Sprache",
        context: "Kontext",
      },
    },
  },
};

export function normalizeLang(lang) {
  const value = String(lang || "").toLowerCase();
  if (value.startsWith("de")) return "de";
  if (value.startsWith("en")) return "en";
  return "da";
}

export function t(lang, key, vars = {}) {
  const normalized = normalizeLang(lang);
  const parts = key.split(".");
  let value = resources[normalized];

  for (const part of parts) {
    value = value?.[part];
  }

  if (typeof value !== "string") {
    value = resources.da;
    for (const part of parts) {
      value = value?.[part];
    }
  }

  if (typeof value !== "string") return key;

  return value.replace(/\{\{(\w+)\}\}/g, (_, name) =>
    vars[name] == null ? "" : String(vars[name])
  );
}

export function yesNo(value, lang) {
  return value ? t(lang, "common.yes") : t(lang, "common.no");
}
