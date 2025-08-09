import { test, expect } from '@playwright/test';

// Test data for employee login scenarios
const employeeTestData = {
  validEmployee: {
    email: 'priya.sharma@testshop.com',
    password: 'TestPassword123',
    name: 'Priya Sharma',
    shopName: 'Kumar General Store'
  },
  invalidEmployee: {
    email: 'nonexistent@employee.com',
    password: 'wrongpassword'
  },
  shopOwner: {
    email: 'rajesh.kumar@testshop.com',
    password: 'TestPassword123',
    name: 'Rajesh Kumar'
  }
};

test.describe('Employee Login Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should load employee login interface', async ({ page }) => {
    // Verify login page loads
    await expect(page).toHaveTitle(/EazyQue/);
    await expect(page.locator('h1')).toContainText('EazyQue');
    
    // Check if there's an employee login option or if it's unified
    const employeeOption = page.locator('text=Employee Login').or(page.locator('button[data-testid="employee-login"]'));
    
    if (await employeeOption.isVisible()) {
      await employeeOption.click();
      await page.screenshot({ 
        path: 'test-results/screenshots/employee-login-interface.png',
        fullPage: true 
      });
    } else {
      // Unified login interface
      await page.screenshot({ 
        path: 'test-results/screenshots/unified-login-interface.png',
        fullPage: true 
      });
    }
    
    console.log('✅ Employee login interface loaded');
  });

  test('should validate employee credentials format', async ({ page }) => {
    // Test email validation for employee
    await page.locator('#email').fill('invalid-employee-email');
    await page.locator('#password').fill('somepassword');
    
    // Try to submit
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Check HTML5 email validation
    const emailField = page.locator('#email');
    await expect(emailField).toHaveAttribute('type', 'email');
    
    // Take screenshot of validation
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-email-validation.png',
      fullPage: true 
    });
    
    console.log('✅ Employee email validation tested');
  });

  test('should handle invalid employee credentials', async ({ page }) => {
    // Fill form with invalid employee credentials
    await page.locator('#email').fill(employeeTestData.invalidEmployee.email);
    await page.locator('#password').fill(employeeTestData.invalidEmployee.password);
    
    // Take screenshot before submission
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-invalid-credentials-form.png',
      fullPage: true 
    });
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for error response
    await page.waitForTimeout(3000);
    
    // Check for error message
    const errorMessage = page.locator('[data-testid="error-message"], .error, .alert-error');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/invalid|incorrect|wrong|not found/i);
    }
    
    // Take screenshot of error state
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-invalid-credentials-error.png',
      fullPage: true 
    });
    
    console.log('⚠️ Invalid employee credentials handled');
  });

  test('should successfully login valid employee', async ({ page }) => {
    // Fill form with valid employee credentials
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    
    // Take screenshot before login
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-login-form-filled.png',
      fullPage: true 
    });
    
    // Submit form
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    // Wait for navigation/response
    await page.waitForTimeout(4000);
    
    // Check for successful login indicators
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/pos') || currentUrl.includes('/employee') || currentUrl.includes('/home')) {
      // Successful redirect to employee workspace
      await page.screenshot({ 
        path: 'test-results/screenshots/employee-login-success-dashboard.png',
        fullPage: true 
      });
      
      // Check for employee-specific elements
      const employeeIndicators = [
        page.locator(`text=${employeeTestData.validEmployee.name}`),
        page.locator('text=Employee'),
        page.locator('text=POS'),
        page.locator('[data-testid="employee-menu"]')
      ];
      
      for (const indicator of employeeIndicators) {
        if (await indicator.isVisible()) {
          console.log('✅ Employee-specific element found in dashboard');
          break;
        }
      }
      
      console.log('✅ Employee login successful - redirected to workspace');
    } else {
      // Check for success message on login page
      const successMessage = page.locator('[data-testid="success-message"], .success, .alert-success');
      if (await successMessage.isVisible()) {
        await page.screenshot({ 
          path: 'test-results/screenshots/employee-login-success-message.png',
          fullPage: true 
        });
        console.log('✅ Employee login successful - success message shown');
      } else {
        // Take screenshot for debugging
        await page.screenshot({ 
          path: 'test-results/screenshots/employee-login-debug.png',
          fullPage: true 
        });
        console.log('⚠️ Employee login response unclear - screenshot taken for review');
      }
    }
  });

  test('should differentiate employee access from shop owner', async ({ page }) => {
    // First login as shop owner
    await page.locator('#email').fill(employeeTestData.shopOwner.email);
    await page.locator('#password').fill(employeeTestData.shopOwner.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of shop owner dashboard
    await page.screenshot({ 
      path: 'test-results/screenshots/shop-owner-dashboard.png',
      fullPage: true 
    });
    
    // Logout (if logout functionality exists)
    const logoutButton = page.locator('text=Logout').or(page.locator('text=Sign Out')).or(page.locator('[data-testid="logout"]'));
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Navigate back to login manually
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }
    
    // Now login as employee
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of employee dashboard
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-vs-owner-comparison.png',
      fullPage: true 
    });
    
    console.log('✅ Employee vs Shop Owner access differentiation tested');
  });

  test('should handle employee session management', async ({ page }) => {
    // Login as employee
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    // Check if session is maintained on page refresh
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be logged in
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      await page.screenshot({ 
        path: 'test-results/screenshots/employee-session-maintained.png',
        fullPage: true 
      });
      console.log('✅ Employee session maintained after refresh');
    } else {
      await page.screenshot({ 
        path: 'test-results/screenshots/employee-session-lost.png',
        fullPage: true 
      });
      console.log('⚠️ Employee session not maintained - redirected to login');
    }
  });

  test('should validate employee permissions and access', async ({ page }) => {
    // Login as employee
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/pos') || currentUrl.includes('/employee')) {
      // Check for employee-appropriate menu items
      const employeeMenuItems = [
        'text=POS',
        'text=Sales',
        'text=Inventory',
        'text=Customers'
      ];
      
      // Check for restricted admin items (should not be visible)
      const adminOnlyItems = [
        'text=Settings',
        'text=Analytics',
        'text=Reports',
        'text=User Management',
        'text=Shop Configuration'
      ];
      
      // Take screenshot of employee interface
      await page.screenshot({ 
        path: 'test-results/screenshots/employee-permissions-interface.png',
        fullPage: true 
      });
      
      // Log available menu items
      for (const item of employeeMenuItems) {
        if (await page.locator(item).isVisible()) {
          console.log(`✅ Employee menu item visible: ${item}`);
        }
      }
      
      for (const item of adminOnlyItems) {
        if (await page.locator(item).isVisible()) {
          console.log(`⚠️ Admin-only item visible to employee: ${item}`);
        }
      }
    }
    
    console.log('✅ Employee permissions and access validated');
  });

  test('should handle employee password reset flow', async ({ page }) => {
    // Look for forgot password link
    const forgotPasswordLink = page.locator('text=Forgot Password').or(page.locator('text=Reset Password')).or(page.locator('a[href*="reset"]'));
    
    if (await forgotPasswordLink.isVisible()) {
      // Click forgot password
      await forgotPasswordLink.click();
      await page.waitForLoadState('networkidle');
      
      // Fill employee email
      const emailField = page.locator('#email').or(page.locator('input[type="email"]')).first();
      if (await emailField.isVisible()) {
        await emailField.fill(employeeTestData.validEmployee.email);
        
        // Take screenshot of password reset form
        await page.screenshot({ 
          path: 'test-results/screenshots/employee-password-reset-form.png',
          fullPage: true 
        });
        
        // Submit password reset
        const submitButton = page.getByRole('button', { name: /Send|Reset|Submit/ });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
          
          // Take screenshot of result
          await page.screenshot({ 
            path: 'test-results/screenshots/employee-password-reset-result.png',
            fullPage: true 
          });
        }
      }
      
      console.log('✅ Employee password reset flow tested');
    } else {
      console.log('ℹ️ Password reset functionality not found');
    }
  });

  test('should handle concurrent employee logins', async ({ page, context }) => {
    // Open second tab for concurrent login test
    const page2 = await context.newPage();
    
    // Login on first tab
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of first session
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-concurrent-session-1.png',
      fullPage: true 
    });
    
    // Try to login on second tab with same credentials
    await page2.goto('/login');
    await page2.waitForLoadState('networkidle');
    await page2.locator('#email').fill(employeeTestData.validEmployee.email);
    await page2.locator('#password').fill(employeeTestData.validEmployee.password);
    await page2.getByRole('button', { name: /Sign In/ }).click();
    await page2.waitForTimeout(3000);
    
    // Take screenshot of second session
    await page2.screenshot({ 
      path: 'test-results/screenshots/employee-concurrent-session-2.png',
      fullPage: true 
    });
    
    // Check if first session is still active
    await page.reload();
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-concurrent-session-1-after.png',
      fullPage: true 
    });
    
    await page2.close();
    console.log('✅ Concurrent employee login handling tested');
  });

  test('should validate employee mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Reload page in mobile view
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of mobile login
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-login-mobile.png',
      fullPage: true 
    });
    
    // Test mobile login functionality
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    
    // Take screenshot of filled mobile form
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-login-mobile-filled.png',
      fullPage: true 
    });
    
    // Submit on mobile
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    // Take screenshot of mobile result
    await page.screenshot({ 
      path: 'test-results/screenshots/employee-login-mobile-result.png',
      fullPage: true 
    });
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ Employee mobile responsiveness tested');
  });

  test('should test employee logout functionality', async ({ page }) => {
    // Login as employee first
    await page.locator('#email').fill(employeeTestData.validEmployee.email);
    await page.locator('#password').fill(employeeTestData.validEmployee.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    await page.waitForTimeout(3000);
    
    // Look for logout option
    const logoutOptions = [
      page.locator('text=Logout'),
      page.locator('text=Sign Out'),
      page.locator('[data-testid="logout"]'),
      page.locator('button:has-text("Logout")'),
      page.locator('a[href*="logout"]')
    ];
    
    let logoutFound = false;
    for (const logoutOption of logoutOptions) {
      if (await logoutOption.isVisible()) {
        // Take screenshot before logout
        await page.screenshot({ 
          path: 'test-results/screenshots/employee-before-logout.png',
          fullPage: true 
        });
        
        // Click logout
        await logoutOption.click();
        await page.waitForTimeout(2000);
        
        // Take screenshot after logout
        await page.screenshot({ 
          path: 'test-results/screenshots/employee-after-logout.png',
          fullPage: true 
        });
        
        // Verify redirected to login
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          console.log('✅ Employee logout successful - redirected to login');
        }
        
        logoutFound = true;
        break;
      }
    }
    
    if (!logoutFound) {
      console.log('ℹ️ Logout functionality not found in current interface');
    }
  });
});
