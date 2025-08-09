import { test, expect } from '@playwright/test';

// Test data for shop registration
const testShopData = {
  owner: {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@testshop.com',
    phone: '9876543210',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123'
  },
  shop: {
    name: 'Kumar General Store',
    gstNumber: '27ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    addressLine1: 'Shop No. 15, Main Market',
    addressLine2: 'Near T-point',
    city: 'Chandigarh',
    state: 'Punjab',
    pincode: '160034',
    phone: '9876543211'
  }
};

const testEmployeeData = {
  employee: {
    name: 'Priya Sharma',
    email: 'priya.sharma@testshop.com',
    phone: '9876543212',
    password: 'TestPassword123',
    confirmPassword: 'TestPassword123'
  }
};

test.describe('Signup Form Automation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');
  });

  test('should load signup page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/EazyQue/);
    await expect(page.locator('h1')).toContainText('Join EazyQue');
    
    // Check if signup type buttons are visible
    await expect(page.getByRole('button', { name: /Shop Owner/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Employee/ })).toBeVisible();
  });

  test('should create shop owner account with complete shop details', async ({ page }) => {
    // Select Shop Owner signup type
    await page.getByRole('button', { name: /Shop Owner/ }).click();
    
    // Wait for shop owner form to be visible
    await expect(page.locator('text=Personal Information')).toBeVisible();

    // Fill personal information using IDs
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
    
    // Select state
    await page.locator('#state').selectOption({ label: testShopData.shop.state });
    
    // Fill pincode and shop phone
    await page.locator('#pincode').fill(testShopData.shop.pincode);
    await page.locator('#shopPhone').fill(testShopData.shop.phone);

    // Verify all fields are filled correctly
    await expect(page.locator('#name')).toHaveValue(testShopData.owner.name);
    await expect(page.locator('#gstNumber')).toHaveValue(testShopData.shop.gstNumber);
    await expect(page.locator('#panNumber')).toHaveValue(testShopData.shop.panNumber);
    await expect(page.locator('#pincode')).toHaveValue(testShopData.shop.pincode);

    // Submit the form
    await page.getByRole('button', { name: /Create Account/ }).click();

    // Wait for response
    await page.waitForTimeout(3000);
    
    // Log the attempt
    console.log(`Attempted to create shop: ${testShopData.shop.name}`);
  });

  test('should validate required fields for shop owner', async ({ page }) => {
    // Select Shop Owner signup type
    await page.getByRole('button', { name: /Shop Owner/ }).click();

    // Try to submit without filling any fields
    await page.getByRole('button', { name: /Create Account/ }).click();

    // Check for validation error
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible();
  });

  test('should validate pincode input restrictions', async ({ page }) => {
    // Select Shop Owner signup type
    await page.getByRole('button', { name: /Shop Owner/ }).click();

    // Try to enter non-numeric characters in pincode
    await page.locator('#pincode').fill('abc123def');

    // Should only contain numeric characters
    await expect(page.locator('#pincode')).toHaveValue('123');
  });

  test('should limit pincode to 6 digits', async ({ page }) => {
    // Select Shop Owner signup type
    await page.getByRole('button', { name: /Shop Owner/ }).click();

    // Try to enter more than 6 digits
    await page.locator('#pincode').fill('1234567890');

    // Should be limited to 6 digits
    await expect(page.locator('#pincode')).toHaveValue('123456');
  });

  test('should handle input field visibility and styling', async ({ page }) => {
    // Select Shop Owner signup type
    await page.getByRole('button', { name: /Shop Owner/ }).click();

    // Check that key input fields are visible and properly styled
    const inputFields = ['#name', '#email', '#phone', '#pincode'];

    for (const selector of inputFields) {
      const field = page.locator(selector);
      await expect(field).toBeVisible();
      
      // Check styling - should have white background and dark text
      await expect(field).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await expect(field).toHaveCSS('color', 'rgb(0, 0, 0)');
    }
  });

  test('should switch between signup types correctly', async ({ page }) => {
    // Select Shop Owner
    await page.getByRole('button', { name: /Shop Owner/ }).click();

    // Shop details section should be visible
    await expect(page.locator('text=Shop Information')).toBeVisible();

    // Switch to Employee
    await page.getByRole('button', { name: /Employee/ }).click();

    // Shop details section should be hidden, employee notice should be visible
    await expect(page.locator('text=Shop Information')).not.toBeVisible();
    await expect(page.locator('text=No shops available')).toBeVisible();
  });
});

