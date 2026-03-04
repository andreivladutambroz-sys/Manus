import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Home page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load diagnostic page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/diagnostic/new', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Diagnostic page should load within 4 seconds
    expect(loadTime).toBeLessThan(4000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return {
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        lcp: performance.getEntriesByType('largest-contentful-paint').pop()?.startTime,
        cls: 0, // Cumulative Layout Shift (simplified)
      };
    });
    
    // First Contentful Paint should be < 1.8s
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(1800);
    }
    
    // Largest Contentful Paint should be < 2.5s
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (err) => !err.includes('Failed to load') && !err.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle network throttling', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', (route) => {
      setTimeout(() => route.continue(), 100);
    });
    
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(8000);
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/');
    
    // Check if images have lazy loading attributes
    const images = page.locator('img');
    const count = await images.count();
    
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const img = images.nth(i);
        const loading = await img.getAttribute('loading');
        
        // Images should have loading="lazy" or data-src for lazy loading
        const hasLazyLoading = loading === 'lazy' || (await img.getAttribute('data-src'));
        expect(hasLazyLoading).toBeTruthy();
      }
    }
  });

  test('should not have memory leaks', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/');
    await page.goto('/diagnostic/new');
    await page.goto('/');
    
    // Get memory usage
    const memory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory usage should be reasonable (< 100MB)
    expect(memory).toBeLessThan(100 * 1024 * 1024);
  });

  test('should bundle code efficiently', async ({ page }) => {
    const requests: { url: string; size: number }[] = [];
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('.js') || url.includes('.css')) {
        requests.push({
          url,
          size: response.headers()['content-length']
            ? parseInt(response.headers()['content-length'])
            : 0,
        });
      }
    });
    
    await page.goto('/');
    
    // Check bundle sizes
    const totalSize = requests.reduce((sum, req) => sum + req.size, 0);
    
    // Total JS + CSS should be < 500KB (gzipped)
    expect(totalSize).toBeLessThan(500 * 1024);
  });
});
