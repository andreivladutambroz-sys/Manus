import { test, expect } from '@playwright/test';

test.describe('Diagnostic Generation E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should complete full diagnostic workflow', async ({ page }) => {
    // Step 1: Login (if needed)
    const loginButton = page.locator('text=Login');
    if (await loginButton.isVisible()) {
      await loginButton.click();
      // Handle OAuth flow - this would need credentials
      await page.waitForURL('**/callback');
    }

    // Step 2: Navigate to New Diagnostic
    await page.click('text=New Diagnostic');
    await page.waitForURL('**/diagnostic/new');

    // Step 3: Select Vehicle Brand
    const brandSelect = page.locator('[id="brand"]');
    await brandSelect.click();
    await page.click('text=Volkswagen');
    expect(await brandSelect.inputValue()).toBe('Volkswagen');

    // Step 4: Select Vehicle Model (should be dropdown now)
    const modelSelect = page.locator('[id="model"]');
    await modelSelect.click();
    await page.click('text=Golf');
    expect(await modelSelect.inputValue()).toBe('Golf');

    // Step 5: Fill Year
    await page.fill('[id="year"]', '2015');

    // Step 6: Fill Engine
    await page.fill('[id="engine"]', '1.6 TDI');

    // Step 7: Fill Mileage
    await page.fill('[id="mileage"]', '145000');

    // Step 8: Click Next/Continue
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');

    // Step 9: Select Symptoms
    const symptomCheckbox = page.locator('text=Check Engine aprins');
    await symptomCheckbox.click();
    
    const powerLossCheckbox = page.locator('text=Pierdere putere');
    await powerLossCheckbox.click();

    // Step 10: Add Error Codes
    const errorCodeInput = page.locator('[placeholder*="P0"]');
    await errorCodeInput.fill('P0101');
    await page.click('button:has-text("Add")');
    
    await errorCodeInput.fill('P0128');
    await page.click('button:has-text("Add")');

    // Step 11: Select Conditions
    const conditionCheckbox = page.locator('text=La accelerare');
    await conditionCheckbox.click();

    // Step 12: Add Notes
    await page.fill('[placeholder*="note"]', 'Test diagnostic - Check Engine light on');

    // Step 13: Submit for Analysis
    const analyzeButton = page.locator('button:has-text("Analyze")');
    await analyzeButton.click();

    // Step 14: Wait for Analysis to Complete
    await page.waitForSelector('text=Analysis Complete', { timeout: 30000 });

    // Step 15: Verify Diagnostic Results
    const resultsCard = page.locator('[data-testid="diagnostic-results"]');
    await expect(resultsCard).toBeVisible();

    // Check for analysis content
    const analysisContent = page.locator('text=Possible Causes');
    await expect(analysisContent).toBeVisible();

    // Check for recommendations
    const recommendationsSection = page.locator('text=Recommendations');
    await expect(recommendationsSection).toBeVisible();

    // Step 16: Verify AI Suggestions
    const suggestionsSection = page.locator('[data-testid="ai-suggestions"]');
    if (await suggestionsSection.isVisible()) {
      const suggestionText = await suggestionsSection.textContent();
      expect(suggestionText).toContain('suggestion');
    }

    // Step 17: Verify Maintenance Recommendations
    const maintenanceSection = page.locator('[data-testid="maintenance-recommendations"]');
    if (await maintenanceSection.isVisible()) {
      const maintenanceText = await maintenanceSection.textContent();
      expect(maintenanceText).toContain('maintenance');
    }

    console.log('✅ Full diagnostic workflow completed successfully!');
  });

  test('should validate model dropdown per brand', async ({ page }) => {
    // Navigate to new diagnostic
    await page.goto('http://localhost:3000/diagnostic/new');
    await page.waitForLoadState('networkidle');

    // Test Volkswagen models
    const brandSelect = page.locator('[id="brand"]');
    await brandSelect.click();
    await page.click('text=Volkswagen');

    const modelSelect = page.locator('[id="model"]');
    await modelSelect.click();
    
    // Check that Volkswagen models are available
    const golfOption = page.locator('text=Golf');
    await expect(golfOption).toBeVisible();
    
    const passatOption = page.locator('text=Passat');
    await expect(passatOption).toBeVisible();

    // Test BMW models
    await brandSelect.click();
    await page.click('text=BMW');

    await modelSelect.click();
    
    // Check that BMW models are available
    const bmwModel = page.locator('text=320');
    await expect(bmwModel).toBeVisible();

    console.log('✅ Model dropdown validation passed!');
  });

  test('should handle Kimi API responses correctly', async ({ page }) => {
    // This test verifies that API responses are being processed
    await page.goto('http://localhost:3000/diagnostic/new');
    await page.waitForLoadState('networkidle');

    // Fill in diagnostic data
    const brandSelect = page.locator('[id="brand"]');
    await brandSelect.click();
    await page.click('text=Volkswagen');

    const modelSelect = page.locator('[id="model"]');
    await modelSelect.click();
    await page.click('text=Golf');

    await page.fill('[id="year"]', '2015');
    await page.fill('[id="engine"]', '1.6 TDI');
    await page.fill('[id="mileage"]', '145000');

    // Monitor network requests for Kimi API calls
    const kimiRequests: any[] = [];
    page.on('response', (response) => {
      if (response.url().includes('api.moonshot.ai')) {
        kimiRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Submit for analysis
    await page.click('button:has-text("Next")');
    await page.click('text=Check Engine aprins');
    await page.click('button:has-text("Analyze")');

    // Wait for analysis
    await page.waitForSelector('text=Analysis', { timeout: 20000 });

    // Verify Kimi API was called
    console.log(`📊 Kimi API requests: ${kimiRequests.length}`);
    kimiRequests.forEach((req) => {
      console.log(`   - ${req.url}: ${req.status}`);
    });

    expect(kimiRequests.length).toBeGreaterThan(0);
  });
});
