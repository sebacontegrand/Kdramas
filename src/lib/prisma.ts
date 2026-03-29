import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

// Bypass TLS certificate validation for cloud database connections in this environment
// This is required for the Driver Adapter to work with Supabase in restrictive environments
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString && typeof window === 'undefined') {
        throw new Error('DATABASE_URL is missing! Please set your Supabase connection string in Vercel Environment Variables.');
    }

    const pool = new pg.Pool({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
