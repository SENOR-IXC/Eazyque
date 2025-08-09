'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  User, 
  Calculator,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Camera,
  Scan
} from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { useBarcode } from '@/hooks/useBarcode';

interface Product {
  id: string;
  name: string;
  description: string;
  barcode: string;
  category: string;
  unitOfMeasurement: string;
  sellingPrice: number;
  gstRate: number;
  inventory: Array<{
    quantity: number;
  }>;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  availableStock: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const router = useRouter();

  // Barcode functionality
  const { handleScan, isLoading: isScanLoading } = useBarcode({
    onProductFound: (product) => {
      console.log('✅ Product found via barcode scan:', product);
      addToCart(product);
      setShowScanner(false);
      setScannerMessage(`Added ${product.name} to cart!`);
      
      // Clear message after 3 seconds
      setTimeout(() => setScannerMessage(null), 3000);
    },
    onProductNotFound: (barcode) => {
      console.log('❌ Product not found for barcode:', barcode);
      setScannerMessage(`No product found for barcode: ${barcode}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setScannerMessage(null), 5000);
    },
    onScanError: (error) => {
      console.error('❌ Scan error:', error);
      setScannerMessage(`Scan error: ${error}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setScannerMessage(null), 5000);
    }
  });

  useEffect(() => {
    // Check authentication on client side
    const checkAuthAndFetchProducts = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      fetchProducts();
    };
    
    checkAuthAndFetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();
      setProducts(result.data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      // If there's a network error or other issue, redirect to login
      router.push('/login');
    }
  };

  const addToCart = (product: Product) => {
    const availableStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    
    if (availableStock === 0) {
      alert('Product is out of stock');
      return;
    }

    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= availableStock) {
        alert('Cannot add more items. Stock limit reached.');
        return;
      }
      updateQuantity(product.id, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        productId: product.id,
        name: product.name,
        unitPrice: product.sellingPrice,
        quantity: 1,
        gstRate: product.gstRate,
        availableStock
      };
      setCart(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const maxQuantity = Math.min(newQuantity, item.availableStock);
        return { ...item, quantity: maxQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const totalTax = cart.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + (itemTotal * item.gstRate / 100);
    }, 0);
    const total = subtotal + totalTax;

    return {
      subtotal: subtotal.toFixed(2),
      tax: totalTax.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const processOrder = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const orderData = {
        customerId: null,
        customerName,
        customerPhone: customerPhone || undefined,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: 0
        })),
        paymentMethod,
        isDelivery: false,
        discountAmount: 0
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to process order');
      }

      const result = await response.json();
      
      if (result.success) {
        alert(`Order created successfully! Order Number: ${result.data.orderNumber}`);
        clearCart();
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setShowPayment(false);
        
        // Refresh products to update stock
        fetchProducts();
      } else {
        throw new Error(result.message || 'Failed to create order');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
  );

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-7 h-7" />
                Point of Sale
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Items in cart: {cart.length}
              </span>
              <span className="text-lg font-bold text-green-600">
                ₹{totals.total}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Products</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowScanner(true)}
                      disabled={isScanLoading}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isScanLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Scan Barcode
                        </>
                      )}
                    </button>
                    <span className="text-sm text-gray-600">
                      {filteredProducts.length} products
                    </span>
                  </div>
                </div>

                {/* Scanner Message */}
                {scannerMessage && (
                  <div className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
                    scannerMessage.includes('Added') 
                      ? 'bg-green-50 border border-green-200 text-green-800'
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    <div className="flex-1">
                      {scannerMessage.includes('Added') ? '✅' : '❌'} {scannerMessage}
                    </div>
                    <button
                      onClick={() => setScannerMessage(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products by name or barcode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchTerm.trim()) {
                        // Handle manual barcode entry
                        handleScan(searchTerm.trim());
                      }
                    }}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      onClick={() => handleScan(searchTerm.trim())}
                      disabled={!searchTerm.trim() || isScanLoading}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Lookup by barcode"
                    >
                      <Scan className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => {
                    const availableStock = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                    const inCart = cart.find(item => item.productId === product.id);
                    
                    return (
                      <div
                        key={product.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          availableStock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => availableStock > 0 && addToCart(product)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </h3>
                          {inCart && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {inCart.quantity}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-green-600 mb-1">
                          ₹{product.sellingPrice}
                        </p>
                        <p className="text-xs text-gray-500 mb-2">
                          Stock: {availableStock} {product.unitOfMeasurement}
                        </p>
                        <p className="text-xs text-gray-600">
                          {product.category.replace('_', ' ')} • GST: {product.gstRate}%
                        </p>
                      </div>
                    );
                  })}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your search terms.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-6">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {/* Customer Info */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                  />
                  
                  <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                    placeholder="+91-XXXXXXXXXX"
                  />
                </div>

                {/* Cart Items */}
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{item.unitPrice} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                          disabled={item.quantity >= item.availableStock}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {cart.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Cart is empty</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Add products to start a new order.
                    </p>
                  </div>
                )}

                {/* Order Summary */}
                {cart.length > 0 && (
                  <>
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">₹{totals.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (GST):</span>
                        <span className="font-medium">₹{totals.tax}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">₹{totals.total}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowPayment(true)}
                      className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Proceed to Payment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Payment</h3>
              <button
                onClick={() => setShowPayment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Method</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'CASH' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Banknote className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'UPI' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Smartphone className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">UPI</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      paymentMethod === 'CARD' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs">Card</span>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Items ({cart.length}):</span>
                  <span>₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax:</span>
                  <span>₹{totals.tax}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total Amount:</span>
                  <span className="text-green-600">₹{totals.total}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayment(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={processOrder}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {isProcessing ? 'Processing...' : 'Complete Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
        onError={(error) => {
          console.error('Scanner error:', error);
          setScannerMessage(`Scanner error: ${error}`);
          setTimeout(() => setScannerMessage(null), 5000);
        }}
        scannerOptions={{
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        }}
      />
    </div>
  );
}
