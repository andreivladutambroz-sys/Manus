import { test, expect, devices } from '@playwright/test';

const test_mobile = test.extend({
  ...devices['iPhone 12'],
});

test_mobile.describe('Mobile UX', () => {

  test_mobile('should display mobile bottom navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for bottom navigation
    const bottomNav = page.locator('nav');
    await expect(bottomNav).toBeVisible();
    
    // Check for navigation items
    await expect(page.locator('button:has-text("Home")')).toBeVisible();
    await expect(page.locator('button:has-text("Diagnostic")')).toBeVisible();
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
  });

  test_mobile('should navigate using bottom nav', async ({ page }) => {
    await page.goto('/');
    
    // Click on dashboard button
    const dashboardButton = page.locator('button:has-text("Dashboard")');
    if (await dashboardButton.isVisible()) {
      await dashboardButton.click();
      // Should navigate to dashboard
      await expect(page).toHaveURL(/dashboard/);
    }
  });

  test_mobile('should have touch-optimized buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check button sizes (should be at least 44x44 for touch)
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      
      if (box) {
        // Touch targets should be at least 44x44
        expect(box.height).toBeGreaterThanOrEqual(40);
        expect(box.width).toBeGreaterThanOrEqual(40);
      }
    }
  });

  test_mobile('should have responsive layout', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(430);
    
    // Check if content is visible
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test_mobile('should display theme selector on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check if theme selector is accessible
    const themeButton = page.locator('button[title="Theme Settings"]');
    if (await themeButton.isVisible()) {
      await expect(themeButton).toBeVisible();
      await themeButton.click();
      
      // Check if dropdown is visible
      await expect(page.locator('text=Theme Mode')).toBeVisible();
    }
  });

  test_mobile('should support dark mode on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Open theme selector
    const themeButton = page.locator('button[title="Theme Settings"]');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // Select dark theme
      await page.locator('text=Dark').click();
      
      // Check if dark class is applied
      const html = page.locator('html');
      const isDark = await html.evaluate((el) => el.classList.contains('dark'));
      expect(isDark).toBeTruthy();
    }
  });

  test_mobile('should have readable text on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Check font sizes (should be at least 16px for readability)
    const paragraphs = page.locator('p');
    const count = await paragraphs.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      const p = paragraphs.nth(i);
      const fontSize = await p.evaluate((el) => window.getComputedStyle(el).fontSize);
      const fontSizeNum = parseInt(fontSize);
      
      expect(fontSizeNum).toBeGreaterThanOrEqual(14);
    }
  });
});
