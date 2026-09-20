const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

async function main() {
  const svgPath = path.join(__dirname, '../public/logo.svg');
  if (!fs.existsSync(svgPath)) {
    throw new Error(`SVG file not found at ${svgPath}`);
  }

  let svgContent = fs.readFileSync(svgPath, 'utf8');

  // Remplacer rx="280" ry="280" par rx="0" ry="0" pour avoir un conteneur parfaitement carré (sans arrondis)
  // adapté pour les photos de profil (Google, LinkedIn, etc.) qui gèrent l'arrondi dynamiquement.
  svgContent = svgContent.replace(/rx="280"/g, 'rx="0"').replace(/ry="280"/g, 'ry="0"');

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

  // Taille recommandée optimale pour les photos de profil Google / réseaux sociaux (800x800 ou 1024x1024)
  const size = 1024;
  const name = 'logo-social-square.png';

  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1
  });

  await page.setContent(htmlContent);
  await page.waitForTimeout(300);

  const outputPath = path.join(__dirname, '../public', name);

  await page.screenshot({ path: outputPath, type: 'png' });
  console.log(`✔ Généré : ${name} (${size}x${size}) parfaitement CArrÉ pour photo de profil Google !`);

  await page.close();
  await browser.close();
}

main().catch(err => {
  console.error('Erreur lors de la génération :', err);
  process.exit(1);
});
