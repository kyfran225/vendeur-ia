// Configuration centralisée des URLs et du Domaine SEO pour Vendeur IA
export const SITE_CONFIG = {
  domain: (import.meta as any).env.VITE_SITE_DOMAIN || "vendeuria.maatfeed.com",
  get baseUrl() {
    return `https://${this.domain}`;
  },
  appName: "Vendeur IA",
  companyName: "Vendeur IA",
  defaultOgImage: "/og-banner.png"
};

