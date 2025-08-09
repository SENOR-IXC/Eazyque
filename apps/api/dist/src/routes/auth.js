"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Authentication routes
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("@eazyque/database");
const shared_1 = require("@eazyque/shared");
const router = (0, express_1.Router)();
// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, phone, name, password, role, shopId } = req.body;
        // Validate input
        if (!email || !phone || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, phone, name, and password are required'
            });
        }
        // Validate phone number
        if (!shared_1.ValidationUtils.isValidPhoneNumber(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }
        // Check if user already exists
        const existingUser = await database_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { phone }
                ]
            }
        });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await database_1.prisma.user.create({
            data: {
                email,
                phone,
                name,
                password: hashedPassword,
                role: role || 'CUSTOMER',
                shopId
            },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                role: true,
                shopId: true,
                isActive: true,
                createdAt: true
            }
        });
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user,
                token
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register user'
        });
    }
});
// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        // Find user
        const user = await database_1.prisma.user.findUnique({
            where: { email },
            include: {
                shop: true
            }
        });
        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        // Verify password
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, shopId: user.shopId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login'
        });
    }
});
// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                shop: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});
// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
}
exports.default = router;
//# sourceMappingURL=auth.js.map