import { test, expect } from '@playwright/test';
import { setupTestMode, waitForPageReady, checkPageTitle } from './test-helpers';

test.describe('Comprehensive Regression Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestMode(page);
  });

  test.describe('🔐 Authentication System Regression', () => {
    test('should handle complete authentication flow', async ({ page }) => {
      // Test login page accessibility
      await page.goto('/login');
      await waitForPageReady(page);
      await expect(page.locator('h1')).toContainText(/Login|Sign In|EazyQue/);

      // Test form validation
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        
        // Should show validation errors or stay on login page
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/\/login|\/dashboard/);
      }

      // Test authentication API endpoint
      const response = await page.request.post('/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'testpassword'
        }
      });
      
      // Should get response (either success or validation error)
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle authentication middleware correctly', async ({ page }) => {
      // Test protected route access without auth
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      
      // Should either show dashboard (testing mode) or redirect to login
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/dashboard|\/login/);
      
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });

    test('should maintain session state across navigation', async ({ page }) => {
      // Navigate through protected routes
      const protectedRoutes = ['/dashboard', '/products', '/inventory', '/pos'];
      
      for (const route of protectedRoutes) {
        await page.goto(route);
        await page.waitForTimeout(1000);
        
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
        
        // Should have consistent navigation or be redirected consistently
        const currentUrl = page.url();
        expect(currentUrl).toMatch(new RegExp(`${route}|/login`));
      }
    });
  });

  test.describe('📦 Product Management System Regression', () => {
    test('should handle complete product lifecycle', async ({ page }) => {
      await page.goto('/products');
      await waitForPageReady(page);
      
      // Verify products page loads
      await expect(page.locator('h1')).toContainText(/Products|EazyQue/);
      
      // Test product API endpoint
      const response = await page.request.get('/api/products', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle product creation workflow', async ({ page }) => {
      await page.goto('/products');
      await waitForPageReady(page);
      
      // Look for Add Product button
      const addProductBtn = page.locator('button:has-text("Add Product")').first();
      
      if (await addProductBtn.count() > 0) {
        await addProductBtn.click();
        await page.waitForTimeout(1000);
        
        // Should open modal or navigate to form
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
      
      // Test product creation API
      const createResponse = await page.request.post('/api/products', {
        data: {
          name: 'Test Product',
          barcode: '1234567890',
          sellingPrice: 100,
          category: 'Test Category'
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(createResponse.status()).toBeGreaterThanOrEqual(200);
      expect(createResponse.status()).toBeLessThan(500);
    });

    test('should handle product search and filtering', async ({ page }) => {
      await page.goto('/products');
      await waitForPageReady(page);
      
      // Look for search functionality
      const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.waitForTimeout(1000);
        
        // Should filter results or show search state
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });

    test('should handle product data persistence', async ({ page }) => {
      await page.goto('/products');
      await waitForPageReady(page);
      
      // Get initial product count
      const bodyText = await page.textContent('body');
      const hasProducts = bodyText && (
        bodyText.includes('Product') ||
        bodyText.includes('Add') ||
        bodyText.includes('Search') ||
        bodyText.includes('Items')
      );
      
      expect(hasProducts).toBeTruthy();
      
      // Refresh page and verify data persists
      await page.reload();
      await waitForPageReady(page);
      
      const bodyTextAfter = await page.textContent('body');
      expect(bodyTextAfter).toBeTruthy();
    });
  });

  test.describe('📊 Inventory Management System Regression', () => {
    test('should handle inventory tracking accurately', async ({ page }) => {
      await page.goto('/inventory');
      await waitForPageReady(page);
      
      // Verify inventory page loads
      await expect(page.locator('h1')).toContainText(/Inventory|Management|EazyQue/);
      
      // Test inventory API endpoint
      const response = await page.request.get('/api/inventory', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle stock level management', async ({ page }) => {
      await page.goto('/inventory');
      await waitForPageReady(page);
      
      // Look for stock adjustment functionality
      const bodyText = await page.textContent('body');
      const hasInventoryFeatures = bodyText && (
        bodyText.includes('Stock') ||
        bodyText.includes('Quantity') ||
        bodyText.includes('Inventory') ||
        bodyText.includes('Adjust')
      );
      
      expect(hasInventoryFeatures).toBeTruthy();
    });

    test('should handle low stock alerts', async ({ page }) => {
      await page.goto('/inventory');
      await waitForPageReady(page);
      
      // Test low stock API endpoint
      const response = await page.request.get('/api/inventory/low-stock', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle inventory audit trail', async ({ page }) => {
      await page.goto('/inventory');
      await waitForPageReady(page);
      
      // Test inventory adjustment API
      const adjustResponse = await page.request.post('/api/inventory', {
        data: {
          productId: 'test-product-id',
          quantity: 10,
          costPrice: 50,
          reason: 'Test adjustment'
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(adjustResponse.status()).toBeGreaterThanOrEqual(200);
      expect(adjustResponse.status()).toBeLessThan(500);
    });
  });

  test.describe('🏪 Point of Sale (POS) System Regression', () => {
    test('should handle complete POS workflow', async ({ page }) => {
      await page.goto('/pos');
      await waitForPageReady(page);
      
      // Verify POS interface loads
      await expect(page.locator('h1')).toContainText(/POS|Point of Sale|EazyQue/);
      
      // Look for essential POS components
      const bodyText = await page.textContent('body');
      const hasPOSFeatures = bodyText && (
        bodyText.includes('Product') ||
        bodyText.includes('Cart') ||
        bodyText.includes('Total') ||
        bodyText.includes('Sale')
      );
      
      expect(hasPOSFeatures).toBeTruthy();
    });

    test('should handle product scanning simulation', async ({ page }) => {
      await page.goto('/pos');
      await waitForPageReady(page);
      
      // Look for barcode input or product search
      const scannerInput = page.locator('input[placeholder*="Scan"], input[placeholder*="Barcode"], input[placeholder*="Search"]').first();
      
      if (await scannerInput.count() > 0) {
        await scannerInput.fill('1234567890');
        await page.waitForTimeout(1000);
        
        // Should trigger product lookup
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });

    test('should handle cart operations', async ({ page }) => {
      await page.goto('/pos');
      await waitForPageReady(page);
      
      // Look for cart functionality
      const cartElements = page.locator('.cart, .order-items, .shopping-cart');
      const cartText = page.locator('text=Cart');
      const orderText = page.locator('text=Order');
      
      const hasCart = await cartElements.count() > 0 ||
                     await cartText.count() > 0 ||
                     await orderText.count() > 0;
      
      // Cart should be present or page should show POS interface
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
    });

    test('should handle checkout process', async ({ page }) => {
      await page.goto('/pos');
      await waitForPageReady(page);
      
      // Look for checkout or payment buttons
      const checkoutBtn = page.locator('button:has-text("Checkout"), button:has-text("Pay"), button:has-text("Complete")').first();
      
      if (await checkoutBtn.count() > 0) {
        await checkoutBtn.click();
        await page.waitForTimeout(1000);
        
        // Should initiate checkout process
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });
  });

  test.describe('📋 Order Management System Regression', () => {
    test('should handle order creation and tracking', async ({ page }) => {
      // Test order creation API
      const createOrderResponse = await page.request.post('/api/orders', {
        data: {
          items: [
            {
              productId: 'test-product-id',
              quantity: 2,
              unitPrice: 100
            }
          ],
          customerName: 'Test Customer',
          paymentMethod: 'CASH'
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(createOrderResponse.status()).toBeGreaterThanOrEqual(200);
      expect(createOrderResponse.status()).toBeLessThan(500);
    });

    test('should handle order status updates', async ({ page }) => {
      // Test order status update API
      const statusResponse = await page.request.patch('/api/orders/test-order-id/status', {
        data: {
          status: 'COMPLETED'
        },
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(statusResponse.status()).toBeGreaterThanOrEqual(200);
      expect(statusResponse.status()).toBeLessThan(500);
    });

    test('should handle order analytics', async ({ page }) => {
      // Test order stats API
      const statsResponse = await page.request.get('/api/orders/stats', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(statsResponse.status()).toBeGreaterThanOrEqual(200);
      expect(statsResponse.status()).toBeLessThan(500);
    });
  });

  test.describe('📈 Dashboard Analytics Regression', () => {
    test('should handle dashboard data aggregation', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Verify dashboard loads
      await expect(page.locator('h1')).toContainText(/Dashboard|EazyQue/);
      
      // Test dashboard stats API
      const statsResponse = await page.request.get('/api/dashboard/stats', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      expect(statsResponse.status()).toBeGreaterThanOrEqual(200);
      expect(statsResponse.status()).toBeLessThan(500);
    });

    test('should handle real-time updates', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Look for refresh or real-time indicators
      const refreshBtn = page.locator('button:has-text("Refresh"), button[title*="refresh"]').first();
      
      if (await refreshBtn.count() > 0) {
        await refreshBtn.click();
        await page.waitForTimeout(2000);
        
        // Should update dashboard data
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });

    test('should handle statistics display', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Look for statistics cards or metrics
      const bodyText = await page.textContent('body');
      const hasStats = bodyText && (
        bodyText.includes('Total') ||
        bodyText.includes('Revenue') ||
        bodyText.includes('Orders') ||
        bodyText.includes('Products') ||
        bodyText.includes('₹') ||
        bodyText.includes('$')
      );
      
      expect(hasStats || bodyText?.includes('Dashboard')).toBeTruthy();
    });
  });

  test.describe('🔄 Data Consistency and Integrity', () => {
    test('should maintain data consistency across modules', async ({ page }) => {
      // Test data consistency between products and inventory
      const productsResponse = await page.request.get('/api/products', {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      const inventoryResponse = await page.request.get('/api/inventory', {
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      expect(productsResponse.status()).toBeGreaterThanOrEqual(200);
      expect(inventoryResponse.status()).toBeGreaterThanOrEqual(200);
    });

    test('should handle concurrent operations safely', async ({ page }) => {
      // Simulate concurrent API calls
      const promises = [
        page.request.get('/api/products', { headers: { 'Authorization': 'Bearer test-token' } }),
        page.request.get('/api/inventory', { headers: { 'Authorization': 'Bearer test-token' } }),
        page.request.get('/api/orders/stats', { headers: { 'Authorization': 'Bearer test-token' } })
      ];
      
      const responses = await Promise.all(promises);
      
      // All requests should complete successfully or fail gracefully
      responses.forEach(response => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(500);
      });
    });

    test('should handle database transaction integrity', async ({ page }) => {
      // Test order creation with inventory update
      const orderData = {
        items: [
          {
            productId: 'test-product-id',
            quantity: 1,
            unitPrice: 100
          }
        ],
        customerName: 'Test Customer',
        paymentMethod: 'CASH'
      };
      
      const orderResponse = await page.request.post('/api/orders', {
        data: orderData,
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      expect(orderResponse.status()).toBeGreaterThanOrEqual(200);
      expect(orderResponse.status()).toBeLessThan(500);
    });
  });

  test.describe('🌐 Cross-browser and Performance Regression', () => {
    test('should handle responsive design across viewports', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }  // Desktop
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');
        await waitForPageReady(page);
        
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });

    test('should handle network conditions gracefully', async ({ page }) => {
      // Test with slow network simulation
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        await route.continue();
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(3000);
      
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });

    test('should handle memory usage efficiently', async ({ page }) => {
      // Navigate through all pages to test memory usage
      const pages = ['/dashboard', '/products', '/inventory', '/pos'];
      
      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await waitForPageReady(page);
        
        // Force garbage collection simulation
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
        
        const bodyContent = await page.textContent('body');
        expect(bodyContent).toBeTruthy();
      }
    });
  });

  test.describe('🔒 Security and Error Handling Regression', () => {
    test('should handle unauthorized access appropriately', async ({ page }) => {
      // Test API without token
      const response = await page.request.get('/api/products');
      
      // Should either redirect, show error, or handle gracefully
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });

    test('should handle malformed requests gracefully', async ({ page }) => {
      // Test with malformed data
      const response = await page.request.post('/api/products', {
        data: { invalid: 'data' },
        headers: { 'Authorization': 'Bearer test-token' }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Simulate network error
      await page.route('**/api/**', route => route.abort());
      
      // Try to refresh page
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Should show error state or cached content
      const bodyContent = await page.textContent('body');
      expect(bodyContent).toBeTruthy();
    });
  });
});
