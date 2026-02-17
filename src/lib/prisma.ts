import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

if (process.env.NODE_ENV === 'development') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const prismaClientSingleton = () => {
    console.log('DEBUG: Initializing Prisma Client. DATABASE_URL present:', !!process.env.DATABASE_URL);
    const connectionString = process.env.DATABASE_URL
    const pool = new pg.Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false // This fixes the P1011/TLS certificate error in most development environments
        }
    })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

// Browser-safe initialization
let prisma: PrismaClient;

if (typeof window === 'undefined') {
    if (!globalThis.prismaGlobal) {
        globalThis.prismaGlobal = prismaClientSingleton();
    }
    prisma = globalThis.prismaGlobal;
} else {
    // In the browser, we provide a Proxy that throws a helpful error if accessed.
    prisma = new Proxy({} as PrismaClient, {
        get() {
            throw new Error('PrismaClient cannot be used in the browser.');
        },
    });
}

export { prisma }
