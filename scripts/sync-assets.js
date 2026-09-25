import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const logoSrc = path.join(rootDir, "assets", "images", "logo-cinv.png");
const publicImagesDir = path.join(rootDir, "public", "images");
const publicDir = path.join(rootDir, "public");
const appDir = path.join(rootDir, "src", "app");

fs.mkdirSync(publicImagesDir, { recursive: true });

if (fs.existsSync(logoSrc)) {
  // Sync as primary logo for app and public
  fs.copyFileSync(logoSrc, path.join(publicImagesDir, "logo-cinv.png"));
  fs.copyFileSync(logoSrc, path.join(publicDir, "logo-cinv.png"));
  fs.copyFileSync(logoSrc, path.join(publicImagesDir, "cinv.png"));
  fs.copyFileSync(logoSrc, path.join(publicDir, "cinv.png"));

  // Default copies in case sharp is not available
  fs.copyFileSync(logoSrc, path.join(publicDir, "icon-512.png"));
  fs.copyFileSync(logoSrc, path.join(appDir, "icon.png"));

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
      .resize(512, 512, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "icon-512.png"));

    await sharp(logoSrc)
      .resize(192, 192, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "icon-192.png"));

    await sharp(logoSrc)
      .resize(180, 180, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "apple-icon.png"));

    fs.copyFileSync(path.join(publicDir, "apple-icon.png"), path.join(appDir, "apple-icon.png"));

    await sharp(logoSrc)
      .resize(48, 48, { fit: "contain" })
      .png()
      .toFile(path.join(publicDir, "favicon.png"));

    fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(publicDir, "favicon.ico"));
    fs.copyFileSync(path.join(publicDir, "favicon.png"), path.join(appDir, "favicon.ico"));

    // Generate sleek OpenGraph banner with exact brand background #01015c
    const logoBanner = await sharp(logoSrc)
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

    console.log("✅ [sync-assets] Iconos PWA y miniatura OpenGraph regenerados con sharp");
  } catch (err) {
    console.log("ℹ️ [sync-assets] sharp no requerido/utilizado:", err.message);
  }

  console.log("✅ [sync-assets] Sincronizado assets/images/logo-cinv.png -> App, PWA y Vercel thumbnail");
} else {
  console.warn("⚠️ [sync-assets] No se encontró assets/images/logo-cinv.png");
}
