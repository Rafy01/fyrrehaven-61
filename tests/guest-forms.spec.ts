import { test, expect } from '@playwright/test';

test.describe('guest forms', () => {
  test('extra services form sends a valid request and shows confirmation', async ({ page }) => {
    const submissions: Record<string, unknown>[] = [];

    await page.route('**/api/form-draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: true }),
      });
    });

    await page.route('**/api/contact?route=validate-booking', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.route('**/api/contact', async (route) => {
      const request = route.request();
      submissions.push(JSON.parse(request.postData() || '{}'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/guest/en/extra-services');
    await page.fill('#extra-name', 'Playwright Booker');
    await page.fill('#extra-email', 'test+extra@example.com');
    await page.fill('#extra-confirm-email', 'test+extra@example.com');
    await page.locator('input[type=checkbox]').check();
    await page.click('button[type="submit"]');

    await expect(page.getByRole('status')).toContainText(
      'Your extra service request has been sent'
    );
    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toMatchObject({
      purpose: 'extra-services',
      context: 'extra-services',
      name: 'Playwright Booker',
      email: 'test+extra@example.com',
      consent: true,
      feesAccepted: true,
    });
  });

  test('check-in/out form uploads three meter photos and sends a valid reading quickly', async ({ page }) => {
    const readings: string[] = [];

    await page.setViewportSize({ width: 390, height: 1200 });

    await page.route('**/api/form-draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: true }),
      });
    });

    await page.route('**/api/checkin', async (route) => {
      readings.push(route.request().postData() || '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, mailStatus: 'sent' }),
      });
    });

    await page.goto('/guest/en/check-inout');
    await page.fill('#name', 'Playwright Guest');
    await page.fill('#keycode', '1234');
    await page.fill('#email', 'test+checkin@example.com');
    await page.fill('#confirmEmail', 'test+checkin@example.com');
    await page.selectOption('#checkType', 'checkin');
    await page.fill('#elReading', '055540');
    await page.setInputFiles('#upload-meterImagesElectricity', [
      'public/admin-test/electricity-meter.jpeg',
    ]);
    await page.fill('#waterHouse', '123,456');
    await page.setInputFiles('#upload-meterImagesWaterHouse', [
      'public/admin-test/water-house-meter.jpeg',
    ]);
    await page.fill('#waterPool', '1234');
    await page.setInputFiles('#upload-meterImagesWaterPool', [
      'public/admin-test/water-pool-meter.jpeg',
    ]);
    await page.getByLabel(/I consent/i).check();

    const start = Date.now();
    await page.click('button[type="submit"]');

    await expect(page.getByText('Your reading has been sent')).toBeVisible({
      timeout: 8000,
    });
    expect(Date.now() - start).toBeLessThan(8000);
    expect(readings).toHaveLength(1);
    expect(readings[0]).toContain('meterImages');
  });

  test('check-in/out form shows a clear error when more than three meter photos are selected', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1200 });

    await page.route('**/api/form-draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: true }),
      });
    });

    await page.goto('/guest/en/check-inout');
    await page.fill('#name', 'Playwright Guest');
    await page.fill('#keycode', '1234');
    await page.fill('#email', 'test+checkin@example.com');
    await page.fill('#confirmEmail', 'test+checkin@example.com');
    await page.selectOption('#checkType', 'checkin');
    await page.fill('#elReading', '055540');
    await page.setInputFiles('#upload-meterImagesElectricity', [
      'public/admin-test/electricity-meter.jpeg',
      'public/admin-test/water-house-meter.jpeg',
      'public/admin-test/water-pool-meter.jpeg',
      'public/area/fjellerup-strand.webp',
    ]);
    await page.fill('#waterHouse', '123,456');
    await page.fill('#waterPool', '1234');

    await expect(page.getByText('You can upload up to 3 meter photos.')).toBeVisible();
  });

  test('check-in/out upload error is readable when the image API returns plain text', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1200 });

    await page.route('**/api/form-draft', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: true }),
      });
    });

    await page.route('**/api/checkin', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'text/plain',
        body: 'An error occurred while uploading the image.',
      });
    });

    await page.goto('/guest/en/check-inout');
    await page.fill('#name', 'Playwright Guest');
    await page.fill('#keycode', '1234');
    await page.fill('#email', 'test+checkin@example.com');
    await page.fill('#confirmEmail', 'test+checkin@example.com');
    await page.selectOption('#checkType', 'checkin');
    await page.fill('#elReading', '055540');
    await page.fill('#waterHouse', '123,456');
    await page.fill('#waterPool', '1234');
    await page.setInputFiles('#upload-meterImagesElectricity', 'public/admin-test/electricity-meter.jpeg');
    await page.getByLabel(/I consent/i).check();
    await page.click('button[type="submit"]');

    await expect(page.getByRole('alert')).toContainText(
      'upload server returned an unreadable response'
    );
    await expect(page.getByRole('alert')).not.toContainText('Unexpected token');
  });
});
