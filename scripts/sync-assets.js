import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const logoSrc = path.join(rootDir, "assets", "images", "logo-cinv.png");
const cinvSrc = path.join(rootDir, "assets", "images", "cinv.png");
const publicImagesDir = path.join(rootDir, "public", "images");
const publicDir = path.join(rootDir, "public");
const appDir = path.join(rootDir, "src", "app");

fs.mkdirSync(publicImagesDir, { recursive: true });

// 1. Sync cinv.png (header & forms logo)
if (fs.existsSync(cinvSrc)) {
  fs.copyFileSync(cinvSrc, path.join(publicImagesDir, "cinv.png"));
  fs.copyFileSync(cinvSrc, path.join(publicDir, "cinv.png"));
  console.log("✅ [sync-assets] Sincronizado cinv.png -> public/images/cinv.png");
} else {
  console.warn("⚠️ [sync-assets] No se encontró assets/images/cinv.png");
}

// 2. Sync logo-cinv.png (app thumbnail, PWA icons, favicon, og-image)
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, path.join(publicImagesDir, "logo-cinv.png"));
  fs.copyFileSync(logoSrc, path.join(publicDir, "logo-cinv.png"));

  // Default copies in case sharp is not available or during fast sync
  fs.copyFileSync(logoSrc, path.join(publicDir, "icon-512.png"));
  fs.copyFileSync(logoSrc, path.join(appDir, "icon.png"));

  // If favicon or other files don't exist yet, copy as fallback
  if (!fs.existsSync(path.join(publicDir, "icon-192.png"))) {
    fs.copyFileSync(logoSrc, path.join(publicDir, "icon-192.png"));
  }
  if (!fs.existsSync(path.join(publicDir, "apple-icon.png"))) {
    fs.copyFileSync(logoSrc, path.join(publicDir, "apple-icon.png"));
  }
  if (!fs.existsSync(path.join(publicDir, "favicon.ico"))) {
    fs.copyFileSync(logoSrc, path.join(publicDir, "favicon.ico"));
  }
  if (!fs.existsSync(path.join(appDir, "favicon.ico"))) {
    fs.copyFileSync(logoSrc, path.join(appDir, "favicon.ico"));
  }
  if (!fs.existsSync(path.join(appDir, "apple-icon.png"))) {
    fs.copyFileSync(logoSrc, path.join(appDir, "apple-icon.png"));
  }

  // Attempt sharp resize if available for optimal resolutions
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    await sharp(logoSrc)
      .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "icon-512.png"));

    await sharp(logoSrc)
      .resize(192, 192, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "icon-192.png"));

    await sharp(logoSrc)
      .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "apple-icon.png"));

    fs.copyFileSync(path.join(publicDir, "apple-icon.png"), path.join(appDir, "apple-icon.png"));

    await sharp(logoSrc)
      .resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(publicDir, "favicon.png"));

    fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(publicDir, "favicon.ico"));
    fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(appDir, "favicon.ico"));

    // Generate sleek OpenGraph banner
    const logoBanner = await sharp(logoSrc)
      .resize(400, 400, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 },
      },
    })
      .composite([{ input: logoBanner, gravity: "center" }])
      .png()
      .toFile(path.join(publicDir, "og-image.png"));

    fs.copyFileSync(path.join(publicDir, "og-image.png"), path.join(appDir, "opengraph-image.png"));

    console.log("✅ [sync-assets] Iconos PWA y miniatura OpenGraph generados con sharp");
  } catch (err) {
    console.log("ℹ️ [sync-assets] sharp no requerido/utilizado para resize:", err.message);
  }

  console.log("✅ [sync-assets] Sincronizado assets/images/logo-cinv.png -> PWA y miniaturas");
} else {
  console.warn("⚠️ [sync-assets] No se encontró assets/images/logo-cinv.png");
}
