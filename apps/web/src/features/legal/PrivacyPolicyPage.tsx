import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, FileText, CheckCircle2, ArrowLeft } from "lucide-react";

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-vendeur-coal text-slate-100 flex flex-col selection:bg-vendeur-emerald selection:text-black">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-vendeur-coal/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-400 hover:text-vendeur-emerald transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="text-vendeur-emerald" size={20} />
            <span className="font-bold text-white tracking-wide">Vendeur IA</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-vendeur-emerald/10 border border-vendeur-emerald/20 text-vendeur-emerald text-xs font-semibold uppercase tracking-wider mb-4">
              <Lock size={12} /> Conformité Meta & RGPD
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Politique de Confidentialité
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Dernière mise à jour : 14 Août 2026 | Application : Vendeur IA (domaine : vendeuria.maatfeed.com)
            </p>
          </div>

          <div className="space-y-8 text-slate-300 text-sm sm:text-base leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-vendeur-emerald" size={20} />
                1. Présentation et Éditeur du Service
              </h2>
              <p>
                Le service <strong>Vendeur IA</strong> (accessible à l'adresse{" "}
                <code className="text-vendeur-emerald bg-white/5 px-2 py-0.5 rounded">https://vendeuria.maatfeed.com</code>)
                est édité par <strong>Vendeur IA, Inc.</strong> La présente Politique de Confidentialité a pour objet d'informer les utilisateurs, marchands et clients finaux sur la manière dont leurs données personnelles sont collectées, traitées et protégées dans le cadre de l'utilisation de notre plateforme d'automatisation des ventes par Intelligence Artificielle sur WhatsApp, Instagram et Facebook Messenger.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-vendeur-emerald" size={20} />
                2. Données Collectées
              </h2>
              <p className="mb-3">
                Nous collectons uniquement les données strictement nécessaires au bon fonctionnement de nos agents commerciaux virtuels et au suivi des commandes :
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
                <li><strong className="text-slate-200">Informations de compte marchand :</strong> Nom, prénom, adresse e-mail, nom de la boutique, numéro de téléphone.</li>
                <li><strong className="text-slate-200">Données issues des plateformes Meta (WhatsApp Cloud API, Instagram Graph API, Messenger API) :</strong> Identifiants d'utilisateur final (numéro WhatsApp, identifiant Instagram/Messenger), contenus des conversations échangées avec l'agent IA, préférences d'achat.</li>
                <li><strong className="text-slate-200">Données de transaction et commandes :</strong> Produits consultés, paniers d'achat, historiques de paiement (ex: Mobile Money, Paystack), adresses de livraison.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-vendeur-emerald" size={20} />
                3. Utilisation des Données et Intelligence Artificielle
              </h2>
              <p className="mb-3">Les données collectées sont utilisées exclusivement pour :</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 pl-2">
                <li>Permettre à nos modèles d'IA de répondre de manière fluide et pertinente aux questions de vos clients finaux sur WhatsApp, Messenger et Instagram.</li>
                <li>Générer les liens de paiement et finaliser les commandes produits.</li>
                <li>Fournir aux marchands des tableaux de bord analytiques et le suivi des ventes en temps réel.</li>
              </ul>
              <p className="mt-3 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300">
                🔒 <strong>Garantie sur vos données :</strong> Vos données de messagerie Meta ne sont jamais revendues à des tiers ni utilisées à des fins publicitaires en dehors de votre activité.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-vendeur-emerald" size={20} />
                4. Suppression des Données (Data Deletion - Conforme Meta)
              </h2>
              <p>
                Conformément aux exigences de Meta (Facebook, Instagram, WhatsApp) et aux réglementations sur la protection des données personnelles, tout utilisateur ou marchand peut demander la suppression intégrale de ses données personnelles à tout moment :
              </p>
              <div className="mt-3 bg-slate-800/80 border border-vendeur-emerald/30 rounded-xl p-4">
                <p className="font-semibold text-vendeur-emerald mb-1">Procédure de suppression :</p>
                <p className="text-xs text-slate-300">
                  - Via l'interface de l'application : visitez la page dédiée de suppression des données à l'adresse <code className="text-white">https://vendeuria.maatfeed.com/data-deletion</code>.<br/>
                  - Par e-mail : envoyez une demande à <a href="mailto:vendeuria@gmail.com" className="text-vendeur-emerald underline">vendeuria@gmail.com</a> avec l'objet "Demande de suppression de données Meta". Nous traiterons votre demande sous 48 heures ouvrées.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-vendeur-emerald" size={20} />
                5. Sécurité des Données
              </h2>
              <p>
                Toutes les données en transit sont chiffrées à l'aide de protocoles SSL/TLS de classe industrielle (HTTPS). Les jetons d'accès Meta (Tokens API) et données de paiement sont stockés dans un environnement sécurisé avec des accès restreints et contrôlés.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle2 className="text-vendeur-emerald" size={20} />
                6. Contact
              </h2>
              <p>
                Pour toute question concernant cette politique de confidentialité ou l'exercice de vos droits, vous pouvez nous contacter :
              </p>
              <p className="mt-2 text-slate-300">
                - <strong>Équipe :</strong> Vendeur IA, Inc.<br />
                - <strong>Site Web :</strong> <a href="https://vendeuria.maatfeed.com" className="text-vendeur-emerald hover:underline">https://vendeuria.maatfeed.com</a><br />
                - <strong>E-mail :</strong> <a href="mailto:vendeuria@gmail.com" className="text-vendeur-emerald hover:underline">vendeuria@gmail.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © 2026 Vendeur IA, Inc. Tous droits réservés.
      </footer>
    </div>
  );
};
