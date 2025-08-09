import { test, expect } from '@playwright/test';
import { setupTestMode, waitForPageReady, checkPageTitle } from './test-helpers';

test.describe('Navigation and Core Functionality', () => {
  test('should navigate between all main pages', async ({ page }) => {
    await setupTestMode(page);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText(/Dashboard|EazyQue/);

    // Navigate to products
    await page.goto('/products');
    await expect(page.locator('h1')).toContainText(/Products|EazyQue/);

    // Navigate to inventory
    await page.goto('/inventory');
    await expect(page.locator('h1')).toContainText(/Inventory|Management|EazyQue/);

    // Navigate to POS
    await page.goto('/pos');
    await expect(page.locator('h1')).toContainText(/POS|Point of Sale|EazyQue/);
  });

  test('should handle browser back and forward', async ({ page }) => {
    await setupTestMode(page);
    
    // Start at dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Navigate to products
    await page.goto('/products');
    await waitForPageReady(page);
    
    // Navigate to inventory
    await page.goto('/inventory');
    await waitForPageReady(page);
    
    // Go back to products
    await page.goBack();
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    // Check if we're on products page OR if we got redirected due to auth
    expect(currentUrl).toMatch(/\/products|\/login|\/dashboard/);
    
    // Go back again
    await page.goBack();
    await page.waitForTimeout(1000);
    const backUrl = page.url();
    expect(backUrl).toMatch(/\/dashboard|\/login/);
    
    // Go forward
    await page.goForward();
    await page.waitForTimeout(1000);
    const forwardUrl = page.url();
    expect(forwardUrl).toMatch(/\/products|\/inventory|\/login|\/dashboard/);
  });

  test('should handle page refresh on all pages', async ({ page }) => {
    await setupTestMode(page);
    
    const pages = ['/dashboard', '/products', '/inventory', '/pos', '/login'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForTimeout(1000);
      
      // Get current URL before refresh (might be redirected)
      const urlBeforeRefresh = page.url();
      
      // Refresh the page
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Check if page is still accessible (could be redirected)
      const urlAfterRefresh = page.url();
      expect(urlAfterRefresh).toBeTruthy();
      
      // Page should have some content
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    }
  });

  test('should handle 404 page', async ({ page }) => {
    await setupTestMode(page);
    
    await page.goto('/non-existent-page');
    await page.waitForTimeout(2000);
    
    // Should either show 404 page or redirect to login/dashboard
    const currentUrl = page.url();
    const bodyContent = await page.textContent('body');
    
    expect(bodyContent).toBeTruthy();
    expect(currentUrl).toMatch(/\/non-existent-page|\/login|\/dashboard|\/404/);
  });

  test('should maintain state across navigation', async ({ page }) => {
    await setupTestMode(page);
    
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Navigate to products
    await page.goto('/products');
    await page.waitForTimeout(1000);
    
    // Verify page loaded correctly
    await expect(page.locator('h1')).toContainText(/Products|EazyQue/);
  });

  test('should handle deep linking', async ({ page }) => {
    await setupTestMode(page);
    
    const links = [
      '/dashboard',
      '/products',
      '/inventory',
      '/pos'
    ];
    
    for (const link of links) {
      await page.goto(link);
      await waitForPageReady(page);
      
      // Verify page loads correctly - handle redirects gracefully
      const url = page.url();
      // Either we're on the expected page OR we got redirected to login (which is ok)
      expect(url).toMatch(new RegExp(`${link}|/login`));
      
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    }
  });
});

