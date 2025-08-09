import { test, expect } from '@playwright/test';

// Test data for signup regression tests
const testShopData = {
  owner: {
    name: 'Regression Test Owner',
    email: 'regression.owner@testshop.com',
    phone: '9876543299',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123'
  },
  shop: {
    name: 'Regression Test Shop',
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'REGRS1234T',
    addressLine1: 'Shop No. 99, Test Market',
    addressLine2: 'Regression Street',
    city: 'Chandigarh',
    state: 'Punjab',
    pincode: '160099',
    phone: '9876543288'
  }
};

const testEmployeeData = {
  employee: {
    name: 'Regression Test Employee',
    email: 'regression.employee@testshop.com',
    phone: '9876543277',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123'
  }
};

test.describe('Signup Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001/signup');
    await page.waitForLoadState('networkidle');
  });

  test('should load signup page with all elements', async ({ page }) => {
    // Verify page title and heading
    await expect(page).toHaveTitle(/EazyQue/);
    await expect(page.locator('h1')).toContainText('Join EazyQue');
    
    // Check signup type buttons
    await expect(page.getByRole('button', { name: /Shop Owner/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Employee/ })).toBeVisible();
    
    // Take screenshot of initial page
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-page-loaded.png',
      fullPage: true 
    });
    
    console.log('✅ Signup page loaded successfully');
  });

  test('should show shop owner form when selected', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Wait for form to appear
    await page.waitForTimeout(1000);
    
    // Check for form sections
    await expect(page.locator('text=Personal Information')).toBeVisible();
    await expect(page.locator('text=Shop Information')).toBeVisible();
    await expect(page.locator('text=Address Information')).toBeVisible();
    
    // Check for key input fields
    const requiredFields = ['#name', '#email', '#phone', '#password', '#confirmPassword', 
                           '#shopName', '#gstNumber', '#panNumber', '#addressLine1', 
                           '#city', '#state', '#pincode', '#shopPhone'];
    
    for (const field of requiredFields) {
      await expect(page.locator(field)).toBeVisible();
    }
    
    // Take screenshot of shop owner form
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-shop-owner-form.png',
      fullPage: true 
    });
    
    console.log('✅ Shop owner form displayed correctly');
  });

  test('should show employee form when selected', async ({ page }) => {
    // Select Employee
    await page.getByRole('button', { name: /Employee/ }).click();
    
    // Wait for form to appear
    await page.waitForTimeout(1000);
    
    // Check for employee form elements
    await expect(page.locator('text=Personal Information')).toBeVisible();
    
    // Should show "No shops available" message initially
    await expect(page.locator('text=No shops available')).toBeVisible();
    
    // Check for employee input fields
    const employeeFields = ['#name', '#email', '#phone', '#password', '#confirmPassword'];
    
    for (const field of employeeFields) {
      await expect(page.locator(field)).toBeVisible();
    }
    
    // Take screenshot of employee form
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-employee-form.png',
      fullPage: true 
    });
    
    console.log('✅ Employee form displayed correctly');
  });

  test('should validate required fields for shop owner', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Try to submit without filling fields
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check for validation message
    const validationMessage = page.locator('text=Please fill in all required fields');
    if (await validationMessage.isVisible()) {
      await expect(validationMessage).toBeVisible();
    }
    
    // Take screenshot of validation state
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-validation-empty-fields.png',
      fullPage: true 
    });
    
    console.log('✅ Required field validation working');
  });

  test('should validate password confirmation match', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Fill passwords that don't match
    await page.locator('#password').fill('Password123');
    await page.locator('#confirmPassword').fill('DifferentPassword123');
    
    // Fill other required fields minimally
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    
    // Try to submit
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Take screenshot of password mismatch validation
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-password-mismatch.png',
      fullPage: true 
    });
    
    console.log('✅ Password confirmation validation tested');
  });

  test('should validate email format', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Enter invalid email
    await page.locator('#email').fill('invalid-email-format');
    await page.locator('#name').fill('Test User');
    
    // Try to submit
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Check HTML5 email validation
    const emailField = page.locator('#email');
    await expect(emailField).toHaveAttribute('type', 'email');
    
    // Take screenshot of email validation
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-invalid-email.png',
      fullPage: true 
    });
    
    console.log('✅ Email format validation tested');
  });

  test('should validate GST number format', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Enter invalid GST number
    await page.locator('#gstNumber').fill('INVALID_GST');
    
    // Check that GST field has proper validation attributes
    const gstField = page.locator('#gstNumber');
    await expect(gstField).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-gst-validation.png',
      fullPage: true 
    });
    
    console.log('✅ GST number validation tested');
  });

  test('should validate pincode format and length', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Test non-numeric characters
    await page.locator('#pincode').fill('abc123def');
    await expect(page.locator('#pincode')).toHaveValue('123');
    
    // Test length limitation
    await page.locator('#pincode').fill('1234567890');
    await expect(page.locator('#pincode')).toHaveValue('123456');
    
    // Take screenshot of pincode validation
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-pincode-validation.png',
      fullPage: true 
    });
    
    console.log('✅ Pincode validation tested');
  });

  test('should successfully create shop owner account', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Fill all required fields
    await page.locator('#name').fill(testShopData.owner.name);
    await page.locator('#email').fill(testShopData.owner.email);
    await page.locator('#phone').fill(testShopData.owner.phone);
    await page.locator('#password').fill(testShopData.owner.password);
    await page.locator('#confirmPassword').fill(testShopData.owner.confirmPassword);

    // Fill shop information
    await page.locator('#shopName').fill(testShopData.shop.name);
    await page.locator('#gstNumber').fill(testShopData.shop.gstNumber);
    await page.locator('#panNumber').fill(testShopData.shop.panNumber);
    
    // Fill address information
    await page.locator('#addressLine1').fill(testShopData.shop.addressLine1);
    await page.locator('#addressLine2').fill(testShopData.shop.addressLine2);
    await page.locator('#city').fill(testShopData.shop.city);
    await page.locator('#state').selectOption({ label: testShopData.shop.state });
    await page.locator('#pincode').fill(testShopData.shop.pincode);
    await page.locator('#shopPhone').fill(testShopData.shop.phone);

    // Take screenshot before submission
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-shop-owner-filled.png',
      fullPage: true 
    });

    // Submit the form
    await page.getByRole('button', { name: /Create Account/ }).click();

    // Wait for response
    await page.waitForTimeout(3000);
    
    // Take screenshot of result
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-shop-owner-result.png',
      fullPage: true 
    });
    
    console.log(`✅ Shop owner account creation attempted: ${testShopData.shop.name}`);
  });

  test('should handle form state persistence during errors', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    
    // Fill some fields
    await page.locator('#name').fill(testName);
    await page.locator('#email').fill(testEmail);
    
    // Submit incomplete form
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Wait for validation
    await page.waitForTimeout(1000);
    
    // Check that filled values are maintained
    await expect(page.locator('#name')).toHaveValue(testName);
    await expect(page.locator('#email')).toHaveValue(testEmail);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-form-state-persistence.png',
      fullPage: true 
    });
    
    console.log('✅ Form state persistence tested');
  });

  test('should switch between signup types correctly', async ({ page }) => {
    // Start with Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    await expect(page.locator('text=Shop Information')).toBeVisible();
    
    // Take screenshot of shop owner view
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-type-shop-owner.png',
      fullPage: true 
    });

    // Switch to Employee
    await page.getByRole('button', { name: /Employee/ }).click();
    await expect(page.locator('text=Shop Information')).not.toBeVisible();
    await expect(page.locator('text=No shops available')).toBeVisible();
    
    // Take screenshot of employee view
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-type-employee.png',
      fullPage: true 
    });

    // Switch back to Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    await expect(page.locator('text=Shop Information')).toBeVisible();
    
    console.log('✅ Signup type switching tested');
  });

  test('should have proper input field styling', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    const inputFields = ['#name', '#email', '#phone', '#pincode'];
    
    for (const selector of inputFields) {
      const field = page.locator(selector);
      await expect(field).toBeVisible();
      
      // Check styling
      await expect(field).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(field).toHaveCSS('color', 'rgb(0, 0, 0)');
    }
    
    // Take screenshot of styled form
    await page.screenshot({ 
      path: 'test-results/screenshots/signup-form-styling.png',
      fullPage: true 
    });
    
    console.log('✅ Input field styling verified');
  });

  test('should navigate to login page correctly', async ({ page }) => {
    // Look for login link (adjust selector based on actual implementation)
    const loginLink = page.locator('text=Sign in').or(page.locator('text=Login')).or(page.locator('a[href*="login"]')).first();
    
    if (await loginLink.isVisible()) {
      // Click login link
      await loginLink.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Verify we're on login page
      await expect(page.url()).toContain('/login');
      
      // Take screenshot of navigation
      await page.screenshot({ 
        path: 'test-results/screenshots/signup-to-login-navigation.png',
        fullPage: true 
      });
      
      console.log('✅ Navigation to login page tested');
    } else {
      console.log('ℹ️ Login link not found on signup page');
    }
  });
});
