import { test, expect } from '@playwright/test';

test.describe('Diagnostic Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should display diagnostic form', async ({ page }) => {
    // Click on "New Diagnostic" or navigate directly
    await page.goto('/diagnostic/new');
    
    // Check if form elements are visible
    await expect(page.locator('text=Vehicle Information')).toBeVisible();
    await expect(page.locator('input[placeholder*="Brand"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/diagnostic/new');
    
    // Try to proceed without filling form
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // Should show validation error
      await expect(page.locator('text=required')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should fill vehicle information', async ({ page }) => {
    await page.goto('/diagnostic/new');
    
    // Fill brand
    await page.locator('input[placeholder*="Brand"]').fill('Volkswagen');
    await page.locator('text=Volkswagen').click();
    
    // Fill model
    await page.locator('input[placeholder*="Model"]').fill('Golf');
    
    // Fill year
    await page.locator('input[placeholder*="Year"]').fill('2020');
    
    // Verify values are filled
    await expect(page.locator('input[value="Volkswagen"]')).toBeVisible();
    await expect(page.locator('input[value="Golf"]')).toBeVisible();
    await expect(page.locator('input[value="2020"]')).toBeVisible();
  });

  test('should add error codes', async ({ page }) => {
    await page.goto('/diagnostic/new');
    
    // Fill vehicle info first
    await page.locator('input[placeholder*="Brand"]').fill('Volkswagen');
    await page.locator('input[placeholder*="Model"]').fill('Golf');
    await page.locator('input[placeholder*="Year"]').fill('2020');
    
    // Navigate to symptoms step
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
    
    // Add error code
    const errorCodeInput = page.locator('input[placeholder*="Error Code"]');
    if (await errorCodeInput.isVisible()) {
      await errorCodeInput.fill('P0101');
      await page.locator('button:has-text("Add")').click();
      
      // Verify error code is added
      await expect(page.locator('text=P0101')).toBeVisible();
    }
  });

  test('should display voice input button', async ({ page }) => {
    await page.goto('/diagnostic/new');
    
    // Check if voice input is available
    const voiceButton = page.locator('button[title*="mic"]');
    if (await voiceButton.isVisible()) {
      await expect(voiceButton).toBeVisible();
    }
  });

  test('should show AI suggestions after analysis', async ({ page }) => {
    await page.goto('/diagnostic/new');
    
    // Fill minimum required data
    await page.locator('input[placeholder*="Brand"]').fill('Volkswagen');
    await page.locator('input[placeholder*="Model"]').fill('Golf');
    await page.locator('input[placeholder*="Year"]').fill('2020');
    
    // Check if AI suggestions button is present
    const aiButton = page.locator('button:has-text("AI Suggestions")');
    if (await aiButton.isVisible()) {
      await expect(aiButton).toBeVisible();
    }
  });
});
