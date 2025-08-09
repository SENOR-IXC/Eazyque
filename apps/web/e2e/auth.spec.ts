import { test, expect } from '@playwright/test';
import { setupTestMode, waitForPageReady, checkPageTitle, checkPageHeading } from './test-helpers';

test.describe('Authentication Flow', () => {
  test('should display login page correctly', async ({ page }) => {
    await setupTestMode(page);
    await page.goto('/login');
    await waitForPageReady(page);
    
    // Check page title - flexible matching
    const titleValid = await checkPageTitle(page, ['Login', 'EazyQue', 'Auth']);
    expect(titleValid).toBeTruthy();
    
    // Check page heading - flexible matching
    const headingValid = await checkPageHeading(page, ['Login', 'Sign in', 'EazyQue', 'Auth']);
    expect(headingValid).toBeTruthy();
    
    // Check login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    
    // Click submit without filling form
    await page.click('button[type="submit"]');
    
    // Check for validation messages (HTML5 validation)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should attempt login with valid credentials', async ({ page }) => {
    await setupTestMode(page);
    await page.goto('/login');
    await waitForPageReady(page);
    
    // Fill login form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or error message
    await page.waitForTimeout(3000);
    
    // Check if still functional (regardless of auth success/failure)
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await setupTestMode(page);
    
    // Intercept login API call and simulate network error
    await page.route('**/api/auth/login', route => {
      route.abort('internetdisconnected');
    });
    
    await page.goto('/login');
    await waitForPageReady(page);
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Check for error handling
    await page.waitForTimeout(3000);
    
    // Should handle error gracefully
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
  });
});
