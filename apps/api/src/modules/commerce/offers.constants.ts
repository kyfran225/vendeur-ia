export const DEFAULT_OFFERS = [
  {
    slug: "essential",
    name: "Vendeur IA Essentiel",
    description: "L'IA autonome qui vend pour vous 24h/24. Idéal pour ne plus rater de clients et automatiser vos encaissements.",
    monthlyPrice: 5000,
    yearlyPrice: 50000, // 2 mois offerts
    currency: "XOF",
    features: [
      "Agent Vendeur IA autonome 24h/24 & 7j/7",
      "Catalogue produits complet & Gestion des stocks",
      "PaymentShield : Détection automatique des reçus Mobile Money",
      "Prise de commandes & Reçus automatiques",
      "Studio Créatif : Affiches IA & Statuts WhatsApp",
      "Messagerie avec Reprise en main humaine"
    ],
    isActive: true,
    sortOrder: 1,
    setupRequired: false,
    setupOptions: [
      { type: "SELF_SERVICE", price: 0, label: "Installation Standard" }
    ]
  },
  {
    slug: "pro",
    name: "Vendeur IA Pro",
    description: "L'expérience premium complète avec numéro officiel Meta et outils marketing avancés pour booster votre croissance.",
    monthlyPrice: 20000,
    yearlyPrice: 200000, // 2 mois offerts
    currency: "XOF",
    features: [
      "Tout ce qui est inclus dans Essentiel",
      "Numéro d'Entreprise Officiel (API Meta Cloud)",
      "Multi-Canal : WhatsApp + Instagram & Messenger",
      "Broadcast IA : Campagnes marketing ciblées",
      "PaymentShield Forensic : Sécurité anti-fraude renforcée",
      "Vocaux IA : Synthèse vocale naturelle",
      "Support VIP Prioritaire 7j/7"
    ],
    isActive: true,
    sortOrder: 2,
    setupRequired: true,
    setupOptions: [
      { type: "SELF_SERVICE", price: 0, label: "Je configure moi-même" },
      { type: "EXPERT", price: 25000, label: "Pack Pro Expert (Installation Clé en Main)" }
    ]
  }
];
