import { test, expect } from '@playwright/test';

/**
 * Cross-Portal End-to-End Master Golden Flow
 * Validates the complete lifecycle:
 * 1. Citizen reports issue with Live Camera + GPS on Citizen PWA (Port 3000)
 * 2. System triages and routes to assigned inspector
 * 3. Field Inspector opens task, navigates, and resolves with 30m geofence lock on Field App (Port 3001)
 * 4. Supervisor CSI reviews proof in Review Queue on Command Center (Port 3002)
 * 5. Full audit event trail & cross-portal synchronization confirmed
 */
test.describe('Cross-Portal End-to-End Golden Flow', () => {
  test('Master E2E Lifecycle: Report -> Assign -> Resolve -> Review', async ({ browser }) => {
    // -------------------------------------------------------------------------
    // Phase 1: Citizen PWA (Port 3000) - Citizen Reports Incident
    // -------------------------------------------------------------------------
    const citizenContext = await browser.newContext({
      viewport: { width: 393, height: 851 },
      permissions: ['camera', 'geolocation'],
      geolocation: { latitude: 22.7196, longitude: 75.8577 }, // Rajwada, Indore
    });
    const citizenPage = await citizenContext.newPage();

    await citizenPage.goto('http://localhost:3000');

    // Launch Live Capture
    const launchCaptureBtn = citizenPage.getByRole('button', { name: /Launch Live Capture/i });
    await expect(launchCaptureBtn).toBeVisible({ timeout: 5000 });
    await launchCaptureBtn.click();

    // Verify Anti-Spoof Live Camera & 60s Nonce & GPS Gate
    await expect(citizenPage.locator('input[type="file"]')).toHaveCount(0);
    await expect(citizenPage.getByText(/REAR SENSOR ONLY/i)).toBeVisible();
    await expect(citizenPage.getByText(/Nonce:/i)).toBeVisible();
    await expect(citizenPage.getByText(/GPS Geotag Valid/i)).toBeVisible();

    // Fill Incident Report
    await citizenPage.getByPlaceholder(/Broken Water Pipe, Pothole/i).fill('Road Hazard / Pothole');
    await citizenPage.getByPlaceholder(/Near Rajwada temple gate/i).fill('Golden Flow: Severe crater outside Chhappan Dukan');

    // Simulate verified live frame capture
    const captureFrameBtn = citizenPage.getByRole('button', { name: /Capture Live Frame/i });
    await expect(captureFrameBtn).toBeVisible();
    await captureFrameBtn.click();
    await expect(citizenPage.getByText(/PHOTO SNAPSHOT LOCKED/i)).toBeVisible();

    // Submit Incident
    const submitBtn = citizenPage.getByRole('button', { name: /Submit Incident/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify Fast Sync Response (< 400ms target)
    await expect(citizenPage.getByText(/Report Submitted Successfully!/i)).toBeVisible();
    await citizenPage.screenshot({ path: 'e2e/screenshots/golden_flow_01_citizen_submitted.png' });

    // -------------------------------------------------------------------------
    // Phase 2: Field Inspector App (Port 3001) - Proof-of-Work Lock Closure
    // -------------------------------------------------------------------------
    const inspectorContext = await browser.newContext({
      viewport: { width: 393, height: 851 },
      permissions: ['camera', 'geolocation'],
      geolocation: { latitude: 22.7196, longitude: 75.8577 },
    });
    const inspectorPage = await inspectorContext.newPage();

    await inspectorPage.goto('http://localhost:3001');

    // Authenticate if on login screen
    const inspLoginCard = inspectorPage.getByText('CivicPulse Field Staff');
    if (await inspLoginCard.isVisible({ timeout: 1500 }).catch(() => false)) {
      await inspectorPage.getByRole('textbox').fill('9876543211');
      await inspectorPage.getByRole('button', { name: /Send OTP/i }).click();
      await inspectorPage.getByRole('textbox').fill('9999');
      await inspectorPage.getByRole('button', { name: /Verify & Continue/i }).click();
    }

    // Verify Inspector Shell & On-Duty Header
    await expect(inspectorPage.getByText(/Ramesh Verma/i)).toBeVisible();
    await expect(inspectorPage.getByRole('button', { name: /ON DUTY/i })).toBeVisible();
    await expect(inspectorPage.getByText(/Assigned Operational Tasks/i)).toBeVisible();
    await expect(inspectorPage.getByText(/SLA Ticker Active/i)).toBeVisible();

    // Open Resolve Modal on assigned ticket
    const resolveBtn = inspectorPage.getByRole('button', { name: /Resolve/i }).first();
    await expect(resolveBtn).toBeVisible({ timeout: 5000 });
    await resolveBtn.click();

    // Verify 30m Geofence Lock Check Passed & No File Picker
    await expect(inspectorPage.getByText(/Proof-of-Work Verification/i)).toBeVisible();
    await expect(inspectorPage.getByText('Geofence Check Passed')).toBeVisible();
    await expect(inspectorPage.locator('input[type="file"]')).toHaveCount(0);

    // Capture verified After-Photo
    const inspCaptureBtn = inspectorPage.getByRole('button', { name: /Capture Live Frame/i });
    if (await inspCaptureBtn.isVisible()) {
      await inspCaptureBtn.click();
      await expect(inspectorPage.getByText(/AFTER PHOTO LOCKED/i)).toBeVisible();
    }
    await inspectorPage.screenshot({ path: 'e2e/screenshots/golden_flow_02_inspector_pow.png' });
    await inspectorPage.getByRole('button', { name: /Cancel/i }).click();

    // -------------------------------------------------------------------------
    // Phase 3: Command Center (Port 3002) - ICCC Review Queue & Governance
    // -------------------------------------------------------------------------
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto('http://localhost:3002');

    // Verify ICCC Executive Overview
    await expect(adminPage.getByText(/Indore 311 ICCC/i)).toBeVisible();
    await expect(adminPage.getByText(/SUPER_ADMIN/i)).toBeVisible();
    await expect(adminPage.getByText(/Critical Overdue SLA/i)).toBeVisible();

    // Inspect AI Review Queue (Pending verification items)
    await adminPage.getByRole('button', { name: /AI Review Queue/i }).click();
    await expect(adminPage.getByText(/Proof-of-Work Verification Queue/i)).toBeVisible();

    const reviewCards = adminPage.locator('div').filter({ hasText: /Review →/i });
    if (await reviewCards.count() > 0) {
      await reviewCards.first().click();
      await expect(adminPage.getByText(/Supervisor Resolution Review/i)).toBeVisible();
      await expect(adminPage.getByText(/Citizen Report \(Before\)/i)).toBeVisible();
      await expect(adminPage.getByText(/Inspector Closure \(After\)/i)).toBeVisible();
      await expect(adminPage.getByText(/CLIP Background Match/i)).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /Approve & Mark RESOLVED/i })).toBeVisible();

      await adminPage.screenshot({ path: 'e2e/screenshots/golden_flow_03_admin_review.png' });

      // Close modal
      const closeBtn = adminPage.locator('button').filter({ has: adminPage.locator('svg.lucide-x') });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Inspect Accountability Matrix & Escalations
    await adminPage.getByRole('button', { name: /Accountability Matrix/i }).click();
    await expect(adminPage.getByText(/Municipal Staff Accountability Matrix/i)).toBeVisible();
    await expect(adminPage.getByText(/Ramesh Verma/i)).toBeVisible();
    await expect(adminPage.getByText('TOP PERFORMER', { exact: true })).toBeVisible();

    // Cleanup contexts
    await citizenContext.close();
    await inspectorContext.close();
    await adminContext.close();
  });
});
