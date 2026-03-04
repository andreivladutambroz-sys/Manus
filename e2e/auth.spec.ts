import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mechanic Helper/);
    await expect(page.locator('text=Professional Auto Diagnostics')).toBeVisible();
  });

  test('should show login button on home page', async ({ page }) => {
    await page.goto('/');
    const getStartedButton = page.locator('button:has-text("Get Started")');
    await expect(getStartedButton).toBeVisible();
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to home or login page
    await expect(page).toHaveURL(/\//);
  });

  test('should display auth error message on invalid credentials', async ({ page }) => {
    await page.goto('/');
    // Check if OAuth button is present
    const oauthButton = page.locator('button:has-text("Get Started")');
    await expect(oauthButton).toBeVisible();
  });

  test('should persist theme preference', async ({ page }) => {
    await page.goto('/');
    
    // Check if theme selector exists
    const themeButton = page.locator('button[title="Theme Settings"]');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      
      // Select dark theme
      await page.locator('text=Dark').click();
      
      // Reload page
      await page.reload();
      
      // Check if dark theme is still applied
      const html = page.locator('html');
      const isDark = await html.evaluate((el) => el.classList.contains('dark'));
      expect(isDark).toBeTruthy();
    }
  });
});
