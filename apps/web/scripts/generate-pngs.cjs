const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function main() {
  const svgPath = path.join(__dirname, '../public/logo.svg');
  if (!fs.existsSync(svgPath)) {
    throw new Error(`SVG file not found at ${svgPath}`);
  }

  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; overflow: hidden; background: #000000; }
        svg { width: 100%; height: 100%; display: block; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `;

  console.log('Launching headless browser via Playwright...');
  const browser = await chromium.launch();

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'logo-1024x1024.png', size: 1024 }
  ];

  for (const { name, size } of sizes) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1
    });

    await page.setContent(htmlContent);
    // Attendre un court instant pour s'assurer que les filtres SVG complexes soient pleinement calculés
    await page.waitForTimeout(300);

    const outputPath = path.join(__dirname, '../public', name);
    await page.screenshot({ path: outputPath, type: 'png' });
    console.log(`✔ Généré : ${name} (${size}x${size})`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 Tous les logos PNG ont été générés avec succès via Playwright !');
}

main().catch(err => {
  console.error('Erreur lors de la génération :', err);
  process.exit(1);
});
