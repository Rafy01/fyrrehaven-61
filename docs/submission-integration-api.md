# Submission Integration API

This API is for trusted server-to-server integrations that need Fyrrehaven 61 form submission data.

## Environment

Set at least one API key:

```txt
SUBMISSION_SYNC_API_KEY -> one long random secret
```

Multiple keys are supported for rotation:

```txt
SUBMISSION_SYNC_API_KEYS -> secret one, secret two
```

Optional webhook push:

```txt
SUBMISSION_WEBHOOK_URL -> https://other-app.example.com/api/fyrrehaven/submissions
SUBMISSION_WEBHOOK_SECRET -> another long random secret
SUBMISSION_WEBHOOK_TIMEOUT_MS -> 10000
```

## Pull Submissions

```http
GET /api/integrations/submissions?limit=250&sinceMs=1760000000000
Authorization: Bearer <SUBMISSION_SYNC_API_KEY>
```

Optional filters:

```txt
id=<submission-id>
limit=1..500
sinceMs=<createdAtMs lower bound>
intent=booking|extra-services|guest-checkin
status=draft|sent|mail_failed|pending
mailStatus=sent|failed|pending
```

The integration response is English-only and only includes data intended for the
external dashboard. Contact submissions are not shared. Check-in/out submissions
are not shared until an admin approves the meter readings.
Draft submissions are shared as `type: "draft"` when their status is `draft`,
including partial guest, date, price, extra-service, and check-in/out data when
available.

Response:

```json
{
  "ok": true,
  "count": 1,
  "submissions": [
    {
      "id": "abc123",
      "type": "booking",
      "bookingNumber": "91234",
      "guest": {
        "name": "Guest Name",
        "email": "guest@example.com",
        "phone": "+45 ...",
        "country": "Denmark",
        "countryIso": "DK"
      },
      "dates": {
        "checkIn": "2026-08-12",
        "checkOut": "2026-08-19",
        "nights": 7
      },
      "price": {
        "totalDKK": 21750
      },
      "guests": {
        "adults": 2,
        "children": 1,
        "babies": 0
      },
      "approvals": {
        "feeListAccepted": true,
        "policyAccepted": true
      }
    }
  ]
}
```

Extra service submissions return the selected service list:

```json
{
  "id": "extra123",
  "type": "extra-services",
  "bookingNumber": "91234",
  "date": "2026-08-12",
  "totalDKK": 900,
  "items": [
    {
      "id": "linen",
      "name": "Bed linen",
      "quantity": 3,
      "unitPriceDKK": 150,
      "totalDKK": 450
    }
  ]
}
```

Draft submissions return partial data:

```json
{
  "id": "guest-checkin-abc123",
  "type": "draft",
  "status": "draft",
  "intent": "guest-checkin",
  "bookingNumber": "91234",
  "guest": {
    "name": "Guest Name",
    "email": "guest@example.com",
    "phone": null,
    "country": null,
    "countryIso": null
  },
  "dates": {
    "checkIn": null,
    "checkOut": null,
    "nights": null,
    "stayDate": null,
    "checkInOrOut": null
  },
  "price": {
    "totalDKK": null
  },
  "checkin": {
    "type": "checkin",
    "keycode": "1234",
    "meters": {
      "electricity": "055540",
      "waterHouse": "123,456",
      "waterPool": null
    },
    "attachmentCount": 0
  }
}
```

Approved check-in/out submissions only return the booking link, approved date,
and meter numbers:

```json
{
  "id": "checkin123",
  "type": "checkin",
  "bookingNumber": "91234",
  "dates": {
    "checkInOrOut": "2026-08-12",
    "approvedAtMs": 1760000000000
  },
  "meters": {
    "electricity": "055540",
    "waterHouse": "1234",
    "waterPool": "5678"
  }
}
```

## Mark Synced

```http
PATCH /api/integrations/submissions
Authorization: Bearer <SUBMISSION_SYNC_API_KEY>
Content-Type: application/json
```

```json
{
  "ids": ["abc123"],
  "consumer": "other-dashboard",
  "externalId": "remote-789"
}
```

This writes `integrationSync.<consumer>` on each submission.

## Webhook Push

When `SUBMISSION_WEBHOOK_URL` is set, shareable submissions trigger:

```http
POST <SUBMISSION_WEBHOOK_URL>
Content-Type: application/json
X-Fyrrehaven-Event: submission.created
X-Fyrrehaven-Timestamp: 1760000000000
X-Fyrrehaven-Delivery: submission.created:<id>:1760000000000
X-Fyrrehaven-Signature: sha256=<hmac>
```

Bookings and extra service submissions use `submission.created`. Check-in/out
submissions use `submission.approved` after an admin approves the meter readings.

The signature is:

```txt
hex(hmac_sha256(SUBMISSION_WEBHOOK_SECRET, `${timestamp}.${rawBody}`))
```

Webhook failures are recorded on the submission as `integrationDelivery.status = "failed"` and do not block the guest-facing form response.
