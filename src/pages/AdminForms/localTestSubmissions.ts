const localCheckinMeterImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%2315171a'/%3E%3Crect x='112' y='108' width='976' height='684' rx='44' fill='%23222529' stroke='%235a5d63' stroke-width='8'/%3E%3Ctext x='170' y='210' fill='%23f7f4ea' font-family='Arial,sans-serif' font-size='58' font-weight='700'%3ECheck-in meter photo%3C/text%3E%3Ctext x='170' y='360' fill='%23d9d3b6' font-family='Arial,sans-serif' font-size='64'%3EElectricity: 19402%3C/text%3E%3Ctext x='170' y='500' fill='%23d9d3b6' font-family='Arial,sans-serif' font-size='64'%3EWater house: 982%3C/text%3E%3Ctext x='170' y='640' fill='%23d9d3b6' font-family='Arial,sans-serif' font-size='64'%3EWater pool: 411%3C/text%3E%3C/svg%3E";

const localCheckoutMeterImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'%3E%3Crect width='1200' height='900' fill='%23f6f4ed'/%3E%3Crect x='112' y='108' width='976' height='684' rx='44' fill='%23ffffff' stroke='%23d8d3be' stroke-width='8'/%3E%3Ctext x='170' y='210' fill='%2318191c' font-family='Arial,sans-serif' font-size='58' font-weight='700'%3ECheck-out meter photo%3C/text%3E%3Ctext x='170' y='360' fill='%233f4127' font-family='Arial,sans-serif' font-size='64'%3EElectricity: 19610%3C/text%3E%3Ctext x='170' y='500' fill='%233f4127' font-family='Arial,sans-serif' font-size='64'%3EWater house: 1013%3C/text%3E%3Ctext x='170' y='640' fill='%233f4127' font-family='Arial,sans-serif' font-size='64'%3EWater pool: 430%3C/text%3E%3C/svg%3E";

export const localTestSubmissions = [
  {
    id: "local-booking-1",
    intent: "booking",
    name: "Sofie Hansen",
    email: "sofie@example.com",
    phone: "+45 22 33 44 55",
    country: "DK",
    stayPurpose:
      "Family holiday close to the beach with grandparents joining for part of the stay.",
    guests: { adults: 3, children: 2, babies: 0, total: 5 },
    selection: {
      start: "2026-08-12",
      endExclusive: "2026-08-19",
      nights: 7,
      baseNightsTotalDKK: 23054,
      cleaningFeeDKK: 1250,
      totalAfterAirbnbDiscountDKK: 21750,
      totalWithCleaningDKK: 24304,
      airbnbServiceFeeSavingsDKK: 2554,
      breakdown: [
        { date: "2026-08-12", price: 3293 },
        { date: "2026-08-13", price: 3293 },
        { date: "2026-08-14", price: 3443 },
        { date: "2026-08-15", price: 3443 },
        { date: "2026-08-16", price: 3293 },
        { date: "2026-08-17", price: 3143 },
        { date: "2026-08-18", price: 3146 },
      ],
    },
    message: "We would love to hear more about linen and child-friendly extras.",
    status: "sent",
    createdAtMs: Date.UTC(2026, 5, 26, 9, 10),
  },
  {
    id: "local-contact-1",
    intent: "inquiry",
    name: "Sofie Hansen",
    email: "sofie@example.com",
    country: "DK",
    message: "Just checking whether early arrival is ever possible on request.",
    status: "sent",
    createdAtMs: Date.UTC(2026, 5, 26, 8, 55),
  },
  {
    id: "local-contact-failed-1",
    intent: "inquiry",
    name: "Jonas Berg",
    email: "jonas@example.com",
    phone: "+45 44 55 66 77",
    country: "DK",
    message: "Local failed message for dashboard testing.",
    status: "mail_failed",
    mailError: "Local test: admin email delivery failed.",
    createdAtMs: Date.UTC(2026, 5, 26, 8, 47),
  },
  {
    id: "local-contact-de-1",
    intent: "inquiry",
    name: "Lena Schneider",
    email: "lena.schneider@example.de",
    phone: "+49 151 23456789",
    country: "DE",
    message:
      "We are visiting from Germany and would like to ask if late check-out is possible.",
    status: "sent",
    createdAtMs: Date.UTC(2026, 5, 26, 8, 44),
  },
  {
    id: "local-extra-1",
    intent: "extra-services",
    name: "Mikkel Larsen",
    email: "mikkel@example.com",
    country: "DK",
    extras: {
      stayDate: "2026-08-12",
      totalDKK: 1495,
      items: [
        {
          id: "linen-pack",
          qty: 5,
          unitPriceDKK: 199,
          label: { en: "Linen package" },
        },
        {
          id: "crib",
          qty: 1,
          unitPriceDKK: 500,
          label: { en: "Baby crib" },
        },
      ],
    },
    status: "mail_failed",
    mailError: "SMTP timeout while notifying admin.",
    createdAtMs: Date.UTC(2026, 5, 26, 8, 40),
  },
  {
    id: "local-checkin-1",
    intent: "guest-checkin",
    name: "Sofie Hansen",
    email: "sofie@example.com",
    checkin: {
      type: "checkin",
      typeLabel: "Check-in",
      keycode: "6142",
      meterReadings: {
        electricity: "19402",
        waterHouse: "982",
        waterPool: "411",
      },
      attachments: [
        {
          filename: "check-in-meter.svg",
          contentType: "image/svg+xml",
          sizeBytes: 214000,
          dataUrl: localCheckinMeterImage,
        },
      ],
    },
    status: "sent",
    createdAtMs: Date.UTC(2026, 5, 26, 8, 25),
  },
  {
    id: "local-checkout-1",
    intent: "guest-checkin",
    name: "Mikkel Larsen",
    email: "mikkel@example.com",
    checkin: {
      type: "checkout",
      typeLabel: "Check-out",
      meterReadings: {
        electricity: "19610",
        waterHouse: "1013",
        waterPool: "430",
      },
      attachments: [
        {
          filename: "check-out-meter.svg",
          contentType: "image/svg+xml",
          sizeBytes: 187000,
          dataUrl: localCheckoutMeterImage,
        },
      ],
    },
    message: "We left the key in the lockbox and started the dishwasher.",
    status: "pending",
    createdAtMs: Date.UTC(2026, 5, 26, 7, 50),
  },
] as const;
