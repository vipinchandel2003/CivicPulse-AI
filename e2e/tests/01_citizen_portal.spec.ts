import { test, expect } from '@playwright/test';

test.describe('Portal 1: Citizen PWA (apps/web-citizen)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('1.1 Authentication & Profile Module: Phone OTP Login & Validation', async ({ page }) => {
    // 1. Click Exit to test clean logout & Login Card
    const exitBtn = page.getByRole('button', { name: /Exit/i });
    await expect(exitBtn).toBeVisible({ timeout: 5000 });
    await exitBtn.click();

    // 2. Verify Login Card presence
    await expect(page.getByText('CivicPulse Citizen')).toBeVisible();
    await expect(page.getByText('Tier 0 · PWA')).toBeVisible();

    // 3. Negative check: Blank submit
    await page.getByRole('button', { name: /Send OTP/i }).click();
    await expect(page.getByText(/Please enter a valid 10-digit mobile number/i)).toBeVisible();

    // 4. Positive check: Enter valid Indian 10-digit mobile
    const phoneInput = page.getByPlaceholder(/98765 43210/i);
    await phoneInput.fill('9876543210');
    await page.getByRole('button', { name: /Send OTP/i }).click();

    // 5. Step 2 OTP card appears
    await expect(page.getByText(/Enter 4-digit code sent to/i)).toBeVisible();

    // 6. Negative check: Short OTP (< 4 digits)
    const otpInput = page.getByPlaceholder(/• • • •/i);
    await otpInput.fill('12');
    await page.getByRole('button', { name: /Verify & Continue/i }).click();
    await expect(page.getByText(/Please enter the 4-digit OTP/i)).toBeVisible();

    // 7. Negative check: Rejected OTP (1234)
    await otpInput.fill('1234');
    await page.getByRole('button', { name: /Verify & Continue/i }).click();
    await expect(page.getByText(/Invalid or expired OTP/i)).toBeVisible();

    // 8. Positive check: Valid OTP (9999) enters Citizen Shell
    await otpInput.fill('9999');
    await page.getByRole('button', { name: /Verify & Continue/i }).click();

    // Should transition to Citizen Home with Header & Live Ward Geotag
    await expect(page.getByText(/Ward 64/i).first()).toBeVisible();
  });

  test('1.2 Issue Capture & Submission Flow: Anti-Spoof Camera, Nonce & GPS Gate', async ({ page }) => {
    // Click primary capture trigger
    const launchBtn = page.getByRole('button', { name: /Launch Live Capture/i });
    await expect(launchBtn).toBeVisible({ timeout: 5000 });
    await launchBtn.click();

    // Verify In-App Camera Viewport is active and no file picker exists
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await expect(page.getByText(/REAR SENSOR ONLY/i)).toBeVisible();

    // Verify Nonce Ticker
    await expect(page.getByText(/Nonce:/i)).toBeVisible();
    await expect(page.getByText(/Expires in/i)).toBeVisible();

    // Verify GPS Accuracy Ring gate
    await expect(page.getByText(/GPS Geotag Valid/i)).toBeVisible();
    await expect(page.getByText(/Within Indore Nagar Nigam 20m anti-fraud threshold/i)).toBeVisible();

    // Fill Category & Note
    await page.getByPlaceholder(/Broken Water Pipe, Pothole/i).fill('Broken Water Pipe');
    await page.getByPlaceholder(/Near Rajwada temple gate/i).fill('Near Chhappan Dukan junction, severe water leakage');

    // Simulate verified live camera capture
    const captureFrameBtn = page.getByRole('button', { name: /Capture Live Frame/i });
    await expect(captureFrameBtn).toBeVisible();
    await captureFrameBtn.click();
    await expect(page.getByText(/PHOTO SNAPSHOT LOCKED/i)).toBeVisible();

    // Submit report
    const submitBtn = page.getByRole('button', { name: /Submit Incident/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify fast sync response
    await expect(page.getByText(/Report Submitted Successfully!/i)).toBeVisible();
  });

  test('1.3 Spatial Dedup & Nearby Feed: Upvote & Master Ticket Tracking', async ({ page }) => {
    // Check nearby complaints list feed
    await expect(page.getByText(/Recent Incidents & Resolution Timeline/i)).toBeVisible();

    // Explicitly wait for Me Too buttons to populate
    const upvoteButtons = page.locator('button').filter({ hasText: /Me Too/i });
    await expect(upvoteButtons.first()).toBeVisible({ timeout: 5000 });

    const count = await upvoteButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstUpvote = upvoteButtons.first();
    const initialText = await firstUpvote.innerText();
    await firstUpvote.click();
    const updatedText = await firstUpvote.innerText();
    expect(initialText).not.toEqual(updatedText);
  });

  test('1.4 Bilingual Language Toggle: Hindi & English Navigation', async ({ page }) => {
    // Default language navigation includes Hindi (होम, नक्शा, शिकायतें)
    await expect(page.getByRole('button', { name: 'होम' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: 'नक्शा' })).toBeVisible();

    // Switch to English
    const langBtn = page.getByRole('button', { name: /हिन्दी|English/i });
    await langBtn.click();
    await expect(page.getByRole('button', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Map' })).toBeVisible();
  });
});
