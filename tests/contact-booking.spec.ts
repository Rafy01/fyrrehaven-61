import { test, expect, type Page } from '@playwright/test';

type SubmittedPayload = {
  phone?: string;
  selection?: {
    start?: string;
    endExclusive?: string;
    nights?: number;
  };
} & Record<string, unknown>;

const formatDate = (date: Date, locale: string) =>
  date.toLocaleDateString(locale);

async function clickCalendarDate(page: Page, date: Date) {
  const en = formatDate(date, 'en-GB');
  const da = formatDate(date, 'da-DK');
  const locator = page.locator(`button[aria-label="${en}"], button[aria-label="${da}"]`);
  for (let i = 0; i < 12 && (await locator.count()) === 0; i += 1) {
    await page.getByRole('button', { name: /Next month|Næste måned/i }).click();
  }
  await expect(locator).toHaveCount(1);
  await locator.click();
}

test.describe('contact and booking forms', () => {
  test('contact form sends a valid contact payload and shows confirmation', async ({ page }) => {
    const requests: SubmittedPayload[] = [];

    await page.route('**/api/contact', async (route) => {
      const request = route.request();
      const postData = request.postData() ?? '{}';
      requests.push(JSON.parse(postData) as SubmittedPayload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/en/contact');
    await page.fill('#cf-name', 'Playwright Tester');
    await page.fill('#cf-email', 'test+contact@example.com');
    await page.fill('#cf-confirm-email', 'test+contact@example.com');
    await page.selectOption('#cf-country', 'DK');
    await page.fill('#cf-phone', '12345678');
    await page.fill('#cf-msg', 'This is a contact form test. Please ignore.');
    await page.locator('input[type=checkbox]').nth(0).check();
    await page.click('button[type="submit"]');

    await expect(
      page.locator('h3', {
        hasText: /Thanks for your message|Tak for din henvendelse/i,
      })
    ).toHaveCount(1);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      name: 'Playwright Tester',
      email: 'test+contact@example.com',
      countryIso: 'DK',
      message: 'This is a contact form test. Please ignore.',
      consent: true,
    });
    expect(requests[0].phone).toContain('12345678');
  });

  test('contact form blocks invalid email before submitting', async ({ page }) => {
    const requests: SubmittedPayload[] = [];

    await page.route('**/api/contact', async (route) => {
      const request = route.request();
      const postData = request.postData() ?? '{}';
      requests.push(JSON.parse(postData) as SubmittedPayload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/de/kontakt');
    await page.fill('#cf-name', 'Email Tester');
    await page.fill('#cf-email', 'not-an-email');
    await page.fill('#cf-confirm-email', 'not-an-email');
    await page.selectOption('#cf-country', 'DK');
    await page.fill('#cf-phone', '12345678');
    await page.fill('#cf-msg', 'Invalid email validation test');
    await page.locator('input[type=checkbox]').nth(0).check();
    await page.click('button[type="submit"]');

    await expect(
      page.getByText('Bitte geben Sie eine gültige E-Mail-Adresse ein.')
    ).toHaveCount(1);
    expect(requests).toHaveLength(0);
  });

  test('booking form sends a booking payload and shows booking confirmation', async ({ page }) => {
    const requests: SubmittedPayload[] = [];

    await page.route('**/api/contact', async (route) => {
      const request = route.request();
      const postData = request.postData() ?? '{}';
      requests.push(JSON.parse(postData) as SubmittedPayload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/en/book');

    const now = new Date();
    const checkIn = new Date(now);
    checkIn.setDate(now.getDate() + 2);
    const checkOut = new Date(now);
    checkOut.setDate(now.getDate() + 8);

    await clickCalendarDate(page, checkIn);
    await clickCalendarDate(page, checkOut);

    await page.fill('#cf-staypurpose', 'Family holiday test');
    await page.fill('#cf-name', 'Playwright Booker');
    await page.fill('#cf-email', 'test+booking@example.com');
    await page.fill('#cf-confirm-email', 'test+booking@example.com');
    await page.selectOption('#cf-country', 'DK');
    await page.fill('#cf-phone', '12345678');
    await page.fill('#cf-adults', '2');
    await page.fill('#cf-children', '2');
    await page.fill('#cf-babies', '1');
    await page.locator('input[type=checkbox]').nth(0).check();
    await page.locator('input[type=checkbox]').nth(1).check();
    await page.click('button[type="submit"]');

    await expect(
      page.locator('h3', {
        hasText: /Thanks for your booking request|Tak for din bookingforespørgsel/i,
      })
    ).toHaveCount(1);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      name: 'Playwright Booker',
      email: 'test+booking@example.com',
      countryIso: 'DK',
      stayPurpose: 'Family holiday test',
      consent: true,
      feesAccepted: true,
      guests: { adults: 2, children: 2, babies: 1 },
      purpose: 'booking',
    });
    expect(requests[0].phone).toContain('12345678');
    expect(requests[0].selection).toMatchObject({
      start: checkIn.toISOString().slice(0, 10),
      endExclusive: checkOut.toISOString().slice(0, 10),
      nights: 6,
    });
  });

  test('contact form blocks submission without consent', async ({ page }) => {
    const requests: SubmittedPayload[] = [];

    await page.route('**/api/contact', async (route) => {
      const request = route.request();
      const postData = request.postData() ?? '{}';
      requests.push(JSON.parse(postData) as SubmittedPayload);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/en/contact');
    await page.fill('#cf-name', 'Consent Tester');
    await page.fill('#cf-email', 'test+consent@example.com');
    await page.fill('#cf-confirm-email', 'test+consent@example.com');
    await page.selectOption('#cf-country', 'DK');
    await page.fill('#cf-phone', '12345678');
    await page.fill('#cf-msg', 'Consent validation test');
    await page.click('button[type="submit"]');

    await expect(page.locator('input:invalid')).toHaveCount(1);
    expect(requests).toHaveLength(0);
  });

  test('booking calendar disables today as a past selection edge case', async ({ page }) => {
    await page.goto('/en/book');

    const today = new Date();
    const en = formatDate(today, 'en-GB');
    const da = formatDate(today, 'da-DK');
    const todayButton = page.locator(`button[aria-label="${en}"], button[aria-label="${da}"]`);

    await expect(todayButton).toHaveCount(1);
    await expect(todayButton).toBeDisabled();
  });
});
