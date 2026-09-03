import React from "react";
import { Link } from "react-router-dom";
import { FileCheck, ArrowLeft } from "lucide-react";
import { MetaHead } from "@/components/seo/MetaHead";
import { SITE_CONFIG } from "@/lib/seoConfig";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-vendeur-coal text-slate-900 dark:text-slate-100 flex flex-col selection:bg-vendeur-emerald selection:text-black transition-colors duration-200">
      <MetaHead
        title="Conditions Générales d'Utilisation | Vendeur IA"
        description="Conditions générales d'utilisation des services Vendeur IA : droits, responsabilités, conformité WhatsApp Business API et protection des données."
        canonicalUrl={`${SITE_CONFIG.baseUrl}/terms`}
        keywords={['conditions générales vendeur ia', 'cgu vendeuria', 'termes de service whatsapp bot']}
      />

      {/* Top Header */}
      <header className="border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-vendeur-coal/80 backdrop-blur-md sticky top-0 z-50 text-slate-900 dark:text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-vendeur-emerald transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link to="/" className="flex items-center gap-2.5">
              <Logo size={22} />
              <span className="font-bold text-slate-900 dark:text-white tracking-wide">Vendeur IA</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-10 shadow-xl dark:shadow-2xl backdrop-blur-xl text-slate-800 dark:text-slate-300">
          <div className="border-b border-slate-200 dark:border-white/10 pb-6 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-vendeur-emerald text-xs font-semibold uppercase tracking-wider mb-4">
              <FileCheck size={12} /> Conditions Générales d'Utilisation
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Conditions de Service (Terms of Service)
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Dernière mise à jour : 14 Août 2026 | Édité par Vendeur IA (domaine : vendeuria.maatfeed.com)
            </p>
          </div>

          <div className="space-y-8 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {/* Section 1 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Objet et Acceptation</h2>
              <p>
                Les présentes Conditions de Service régissent l'accès et l'utilisation de la plateforme <strong>Vendeur IA</strong> (accessible sur <code>https://vendeuria.maatfeed.com</code>), exploitée par <strong>Vendeur IA</strong>. En utilisant nos services d'automatisation des ventes par IA sur WhatsApp, Instagram et Facebook Messenger, vous acceptez sans réserve les présentes conditions.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Description des Services</h2>
              <p>
                Vendeur IA met à disposition des commerçants et entreprises des agents conversationnels basés sur l'intelligence artificielle pour gérer l'accueil client, la présentation de catalogues produits, la prise de commande et la génération d'instructions de paiement (Mobile Money, Paystack) sur les canaux de messagerie instantanée Meta.
              </p>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. Engagements et Obligations des Utilisateurs</h2>
              <p className="mb-3">En utilisant notre service, vous vous engagez à :</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400 pl-2">
                <li>Fournir des informations exactes lors de la création de votre compte marchand.</li>
                <li>Respecter les Politiques Commerciales et les Conditions d'utilisation de la plateforme Meta (WhatsApp Business API, Instagram Graph API).</li>
                <li>Ne pas utiliser nos agents IA pour la diffusion de messages indésirables (SPAM), de contenus illicites, frauduleux ou trompeurs.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Tarification et Abonnements</h2>
              <p>
                L'accès aux fonctionnalités avancées de Vendeur IA est soumis à des formules d'abonnement ou de forfaits d'utilisation spécifiés sur notre page d'offres. Les paiements sont traités de manière sécurisée par nos partenaires de paiement agréés.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Propriété Intellectuelle et Données</h2>
              <p>
                La marque <strong>Vendeur IA</strong>, les modèles conversationnels, le code source et le design de la plateforme restent la propriété exclusive de Vendeur IA. Le marchand conserve l'entière propriété de son catalogue produits et des données de sa clientèle.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Contact</h2>
              <p>
                Pour toute question relative aux présentes Conditions de Service :<br />
                - <strong>Éditeur :</strong> Vendeur IA<br />
                - <strong>E-mail :</strong> <a href="mailto:vendeuria@gmail.com" className="text-emerald-600 dark:text-vendeur-emerald font-semibold hover:underline">vendeuria@gmail.com</a><br />
                - <strong>Site Web :</strong> <a href="https://vendeuria.maatfeed.com" className="text-emerald-600 dark:text-vendeur-emerald font-semibold hover:underline">https://vendeuria.maatfeed.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10 py-6 text-center text-xs text-slate-500">
        © 2026 Franck Corp. Tous droits réservés.
      </footer>
    </div>
  );
};
