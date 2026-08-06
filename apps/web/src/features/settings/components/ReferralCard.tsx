import React from "react";
import {
  Gift,
  Share2,
  Users,
  Copy,
  CheckCircle2,
  Sparkles,
  MessageCircle
} from "lucide-react";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ReferralCard({ merchant }: { merchant: any }) {
  const referralCode = merchant?.referralCode || "BETA-REF";
  const referralLink = `${window.location.origin}/onboarding?ref=${referralCode}`;

  const stats = merchant?.referralStats || { count: 0, earnedMonths: 0 };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Lien copié ! 📋");
  };

  const shareOnWhatsApp = () => {
    const text = `Salut ! J'utilise Vendeur IA pour automatiser mes ventes sur WhatsApp. C'est magique ! ✨\n\nInscris-toi avec mon lien pour tester :\n👉 ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-vendeur-coal border border-white/10 p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden shadow-2xl space-y-8">
      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Gift className="text-amber-400" size={28} />
            Programme Ambassadeur
          </h2>
          <p className="text-white/40 text-sm font-medium">
            Invitez des amis et gagnez <span className="text-amber-400 font-black">1 mois gratuit</span> pour chaque abonnement.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Mois Gagnés</p>
            <p className="text-xl font-black text-amber-400">+{stats.earnedMonths} Mois</p>
          </div>
          <div className="h-10 w-[1px] bg-white/10 mx-2" />
          <div className="text-right">
            <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Filleuls</p>
            <p className="text-xl font-black text-white">{stats.count}</p>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="relative z-10 grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-4">
            <label className="text-[10px] font-black uppercase text-white/20 tracking-widest ml-1">Votre Lien de Parrainage</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/60 font-mono truncate">
                {referralLink}
              </div>
              <button
                onClick={copyToClipboard}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>

          <button
            onClick={shareOnWhatsApp}
            className="w-full h-16 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-vendeur-emerald/20"
          >
            <MessageCircle size={20} />
            Partager sur WhatsApp
          </button>
        </div>

        <div className="space-y-4 flex flex-col justify-center">
            <div className="space-y-4">
                <StepItem icon={<Share2 size={16}/>} text="Partagez votre lien à des commerçants." />
                <StepItem icon={<Users size={16}/>} text="Ils s'inscrivent et boostent leur business." />
                <StepItem icon={<Sparkles size={16}/>} text="Dès leur premier paiement, vous gagnez 1 mois." />
            </div>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 bg-amber-400/5 blur-[100px] rounded-full" />
    </div>
  );
}

function StepItem({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl group hover:border-amber-400/20 transition-all">
            <div className="h-8 w-8 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <p className="text-xs font-bold text-white/60 uppercase tracking-tight">{text}</p>
        </div>
    );
}
