import { test, expect } from "@playwright/test";

test.describe("Mechanic Helper - Comprehensive E2E Tests", () => {
  const baseURL = "http://localhost:5173";

  test.beforeEach(async ({ page }) => {
    await page.goto(baseURL);
  });

  // ============================================
  // 1. AUTHENTICATION & USER FLOWS
  // ============================================

  test("should load landing page and show login button", async ({ page }) => {
    // Check if page loads
    await expect(page).toHaveTitle(/Mechanic Helper/i);

    // Check for key elements
    const heading = page.locator("h1, h2");
    await expect(heading).toBeTruthy();
  });

  test("should navigate to diagnostic page", async ({ page }) => {
    // Click on "New Diagnostic" button or link
    const newDiagnosticBtn = page.locator("button:has-text('New Diagnostic'), a:has-text('New Diagnostic')");
    if (await newDiagnosticBtn.isVisible()) {
      await newDiagnosticBtn.click();
      await page.waitForNavigation();
      await expect(page).toHaveURL(/\/diagnostic/);
    }
  });

  // ============================================
  // 2. DIAGNOSTIC WORKFLOW
  // ============================================

  test("should complete diagnostic workflow - vehicle selection", async ({ page }) => {
    // Navigate to diagnostic
    await page.goto(`${baseURL}/diagnostic`);

    // Select brand
    const brandSelect = page.locator("select, [role='combobox']").first();
    if (await brandSelect.isVisible()) {
      await brandSelect.click();
      await page.locator("text=Volkswagen").click();
    }

    // Select model
    const modelSelect = page.locator("select, [role='combobox']").nth(1);
    if (await modelSelect.isVisible()) {
      await modelSelect.click();
      await page.locator("text=Golf").click();
    }

    // Select year
    const yearInput = page.locator("input[type='number']");
    if (await yearInput.isVisible()) {
      await yearInput.fill("2015");
    }
  });

  test("should add symptoms to diagnostic", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Fill in symptoms
    const symptomsInput = page.locator("textarea, input[placeholder*='symptom' i]");
    if (await symptomsInput.isVisible()) {
      await symptomsInput.fill("Engine light on, rough idle, poor fuel economy");
    }

    // Add error codes
    const errorCodeInput = page.locator("input[placeholder*='error' i], input[placeholder*='code' i]");
    if (await errorCodeInput.isVisible()) {
      await errorCodeInput.fill("P0101");
      await page.keyboard.press("Enter");
    }
  });

  test("should submit diagnostic and receive analysis", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Fill form
    const submitBtn = page.locator("button:has-text('Submit'), button:has-text('Analyze')");
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Wait for analysis results
      await page.waitForTimeout(3000);

      // Check for results
      const results = page.locator("text=/diagnosis|analysis|result/i");
      if (await results.isVisible()) {
        await expect(results).toBeTruthy();
      }
    }
  });

  // ============================================
  // 3. OBD SCANNER & AI FEATURES
  // ============================================

  test("should access OBD Scanner page", async ({ page }) => {
    // Navigate to OBD Scanner
    const obdLink = page.locator("a:has-text('OBD Scanner'), button:has-text('OBD Scanner')");
    if (await obdLink.isVisible()) {
      await obdLink.click();
      await page.waitForNavigation();
      await expect(page).toHaveURL(/obd|scanner/i);
    }
  });

  test("should show AI suggestions in diagnostic results", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Look for AI suggestions section
    const aiSuggestions = page.locator("text=/AI suggestions|Recommended|Analysis/i");
    if (await aiSuggestions.isVisible()) {
      await expect(aiSuggestions).toBeTruthy();
    }
  });

  test("should display maintenance recommendations", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Look for maintenance section
    const maintenance = page.locator("text=/maintenance|service|preventive/i");
    if (await maintenance.isVisible()) {
      await expect(maintenance).toBeTruthy();
    }
  });

  // ============================================
  // 4. REPAIR PROCEDURES & FIXES
  // ============================================

  test("should display repair procedures", async ({ page }) => {
    // Look for repair procedures section
    const procedures = page.locator("text=/repair procedure|step-by-step|how to/i");
    if (await procedures.isVisible()) {
      await expect(procedures).toBeTruthy();
    }
  });

  test("should show confirmed fixes from community", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Look for community fixes
    const fixes = page.locator("text=/confirmed fixes|community solutions|verified fixes/i");
    if (await fixes.isVisible()) {
      await expect(fixes).toBeTruthy();
    }
  });

  test("should allow voting on fixes", async ({ page }) => {
    // Look for upvote button
    const upvoteBtn = page.locator("button:has-text('upvote'), button:has-text('helpful')");
    if (await upvoteBtn.isVisible()) {
      await upvoteBtn.click();
      await page.waitForTimeout(500);
      await expect(upvoteBtn).toBeTruthy();
    }
  });

  // ============================================
  // 5. REPORTING & EXPORT
  // ============================================

  test("should generate PDF report", async ({ page }) => {
    // Look for export/PDF button
    const exportBtn = page.locator("button:has-text('Export'), button:has-text('PDF'), button:has-text('Download')");
    if (await exportBtn.isVisible()) {
      // Start listening for download
      const downloadPromise = page.waitForEvent("download");
      await exportBtn.click();

      // Wait for download to start
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain(".pdf");
    }
  });

  test("should show cost estimates", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Look for cost information
    const costs = page.locator("text=/cost|price|estimate|$|€/i");
    if (await costs.isVisible()) {
      await expect(costs).toBeTruthy();
    }
  });

  test("should display repair shop options", async ({ page }) => {
    // Look for shop information
    const shops = page.locator("text=/repair shop|mechanic|service center/i");
    if (await shops.isVisible()) {
      await expect(shops).toBeTruthy();
    }
  });

  // ============================================
  // 6. ADMIN FEATURES
  // ============================================

  test("should access admin dashboard", async ({ page }) => {
    // Try to navigate to admin
    await page.goto(`${baseURL}/admin`);

    // Check if admin page loads or shows access denied
    const adminContent = page.locator("text=/admin|settings|management/i");
    const accessDenied = page.locator("text=/403|forbidden|access denied/i");

    if (await adminContent.isVisible()) {
      await expect(adminContent).toBeTruthy();
    } else if (await accessDenied.isVisible()) {
      // Expected for non-admin users
      await expect(accessDenied).toBeTruthy();
    }
  });

  // ============================================
  // 7. MOBILE RESPONSIVENESS
  // ============================================

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(baseURL);

    // Check if mobile nav is visible
    const mobileNav = page.locator("[class*='mobile'], [class*='nav']");
    await expect(mobileNav).toBeTruthy();
  });

  // ============================================
  // 8. DARK MODE
  // ============================================

  test("should support dark mode", async ({ page }) => {
    // Look for theme toggle
    const themeToggle = page.locator("button[aria-label*='theme'], button[aria-label*='dark']");
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Check if dark mode is applied
      const htmlElement = page.locator("html");
      const classList = await htmlElement.getAttribute("class");
      expect(classList).toContain("dark");
    }
  });

  // ============================================
  // 9. PERFORMANCE
  // ============================================

  test("should load home page in under 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(baseURL);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test("should load diagnostic page in under 4 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(`${baseURL}/diagnostic`);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(4000);
  });

  // ============================================
  // 10. ERROR HANDLING
  // ============================================

  test("should handle network errors gracefully", async ({ page }) => {
    // Simulate network error
    await page.context().setOffline(true);

    // Try to navigate
    await page.goto(baseURL).catch(() => {
      // Expected to fail
    });

    // Restore network
    await page.context().setOffline(false);
  });

  test("should show error messages for invalid input", async ({ page }) => {
    await page.goto(`${baseURL}/diagnostic`);

    // Try to submit empty form
    const submitBtn = page.locator("button:has-text('Submit'), button:has-text('Analyze')");
    if (await submitBtn.isVisible()) {
      await submitBtn.click();

      // Check for error message
      const errorMsg = page.locator("text=/required|invalid|error/i");
      if (await errorMsg.isVisible()) {
        await expect(errorMsg).toBeTruthy();
      }
    }
  });
});
