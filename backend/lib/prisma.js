// FILE: backend/lib/prisma.js
// Singleton Prisma client — import this everywhere instead of creating new instances

const { PrismaClient } = require('@prisma/client');

// Reuse client in development to avoid "too many connections" during hot reload
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
