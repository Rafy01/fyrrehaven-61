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
      greeting: "Hej {{name}},",
      thanks: "Tak for din {{type}}.",
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
      greeting: "Hi {{name}},",
      thanks: "Thanks for your {{type}}.",
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
      greeting: "Hallo {{name}},",
      thanks: "Danke für Ihre {{type}}.",
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
