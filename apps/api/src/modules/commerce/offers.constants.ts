export const DEFAULT_OFFERS = [
  {
    slug: "essential",
    name: "Vendeur IA Essentiel",
    description: "La formule idéale pour automatiser vos ventes sur WhatsApp, ne plus rater de clients la nuit et valider vos paiements Mobile Money.",
    monthlyPrice: 5000,
    yearlyPrice: 50000, // 2 mois offerts (10x le prix mensuel au lieu de 12x)
    currency: "XOF",
    features: [
      "Agent Vendeur IA autonome 24h/24 & 7j/7",
      "Catalogue produits complet & Gestion des stocks",
      "PaymentShield OCR : Détection reçus Wave, Orange, MTN",
      "Prise de commandes & Reçus automatiques",
      "Studio Créatif : Affiches IA & Statuts WhatsApp",
      "Messagerie commerciale avec Reprise en main humaine"
    ],
    isActive: true,
    sortOrder: 1,
    setupRequired: false,
    setupOptions: [
      { type: "SELF_SERVICE", price: 0, label: "Je le fais moi-même" }
    ]
  },
  {
    slug: "pro",
    name: "Vendeur IA Pro",
    description: "Pour les marques et entreprises à fort volume qui veulent un numéro officiel dédié Meta, du multi-canal et des outils marketing avancés.",
    monthlyPrice: 20000,
    yearlyPrice: 200000, // 2 mois offerts (10x le prix mensuel au lieu de 12x)
    currency: "XOF",
    features: [
      "Tout ce qui est inclus dans Essentiel",
      "Numéro d'Entreprise Pro Dédié (Meta Cloud API)",
      "Multi-Canal : WhatsApp + Instagram & Messenger",
      "Broadcast IA : Campagnes marketing & diffusion ciblée",
      "PaymentShield Forensic : Détection anti-fraude avancée",
      "Vocaux IA : Synthèse & Transcription vocale naturelle",
      "Support VIP Prioritaire 7j/7"
    ],
    isActive: true,
    sortOrder: 2,
    setupRequired: true,
    setupOptions: [
      { type: "SELF_SERVICE", price: 0, label: "Je le fais moi-même" },
      { type: "EXPERT", price: 25000, label: "Faites-le pour moi (Installation Expert)" }
    ]
  }
];
