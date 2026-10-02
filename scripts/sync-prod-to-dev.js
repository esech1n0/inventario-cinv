import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const prodPrisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
const devPrisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL_DEVELOP } } });

async function sync() {
  console.log('--- Obteniendo datos de PRODUCCIÓN ---');
  const users = await prodPrisma.user.findMany();
  const accounts = await prodPrisma.account.findMany();
  const sessions = await prodPrisma.session.findMany();
  const verificationTokens = await prodPrisma.verificationToken.findMany();
  const modules = await prodPrisma.module.findMany();
  const items = await prodPrisma.item.findMany();
  const transactions = await prodPrisma.transaction.findMany();

  console.log(`Leídos de Producción:
  - Usuarios: ${users.length}
  - Módulos: ${modules.length}
  - Artículos: ${items.length}
  - Transacciones: ${transactions.length}
  - Tokens: ${verificationTokens.length}
  - Cuentas: ${accounts.length}
  - Sesiones: ${sessions.length}
  `);

  console.log('--- Aplicando a DEVELOP dentro de una transacción ---');
  await devPrisma.$transaction(async (tx) => {
    // 1. Limpieza en cascada en DEVELOP
    await tx.transaction.deleteMany();
    await tx.item.deleteMany();
    await tx.session.deleteMany();
    await tx.account.deleteMany();
    await tx.verificationToken.deleteMany();
    await tx.module.deleteMany();
    await tx.user.deleteMany();

    // 2. Inserción ordenada de datos de PRODUCCIÓN
    if (users.length > 0) {
      await tx.user.createMany({ data: users });
    }
    if (modules.length > 0) {
      await tx.module.createMany({ data: modules });
    }
    if (items.length > 0) {
      await tx.item.createMany({ data: items });
    }
    if (transactions.length > 0) {
      await tx.transaction.createMany({ data: transactions });
    }
    if (verificationTokens.length > 0) {
      await tx.verificationToken.createMany({ data: verificationTokens });
    }
    if (accounts.length > 0) {
      await tx.account.createMany({ data: accounts });
    }
    if (sessions.length > 0) {
      await tx.session.createMany({ data: sessions });
    }
  });

  console.log('✅ Sincronización exitosa: Datos de Producción copiados a Develop.');

  await prodPrisma.$disconnect();
  await devPrisma.$disconnect();
}

sync().catch(async (err) => {
  console.error('❌ Error durante la sincronización:', err);
  await prodPrisma.$disconnect();
  await devPrisma.$disconnect();
  process.exit(1);
});
