import React from "react";
import { Link } from "react-router-dom";
import { Trash2, ShieldCheck, ArrowLeft, Mail, AlertTriangle } from "lucide-react";

export const DataDeletionPage: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

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
            <ShieldCheck className="text-vendeur-emerald" size={20} />
            <span className="font-bold text-white tracking-wide">Vendeur IA</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/10 pb-6 mb-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Trash2 size={12} /> Exigence Meta User Data Deletion
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Suppression des Données Utilisateur (Meta & Vendeur IA)
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Conformément à la politique de confidentialité de Meta pour WhatsApp, Messenger et Instagram.
            </p>
          </div>

          <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
            <p>
              Si vous souhaitez supprimer les données associées à votre compte utilisateur Meta ou à votre compte marchand <strong>Vendeur IA</strong> (sur le domaine <code>vendeuria.maatfeed.com</code>), vous disposez de deux méthodes simples :
            </p>

            {/* Option 1 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-vendeur-emerald text-black text-xs font-extrabold flex items-center justify-center">1</span>
                Demande de suppression directe en ligne
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Saisissez l'adresse e-mail associée à votre compte ou votre numéro WhatsApp configuré. Notre équipe supprimera l'intégralité de vos logs et historiques en base de données sous 48h.
              </p>

              {submitted ? (
                <div className="bg-vendeur-emerald/10 border border-vendeur-emerald/30 text-vendeur-emerald p-4 rounded-lg text-xs font-medium flex items-center gap-3">
                  <ShieldCheck size={20} />
                  <span>Votre demande de suppression a bien été enregistrée. Un accusé de réception vous parviendra d'ici quelques instants.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Votre email ou numéro WhatsApp..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-slate-950 border border-white/20 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-vendeur-emerald transition-colors"
                  />
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Confirmer la suppression
                  </button>
                </form>
              )}
            </div>

            {/* Option 2 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-vendeur-emerald text-black text-xs font-extrabold flex items-center justify-center">2</span>
                Demande par e-mail
              </h3>
              <p className="text-xs text-slate-400">
                Vous pouvez également envoyer un message directement à notre responsable protection des données :
              </p>
              <div className="mt-3 text-xs bg-slate-950 p-3 rounded-lg border border-white/10 flex items-center gap-3 text-slate-300">
                <Mail className="text-vendeur-emerald" size={18} />
                <div>
                  <strong>Email :</strong> <a href="mailto:vendeuria@gmail.com" className="text-vendeur-emerald hover:underline">vendeuria@gmail.com</a><br />
                  <strong>Objet :</strong> Suppression des données Meta - vendeuria.maatfeed.com
                </div>
              </div>
            </div>

            {/* Warning info */}
            <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl text-xs">
              <AlertTriangle size={24} className="shrink-0" />
              <div>
                <strong>Attention :</strong> La suppression entraîne l'effacement irréversible de vos catalogues produits synchros, des jetons API Meta et de l'historique des échanges avec vos clients.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © 2026 Franck Corp. Tous droits réservés.
      </footer>
    </div>
  );
};
