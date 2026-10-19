import { test, expect } from '@playwright/test';

async function ensureInspectorLoggedIn(page: any) {
  const loginCard = page.getByText('CivicPulse Field Staff');
  if (await loginCard.isVisible({ timeout: 1500 }).catch(() => false)) {
    const sendOtp = page.getByRole('button', { name: /Send OTP/i });
    if (await sendOtp.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByPlaceholder(/98765 43210/i).fill('9876543211');
      await sendOtp.click();
    }
    const verifyBtn = page.getByRole('button', { name: /Verify & Continue/i });
    if (await verifyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByPlaceholder(/• • • •/i).fill('9999');
      await verifyBtn.click();
    }
  }
}

test.describe('Portal 2: Field Inspector App (apps/app-inspector)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001');
  });

  test('2.1 Identity & Shift Management: Staff Login & On-Duty Toggle', async ({ page }) => {
    await ensureInspectorLoggedIn(page);

    // 2. Verify Inspector Shell Header with Ward & Department info
    await expect(page.getByText(/Ramesh Verma/i)).toBeVisible();
    await expect(page.getByText(/Ward 64/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /ON DUTY/i })).toBeVisible();

    // 3. Toggle On-Duty to Off-Duty
    const dutyToggle = page.getByRole('button', { name: /ON DUTY/i });
    await dutyToggle.click();

    // Verify status switches to OFF DUTY and warning banner appears
    await expect(page.getByRole('button', { name: /OFF DUTY/i })).toBeVisible();
    await expect(page.getByText(/marked OFF DUTY/i)).toBeVisible();

    // Toggle back to ON DUTY
    await page.getByRole('button', { name: /OFF DUTY/i }).click();
    await expect(page.getByRole('button', { name: /ON DUTY/i })).toBeVisible();
  });

  test('2.2 Task List & Navigation: Priority Badges & SLA Clocks', async ({ page }) => {
    await ensureInspectorLoggedIn(page);

    // Check Assigned Tasks list
    await expect(page.getByText(/Assigned Operational Tasks/i)).toBeVisible();
    await expect(page.getByText(/SLA Ticker Active/i)).toBeVisible();

    // Wait for task cards to load
    await expect(page.getByText(/SLA Countdown:/i).first()).toBeVisible();

    // Check Priority Badges (CRITICAL SLA / HIGH SLA)
    const badges = page.locator('span, div').filter({ hasText: /CRITICAL SLA|HIGH SLA/i });
    expect(await badges.count()).toBeGreaterThan(0);

    // Verify DPDP masking: Citizen phone number must NOT appear in inspector task feed
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('+919876543210');
  });

  test('2.3 Proof-of-Work Closure: 30m Geofence Lock & Live After-Photo', async ({ page }) => {
    await ensureInspectorLoggedIn(page);

    // Find and open resolution modal
    const resolveBtn = page.getByRole('button', { name: /Resolve/i }).first();
    await expect(resolveBtn).toBeVisible({ timeout: 5000 });
    await resolveBtn.click();

    // Check Proof-of-Work Geofence indicator
    await expect(page.getByText(/Proof-of-Work Verification/i)).toBeVisible();
    await expect(page.getByText('Geofence Check Passed')).toBeVisible();

    // Verify no gallery file input exists (anti-gallery rule)
    await expect(page.locator('input[type="file"]')).toHaveCount(0);

    // Verify Live Camera Viewport
    await expect(page.getByText(/REAR SENSOR ONLY/i)).toBeVisible();

    // Simulate capturing live after-photo
    const captureFrameBtn = page.getByRole('button', { name: /Capture Live Frame/i });
    if (await captureFrameBtn.isVisible()) {
      await captureFrameBtn.click();
      await expect(page.getByText(/AFTER PHOTO LOCKED/i)).toBeVisible();
    }

    // Close modal cleanly
    await page.getByRole('button', { name: /Cancel/i }).click();
  });
});
