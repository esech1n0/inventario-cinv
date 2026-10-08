// Aplica los archivos SQL de prisma/migrations durante el build (Vercel).
// Los scripts deben ser idempotentes (IF NOT EXISTS), ya que se ejecutan en cada deploy.
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "prisma", "migrations");

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
  });
}
console.log(`[migrations] ${folders.length} migración(es) aplicada(s).`);
