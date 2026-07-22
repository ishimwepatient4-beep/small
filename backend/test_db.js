const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect()
  .then(() => {
    console.log('Connected!');
    return prisma.$queryRaw`SELECT 1 as test`;
  })
  .then((r) => {
    console.log('Query result:', r);
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error('Error:', e.message);
    prisma.$disconnect();
  });
