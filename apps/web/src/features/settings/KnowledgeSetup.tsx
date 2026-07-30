import React from "react";
import { Brain, MapPin, Truck, HelpCircle, Save } from "lucide-react";

export function KnowledgeSetup() {
  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Cerveau IA</h1>
        <p className="text-white/40">Enseignez les règles de votre boutique à votre IA.</p>
      </header>

      <div className="grid gap-6">
        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400"><Truck size={20} /></div>
            <h2 className="text-xl font-black">Livraison & Zones</h2>
          </div>
          <textarea
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-vendeur-emerald transition-all min-h-[120px]"
            placeholder="Ex: Nous livrons à Cocody, Plateau, Marcory pour 1.500 FCFA. Yopougon: 2.500 FCFA."
          />
        </section>

        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400"><HelpCircle size={20} /></div>
            <h2 className="text-xl font-black">FAQ Boutique</h2>
          </div>
          <div className="space-y-4">
            <FaqItem question="Quelle est votre politique de retour ?" answer="Les échanges sont possibles sous 48h si l'article est intact." />
            <FaqItem question="Quels sont vos horaires ?" answer="Nous sommes ouverts du lundi au samedi de 9h à 19h." />
            <button className="text-vendeur-emerald text-xs font-black uppercase tracking-widest">+ Ajouter une question</button>
          </div>
        </section>

        <button className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-vendeur-coal font-black uppercase tracking-widest text-sm shadow-xl">
          <Save size={20} /> Enregistrer la mémoire
        </button>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: any) {
  return (
    <div className="space-y-2">
      <input className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white/60" value={question} readOnly />
      <textarea className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/40" value={answer} readOnly />
    </div>
  );
}
