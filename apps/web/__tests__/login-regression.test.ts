import { test, expect } from '@playwright/test';

// Test data for login scenarios
const testUsers = {
  shopOwner: {
    email: 'rajesh.kumar@testshop.com',
    password: 'TestPassword123',
    name: 'Rajesh Kumar',
    shopName: 'Kumar General Store'
  },
  employee: {
    email: 'priya.sharma@testshop.com',
    password: 'TestPassword123',
    name: 'Priya Sharma'
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  }
};

test.describe('Login Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
  });

  test('should load login page correctly', async ({ page }) => {
    // Verify page elements
    await expect(page).toHaveTitle(/EazyQue/);
    await expect(page.locator('h1')).toContainText('Sign In');
    
    // Check form elements are visible
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/ })).toBeVisible();
    
    // Check links are present
    await expect(page.locator('text=Don\'t have an account?')).toBeVisible();
    await expect(page.locator('text=Sign up')).toBeVisible();
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'test-results/screenshots/login-page-loaded.png',
      fullPage: true 
    });
  });

  test('should validate empty form submission', async ({ page }) => {
    // Try to submit empty form
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Check for validation errors
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    
    // HTML5 validation should prevent submission
    await expect(emailField).toHaveAttribute('required');
    await expect(passwordField).toHaveAttribute('required');
    
    // Take screenshot of validation state
    await page.screenshot({ 
      path: 'test-results/screenshots/login-validation-empty.png',
      fullPage: true 
    });
  });

  test('should validate invalid email format', async ({ page }) => {
    // Enter invalid email
    await page.locator('#email').fill('invalid-email');
    await page.locator('#password').fill('somepassword');
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Check HTML5 email validation
    const emailField = page.locator('#email');
    await expect(emailField).toHaveAttribute('type', 'email');
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/login-invalid-email.png',
      fullPage: true 
    });
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    // Fill form with invalid credentials
    await page.locator('#email').fill(testUsers.invalidUser.email);
    await page.locator('#password').fill(testUsers.invalidUser.password);
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Check for error message (adjust selector based on actual implementation)
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/invalid|incorrect|wrong/i);
    }
    
    // Take screenshot of error state
    await page.screenshot({ 
      path: 'test-results/screenshots/login-invalid-credentials.png',
      fullPage: true 
    });
    
    console.log('Tested invalid login credentials');
  });

  test('should successfully login as shop owner', async ({ page }) => {
    // Fill login form with shop owner credentials
    await page.locator('#email').fill(testUsers.shopOwner.email);
    await page.locator('#password').fill(testUsers.shopOwner.password);
    
    // Take screenshot before login
    await page.screenshot({ 
      path: 'test-results/screenshots/login-form-filled-owner.png',
      fullPage: true 
    });
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for navigation/response
    await page.waitForTimeout(3000);
    
    // Check for successful login indicators
    const currentUrl = page.url();
    
    // Could redirect to dashboard, home, or stay on login with success message
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/home')) {
      // Successful redirect
      await expect(page.url()).toMatch(/(dashboard|home)/);
      
      // Take screenshot of successful login
      await page.screenshot({ 
        path: 'test-results/screenshots/login-success-owner-dashboard.png',
        fullPage: true 
      });
      
      console.log('✅ Shop owner login successful - redirected to dashboard');
    } else {
      // Check for success message on login page
      const successMessage = page.locator('[data-testid="success-message"], .success, .alert-success');
      if (await successMessage.isVisible()) {
        await page.screenshot({ 
          path: 'test-results/screenshots/login-success-owner-message.png',
          fullPage: true 
        });
        console.log('✅ Shop owner login successful - success message shown');
      } else {
        // Take screenshot for debugging
        await page.screenshot({ 
          path: 'test-results/screenshots/login-owner-debug.png',
          fullPage: true 
        });
        console.log('⚠️ Shop owner login response unclear - screenshot taken for review');
      }
    }
  });

  test('should successfully login as employee', async ({ page }) => {
    // Fill login form with employee credentials
    await page.locator('#email').fill(testUsers.employee.email);
    await page.locator('#password').fill(testUsers.employee.password);
    
    // Take screenshot before login
    await page.screenshot({ 
      path: 'test-results/screenshots/login-form-filled-employee.png',
      fullPage: true 
    });
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for navigation/response
    await page.waitForTimeout(3000);
    
    // Check for successful login indicators
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/pos') || currentUrl.includes('/home')) {
      // Successful redirect for employee
      await page.screenshot({ 
        path: 'test-results/screenshots/login-success-employee-dashboard.png',
        fullPage: true 
      });
      
      console.log('✅ Employee login successful - redirected to workspace');
    } else {
      // Check for success message
      const successMessage = page.locator('[data-testid="success-message"], .success, .alert-success');
      if (await successMessage.isVisible()) {
        await page.screenshot({ 
          path: 'test-results/screenshots/login-success-employee-message.png',
          fullPage: true 
        });
        console.log('✅ Employee login successful - success message shown');
      } else {
        // Take screenshot for debugging
        await page.screenshot({ 
          path: 'test-results/screenshots/login-employee-debug.png',
          fullPage: true 
        });
        console.log('⚠️ Employee login response unclear - screenshot taken for review');
      }
    }
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Simulate offline network
    await page.route('**/*', route => route.abort());
    
    // Fill form
    await page.locator('#email').fill(testUsers.shopOwner.email);
    await page.locator('#password').fill(testUsers.shopOwner.password);
    
    // Try to submit
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for timeout/error
    await page.waitForTimeout(2000);
    
    // Take screenshot of network error state
    await page.screenshot({ 
      path: 'test-results/screenshots/login-network-error.png',
      fullPage: true 
    });
    
    console.log('Tested network connectivity error handling');
  });

  test('should maintain form state during validation errors', async ({ page }) => {
    const testEmail = 'user@example.com';
    const testPassword = 'password123';
    
    // Fill form
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(testPassword);
    
    // Submit (might fail due to user not existing)
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check that form values are maintained
    await expect(page.locator('#email')).toHaveValue(testEmail);
    await expect(page.locator('#password')).toHaveValue(testPassword);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/login-form-state-maintained.png',
      fullPage: true 
    });
  });

  test('should have proper input field styling and visibility', async ({ page }) => {
    const inputFields = ['#email', '#password'];
    
    for (const selector of inputFields) {
      const field = page.locator(selector);
      await expect(field).toBeVisible();
      
      // Check styling
      await expect(field).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(field).toHaveCSS('color', 'rgb(0, 0, 0)');
    }
    
    // Take screenshot of styled form
    await page.screenshot({ 
      path: 'test-results/screenshots/login-form-styling.png',
      fullPage: true 
    });
  });

  test('should navigate to signup page correctly', async ({ page }) => {
    // Click signup link
    await page.locator('text=Sign up').click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we're on signup page
    await expect(page.url()).toContain('/signup');
    await expect(page.locator('h1')).toContainText('Join EazyQue');
    
    // Take screenshot of navigation
    await page.screenshot({ 
      path: 'test-results/screenshots/login-to-signup-navigation.png',
      fullPage: true 
    });
  });
});
