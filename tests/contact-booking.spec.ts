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

function isoFromCalendarLabel(label: string) {
  const match = label.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return '';
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function selectableCalendarDates(page: Page) {
  return page
    .getByLabel('Availability calendar')
    .locator('button[aria-label*="/"]:not([disabled])');
}

async function selectAvailableBookingRange(page: Page, nights: number) {
  let dateButtons = await selectableCalendarDates(page);
  for (let i = 0; i < 12 && (await dateButtons.count()) <= nights; i += 1) {
    await page.getByRole('button', { name: /Next month|Næste måned/i }).click();
    dateButtons = await selectableCalendarDates(page);
  }

  await expect(dateButtons.nth(nights)).toBeVisible();

  const checkInLabel = (await dateButtons.first().getAttribute('aria-label')) ?? '';
  const checkOutLabel = (await dateButtons.nth(nights).getAttribute('aria-label')) ?? '';

  await dateButtons.first().click();
  await dateButtons.nth(nights).click();

  return {
    checkInIso: isoFromCalendarLabel(checkInLabel),
    checkOutIso: isoFromCalendarLabel(checkOutLabel),
  };
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

    const { checkInIso, checkOutIso } = await selectAvailableBookingRange(page, 6);

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
      start: checkInIso,
      endExclusive: checkOutIso,
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
