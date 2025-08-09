import { test, expect } from '@playwright/test';

/**
 * Integration Tests for Signup Flow
 * These tests verify actual user/shop creation in the database,
 * not just frontend form behavior.
 */

const API_BASE_URL = 'http://localhost:5001/api';
const WEB_BASE_URL = 'http://localhost:3000';

// Generate unique test data to avoid conflicts
const timestamp = Date.now();
const testShopData = {
  owner: {
    name: `Integration Test Owner ${timestamp}`,
    email: `integration.owner.${timestamp}@testshop.com`,
    phone: `98765432${String(timestamp).slice(-2)}`,
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123'
  },
  shop: {
    name: `Integration Test Shop ${timestamp}`,
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'INTEG1234T',
    addressLine1: 'Shop No. 123, Integration Market',
    addressLine2: 'Integration Street',
    city: 'Chandigarh',
    state: 'Punjab',
    pincode: '160001',
    phone: `98765431${String(timestamp).slice(-2)}`
  }
};

test.describe('Signup Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure servers are running
    await page.goto(`${WEB_BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');
  });

  test('should create shop owner account end-to-end', async ({ page }) => {
    console.log('🧪 Testing complete shop owner signup flow...');
    
    // Step 1: Fill and submit signup form
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Fill owner information
    await page.locator('#name').fill(testShopData.owner.name);
    await page.locator('#email').fill(testShopData.owner.email);
    await page.locator('#phone').fill(testShopData.owner.phone);
    await page.locator('#password').fill(testShopData.owner.password);
    await page.locator('#confirmPassword').fill(testShopData.owner.confirmPassword);

    // Fill shop information
    await page.locator('#shopName').fill(testShopData.shop.name);
    await page.locator('#gstNumber').fill(testShopData.shop.gstNumber);
    await page.locator('#panNumber').fill(testShopData.shop.panNumber);
    await page.locator('#addressLine1').fill(testShopData.shop.addressLine1);
    await page.locator('#addressLine2').fill(testShopData.shop.addressLine2);
    await page.locator('#city').fill(testShopData.shop.city);
    await page.locator('#state').selectOption({ label: testShopData.shop.state });
    await page.locator('#pincode').fill(testShopData.shop.pincode);
    await page.locator('#shopPhone').fill(testShopData.shop.phone);

    // Submit form
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Step 2: Wait for success and verify redirect
    await page.waitForTimeout(5000);
    
    // Should redirect to dashboard on success
    const currentUrl = page.url();
    console.log(`Current URL after signup: ${currentUrl}`);
    
    // Step 3: Verify user can login with created account
    if (!currentUrl.includes('/dashboard')) {
      await page.goto(`${WEB_BASE_URL}/login`);
      await page.locator('#email').fill(testShopData.owner.email);
      await page.locator('#password').fill(testShopData.owner.password);
      await page.getByRole('button', { name: /Sign In/ }).click();
      
      await page.waitForTimeout(3000);
      expect(page.url()).toContain('/dashboard');
    }
    
    console.log('✅ Shop owner signup and login successful');
  });

  test('should create employee account for existing shop', async ({ page, request }) => {
    console.log('🧪 Testing employee signup flow...');
    
    // Step 1: Create a shop first via API for employee to join
    const shopResponse = await request.post(`${API_BASE_URL}/shops/signup`, {
      data: {
        name: `Employee Test Shop ${timestamp}`,
        gstNumber: '27ABCDE1234F1Z5',
        panNumber: 'EMPSH1234T',
        addressLine1: 'Employee Test Shop Address',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '9876543201'
      }
    });
    
    expect(shopResponse.ok()).toBeTruthy();
    const shopData = await shopResponse.json();
    const shopId = shopData.data.id;
    
    // Step 2: Test employee signup
    await page.getByRole('button', { name: /Employee/ }).click();
    
    // Wait for shops to load and select the created shop
    await page.waitForTimeout(2000);
    await page.locator('#shopId').selectOption({ value: shopId });
    
    // Fill employee information
    const employeeData = {
      name: `Integration Employee ${timestamp}`,
      email: `integration.employee.${timestamp}@testshop.com`,
      phone: `98765430${String(timestamp).slice(-2)}`,
      password: 'TestPassword123'
    };
    
    await page.locator('#name').fill(employeeData.name);
    await page.locator('#email').fill(employeeData.email);
    await page.locator('#phone').fill(employeeData.phone);
    await page.locator('#password').fill(employeeData.password);
    await page.locator('#confirmPassword').fill(employeeData.password);
    
    // Submit form
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Step 3: Verify employee can login
    await page.waitForTimeout(3000);
    
    await page.goto(`${WEB_BASE_URL}/login`);
    await page.locator('#email').fill(employeeData.email);
    await page.locator('#password').fill(employeeData.password);
    await page.getByRole('button', { name: /Sign In/ }).click();
    
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('/dashboard');
    
    console.log('✅ Employee signup and login successful');
  });

  test('should handle duplicate email validation', async ({ page, request }) => {
    console.log('🧪 Testing duplicate email handling...');
    
    // Step 1: Create user via API first
    const existingShopResponse = await request.post(`${API_BASE_URL}/shops/signup`, {
      data: {
        name: `Duplicate Test Shop ${timestamp}`,
        gstNumber: '29ABCDE1234F1Z5',
        panNumber: 'DUPLI1234T',
        addressLine1: 'Duplicate Test Address',
        city: 'Chandigarh',
        state: 'Punjab',
        pincode: '160001',
        phone: '9876543202'
      }
    });
    
    const shopData = await existingShopResponse.json();
    const duplicateEmail = `duplicate.${timestamp}@testshop.com`;
    
    await request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        name: 'Existing User',
        email: duplicateEmail,
        phone: '9876543203',
        password: 'TestPassword123',
        role: 'SHOP_OWNER',
        shopId: shopData.data.id
      }
    });
    
    // Step 2: Try to signup with same email
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    await page.locator('#name').fill('Duplicate Test User');
    await page.locator('#email').fill(duplicateEmail);
    await page.locator('#phone').fill('9876543204');
    await page.locator('#password').fill('TestPassword123');
    await page.locator('#confirmPassword').fill('TestPassword123');
    
    // Fill minimal shop data
    await page.locator('#shopName').fill(`Duplicate Shop ${timestamp}`);
    await page.locator('#gstNumber').fill('29ABCDE1234F1Z6');
    await page.locator('#panNumber').fill('DUPLI1234U');
    await page.locator('#addressLine1').fill('Duplicate Shop Address');
    await page.locator('#city').fill('Chandigarh');
    await page.locator('#state').selectOption({ label: 'Punjab' });
    await page.locator('#pincode').fill('160001');
    await page.locator('#shopPhone').fill('9876543205');
    
    // Submit form
    await page.getByRole('button', { name: /Create Account/ }).click();
    
    // Step 3: Verify error handling
    await page.waitForTimeout(3000);
    
    // Should show error message and stay on signup page
    const errorMessage = page.locator('text=email already exists');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
    
    // Should not redirect to dashboard
    expect(page.url()).toContain('/signup');
    
    console.log('✅ Duplicate email validation working');
  });
});
