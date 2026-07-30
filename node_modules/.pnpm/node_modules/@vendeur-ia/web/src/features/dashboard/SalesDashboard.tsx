import React from "react";
import { LayoutDashboard, TrendingUp, Users, MessageCircle, DollarSign } from "lucide-react";

export function SalesDashboard() {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Money Board</h1>
          <p className="text-white/40">Suivez vos ventes en temps réel.</p>
        </div>
        <div className="bg-vendeur-emerald/10 border border-vendeur-emerald/20 px-4 py-2 rounded-xl">
          <span className="text-vendeur-emerald font-black">PRO</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={<DollarSign className="text-vendeur-emerald" />} label="Revenu Jour" value="45.000 FCFA" />
        <MetricCard icon={<MessageCircle className="text-blue-400" />} label="Conversations" value="12" />
        <MetricCard icon={<Users className="text-amber-400" />} label="Leads Chauds" value="5" />
        <MetricCard icon={<TrendingUp className="text-rose-400" />} label="Conversion" value="18%" />
      </div>

      <section className="bg-vendeur-coal border border-white/5 rounded-[2.5rem] p-8">
        <h2 className="text-xl font-black mb-6">Pipeline de Vente</h2>
        <div className="space-y-4">
          <PipelineStep label="Découverte (TikTok/Insta)" value={84} color="bg-blue-400" />
          <PipelineStep label="Discussion WhatsApp" value={42} color="bg-vendeur-emerald" />
          <PipelineStep label="Paiement Initié" value={12} color="bg-amber-400" />
          <PipelineStep label="Commandes Validées" value={8} color="bg-rose-400" />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-vendeur-coal border border-white/10 p-6 rounded-3xl space-y-4">
      <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</p>
        <p className="text-2xl font-black">{value}</p>
      </div>
    </div>
  );
}

function PipelineStep({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-48 text-sm font-bold text-white/60">{label}</div>
      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <div className="w-12 text-right font-black">{value}</div>
    </div>
  );
}
