import { prisma } from '../src/lib/prisma'

async function main() {
  try {
    const userCount = await prisma.user.count()
    console.log('Successfully connected! User count:', userCount)
  } catch (error) {
    console.error('Connection failed:', error)
    process.exit(1)
  } finally {
    // @ts-ignore
    await prisma.$disconnect()
  }
}

main()
