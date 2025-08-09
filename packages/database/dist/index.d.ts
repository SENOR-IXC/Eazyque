import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import(".prisma/client/runtime/library").DefaultArgs>;
export declare class DatabaseUtils {
    /**
     * Check database connection
     */
    static checkConnection(): Promise<boolean>;
    /**
     * Gracefully disconnect from database
     */
    static disconnect(): Promise<void>;
    /**
     * Start a database transaction
     */
    static transaction<T>(fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T>;
    /**
     * Bulk upsert operation
     */
    static bulkUpsert<T>(model: any, data: Array<T & {
        id?: string;
    }>, uniqueFields: string[]): Promise<any[]>;
}
export declare abstract class BaseRepository {
    protected model: any;
    constructor(model: any);
    findMany(options?: any): Promise<any>;
    findUnique(options: any): Promise<any>;
    findFirst(options?: any): Promise<any>;
    create(data: any): Promise<any>;
    update(where: any, data: any): Promise<any>;
    delete(where: any): Promise<any>;
    count(options?: any): Promise<any>;
    upsert(where: any, create: any, update: any): Promise<any>;
}
export * from '@prisma/client';
export default prisma;
//# sourceMappingURL=index.d.ts.map