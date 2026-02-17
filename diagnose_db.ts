
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- USERS ---')
    const users = await prisma.user.findMany()
    console.log(JSON.stringify(users, null, 2))

    console.log('--- RATINGS ---')
    const ratings = await prisma.rating.findMany()
    console.log(JSON.stringify(ratings, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
