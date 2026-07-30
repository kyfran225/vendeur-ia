import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { BusinessForm } from "./components/BusinessForm";
import { WhatsAppSimulator } from "./components/WhatsAppSimulator";

export function LandingPage() {
  const [step, setStep] = useState<"hero" | "form" | "simulator">("hero");

  return (
    <div className="min-h-screen bg-vendeur-bg flex flex-col items-center justify-center p-4 md:p-12 text-center">
      {step === "hero" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-vendeur-emerald/20 bg-vendeur-emerald/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-vendeur-emerald">
            <Sparkles size={14} />
            Vendeur IA Standalone
          </div>
          <h1 className="text-6xl md:text-8xl font-black leading-[1.05] text-white mb-6 tracking-tighter">
            Votre WhatsApp <br/>
            <span className="text-vendeur-emerald text-transparent bg-clip-text bg-gradient-to-r from-vendeur-emerald to-emerald-500">vend tout seul.</span>
          </h1>
          <p className="text-xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            L'IA gère les clients, les livraisons et les paiements pendant que vous travaillez. Reconstruction propre pour une performance maximale.
          </p>

          <button
            onClick={() => setStep("form")}
            className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-vendeur-emerald px-10 text-lg font-black uppercase tracking-widest text-vendeur-coal shadow-xl shadow-vendeur-emerald/20 transition-all hover:scale-[1.02] active:scale-95 mx-auto"
          >
            Lancer mon Vendeur IA
          </button>
        </div>
      )}

      {step === "form" && (
        <div className="w-full max-w-xl animate-in fade-in zoom-in-95 duration-500">
          <BusinessForm onNext={() => setStep("simulator")} />
        </div>
      )}

      {step === "simulator" && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <WhatsAppSimulator onBack={() => setStep("form")} onComplete={() => alert("Direction Paystack Sub!")} />
        </div>
      )}
    </div>
  );
}