test.describe('Multiple Shop Creation Tests', () => {
  const multipleShops = [
    {
      owner: {
        name: 'Amit Singh',
        email: 'amit.singh@electronicsworld.com',
        phone: '9876543213',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      },
      shop: {
        name: 'Electronics World',
        gstNumber: '24ABCDE1234F1Z5',
        panNumber: 'BCDEF2345G',
        addressLine1: 'Shop No. 25, Electronics Market',
        addressLine2: 'Sector 20',
        city: 'Chandigarh',
        state: 'Delhi',
        pincode: '160020',
        phone: '9876543214'
      }
    },
    {
      owner: {
        name: 'Sunita Devi',
        email: 'sunita.devi@clothingstore.com',
        phone: '9876543215',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      },
      shop: {
        name: 'Fashion Hub',
        gstNumber: '03ABCDE1234F1Z5',
        panNumber: 'CDEFG3456H',
        addressLine1: 'Shop No. 12, Clothing Market',
        addressLine2: 'Near Railway Station',
        city: 'Ludhiana',
        state: 'Punjab',
        pincode: '141001',
        phone: '9876543216'
      }
    },
    {
      owner: {
        name: 'Ravi Kumar',
        email: 'ravi.kumar@medicalstore.com',
        phone: '9876543217',
        password: 'TestPassword123',
        confirmPassword: 'TestPassword123'
      },
      shop: {
        name: 'Wellness Pharmacy',
        gstNumber: '06ABCDE1234F1Z5',
        panNumber: 'DEFGH4567I',
        addressLine1: 'Shop No. 8, Medical Complex',
        addressLine2: 'Civil Hospital Road',
        city: 'Amritsar',
        state: 'Punjab',
        pincode: '143001',
        phone: '9876543218'
      }
    }
  ];

  multipleShops.forEach((shopData, index) => {
    test(`should create shop ${index + 1}: ${shopData.shop.name}`, async ({ page }) => {
      await page.goto('http://localhost:3000/signup');
      await page.waitForLoadState('networkidle');

      // Select Shop Owner signup type
      await page.getByRole('button', { name: /Shop Owner/ }).click();

      // Fill personal information
      await page.locator('#name').fill(shopData.owner.name);
      await page.locator('#email').fill(shopData.owner.email);
      await page.locator('#phone').fill(shopData.owner.phone);
      await page.locator('#password').fill(shopData.owner.password);
      await page.locator('#confirmPassword').fill(shopData.owner.confirmPassword);

      // Fill shop information
      await page.locator('#shopName').fill(shopData.shop.name);
      await page.locator('#gstNumber').fill(shopData.shop.gstNumber);
      await page.locator('#panNumber').fill(shopData.shop.panNumber);
      
      // Fill address information
      await page.locator('#addressLine1').fill(shopData.shop.addressLine1);
      await page.locator('#addressLine2').fill(shopData.shop.addressLine2);
      await page.locator('#city').fill(shopData.shop.city);
      
      // Select state
      await page.locator('#state').selectOption({ label: shopData.shop.state });
      
      // Fill pincode and shop phone
      await page.locator('#pincode').fill(shopData.shop.pincode);
      await page.locator('#shopPhone').fill(shopData.shop.phone);

      // Submit the form
      await page.getByRole('button', { name: /Create Account/ }).click();

      // Wait for response
      await page.waitForTimeout(3000);
      
      // Log the shop creation attempt
      console.log(`Attempted to create shop: ${shopData.shop.name} in ${shopData.shop.city}, ${shopData.shop.state}`);
    });
  });
});
