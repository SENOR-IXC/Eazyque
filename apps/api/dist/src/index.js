"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Main API server for EazyQue Retail Platform
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Socket.IO setup for real-time features with multiple port support
const io = new socket_io_1.Server(server, {
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
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
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
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
// Body parsing middleware
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get('/health', (req, res) => {
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
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const inventory_1 = __importDefault(require("./routes/inventory"));
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/inventory', inventory_1.default);
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
app.use((err, req, res, next) => {
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
const PORT = process.env.PORT || 5001; // Explicitly use port 5001
server.listen(PORT, () => {
    console.log(`🚀 EazyQue API Server running on port ${PORT}`);
    console.log(`🇮🇳 Market: India - GST Compliant`);
    console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Available at: http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map