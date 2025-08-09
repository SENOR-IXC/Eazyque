#!/bin/bash

# EazyQue API Deployment Script for Supabase/Railway

echo "🚀 Starting EazyQue API Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is set
if [ -z "$NODE_ENV" ]; then
    export NODE_ENV=production
    print_status "Setting NODE_ENV to production"
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
cd apps/api
npm ci --only=production
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Generate Prisma client
print_status "Generating Prisma client..."
cd ../../packages/database
npm run generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated successfully"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Step 3: Build the API
print_status "Building API..."
cd ../../apps/api
npm run build
if [ $? -eq 0 ]; then
    print_success "API built successfully"
else
    print_error "Failed to build API"
    exit 1
fi

# Step 4: Database migration (only if DATABASE_URL is set)
if [ ! -z "$DATABASE_URL" ]; then
    print_status "Running database migrations..."
    cd ../../packages/database
    npx prisma migrate deploy
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed"
    else
        print_warning "Database migrations failed - please run manually"
    fi
else
    print_warning "DATABASE_URL not set - skipping migrations"
fi

# Step 5: Seed database (optional)
print_status "Seeding database with initial data..."
cd ../../
node scripts/seed-test-products.ts 2>/dev/null || print_warning "Seeding failed - database might already be seeded"

print_success "🎉 EazyQue API deployment completed!"
print_status "Next steps:"
echo "  1. Set up environment variables in your hosting platform"
echo "  2. Configure DATABASE_URL with your Supabase PostgreSQL URL"
echo "  3. Set JWT_SECRET and other security variables"
echo "  4. Deploy to Railway/Render/Heroku"
echo ""
print_status "Production checklist:"
echo "  ✅ Dependencies installed"
echo "  ✅ Prisma client generated" 
echo "  ✅ API built"
echo "  ⚠️  Database migrations (run manually if needed)"
echo "  ⚠️  Environment variables (configure in hosting platform)"
echo "  ⚠️  Domain and SSL (configure in hosting platform)"
