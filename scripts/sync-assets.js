import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const srcFile = path.join(rootDir, "assets", "images", "cinv.png");
const destDir = path.join(rootDir, "public", "images");
const destFile = path.join(destDir, "cinv.png");
const rootDestFile = path.join(rootDir, "public", "cinv.png");

if (fs.existsSync(srcFile)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcFile, destFile);
  fs.copyFileSync(srcFile, rootDestFile);
  console.log("✅ [sync-assets] Sincronizado assets/images/cinv.png -> public/images/cinv.png y public/cinv.png");
} else {
  console.warn("⚠️ [sync-assets] No se encontró assets/images/cinv.png");
}