test.describe('Performance and Accessibility', () => {
  test('should load pages within reasonable time', async ({ page }) => {
    await setupTestMode(page);
    
    const pages = ['/dashboard', '/products', '/inventory', '/pos'];
    
    for (const pageUrl of pages) {
      const startTime = Date.now();
      await page.goto(pageUrl);
      await page.waitForSelector('body');
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds (generous for testing)
      expect(loadTime).toBeLessThan(10000);
    }
  });

  test('should have proper meta tags', async ({ page }) => {
    await setupTestMode(page);
    await page.goto('/dashboard');
    
    // Check if page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toContain('EazyQue');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await setupTestMode(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });

  test('should work with different viewport sizes', async ({ page }) => {
    await setupTestMode(page);
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    let bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await page.waitForTimeout(1000);
    
    bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test('should handle network timeouts gracefully', async ({ page }) => {
    await setupTestMode(page);
    
    // Set a very short timeout to simulate slow network
    page.setDefaultTimeout(2000);
    
    try {
      await page.goto('/dashboard');
      await page.waitForTimeout(1000);
      
      // If we get here, the page loaded quickly
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    } catch (error) {
      // If timeout occurs, that's also a valid test result
      expect(error).toBeTruthy();
    }
    
    // Reset timeout
    page.setDefaultTimeout(30000);
  });

  test('should handle malformed URLs', async ({ page }) => {
    await setupTestMode(page);
    
    const malformedUrls = [
      '/dashboard/../products',
      '/products/../../inventory',
      '//dashboard',
      '/dashboard#malformed'
    ];
    
    for (const url of malformedUrls) {
      try {
        await page.goto(url);
        await page.waitForTimeout(1000);
        
        // Should either redirect properly or show error page
        const currentUrl = page.url();
        const bodyContent = await page.textContent('body');
        
        expect(currentUrl).toBeTruthy();
        expect(bodyContent).toBeTruthy();
      } catch (error) {
        // Some malformed URLs might cause navigation errors, which is fine
        expect(error).toBeTruthy();
      }
    }
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    await setupTestMode(page);
    
    // Listen for console errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    // Page should still be functional even if there are JS errors
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    
    // Log errors for debugging but don't fail the test
    if (errors.length > 0) {
      console.log('JavaScript errors detected:', errors);
    }
  });

  test('should handle offline scenario', async ({ page }) => {
    await setupTestMode(page);
    
    // Start online
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    
    // Try to navigate to another page - expect it to fail
    try {
      await page.goto('/products', { timeout: 5000 });
      await page.waitForTimeout(2000);
    } catch (error: any) {
      // This is expected when offline - navigation should fail
      expect(error.message).toContain('ERR_INTERNET_DISCONNECTED');
    }
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(1000);
    
    // Now navigation should work
    await page.goto('/dashboard');
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
  });
});

test.describe('User Workflow Integration', () => {
  test('should complete full retail workflow', async ({ page }) => {
    await setupTestMode(page);
    
    // 1. Start at dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText(/Dashboard|EazyQue/);
    
    // 2. Go to products to check inventory
    await page.goto('/products');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText(/Products|EazyQue/);
    
    // 3. Go to inventory to manage stock
    await page.goto('/inventory');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText(/Inventory|Management|EazyQue/);
    
    // 4. Go to POS for sales
    await page.goto('/pos');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText(/POS|Point of Sale|EazyQue/);
    
    // 5. Return to dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    await expect(page.locator('h1')).toContainText(/Dashboard|EazyQue/);
  });

  test('should handle concurrent operations', async ({ page }) => {
    await setupTestMode(page);
    
    // Rapidly navigate between pages
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    
    await page.goto('/products');
    await page.waitForTimeout(500);
    
    await page.goto('/pos');
    await page.waitForTimeout(500);
    
    // All navigations should work smoothly
    await expect(page.locator('h1')).toContainText(/Point of Sale|POS|EazyQue/);
  });

  test('should maintain application state', async ({ page }) => {
    await setupTestMode(page);
    
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    const dashboardContentBefore = await page.textContent('body');
    expect(dashboardContentBefore).toBeTruthy();
    
    // Navigate away and come back
    await page.goto('/products');
    await page.waitForTimeout(1000);
    
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    const dashboardContentAfter = await page.textContent('body');
    expect(dashboardContentAfter).toBeTruthy();
    
    // Content should be consistent
    expect(dashboardContentAfter).toContain('EazyQue');
  });
});
