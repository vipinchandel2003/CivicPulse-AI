import { test, expect } from '@playwright/test';

test.describe('Portal 3: Command Center & Governance (apps/web-admin)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
  });

  test('3.1 Role Scoping & Access Control: Admin Shell & Clearance', async ({ page }) => {
    // 1. Verify Command Center Header & Super Admin clearance
    await expect(page.getByText(/Indore 311 ICCC/i)).toBeVisible();
    await expect(page.getByText(/SUPER_ADMIN/i)).toBeVisible();
    await expect(page.getByText(/Dr\. P\. Singhal/i)).toBeVisible();

    // 2. Verify all 6 governance navigation tabs
    await expect(page.getByRole('button', { name: /Executive Overview/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Ward Kanban Board/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /AI Review Queue/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Geospatial Heatmap/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Accountability Matrix/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /SLA Escalation Engine/i })).toBeVisible();
  });

  test('3.2 City Overview & Geospatial Intelligence: KPI Metrics & City Heatmap', async ({ page }) => {
    // 1. Check Executive KPI Cards
    await expect(page.getByText(/Critical Overdue SLA/i)).toBeVisible();
    await expect(page.getByText(/In-Progress Field Jobs/i)).toBeVisible();
    await expect(page.getByText(/Verified Closures/i)).toBeVisible();
    await expect(page.getByText(/Citywide MTTR/i)).toBeVisible();

    // 2. Switch to Geospatial Heatmap (H3) tab
    await page.getByRole('button', { name: /Geospatial Heatmap/i }).click();
    await expect(page.getByText(/Citywide Geospatial H3 Heatmap/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Chronic Blackspots/i })).toBeVisible();
    await expect(page.getByText(/Indore Nagar Nigam PostGIS Grid/i)).toBeVisible();
  });

  test('3.3 CSI Review Queue & Fraud Control: Side-by-Side Verification', async ({ page }) => {
    // Go to Review Queue
    await page.getByRole('button', { name: /AI Review Queue/i }).click();
    await expect(page.getByText(/Proof-of-Work Verification Queue/i)).toBeVisible();

    // Open first review card if present
    const reviewCards = page.locator('div').filter({ hasText: /Review →/i });
    if (await reviewCards.count() > 0) {
      await reviewCards.first().click();

      // Check Supervisor Review Modal
      await expect(page.getByText(/Supervisor Resolution Review/i)).toBeVisible();
      await expect(page.getByText(/Citizen Report \(Before\)/i)).toBeVisible();
      await expect(page.getByText(/Inspector Closure \(After\)/i)).toBeVisible();
      await expect(page.getByText(/CLIP Background Match/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Approve & Mark RESOLVED/i })).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }

    // Switch to Ward Kanban Board
    await page.getByRole('button', { name: /Ward Kanban Board/i }).click();
    await expect(page.getByText(/Ward 64 Incident Board/i)).toBeVisible();
    await expect(page.getByText(/In Progress/i)).toBeVisible();
    await expect(page.getByText(/Verified Closures/i)).toBeVisible();
  });

  test('3.4 Accountability Matrix, ICCC Red List & Show-Cause Drafts', async ({ page }) => {
    // Switch to Accountability Matrix
    await page.getByRole('button', { name: /Accountability Matrix/i }).click();
    await expect(page.getByText(/Municipal Staff Accountability Matrix/i)).toBeVisible();
    await expect(page.getByText(/Ramesh Verma/i)).toBeVisible();
    await expect(page.getByText('TOP PERFORMER', { exact: true })).toBeVisible();
    await expect(page.getByText(/Dinesh Malviya/i)).toBeVisible();
    await expect(page.getByText('CRITICAL REVIEW', { exact: true })).toBeVisible();

    // Switch to SLA Escalation Engine & ICCC Red List
    await page.getByRole('button', { name: /SLA Escalation Engine/i }).click();
    await expect(page.getByText(/SLA Escalation Engine & ICCC Red List/i)).toBeVisible();
    await expect(page.getByText('L3 COMMISSIONER', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Review Show-Cause Draft/i })).toBeVisible();
  });
});
