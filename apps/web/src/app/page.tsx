export default function Home() {
  // Sample data to demonstrate the platform
  const sampleOrder = {
    orderNumber: 'ORD-DEMO-001',
    items: [
      { name: 'Basmati Rice 1kg', price: 120, gstRate: 5 },
      { name: 'Milk 1L', price: 55, gstRate: 5 },
      { name: 'Biscuits Pack', price: 40, gstRate: 18 }
    ],
    totalAmount: 225.85
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">EazyQue</h1>
              <span className="ml-2 text-sm text-gray-500">Retail Platform</span>
            </div>
            <nav className="flex space-x-6">
              <a href="#features" className="text-gray-700 hover:text-indigo-600">Features</a>
              <a href="#demo" className="text-gray-700 hover:text-indigo-600">Demo</a>
              <a href="#contact" className="text-gray-700 hover:text-indigo-600">Contact</a>
              <a 
                href="/login" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Login
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Modern Retail Billing
            <span className="block text-indigo-600">Made Simple</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete cloud-based retail solution with POS system, customer self-checkout, 
            GST compliance, and real-time inventory management for Indian retailers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Login to Dashboard
            </a>
            <a 
              href="#demo"
              className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors text-center"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need for Modern Retail
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "GST Compliance",
                description: "Automated GST calculations, HSN codes, and return filing support",
                icon: "📊"
              },
              {
                title: "POS System",
                description: "Fast barcode scanning, inventory lookup, and multi-payment support",
                icon: "🛒"
              },
              {
                title: "Self-Checkout",
                description: "Mobile app for customers to scan and pay independently",
                icon: "📱"
              },
              {
                title: "Real-time Sync",
                description: "Live updates between web dashboard and mobile apps",
                icon: "🔄"
              },
              {
                title: "Inventory Management",
                description: "Track stock levels, expiry dates, and automated reorder alerts",
                icon: "📦"
              },
              {
                title: "Analytics Dashboard",
                description: "Sales insights, customer analytics, and business intelligence",
                icon: "📈"
              }
            ].map((feature, index) => (
              <div key={index} className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Sample Order Processing
          </h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Order #{sampleOrder.orderNumber}</h3>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-IN')}
              </span>
            </div>
            
            <div className="space-y-4 mb-6">
              {sampleOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (GST: {item.gstRate}%)
                    </span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-indigo-600">
                  {formatCurrency(sampleOrder.totalAmount)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                *Includes GST as applicable
              </p>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors">
                Accept Payment
              </button>
              <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 transition-colors">
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Retail Business?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of retailers already using EazyQue for streamlined operations
          </p>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold">
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">EazyQue</h3>
              <p className="text-gray-400">
                Modern retail billing platform designed for Indian businesses
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>POS System</li>
                <li>Mobile Checkout</li>
                <li>GST Compliance</li>
                <li>Inventory Management</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>Help Center</li>
                <li>Contact Support</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Careers</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 EazyQue. Built with ❤️ for Indian retailers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
