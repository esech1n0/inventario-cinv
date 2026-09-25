import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const cinvSrc = path.join(rootDir, "assets", "images", "cinv.png");
const logoCinvSrc = path.join(rootDir, "assets", "images", "logo-cinv.png");
const publicImagesDir = path.join(rootDir, "public", "images");
const publicDir = path.join(rootDir, "public");
const appDir = path.join(rootDir, "src", "app");

fs.mkdirSync(publicImagesDir, { recursive: true });

// 1. Web page logo (Vercel, Header / Navigation, Login, Register) -> cinv.png
if (fs.existsSync(cinvSrc)) {
  fs.copyFileSync(cinvSrc, path.join(publicImagesDir, "cinv.png"));
  fs.copyFileSync(cinvSrc, path.join(publicDir, "cinv.png"));
  console.log("✅ [sync-assets] Sincronizado cinv.png -> public/images/cinv.png (Logo web / Vercel)");
} else {
  console.warn("⚠️ [sync-assets] No se encontró assets/images/cinv.png");
}

// 2. App icon / PWA thumbnail (app instalada / descargada en móvil y escritorio) -> logo-cinv.png
if (fs.existsSync(logoCinvSrc)) {
  fs.copyFileSync(logoCinvSrc, path.join(publicImagesDir, "logo-cinv.png"));
  fs.copyFileSync(logoCinvSrc, path.join(publicDir, "logo-cinv.png"));
  fs.copyFileSync(logoCinvSrc, path.join(publicDir, "icon-512.png"));
  fs.copyFileSync(logoCinvSrc, path.join(appDir, "icon.png"));

  // Default fallback copies
  if (!fs.existsSync(path.join(publicDir, "icon-192.png"))) {
    fs.copyFileSync(logoCinvSrc, path.join(publicDir, "icon-192.png"));
  }
  if (!fs.existsSync(path.join(publicDir, "apple-icon.png"))) {
    fs.copyFileSync(logoCinvSrc, path.join(publicDir, "apple-icon.png"));
  }
  if (!fs.existsSync(path.join(publicDir, "favicon.ico"))) {
    fs.copyFileSync(logoCinvSrc, path.join(publicDir, "favicon.ico"));
  }
  if (!fs.existsSync(path.join(appDir, "favicon.ico"))) {
    fs.copyFileSync(logoCinvSrc, path.join(appDir, "favicon.ico"));
  }
  if (!fs.existsSync(path.join(appDir, "apple-icon.png"))) {
    fs.copyFileSync(logoCinvSrc, path.join(appDir, "apple-icon.png"));
  }

  // Generate crisp resolutions using sharp if available
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    // 512x512 PWA downloaded app icon
    await sharp(logoCinvSrc)
      .resize(512, 512, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "icon-512.png"));

    // 192x192 PWA downloaded app icon
    await sharp(logoCinvSrc)
      .resize(192, 192, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "icon-192.png"));

    // 180x180 Apple touch icon for iOS installed app
    await sharp(logoCinvSrc)
      .resize(180, 180, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "apple-icon.png"));

    fs.copyFileSync(path.join(publicDir, "apple-icon.png"), path.join(appDir, "apple-icon.png"));

    // 48x48 Favicon
    await sharp(logoCinvSrc)
      .resize(48, 48, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "favicon.png"));

    fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(publicDir, "favicon.ico"));
    fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(appDir, "favicon.ico"));

    // OpenGraph banner (cinv brand)
    const logoBanner = await sharp(logoCinvSrc)
      .resize(480, 480, { fit: "contain" })
      .toBuffer();

    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 1, g: 1, b: 92, alpha: 1 },
      },
    })
      .composite([{ input: logoBanner, gravity: "center" }])
      .png()
      .toFile(path.join(publicDir, "og-image.png"));

    fs.copyFileSync(path.join(publicDir, "og-image.png"), path.join(appDir, "opengraph-image.png"));

    console.log("✅ [sync-assets] Iconos PWA generados con sharp para app descargada");
  } catch (err) {
    console.log("ℹ️ [sync-assets] sharp no requerido/utilizado:", err.message);
  }

  console.log("✅ [sync-assets] Sincronizado logo-cinv.png -> Iconos de app descargada (PWA)");
} else {
  console.warn("⚠️ [sync-assets] No se encontró assets/images/logo-cinv.png");
}
