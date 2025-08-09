'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter,
  Eye,
  Edit,
  RefreshCw
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  unitOfMeasurement: string;
  sellingPrice: number;
  inventory: Array<{
    id: string;
    quantity: number;
    minStockLevel: number;
    maxStockLevel: number;
    costPrice: number;
    lastUpdated: string;
  }>;
}

interface StockAdjustment {
  productId: string;
  type: 'add' | 'remove';
  quantity: number;
  reason: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState<StockAdjustment>({
    productId: '',
    type: 'add',
    quantity: 0,
    reason: ''
  });
  const router = useRouter();

  const categories = [
    'GROCERIES',
    'DAIRY',
    'SNACKS',
    'BEVERAGES',
    'PERSONAL_CARE',
    'HOUSEHOLD',
    'FROZEN',
    'BAKERY',
    'MEDICINE'
  ];

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
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (inventory: any[]) => {
    return inventory.reduce((sum, inv) => sum + inv.quantity, 0);
  };

  const getStockStatus = (inventory: any[]) => {
    const totalStock = getTotalStock(inventory);
    const minLevel = inventory[0]?.minStockLevel || 0;
    
    if (totalStock === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    if (totalStock <= minLevel) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm);
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    const stockStatus = getStockStatus(product.inventory);
    const matchesStockFilter = stockFilter === 'all' || 
                              (stockFilter === 'low' && stockStatus.status === 'low') ||
                              (stockFilter === 'out' && stockStatus.status === 'out');
    
    return matchesSearch && matchesCategory && matchesStockFilter;
  });

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setAdjustmentData({
      productId: product.id,
      type: 'add',
      quantity: 0,
      reason: ''
    });
    setShowAdjustModal(true);
  };

  const handleStockAdjustment = async () => {
    if (!selectedProduct || adjustmentData.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Calculate the new quantity
      const currentStock = getTotalStock(selectedProduct.inventory);
      const adjustmentQuantity = adjustmentData.type === 'add' 
        ? adjustmentData.quantity 
        : -adjustmentData.quantity;

      const newQuantity = currentStock + adjustmentQuantity;

      if (newQuantity < 0) {
        alert('Cannot remove more stock than available');
        return;
      }

      // For simplicity, we'll create a new inventory entry or update existing one
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: adjustmentQuantity,
          costPrice: selectedProduct.inventory[0]?.costPrice || 0,
          reason: adjustmentData.reason
        })
      });

      if (!response.ok) {
        throw new Error('Failed to adjust inventory');
      }

      // Refresh products
      await fetchProducts();
      setShowAdjustModal(false);
      setSelectedProduct(null);
      
      alert(`Stock ${adjustmentData.type === 'add' ? 'added' : 'removed'} successfully!`);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const getInventoryStats = () => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => getStockStatus(p.inventory).status === 'low').length;
    const outOfStockProducts = products.filter(p => getStockStatus(p.inventory).status === 'out').length;
    const totalValue = products.reduce((sum, product) => {
      const stock = getTotalStock(product.inventory);
      return sum + (stock * product.sellingPrice);
    }, 0);

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalValue
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  const stats = getInventoryStats();

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
                <Package className="w-7 h-7" />
                Inventory Management
              </h1>
            </div>
            <button
              onClick={fetchProducts}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.totalValue.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock Only</option>
                <option value="out">Out of Stock Only</option>
              </select>
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Levels
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.inventory);
                  const totalStock = getTotalStock(product.inventory);
                  const stockValue = totalStock * product.sellingPrice;
                  const inventory = product.inventory[0] || {};
                  
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.barcode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          {product.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {totalStock} {product.unitOfMeasurement}
                        </div>
                        <div className="text-xs text-gray-500">
                          Updated: {inventory.lastUpdated ? new Date(inventory.lastUpdated).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Min: {inventory.minStockLevel || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          Max: {inventory.maxStockLevel || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{stockValue.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          @ ₹{product.sellingPrice}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                          <stockStatus.icon className="w-3 h-3 mr-1" />
                          {stockStatus.status === 'out' ? 'Out of Stock' : 
                           stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAdjustModal(product)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Adjust Stock"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Adjust Stock - {selectedProduct.name}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Current Stock: <span className="font-medium">{getTotalStock(selectedProduct.inventory)} {selectedProduct.unitOfMeasurement}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'add' }))}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      adjustmentData.type === 'add' 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Plus className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Add Stock</span>
                  </button>
                  <button
                    onClick={() => setAdjustmentData(prev => ({ ...prev, type: 'remove' }))}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      adjustmentData.type === 'remove' 
                        ? 'border-red-500 bg-red-50 text-red-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Minus className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm">Remove Stock</span>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustmentData.quantity}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                  placeholder="Enter quantity"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason
                </label>
                <textarea
                  value={adjustmentData.reason}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                  placeholder="Enter reason for adjustment"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockAdjustment}
                  className={`flex-1 py-2 px-4 rounded-lg transition-colors font-medium text-white ${
                    adjustmentData.type === 'add' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {adjustmentData.type === 'add' ? 'Add Stock' : 'Remove Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
