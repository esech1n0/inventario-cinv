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

const prodUrl = env.DATABASE_URL;
const devUrl = env.DATABASE_URL_DEVELOP;

console.log('Production URL host:', prodUrl ? prodUrl.split('@')[1]?.split('/')[0] : 'not set');
console.log('Develop URL host:', devUrl ? devUrl.split('@')[1]?.split('/')[0] : 'not set');

async function inspect(name, url) {
  if (!url) {
    console.log(`\n--- ${name}: URL not configured ---`);
    return;
  }

  const prisma = new PrismaClient({
    datasources: { db: { url } }
  });

  try {
    const usersCount = await prisma.user.count();
    const modulesCount = await prisma.module.count();
    const itemsCount = await prisma.item.count();
    const transactionsCount = await prisma.transaction.count();
    const sessionsCount = await prisma.session.count();
    const accountsCount = await prisma.account.count();
    const verificationTokensCount = await prisma.verificationToken.count();

    console.log(`\n--- ${name} ---`);
    console.log(`Users: ${usersCount}`);
    console.log(`Modules: ${modulesCount}`);
    console.log(`Items: ${itemsCount}`);
    console.log(`Transactions: ${transactionsCount}`);
    console.log(`Sessions: ${sessionsCount}`);
    console.log(`Accounts: ${accountsCount}`);
    console.log(`VerificationTokens: ${verificationTokensCount}`);

    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
    console.log(`Users in ${name}:`, users);

    const modules = await prisma.module.findMany({ select: { id: true, name: true } });
    console.log(`Modules in ${name}:`, modules.map(m => m.name));
  } catch (err) {
    console.error(`Error inspecting ${name}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await inspect('PRODUCTION (DATABASE_URL)', prodUrl);
  await inspect('DEVELOP (DATABASE_URL_DEVELOP)', devUrl);
}

main();
