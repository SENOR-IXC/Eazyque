'use client';

import { useState } from 'react';
import { X, Upload, Barcode, Package } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

const productCategories = [
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

const unitOfMeasurements = [
  'KG',
  'GRAM',
  'LITER',
  'ML',
  'PIECE',
  'PACK',
  'BOX',
  'BOTTLE'
];

export default function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    hsnCode: '',
    category: 'GROCERIES',
    unitOfMeasurement: 'PIECE',
    basePrice: '',
    sellingPrice: '',
    gstRate: '',
    minStockLevel: '',
    maxStockLevel: '',
    initialStock: '',
    costPrice: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create product
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          barcode: formData.barcode,
          hsnCode: formData.hsnCode,
          category: formData.category,
          unitOfMeasurement: formData.unitOfMeasurement,
          basePrice: parseFloat(formData.basePrice),
          sellingPrice: parseFloat(formData.sellingPrice),
          gstRate: parseFloat(formData.gstRate)
        })
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json();
        throw new Error(errorData.message || 'Failed to create product');
      }

      const productResult = await productResponse.json();
      const productId = productResult.data.id;

      // Add initial inventory
      if (formData.initialStock && parseFloat(formData.initialStock) > 0) {
        const inventoryResponse = await fetch('/api/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            productId,
            quantity: parseFloat(formData.initialStock),
            costPrice: parseFloat(formData.costPrice || formData.basePrice),
            minStockLevel: parseInt(formData.minStockLevel) || 10,
            maxStockLevel: parseInt(formData.maxStockLevel) || 100
          })
        });

        if (!inventoryResponse.ok) {
          console.warn('Failed to add initial inventory');
        }
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        barcode: '',
        hsnCode: '',
        category: 'GROCERIES',
        unitOfMeasurement: 'PIECE',
        basePrice: '',
        sellingPrice: '',
        gstRate: '',
        minStockLevel: '',
        maxStockLevel: '',
        initialStock: '',
        costPrice: ''
      });

      onProductAdded();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = () => {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData(prev => ({ ...prev, barcode: `890${timestamp.slice(-8)}${random}` }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Add New Product
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
              >
                {productCategories.map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="Enter product description"
              />
            </div>

            {/* Product Identification */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Product Identification</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                  placeholder="Enter or generate barcode"
                />
                <button
                  type="button"
                  onClick={generateBarcode}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  title="Generate Barcode"
                >
                  <Barcode className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HSN Code *
              </label>
              <input
                type="text"
                required
                value={formData.hsnCode}
                onChange={(e) => setFormData(prev => ({ ...prev, hsnCode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="Enter HSN code"
              />
            </div>

            {/* Pricing & Tax */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Pricing & Tax</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base Price (₹) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Rate (%) *
              </label>
              <select
                required
                value={formData.gstRate}
                onChange={(e) => setFormData(prev => ({ ...prev, gstRate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
              >
                <option value="">Select GST Rate</option>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measurement *
              </label>
              <select
                required
                value={formData.unitOfMeasurement}
                onChange={(e) => setFormData(prev => ({ ...prev, unitOfMeasurement: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
              >
                {unitOfMeasurements.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Inventory */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Initial Inventory</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock Quantity
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.initialStock}
                onChange={(e) => setFormData(prev => ({ ...prev, initialStock: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, minStockLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Stock Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxStockLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStockLevel: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:text-black dark:bg-white dark:border-gray-300"
                placeholder="100"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
