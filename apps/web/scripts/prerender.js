import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.resolve(__dirname, '../dist');
const BASE_URL = 'https://vendeuria.maatfeed.com';

const ROUTES = [
  {
    path: 'offers',
    title: 'Offres & Tarifs | Vendeur IA - Commercial Virtuel WhatsApp & Instagram',
    description: 'Découvrez nos forfaits flexibles adaptés à votre activité commerciale. Automatisez vos ventes sur WhatsApp à partir de 15 000 FCFA / mois.',
    canonicalUrl: `${BASE_URL}/offers`,
    noscriptContent: `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111;">
        <h1>Offres & Tarifs - Vendeur IA</h1>
        <p>Automatisez vos ventes sur WhatsApp et Instagram avec un commercial virtuel intelligent disponible 24h/24.</p>
        <h2>Nos forfaits :</h2>
        <ul>
          <li><strong>Starter (15 000 FCFA / mois)</strong> : Idéal pour démarrer. Catalogue jusqu'à 50 produits, réponses automatiques et encaissements Mobile Money.</li>
          <li><strong>Pro & Croissance (35 000 FCFA / mois)</strong> : Pour les boutiques actives. Produits illimités, relances intelligentes de paniers, intégrations avancées et support prioritaire.</li>
          <li><strong>Entreprise & Sur Mesure</strong> : Volume élevé, formation personnalisée de l'IA et intégration CRM sur mesure.</li>
        </ul>
        <p><a href="/">Retour à l'accueil</a> | <a href="/terms">Conditions Générales</a> | <a href="/privacy">Politique de Confidentialité</a></p>
      </div>
    `
  },
  {
    path: 'terms',
    title: 'Conditions Générales d\'Utilisation | Vendeur IA',
    description: 'Conditions générales d\'utilisation des services Vendeur IA : droits, responsabilités, conformité WhatsApp Business API et protection des données.',
    canonicalUrl: `${BASE_URL}/terms`,
    noscriptContent: `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111;">
        <h1>Conditions Générales d'Utilisation - Vendeur IA</h1>
        <p>Les présentes CGU définissent les règles d'utilisation de la plateforme SaaS Vendeur IA pour les commerçants et entreprises.</p>
        <h2>Principes clés :</h2>
        <ul>
          <li>Utilisation conforme aux politiques commerciales de Meta (WhatsApp et Instagram).</li>
          <li>Responsabilité des marchands sur leurs catalogues et transactions financières.</li>
          <li>Disponibilité des services et sécurité des données hébergées.</li>
        </ul>
        <p><a href="/">Retour à l'accueil</a> | <a href="/offers">Consulter nos offres</a></p>
      </div>
    `
  },
  {
    path: 'privacy',
    title: 'Politique de Confidentialité | Vendeur IA',
    description: 'Politique de confidentialité et protection des données personnelles de la plateforme Vendeur IA. Conformité RGPD et respect du secret commercial.',
    canonicalUrl: `${BASE_URL}/privacy`,
    noscriptContent: `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111;">
        <h1>Politique de Confidentialité - Vendeur IA</h1>
        <p>Vendeur IA s'engage à respecter la vie privée de ses utilisateurs et celle de leurs clients finaux.</p>
        <h2>Gestion des données :</h2>
        <ul>
          <li>Chiffrement des échanges et des identifiants d'accès.</li>
          <li>Non-revente des données commerciales à des tiers.</li>
          <li>Droit d'accès, de rectification et de suppression totale sur simple demande.</li>
        </ul>
        <p><a href="/data-deletion">Demander la suppression de vos données</a> | <a href="/">Retour à l'accueil</a></p>
      </div>
    `
  },
  {
    path: 'data-deletion',
    title: 'Suppression des Données & Droit à l\'Oubli | Vendeur IA',
    description: 'Instructions et démarches pour demander la suppression totale de vos données personnelles et professionnelles stockées sur Vendeur IA.',
    canonicalUrl: `${BASE_URL}/data-deletion`,
    noscriptContent: `
      <div style="font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #111;">
        <h1>Suppression des Données - Vendeur IA</h1>
        <p>Conformément aux exigences de Meta Platform et aux réglementations sur la protection des données, vous pouvez à tout moment demander l'effacement complet de votre compte et de l'historique associé.</p>
        <p>Pour exercer ce droit, écrivez à contact@vendeuria.maatfeed.com ou rendez-vous dans les paramètres de votre compte.</p>
        <p><a href="/">Retour à l'accueil</a></p>
      </div>
    `
  }
];

function prerender() {
  const templatePath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`[Prerender] Error: Base template not found at ${templatePath}`);
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(templatePath, 'utf8');

  for (const route of ROUTES) {
    const routeDir = path.join(DIST_DIR, route.path);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    let modifiedHtml = baseHtml;

    // Remplacement du Title
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/i, `<title>${route.title}</title>`);

    // Remplacement de la meta description
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
      `<meta name="description" content="${route.description}" />`
    );

    // Remplacement du canonical
    modifiedHtml = modifiedHtml.replace(
      /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
      `<link rel="canonical" href="${route.canonicalUrl}" />`
    );

    // Remplacement des balises Open Graph
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
      `<meta property="og:title" content="${route.title}" />`
    );
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
      `<meta property="og:description" content="${route.description}" />`
    );
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
      `<meta property="og:url" content="${route.canonicalUrl}" />`
    );

    // Remplacement des Twitter Cards
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i,
      `<meta name="twitter:title" content="${route.title}" />`
    );
    modifiedHtml = modifiedHtml.replace(
      /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
      `<meta name="twitter:description" content="${route.description}" />`
    );

    // Remplacement de la balise noscript
    modifiedHtml = modifiedHtml.replace(
      /<noscript>[\s\S]*?<\/noscript>/i,
      `<noscript>${route.noscriptContent}</noscript>`
    );

    const outFilePath = path.join(routeDir, 'index.html');
    fs.writeFileSync(outFilePath, modifiedHtml, 'utf8');
    console.log(`[Prerender] Generated static route: /${route.path} -> ${outFilePath}`);
  }

  console.log('[Prerender] All public static routes successfully prerendered!');
}

prerender();
