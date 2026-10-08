const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('prueba 1234', 12);
  await prisma.user.upsert({
    where: { email: 'prueba@prueba.com' },
    update: { passwordHash: hash, role: 'ADMIN', isApproved: true },
    create: {
      name: 'Prueba Admin',
      email: 'prueba@prueba.com',
      passwordHash: hash,
      role: 'ADMIN',
      isApproved: true
    }
  });
  console.log('User created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
