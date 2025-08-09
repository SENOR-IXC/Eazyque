// Database client and utilities for EazyQue platform
import { PrismaClient } from '@prisma/client';

// Create a global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'minimal',
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database utilities
export class DatabaseUtils {
  /**
   * Check database connection
   */
  static async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Gracefully disconnect from database
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  /**
   * Start a database transaction
   */
  static async transaction<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return await prisma.$transaction(fn);
  }

  /**
   * Bulk upsert operation
   */
  static async bulkUpsert<T>(
    model: any,
    data: Array<T & { id?: string }>,
    uniqueFields: string[]
  ) {
    const operations = data.map(item => {
      const where = uniqueFields.reduce((acc, field) => {
        acc[field] = (item as any)[field];
        return acc;
      }, {} as any);

      return model.upsert({
        where,
        create: item,
        update: item
      });
    });

    return await prisma.$transaction(operations);
  }
}

// Repository base class
export abstract class BaseRepository {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findMany(options?: any) {
    return await this.model.findMany(options);
  }

  async findUnique(options: any) {
    return await this.model.findUnique(options);
  }

  async findFirst(options?: any) {
    return await this.model.findFirst(options);
  }

  async create(data: any) {
    return await this.model.create({ data });
  }

  async update(where: any, data: any) {
    return await this.model.update({ where, data });
  }

  async delete(where: any) {
    return await this.model.delete({ where });
  }

  async count(options?: any) {
    return await this.model.count(options);
  }

  async upsert(where: any, create: any, update: any) {
    return await this.model.upsert({ where, create, update });
  }
}

// Export Prisma types
export * from '@prisma/client';
export default prisma;
