// Aplica los archivos SQL de prisma/migrations durante el build (Vercel).
// Los scripts deben ser idempotentes (IF NOT EXISTS), ya que se ejecutan en cada deploy.
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "prisma", "migrations");

// Cargar .env si se ejecuta localmente donde el entorno aún no tiene las variables inyectadas
if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_DEVELOP) {
  const envPath = path.join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_DEVELOP) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_DEVELOP;
}

if (!process.env.DATABASE_URL) {
  console.log("[migrations] DATABASE_URL no definida, se omite.");
  process.exit(0);
}
if (!existsSync(dir)) process.exit(0);

const folders = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, "migration.sql")))
  .map((d) => d.name)
  .sort();

for (const name of folders) {
  const file = path.join("prisma", "migrations", name, "migration.sql");
  console.log(`[migrations] Aplicando ${name}...`);
  execSync(`npx prisma db execute --file "${file}" --schema prisma/schema.prisma`, {
    stdio: "inherit",
    env: process.env,
  });
}
console.log(`[migrations] ${folders.length} migración(es) aplicada(s).`);
