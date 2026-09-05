import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  HelpCircle,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Package,
  Truck,
  Settings,
  Zap,
  ChevronDown,
  ExternalLink,
  Bot,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { useCopilotStore } from "@/stores/copilotStore";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  linkTo?: {
    url: string;
    label: string;
  };
}

const FAQ_DATA: FaqItem[] = [
  // 🚀 Démarrage & Onboarding
  {
    id: "onboarding-start",
    category: "onboarding",
    question: "Comment démarrer avec Vendeur IA en moins de 2 minutes ?",
    answer: "Pour démarrer : 1) Créez votre compte marchand. 2) Ajoutez vos premiers articles dans le Catalogue (ou scannez un rayon entier avec l'IA). 3) Définissez vos numéros de réception Mobile Money (Wave, Orange, MTN). 4) Connectez votre WhatsApp en scannant le QR code. Votre Vendeur IA commencera instantanément à conseiller vos clients et à enregistrer les commandes 24h/24.",
    keywords: ["démarrage", "débuter", "commencer", "premiers pas", "onboarding", "rapide", "tuto"],
    linkTo: { url: "/products", label: "Ajouter mes premiers articles" }
  },
  {
    id: "simulator-test",
    category: "onboarding",
    question: "Comment tester mon Vendeur IA avant de le laisser répondre aux vrais clients ?",
    answer: "Rendez-vous sur votre Tableau de Bord ou dans la section Réglages et cliquez sur 'Tester mon Vendeur IA'. Vous accéderez à un simulateur de discussion interactif. Vous pouvez jouer le rôle d'un client, poser des questions sur vos produits, négocier les prix et vérifier les réponses de votre agent sans aucun impact sur votre compte WhatsApp réel.",
    keywords: ["tester", "simulateur", "démo", "simulation", "entraînement", "vérifier", "test"],
    linkTo: { url: "/dashboard", label: "Ouvrir le simulateur" }
  },

  // 📱 WhatsApp & Canaux
  {
    id: "whatsapp-connect-qr",
    category: "whatsapp",
    question: "Comment connecter mon numéro WhatsApp personnel ou business ?",
    answer: "Allez dans Réglages > Onglet Connexions. Cliquez sur 'Générer un QR Code'. Ouvrez WhatsApp sur votre téléphone, allez dans Menu (3 points ou Réglages) > 'Appareils connectés' > 'Connecter un appareil', et scannez le code à l'écran. La synchronisation prend entre 5 et 10 secondes.",
    keywords: ["whatsapp", "qr code", "connexion", "connecter", "appareils connectés", "lier"],
    linkTo: { url: "/settings?tab=connexions", label: "Aller aux connexions WhatsApp" }
  },
  {
    id: "whatsapp-disconnect-why",
    category: "whatsapp",
    question: "Pourquoi ma session WhatsApp s'est-elle déconnectée et comment la rétablir ?",
    answer: "WhatsApp peut fermer une session si votre téléphone principal est resté sans connexion Internet pendant plus de 14 jours, ou si vous avez déconnecté l'appareil depuis l'application WhatsApp de votre téléphone. Pour reconnecter, rendez-vous dans Réglages > Connexions et cliquez simplement sur 'Générer un nouveau QR Code'.",
    keywords: ["déconnexion", "déconnecté", "coupure", "session", "reconnexion", "erreur whatsapp"],
    linkTo: { url: "/settings?tab=connexions", label: "Reconnecter WhatsApp" }
  },
  {
    id: "meta-cloud-official",
    category: "whatsapp",
    question: "Quelle est la différence entre la connexion QR Code et le Numéro Officiel Meta (API Cloud) ?",
    answer: "La connexion QR Code utilise votre numéro existant via la technologie WhatsApp Web (inclus dans l'offre Essentiel). Le Numéro Officiel Meta (inclus dans l'offre Pro) utilise l'API Cloud officielle de Meta : il garantit zéro déconnexion, un débit ultra-rapide sans besoin de garder un téléphone allumé, et permet d'obtenir le badge de vérification verte pour votre entreprise.",
    keywords: ["meta", "cloud api", "officiel", "badge vert", "qr code", "pro", "numéro d'entreprise"],
    linkTo: { url: "/offers", label: "Découvrir la formule Pro" }
  },

  // 🛍️ Catalogue & Stocks
  {
    id: "catalog-batch-scan",
    category: "products",
    question: "Comment fonctionne le scanner de rayon IA (Batch Vision) ?",
    answer: "Dans le menu Catalogue, cliquez sur 'Scanner un rayon / Plusieurs produits'. Prenez une photo nette de votre étagère, portant ou comptoir. L'intelligence artificielle Gemini analyse l'image, extrait chaque article distinct, génère un titre accrocheur, estime la catégorie et pré-remplit les fiches produits. Vous n'avez plus qu'à valider les prix.",
    keywords: ["scanner", "photo", "rayon", "batch", "vision", "ia", "ajouter plusieurs produits", "catalogue"],
    linkTo: { url: "/products", label: "Essayer le scanner IA" }
  },
  {
    id: "catalog-stock-management",
    category: "products",
    question: "Que se passe-t-il quand un produit tombe en rupture de stock ?",
    answer: "Dès qu'une commande est confirmée et validée, le stock du produit est automatiquement décrémenté. Lorsque le stock atteint 0, Vendeur IA informe poliment les clients que l'article est momentanément indisponible et leur propose immédiatement des alternatives similaires disponibles dans votre boutique.",
    keywords: ["stock", "rupture", "épuisé", "inventaire", "quantité", "articles"],
    linkTo: { url: "/products", label: "Gérer mes stocks" }
  },
  {
    id: "marketing-flyers",
    category: "products",
    question: "Comment créer des affiches publicitaires et flyers pour mes statuts WhatsApp ?",
    answer: "Dans le menu Marketing ou directement sur chaque fiche produit, cliquez sur 'Créer une Affiche Promo IA'. Choisissez le format (Story 9:16 pour les Statuts WhatsApp & Instagram, ou Carré 1:1 pour les posts). L'IA génère en quelques secondes un visuel commercial percutant avec le prix, vos coordonnées et un slogan vendeur.",
    keywords: ["affiche", "flyer", "statut whatsapp", "story", "visuel", "studio créatif", "marketing"],
    linkTo: { url: "/marketing", label: "Accéder au Studio Marketing" }
  },

  // 💳 Paiements & PaymentShield
  {
    id: "payment-shield-how",
    category: "payments",
    question: "Comment PaymentShield Forensic™ détecte-t-il les faux reçus de paiement ?",
    answer: "PaymentShield combine une triple vérification : 1) Calcul d'empreinte SHA-256 pour bloquer instantanément les captures d'écran réutilisées (replay attack). 2) Analyse forensique visuelle avec Gemini Vision pour repérer les retouches d'images, polices décalées ou montages Photoshop. 3) Contrôle syntaxique rigoureux des identifiants de transactions pour chaque opérateur (Wave, Orange Money, MTN Moov). Si le reçu est authentique, la commande est validée sans action manuelle requise.",
    keywords: ["paymentshield", "faux reçu", "fraude", "arnaque", "sécurité", "wave", "orange money", "mtn", "forensic"],
    linkTo: { url: "/orders", label: "Voir les commandes vérifiées" }
  },
  {
    id: "payment-channels-setup",
    category: "payments",
    question: "Comment configurer mes comptes Wave, Orange Money et MTN ?",
    answer: "Allez dans Réglages > Onglet Boutique. Dans la section 'Moyens de Paiement', ajoutez vos numéros de réception pour chaque réseau disponible (Wave, Orange Money CI/SN, MTN MoMo, Moov Money). Vous pouvez également activer l'option 'Paiement à la livraison' si vous proposez l'encaissement en espèces par coursier.",
    keywords: ["wave", "orange money", "mtn", "moov", "paiement", "numéro", "encaissement", "espèces"],
    linkTo: { url: "/settings?tab=boutique", label: "Configurer mes numéros de paiement" }
  },

  // 🚚 Livraisons & Commandes
  {
    id: "delivery-zones-pricing",
    category: "delivery",
    question: "Comment paramétrer les frais de livraison par commune ou quartier ?",
    answer: "Rendez-vous dans Réglages > Onglet Boutique > Grille de Livraison. Vous pouvez définir le coût de livraison par zone (ex: Cocody : 1 500 CFA, Yopougon : 2 000 CFA, Expédition Intérieur : 3 500 CFA). Lorsque le client renseigne son adresse sur WhatsApp, Vendeur IA calcule et ajoute automatiquement les frais au montant total.",
    keywords: ["livraison", "frais", "tarif", "commune", "quartier", "cocody", "yopougon", "transport"],
    linkTo: { url: "/settings?tab=boutique", label: "Paramétrer les zones de livraison" }
  },
  {
    id: "order-dispatch-courier",
    category: "delivery",
    question: "Comment transmettre une course à mon livreur en un clic ?",
    answer: "Sur la page Commandes, ouvrez la commande souhaitée et cliquez sur 'Fiche Livreur WhatsApp'. Un message pré-rempli contenant le nom du client, son numéro cliquable, l'adresse exacte, le montant à encaisser et la liste des articles est généré. Vous pouvez l'envoyer directement à votre livreur en un seul tap.",
    keywords: ["livreur", "coursier", "expédition", "bon de commande", "course", "livraison"],
    linkTo: { url: "/orders", label: "Consulter les commandes" }
  },

  // 💎 Abonnements & Facturation
  {
    id: "pricing-plans-difference",
    category: "billing",
    question: "Quelles sont les formules d'abonnement disponibles et combien ça coûte ?",
    answer: "Vendeur IA propose 2 formules simples : 1) Formule Essentiel à 5 000 FCFA / mois (Agent IA 24/7 sur votre WhatsApp existant, catalogue illimité, PaymentShield standard, studio d'affiches). 2) Formule Pro à 20 000 FCFA / mois (Numéro officiel Meta Cloud vérifié, multi-canal Instagram/Messenger, broadcast marketing IA, synthèses vocales, support prioritaire 7j/7). L'option annuelle offre 2 mois gratuits.",
    keywords: ["prix", "tarif", "abonnement", "combien", "formule", "essentiel", "pro", "coût", "facturation"],
    linkTo: { url: "/offers", label: "Voir la grille des tarifs" }
  },
  {
    id: "pack-pro-expert",
    category: "billing",
    question: "Qu'est-ce que le Pack Pro Expert (Installation Clé en Main) ?",
    answer: "Le Pack Pro Expert (25 000 FCFA - paiement unique) est un accompagnement personnalisé où notre équipe technique configure l'intégralité de votre système : numérisation de votre catalogue complet avec photos optimisées, configuration du compte Meta Cloud officiel, paramétrage de vos devises et zones de livraison, et tests de bout en bout.",
    keywords: ["pack pro", "expert", "clé en main", "installation", "accompagnement", "service"],
    linkTo: { url: "/offers", label: "Demander le Pack Expert" }
  },

  // 🛠️ Dépannage & Support
  {
    id: "takeover-manual",
    category: "support",
    question: "Comment reprendre la main manuellement si je veux parler moi-même à un client ?",
    answer: "Dans le menu Inbox (Boîte de vente), ouvrez la conversation concernée et cliquez sur le bouton 'Prendre la main'. L'agent IA se met immédiatement en pause sur cette discussion. Vous pouvez écrire directement au client. Dès que vous avez terminé, cliquez sur 'Réactiver l'IA' pour qu'elle reprenne le relais.",
    keywords: ["reprendre la main", "manuel", "interrompre", "pause", "human takeover", "parler au client"],
    linkTo: { url: "/inbox", label: "Ouvrir l'Inbox" }
  },
  {
    id: "contact-human-support",
    category: "support",
    question: "Comment contacter l'assistance technique humaine en cas de problème ?",
    answer: "Notre équipe de support est disponible 7j/7. Vous pouvez poser votre question directement au Copilote IA dans l'application (qui remontera le ticket si nécessaire), ou nous contacter directement sur notre ligne WhatsApp officielle d'assistance.",
    keywords: ["support", "aide", "contact", "assistance", "service client", "numéro", "fondateur", "problème"],
    linkTo: { url: "/settings?tab=compte", label: "Consulter mon compte" }
  }
];

