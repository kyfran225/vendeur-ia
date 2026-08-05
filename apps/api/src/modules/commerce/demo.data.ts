export interface MockProduct {
  name: string;
  price: number;
  currency: string;
  stock: number;
  description: string;
  category: string;
}

export const CATEGORY_MOCKS: Record<string, MockProduct[]> = {
  fashion: [
    { name: "Robe d'été Fleurie", price: 15000, currency: "XOF", stock: 3, description: "Coton léger, disponible en S, M, L.", category: "fashion" },
    { name: "Sneakers Urban Flow", price: 25000, currency: "XOF", stock: 8, description: "Style moderne, grand confort. Pointures 40-44.", category: "fashion" },
    { name: "Sac à main Élégance", price: 35000, currency: "XOF", stock: 2, description: "Cuir véritable, finition dorée.", category: "fashion" }
  ],
  food: [
    { name: "Menu Burger XL Gourmet", price: 6500, currency: "XOF", stock: 20, description: "Bœuf grillé, fromage fondant, frites maison.", category: "food" },
    { name: "Plateau d'Allocos Royal", price: 4500, currency: "XOF", stock: 15, description: "Bananes plantains frites, poisson braisé et piment.", category: "food" },
    { name: "Cocktail Fraîcheur Maison", price: 2500, currency: "XOF", stock: 50, description: "Mélange de fruits exotiques de saison.", category: "food" }
  ],
  beauty: [
    { name: "Sérum Éclat Vitamine C", price: 12000, currency: "XOF", stock: 5, description: "Redonne de l'éclat à votre teint instantanément.", category: "beauty" },
    { name: "Palette Maquillage Nude", price: 18000, currency: "XOF", stock: 4, description: "12 teintes naturelles pour un look parfait.", category: "beauty" },
    { name: "Huile Capillaire Karité", price: 8000, currency: "XOF", stock: 10, description: "Nourrit intensément les cheveux secs.", category: "beauty" }
  ],
  electronics: [
    { name: "AirPods Pro (Réplique Premium)", price: 45000, currency: "XOF", stock: 6, description: "Réduction de bruit active, son spatial.", category: "electronics" },
    { name: "Smartwatch Sport V3", price: 30000, currency: "XOF", stock: 12, description: "Suivi cardiaque, GPS, étanche.", category: "electronics" },
    { name: "Powerbank 20000mAh", price: 15000, currency: "XOF", stock: 25, description: "Charge rapide pour tous vos appareils.", category: "electronics" }
  ],
  artisan: [
    { name: "Statue en Bronze Traditionnelle", price: 55000, currency: "XOF", stock: 1, description: "Pièce unique faite main par nos artisans.", category: "artisan" },
    { name: "Panier Tissé Bogolan", price: 12000, currency: "XOF", stock: 7, description: "Décoration authentique et robuste.", category: "artisan" }
  ],
  services: [
    { name: "Consultation Express (1h)", price: 25000, currency: "XOF", stock: 5, description: "Conseils stratégiques pour votre business.", category: "services" },
    { name: "Audit Marketing Digital", price: 75000, currency: "XOF", stock: 2, description: "Analyse complète de votre présence en ligne.", category: "services" }
  ],
  digital: [
    { name: "Ebook : Vendre sur WhatsApp", price: 5000, currency: "XOF", stock: 1000, description: "Toutes les astuces pour booster vos ventes.", category: "digital" },
    { name: "Formation Vidéo : IA pour PME", price: 45000, currency: "XOF", stock: 1000, description: "Apprenez à utiliser l'IA au quotidien.", category: "digital" }
  ],
  home: [
    { name: "Vase Design Céramique", price: 22000, currency: "XOF", stock: 3, description: "Apportez une touche moderne à votre salon.", category: "home" },
    { name: "Ensemble Draps Satin 3 places", price: 28000, currency: "XOF", stock: 5, description: "Confort absolu pour vos nuits.", category: "home" }
  ],
  grocery: [
    { name: "Pack Petit Déjeuner", price: 10000, currency: "XOF", stock: 15, description: "Lait, café, pain frais, beurre, confiture.", category: "grocery" },
    { name: "Huile de Palme 5L", price: 7500, currency: "XOF", stock: 30, description: "Qualité supérieure, production locale.", category: "grocery" }
  ],
  health: [
    { name: "Compléments Multivitamines", price: 9500, currency: "XOF", stock: 20, description: "Boostez votre énergie quotidiennement.", category: "health" },
    { name: "Thé Détox Naturel", price: 6000, currency: "XOF", stock: 15, description: "Mélange d'herbes pour purifier le corps.", category: "health" }
  ],
  auto: [
    { name: "Kit Entretien Vidange", price: 35000, currency: "XOF", stock: 8, description: "Huile, filtres, contrôle 10 points inclus.", category: "auto" },
    { name: "Support Téléphone Magnétique", price: 4500, currency: "XOF", stock: 50, description: "Fixation solide pour tous les smartphones.", category: "auto" }
  ],
  other: [
    { name: "Produit Mystère Premium", price: 10000, currency: "XOF", stock: 10, description: "Une surprise de haute qualité pour vous.", category: "other" }
  ]
};
