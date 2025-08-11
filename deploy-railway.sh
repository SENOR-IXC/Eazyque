#!/bin/bash
# Railway deployment script for EazyQue API

echo "🏗️ Building EazyQue packages..."
npm run build:packages

echo "🚀 Building API..."
cd apps/api
npm run build

echo "✅ Starting API server..."
npm start
