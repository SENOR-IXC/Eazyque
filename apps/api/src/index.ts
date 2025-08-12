// Main API server for EazyQue Retail Platform
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { performanceMonitor, requestTimeout, cacheControl } from './middleware/performance';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup for real-time features with multiple port support
const io = new Server(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:3001", // Support for Next.js fallback port
      "http://localhost:3002", // Additional fallback
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
});

// Performance monitoring middleware
app.use(performanceMonitor);
app.use(requestTimeout(15000)); // 15 second timeout

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "http://localhost:3001", // Support for Next.js fallback port
    "http://localhost:3002", // Additional fallback
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));

// Rate limiting with optimized settings
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased from 100 to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint - Simple and robust for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'EazyQue API Server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check endpoint
app.get('/health/detailed', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EazyQue API Server is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    market: 'India',
    gstCompliant: true,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    supportedClients: ['3000', '3001', '3002'],
    features: {
      realTimeSync: true,
      gstCalculations: true,
      upiPayments: true,
      mobilePos: true
    }
  });
});

// API Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EazyQue API Server is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// System status endpoint for debugging
app.get('/api/system/status', (req, res) => {
  res.json({
    server: {
      running: true,
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version
    },
    socketio: {
      connected: io.engine.clientsCount,
      rooms: Array.from(io.sockets.adapter.rooms.keys())
    },
    cors: {
      allowedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
      ]
    }
  });
});

// API routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import inventoryRoutes from './routes/inventory';
import dashboardRoutes from './routes/dashboard';
import shopRoutes from './routes/shops';
import analyticsRoutes from './routes/analytics';
import loyaltyRoutes from './routes/loyalty';

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join shop-specific room for real-time updates
  socket.on('joinShop', (shopId) => {
    socket.join(`shop:${shopId}`);
    console.log(`Socket ${socket.id} joined shop room: ${shopId}`);
  });

  // Handle new order events
  socket.on('newOrder', (orderData) => {
    // Broadcast to all clients in the shop
    socket.to(`shop:${orderData.shopId}`).emit('orderUpdate', orderData);
  });

  // Handle inventory updates
  socket.on('inventoryUpdate', (inventoryData) => {
    socket.to(`shop:${inventoryData.shopId}`).emit('inventoryChange', inventoryData);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5001; // Changed from 5000 to avoid macOS conflicts

server.listen(Number(PORT), () => {
  console.log(`🚀 EazyQue API Server running on port ${PORT}`);
  console.log(`🇮🇳 Market: India - GST Compliant`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Available at: http://localhost:${PORT}`);
  console.log(`✅ Server ready for connections`);
});

export default app;
