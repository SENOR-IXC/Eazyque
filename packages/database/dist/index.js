"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = exports.DatabaseUtils = exports.prisma = void 0;
// Database client and utilities for EazyQue platform
const client_1 = require("@prisma/client");
// Create a global Prisma client instance
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    errorFormat: 'minimal',
});
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
// Database utilities
class DatabaseUtils {
    /**
     * Check database connection
     */
    static async checkConnection() {
        try {
            await exports.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
    /**
     * Gracefully disconnect from database
     */
    static async disconnect() {
        await exports.prisma.$disconnect();
    }
    /**
     * Start a database transaction
     */
    static async transaction(fn) {
        return await exports.prisma.$transaction(fn);
    }
    /**
     * Bulk upsert operation
     */
    static async bulkUpsert(model, data, uniqueFields) {
        const operations = data.map(item => {
            const where = uniqueFields.reduce((acc, field) => {
                acc[field] = item[field];
                return acc;
            }, {});
            return model.upsert({
                where,
                create: item,
                update: item
            });
        });
        return await exports.prisma.$transaction(operations);
    }
}
exports.DatabaseUtils = DatabaseUtils;
// Repository base class
class BaseRepository {
    constructor(model) {
        this.model = model;
    }
    async findMany(options) {
        return await this.model.findMany(options);
    }
    async findUnique(options) {
        return await this.model.findUnique(options);
    }
    async findFirst(options) {
        return await this.model.findFirst(options);
    }
    async create(data) {
        return await this.model.create({ data });
    }
    async update(where, data) {
        return await this.model.update({ where, data });
    }
    async delete(where) {
        return await this.model.delete({ where });
    }
    async count(options) {
        return await this.model.count(options);
    }
    async upsert(where, create, update) {
        return await this.model.upsert({ where, create, update });
    }
}
exports.BaseRepository = BaseRepository;
// Export Prisma types
__exportStar(require("@prisma/client"), exports);
exports.default = exports.prisma;
//# sourceMappingURL=index.js.map