# EazyQue - Retail Billing & Self-Checkout Platform

A comprehensive cloud-based omnichannel grocery billing ecosystem tailored for Indian retailers. The solution seamlessly integrates a feature-rich web platform and mobile app, delivering both traditional POS capabilities and customer self-service checkout.

## 🚀 Features

### Web Application (Admin/POS)
- **GST Compliance**: Automated GST/CGST/SGST/IGST calculations with HSN code management
- **POS Integration**: Barcode/QR scanning, weighing scale input, multilingual UI
- **Inventory Management**: Real-time stock tracking, batch and expiry management
- **Customer Management**: Loyalty programs, customer analytics, communication tools
- **Payment Processing**: Integrated UPI, cards, wallets with PCI DSS compliance
- **Reporting**: Comprehensive sales, GST, inventory, and financial dashboards

### Mobile Application (Customer Self-Checkout)
- **Barcode Scanner**: Native camera-based product scanning
- **Cart & Checkout**: Real-time bill calculation with GST
- **Payment Integration**: UPI, digital wallets, split payments
- **Real-time Sync**: Instant synchronization with POS system
- **Offline Support**: Queue transactions for sync when online

## 🏗️ Architecture

```
├── apps/
│   ├── web/          # Next.js web application (Admin/POS)
│   ├── api/          # Node.js/Express backend API
│   └── mobile/       # React Native mobile app
└── packages/
    ├── shared/       # Common types and utilities
    ├── database/     # Prisma database schema and client
    └── gst-utils/    # GST calculation and compliance utilities
```

## 🛠️ Tech Stack

- **Frontend Web**: Next.js 15, TypeScript, Tailwind CSS
- **Mobile**: React Native with TypeScript
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js, JWT
- **Payments**: UPI, Razorpay, Stripe
- **Real-time**: Socket.io
- **Deployment**: Vercel (frontend), Railway/Supabase (backend)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- React Native development environment (for mobile)

### Installation

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd eazyque
npm install
```

2. **Set up environment variables**
```bash
# Copy environment template
cp .env.example .env

# Configure your database and API keys
DATABASE_URL="postgresql://username:password@localhost:5432/eazyque"
JWT_SECRET="your-jwt-secret"
RAZORPAY_KEY_ID="your-razorpay-key"
```

3. **Set up the database**
```bash
# Generate Prisma client and run migrations
npm run db:generate
npm run db:push

# Seed the database with sample data
npm run db:seed
```

4. **Start development servers**
```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:web    # Web app on http://localhost:3000
npm run dev:api    # API server on http://localhost:5000
```

### Mobile App Setup

1. **Install React Native CLI**
```bash
npm install -g react-native-cli
```

2. **Start the mobile app**
```bash
# For Android
npm run mobile:android

# For iOS
npm run mobile:ios
```

## 📱 Key Features Implementation

### GST Compliance
- Automated GST rate calculation based on HSN codes
- Support for intrastate (CGST+SGST) and interstate (IGST) transactions
- GSTR-1 and GSTR-3B report generation
- Government HSN code validation

### Real-time Synchronization
- Socket.io for live updates between web and mobile
- Inventory updates reflect instantly across all platforms
- Real-time order processing and status updates

### Payment Integration
- UPI integration for instant payments
- Multi-modal payment support (cash, cards, wallets)
- Split payment functionality
- Secure transaction processing

### Barcode Scanning
- Support for multiple barcode formats (EAN-13, UPC-A, Code 128)
- Camera-based scanning on mobile devices
- Product lookup and inventory management

## 🔐 Security Features

- JWT-based authentication and authorization
- Role-based access control (Admin, Shop Owner, Cashier, Customer)
- Data encryption and secure API endpoints
- PCI DSS compliance for payment processing
- Rate limiting and DDoS protection

## 📊 Analytics & Reporting

- Real-time sales dashboards
- Inventory analytics and low-stock alerts
- Customer behavior insights
- GST compliance reports
- Financial performance metrics

## 🌐 Deployment

### Web Application
```bash
# Build and deploy to Vercel
npm run build:web
vercel --prod
```

### API Server
```bash
# Build and deploy to Railway/Heroku
npm run build:api
# Deploy using your preferred platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@eazyque.com
- 📱 Phone: +91-XXXX-XXXX
- 💬 Discord: [EazyQue Community](https://discord.gg/eazyque)

## 🎯 Roadmap

- [ ] Advanced analytics dashboard
- [ ] Multi-store management
- [ ] E-commerce integration
- [ ] Voice commands for POS
- [ ] AI-powered inventory predictions
- [ ] WhatsApp Business integration
- [ ] QR code based table ordering

---

**Built with ❤️ for Indian retailers**
