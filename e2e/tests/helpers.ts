import { Page, expect } from '@playwright/test';

/**
 * Robust helper to authenticate via Phone OTP across all CivicPulse portals
 */
export async function loginWithOtp(page: Page, phone: string, otp: string = '9999') {
  const phoneInput = page.locator('input[type="tel"]').first();
  if (await phoneInput.isVisible({ timeout: 1000 }).catch(() => false)) {
    await phoneInput.fill(phone);
    const sendOtpBtn = page.getByRole('button', { name: /Send OTP/i });
    await sendOtpBtn.click();

    // Explicitly wait for step 2 OTP prompt to render
    await expect(page.getByText(/Enter 4-digit code sent to/i)).toBeVisible({ timeout: 10000 });

    // Fill the 4-digit OTP
    const otpInput = page.locator('input[type="text"][maxlength="4"]');
    await otpInput.fill(otp);

    // Verify & Continue
    const verifyBtn = page.getByRole('button', { name: /Verify & Continue/i });
    await expect(verifyBtn).toBeVisible({ timeout: 5000 });
    await verifyBtn.click();
  }
}
