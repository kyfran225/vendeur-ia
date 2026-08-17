export const DEFAULT_OFFERS = [
  {
    slug: "essential",
    name: "Vendeur IA Essentiel",
    description: "Votre vendeur IA pour WhatsApp. Un vendeur IA qui répond à vos clients, présente vos produits et vous aide à vendre automatiquement.",
    monthlyPrice: 5000,
    yearlyPrice: 50000, // 2 mois offerts (10x le prix mensuel au lieu de 12x)
    currency: "XOF",
    features: [
      "Réponses automatiques",
      "Catalogue produits",
      "Compréhension des questions clients",
      "Présentation des produits",
      "Assistance commerciale",
      "Disponibilité 24h/24",
      "Utilisation avec WhatsApp"
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
    description: "Pour les vendeurs qui veulent une expérience plus avancée.",
    monthlyPrice: 20000,
    yearlyPrice: 200000, // 2 mois offerts (10x le prix mensuel au lieu de 12x)
    currency: "XOF",
    features: [
      "Tout Essentiel",
      "Connexion professionnelle (Meta API)",
      "Fonctionnalités avancées",
      "Support prioritaire",
      "Accompagnement"
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
