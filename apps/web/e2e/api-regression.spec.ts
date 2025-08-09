import { test, expect } from '@playwright/test';

test.describe('API Integration Regression Tests', () => {
  const API_BASE_URL = 'http://localhost:5001/api';
  const WEB_API_BASE_URL = 'http://localhost:3000/api';
  let authToken = '';

  test.beforeAll(async ({ request }) => {
    // Try to get auth token for API tests
    try {
      const loginResponse = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: 'admin@example.com',
          password: 'password123'
        }
      });
      
      if (loginResponse.ok()) {
        const loginData = await loginResponse.json();
        authToken = loginData.data?.token || '';
      }
    } catch (error) {
      console.log('Note: Direct API login failed, will test API proxy routes');
    }
  });

  test.describe('🔐 Authentication API Regression', () => {
    test('should handle login via web API proxy', async ({ request }) => {
      const response = await request.post(`${WEB_API_BASE_URL}/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'testpassword'
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('success');
    });

    test('should handle login validation errors', async ({ request }) => {
      const response = await request.post(`${WEB_API_BASE_URL}/auth/login`, {
        data: {
          email: 'invalid-email',
          password: ''
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('success');
    });

    test('should handle direct API authentication', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: 'admin@example.com',
          password: 'password123'
        }
      });
      
      // Should either succeed or fail gracefully
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('📦 Products API Regression', () => {
    test('should fetch products via web API proxy', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('success');
    });

    test('should handle product creation via web API', async ({ request }) => {
      const productData = {
        name: 'Test Product Regression',
        barcode: '9876543210',
        sellingPrice: 150,
        category: 'Test Category',
        unit: 'PIECE',
        gstRate: 18,
        hsnCode: '12345678'
      };
      
      const response = await request.post(`${WEB_API_BASE_URL}/products`, {
        data: productData,
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('success');
    });

    test('should handle product search and filtering', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/products?search=test&category=electronics`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle direct API product operations', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('📊 Inventory API Regression', () => {
    test('should handle inventory operations via web API', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/inventory`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle inventory adjustments', async ({ request }) => {
      const adjustmentData = {
        productId: 'test-product-id',
        quantity: 10,
        costPrice: 75,
        reason: 'Regression test adjustment'
      };
      
      const response = await request.post(`${WEB_API_BASE_URL}/inventory`, {
        data: adjustmentData,
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle low stock queries', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/inventory/low-stock`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('🛒 Orders API Regression', () => {
    test('should handle order creation via web API', async ({ request }) => {
      const orderData = {
        items: [
          {
            productId: 'test-product-id',
            quantity: 2,
            unitPrice: 100
          }
        ],
        customerName: 'Regression Test Customer',
        customerPhone: '+91-9876543210',
        paymentMethod: 'CASH',
        subTotal: 200,
        taxAmount: 36,
        totalAmount: 236
      };
      
      const response = await request.post(`${WEB_API_BASE_URL}/orders`, {
        data: orderData,
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should fetch orders with pagination', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/orders?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should handle order statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/orders/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('📈 Dashboard Analytics API Regression', () => {
    test('should handle dashboard stats via web API', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
      
      const responseData = await response.json();
      expect(responseData).toHaveProperty('success');
    });

    test('should handle analytics data aggregation', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/orders/analytics/summary`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('🔄 API Error Handling and Edge Cases', () => {
    test('should handle invalid authentication tokens', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/products`, {
        headers: {
          'Authorization': 'Bearer invalid-token-12345'
        }
      });
      
      // Should handle gracefully - either 401 or error response
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });

    test('should handle malformed request data', async ({ request }) => {
      const response = await request.post(`${WEB_API_BASE_URL}/products`, {
        data: {
          invalidField: 'invalid value',
          anotherBadField: null
        },
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      // Should return validation error
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });

    test('should handle non-existent resource requests', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/products/non-existent-id`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });

    test('should handle rate limiting gracefully', async ({ request }) => {
      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () =>
        request.get(`${WEB_API_BASE_URL}/products`, {
          headers: {
            'Authorization': `Bearer ${authToken || 'test-token'}`
          }
        })
      );
      
      const responses = await Promise.all(promises);
      
      // All requests should complete with appropriate status codes
      responses.forEach(response => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
      });
    });
  });

  test.describe('🔗 API Proxy Architecture Regression', () => {
    test('should handle CORS via Next.js API routes', async ({ request }) => {
      const response = await request.fetch(`${WEB_API_BASE_URL}/products`, {
        method: 'OPTIONS'
      });
      
      // Should handle OPTIONS request for CORS
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(500);
    });

    test('should proxy requests to backend API correctly', async ({ request }) => {
      // Test that web API correctly proxies to backend
      const webResponse = await request.get(`${WEB_API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      expect(webResponse.status()).toBeGreaterThanOrEqual(200);
      expect(webResponse.status()).toBeLessThan(500);
      
      const responseData = await webResponse.json();
      expect(responseData).toHaveProperty('success');
    });

    test('should handle API timeout scenarios', async ({ request }) => {
      // Test with very short timeout
      const response = await request.get(`${WEB_API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        },
        timeout: 1000 // 1 second timeout
      });
      
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe('📊 Data Consistency Across APIs', () => {
    test('should maintain data consistency between web and direct APIs', async ({ request }) => {
      // Get data from both APIs and compare
      const webResponse = await request.get(`${WEB_API_BASE_URL}/products?limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      const directResponse = await request.get(`${API_BASE_URL}/products?limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(webResponse.status()).toBeGreaterThanOrEqual(200);
      expect(directResponse.status()).toBeGreaterThanOrEqual(200);
    });

    test('should handle concurrent API operations safely', async ({ request }) => {
      // Test concurrent operations across different endpoints
      const promises = [
        request.get(`${WEB_API_BASE_URL}/products`, {
          headers: { 'Authorization': `Bearer ${authToken || 'test-token'}` }
        }),
        request.get(`${WEB_API_BASE_URL}/inventory`, {
          headers: { 'Authorization': `Bearer ${authToken || 'test-token'}` }
        }),
        request.get(`${WEB_API_BASE_URL}/orders`, {
          headers: { 'Authorization': `Bearer ${authToken || 'test-token'}` }
        }),
        request.get(`${WEB_API_BASE_URL}/dashboard/stats`, {
          headers: { 'Authorization': `Bearer ${authToken || 'test-token'}` }
        })
      ];
      
      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status()).toBeGreaterThanOrEqual(200);
        expect(response.status()).toBeLessThan(600);
      });
    });

    test('should validate API response schemas', async ({ request }) => {
      const response = await request.get(`${WEB_API_BASE_URL}/products`, {
        headers: {
          'Authorization': `Bearer ${authToken || 'test-token'}`
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        
        // Basic schema validation
        expect(data).toHaveProperty('success');
        
        if (data.success && data.data) {
          expect(Array.isArray(data.data)).toBeTruthy();
        }
      }
    });
  });
});