const CATEGORIES = [
  { id: "all", label: "Toutes les rubriques", icon: BookOpen, count: FAQ_DATA.length },
  { id: "onboarding", label: "Démarrage & Premiers pas", icon: Sparkles, count: FAQ_DATA.filter(f => f.category === "onboarding").length },
  { id: "whatsapp", label: "Connexion WhatsApp & Meta", icon: MessageCircle, count: FAQ_DATA.filter(f => f.category === "whatsapp").length },
  { id: "products", label: "Catalogue, Photos & Stocks", icon: Package, count: FAQ_DATA.filter(f => f.category === "products").length },
  { id: "payments", label: "Paiements & PaymentShield", icon: CreditCard, count: FAQ_DATA.filter(f => f.category === "payments").length },
  { id: "delivery", label: "Livraison & Commandes", icon: Truck, count: FAQ_DATA.filter(f => f.category === "delivery").length },
  { id: "billing", label: "Forfaits & Facturation", icon: Zap, count: FAQ_DATA.filter(f => f.category === "billing").length },
  { id: "support", label: "Dépannage & Support 7j/7", icon: HelpCircle, count: FAQ_DATA.filter(f => f.category === "support").length }
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    "onboarding-start": true,
    "whatsapp-connect-qr": true
  });

  const { openCopilot } = useCopilotStore();

  const toggleFaq = (id: string) => {
    setOpenFaqIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQ_DATA.filter(item => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

      if (!query) return matchesCategory;

      const matchesText =
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query) ||
        item.keywords.some(k => k.toLowerCase().includes(query));

      return matchesCategory && matchesText;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-vendeur-bg text-white pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-vendeur-coal via-vendeur-coal/80 to-transparent border-b border-white/5 pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-xs font-black uppercase tracking-widest">
            <HelpCircle size={14} />
            Centre d'Aide & Base de Connaissances
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Comment pouvons-nous <span className="text-vendeur-emerald">vous aider ?</span>
          </h1>
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
            Retrouvez toutes les réponses, guides pas-à-pas et solutions pour vendre efficacement sur WhatsApp avec votre agent IA.
          </p>

          {/* Instant Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-white/40 pointer-events-none" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une solution (ex: QR code, Wave, faux reçus, stock, tarif...)"
                className="w-full bg-white/5 border border-white/10 focus:border-vendeur-emerald focus:bg-white/10 rounded-2xl pl-12 pr-10 py-4 text-sm sm:text-base text-white placeholder-white/30 outline-none transition-all shadow-2xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 text-xs font-bold text-white/40 hover:text-white bg-white/10 px-2 py-1 rounded-lg"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        {/* Quick Action Assistance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => openCopilot("Comment configurer mon Vendeur IA ?")}
            className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-vendeur-emerald/15 to-transparent border border-vendeur-emerald/30 hover:border-vendeur-emerald text-left transition-all group shadow-sm hover:shadow-md dark:shadow-xl cursor-pointer"
          >
            <div className="h-12 w-12 rounded-xl bg-vendeur-emerald/20 flex items-center justify-center text-vendeur-emerald shrink-0 group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-vendeur-emerald transition-colors">
                Copilote IA Instantané
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Posez n'importe quelle question technique ou business à votre assistant intégré.
              </p>
            </div>
          </button>

          <Link
            to="/settings?tab=connexions"
            className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-left transition-all group shadow-sm hover:shadow-md dark:shadow-xl"
          >
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white/80 shrink-0 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-white transition-colors">
                Connexion WhatsApp
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Scannez le QR Code ou vérifiez l'état de synchronisation de votre numéro.
              </p>
            </div>
          </Link>

          <Link
            to="/offers"
            className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-left transition-all group shadow-sm hover:shadow-md dark:shadow-xl"
          >
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-white transition-colors">
                Formules & Tarifs
              </h3>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                Découvrez les offres Essentiel, Pro et l'installation clé en main.
              </p>
            </div>
          </Link>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? "bg-vendeur-emerald text-vendeur-coal shadow-md shadow-vendeur-emerald/20 scale-105"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <Icon size={16} />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isSelected ? "bg-vendeur-coal/20 text-vendeur-coal" : "bg-white/10 text-white/40"
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white uppercase tracking-wide">
              Questions Fréquentes ({filteredFaqs.length})
            </h2>
            {searchQuery && (
              <span className="text-xs text-white/40">
                Résultats pour "{searchQuery}"
              </span>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white/5 border border-white/10 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-white/40">
                <HelpCircle size={28} />
              </div>
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Aucune réponse trouvée pour cette recherche
              </h3>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Essayez d'autres mots-clés ou posez directement votre question à notre Copilote IA en direct.
              </p>
              <button
                onClick={() => openCopilot(`J'ai une question sur : ${searchQuery}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-vendeur-emerald text-vendeur-coal text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform"
              >
                <Bot size={16} />
                Demander au Copilote IA
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isOpen = !!openFaqIds[faq.id];

                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? "bg-white/[0.07] border-vendeur-emerald/40 shadow-xl"
                        : "bg-white/5 border-white/5 hover:border-white/15"
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left gap-4"
                    >
                      <span className="text-sm sm:text-base font-bold text-white leading-snug">
                        {faq.question}
                      </span>
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center bg-white/5 text-white/60 shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-vendeur-emerald bg-vendeur-emerald/10" : ""
                        }`}
                      >
                        <ChevronDown size={18} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 space-y-4 text-xs sm:text-sm text-white/70 leading-relaxed border-t border-white/5">
                        <p>{faq.answer}</p>

                        {faq.linkTo && (
                          <div className="pt-2">
                            <Link
                              to={faq.linkTo.url}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-vendeur-emerald/15 hover:bg-vendeur-emerald/25 border border-vendeur-emerald/30 text-vendeur-emerald text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <span>{faq.linkTo.label}</span>
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact & Escalation Box */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-vendeur-coal via-vendeur-coal/90 to-vendeur-emerald/10 border border-vendeur-emerald/20 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-vendeur-emerald text-xs font-black uppercase tracking-wider">
              <ShieldCheck size={16} />
              Assistance Dédiée aux Marchands
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Vous ne trouvez pas la solution ?
            </h3>
            <p className="text-xs text-white/60 max-w-lg leading-relaxed">
              Nos spécialistes e-commerce et ingénieurs sont disponibles pour vous guider par message et optimiser vos ventes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => openCopilot("J'ai besoin d'une assistance technique.")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-vendeur-emerald text-vendeur-coal font-black text-xs uppercase tracking-wider hover:scale-105 transition-all shadow-lg"
            >
              <Bot size={16} />
              Parler au Copilote IA
            </button>
            <a
              href="https://wa.me/2250505111157?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20mon%20compte%20Vendeur%20IA."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <PhoneCall size={16} />
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
