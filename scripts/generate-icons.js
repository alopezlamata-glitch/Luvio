#!/usr/bin/env node

/**
 * Luvio · iOS App Icon Generator
 *
 * Genera todos los tamaños de icono requeridos por Apple desde un PNG de 1024x1024.
 *
 * Uso:
 *   node scripts/generate-icons.js [ruta-al-icono-1024.png]
 *
 * Requiere: npm install sharp
 *
 * Genera:
 *   - ios/App/App/Assets.xcassets/AppIcon.appiconset/ (todos los tamaños)
 *   - icons/ (web/PWA icons)
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SOURCE = process.argv[2] || "assets/icon-1024.png";

// Tamaños requeridos por Apple (Xcode 15+, solo necesita 1024)
// Pero por compatibilidad generamos todos los clásicos
const IOS_SIZES = [
  { size: 20, scales: [2, 3], idiom: "iphone" },
  { size: 29, scales: [2, 3], idiom: "iphone" },
  { size: 40, scales: [2, 3], idiom: "iphone" },
  { size: 60, scales: [2, 3], idiom: "iphone" },
  { size: 20, scales: [1, 2], idiom: "ipad" },
  { size: 29, scales: [1, 2], idiom: "ipad" },
  { size: 40, scales: [1, 2], idiom: "ipad" },
  { size: 76, scales: [1, 2], idiom: "ipad" },
  { size: 83.5, scales: [2], idiom: "ipad" },
  { size: 1024, scales: [1], idiom: "ios-marketing" },
];

const WEB_SIZES = [180, 192, 512];

async function generate() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ No se encontró: ${SOURCE}`);
    console.log("Crea un PNG de 1024x1024 con el logo de Luvio y pon la ruta como argumento.");
    console.log("\nTip: fondo #0a0a12, logo gradient coral→amber");
    process.exit(1);
  }

  const iosDir = "ios/App/App/Assets.xcassets/AppIcon.appiconset";
  const webDir = "public/icons";

  fs.mkdirSync(iosDir, { recursive: true });
  fs.mkdirSync(webDir, { recursive: true });

  const contentsImages = [];

  console.log("🎨 Generando iconos iOS...\n");

  // iOS icons
  for (const { size, scales, idiom } of IOS_SIZES) {
    for (const scale of scales) {
      const px = Math.round(size * scale);
      const filename = `icon-${size}x${size}@${scale}x.png`;

      await sharp(SOURCE)
        .resize(px, px, { fit: "cover" })
        .png({ quality: 100 })
        .toFile(path.join(iosDir, filename));

      contentsImages.push({
        size: `${size}x${size}`,
        idiom,
        filename,
        scale: `${scale}x`,
      });

      console.log(`  ✓ ${filename} (${px}×${px})`);
    }
  }

  // Contents.json para Xcode
  const contents = {
    images: contentsImages,
    info: { version: 1, author: "luvio-icon-generator" },
  };
  fs.writeFileSync(
    path.join(iosDir, "Contents.json"),
    JSON.stringify(contents, null, 2)
  );
  console.log(`  ✓ Contents.json\n`);

  // Web/PWA icons
  console.log("🌐 Generando iconos web...\n");
  for (const px of WEB_SIZES) {
    const filename = `icon-${px}.png`;
    await sharp(SOURCE)
      .resize(px, px, { fit: "cover" })
      .png({ quality: 95 })
      .toFile(path.join(webDir, filename));
    console.log(`  ✓ ${filename}`);
  }

  // Favicon
  await sharp(SOURCE)
    .resize(32, 32, { fit: "cover" })
    .png()
    .toFile("public/favicon.png");
  console.log("  ✓ favicon.png\n");

  console.log("✅ Todos los iconos generados correctamente.");
  console.log(`\n   iOS: ${iosDir}/`);
  console.log(`   Web: ${webDir}/`);
}

generate().catch(console.error);
