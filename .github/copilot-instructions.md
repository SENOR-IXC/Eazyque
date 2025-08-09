# Copilot Instructions for EazyQue Retail Billing Platform

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is a full-stack retail billing and self-checkout platform built for Indian retailers. The platform consists of:

1. **Web Application (Next.js)**: Admin dashboard and POS system for shopkeepers
2. **Mobile Application (React Native)**: Customer self-checkout functionality  
3. **Backend Services**: Microservices architecture with PostgreSQL database
4. **Shared Libraries**: Common utilities, types, and business logic

## Tech Stack

- **Frontend Web**: Next.js 15, TypeScript, Tailwind CSS, React
- **Mobile**: React Native with TypeScript
- **Backend**: Node.js, Express, PostgreSQL, Prisma ORM
- **Authentication**: NextAuth.js, JWT
- **Payments**: UPI, Razorpay, Stripe (for cards)
- **Real-time**: Socket.io for live synchronization
- **Deployment**: Vercel (frontend), Railway/Supabase (backend)

## Code Standards

- Use TypeScript with strict mode enabled
- Follow React and Next.js best practices
- Implement responsive design with Tailwind CSS
- Use server components where possible in Next.js
- Implement proper error handling and loading states
- Follow Indian GST compliance requirements
- Use Prisma for database operations
- Implement real-time features with Socket.io

## Indian Market Specifics

- **GST Compliance**: All calculations must include GST/CGST/SGST/IGST
- **HSN Codes**: Validate against government HSN database
- **UPI Integration**: Primary payment method for Indian market
- **Multi-language**: Support Hindi and regional languages
- **Currency**: All amounts in INR (₹)
- **Mobile-first**: Design for mobile and tablet devices primarily

## Architecture Patterns

- **Monorepo Structure**: Organized by applications and shared packages
- **API Design**: RESTful APIs with OpenAPI documentation
- **State Management**: Zustand for client state, React Query for server state
- **Database**: Normalized PostgreSQL schema with proper indexing
- **Security**: Implement RBAC, data encryption, PCI DSS compliance
- **Performance**: Optimize for Indian network conditions and devices

## Key Features to Implement

1. **POS System**: Barcode scanning, inventory management, billing
2. **Self-Checkout**: Customer mobile app with barcode scanning
3. **Inventory Management**: Real-time stock tracking, expiry management
4. **GST Reporting**: Automated GSTR-1, GSTR-3B generation
5. **Payment Processing**: Multi-modal payment support
6. **Customer Management**: Loyalty programs, analytics
7. **Real-time Sync**: Live updates between web and mobile platforms

## Security Considerations

- Implement proper authentication and authorization
- Validate all user inputs and sanitize data
- Use HTTPS for all communications
- Implement rate limiting and DDoS protection
- Follow OWASP security guidelines
- Ensure PCI DSS compliance for payment processing

When writing code, prioritize:
1. Type safety and error handling
2. Performance optimization for mobile devices
3. Real-time synchronization capabilities
4. GST compliance and Indian market requirements
5. Scalable architecture patterns
6. User experience optimization for retail environments
