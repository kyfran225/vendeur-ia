import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Brain,
  Bot,
  Zap,
  Mic,
  MessageSquare,
  Sparkles,
  Banknote,
  Plus,
  Trash2,
  Save,
  Loader2,
  Globe,
  Instagram,
  Bell,
  HelpCircle,
  Truck,
  User as UserIcon,
  Mail,
  Camera,
  LogOut
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { WhatsAppConnectionFlow } from "./components/WhatsAppConnectionFlow";
import { subscribeToPush } from "@/lib/pushUtils";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TikTokIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

type SettingsTab = "boutique" | "savoir" | "personnalite" | "connexions" | "compte";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("boutique");
  const { accessToken, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: dashboard, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/dashboard");
      return res.data;
    },
    enabled: !!accessToken
  });

  const { data: knowledge, isLoading: isKnowledgeLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/knowledge");
      return res.data;
    },
    enabled: !!accessToken
  });

  const qrCode = queryClient.getQueryData<string>(["whatsapp:qr"]);

  if (isDashboardLoading || isKnowledgeLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Sparkles className="animate-spin text-vendeur-emerald" size={48} />
      </div>
    );
  }

  const merchant = dashboard?.merchant;
  const systemSettings = dashboard?.systemSettings;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white flex items-center gap-4">
            <Settings className="text-vendeur-emerald" size={40} />
            Centre de Contrôle
          </h1>
          <p className="text-white/40 md:text-lg">Pilotez votre machine de vente et configurez votre IA.</p>
        </div>

        <button
          onClick={logout}
          className="h-12 px-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </header>

      {/* Navigation Onglets */}
      <div className="flex gap-2 p-1.5 bg-vendeur-coal/80 backdrop-blur-md rounded-[2rem] border border-white/10 w-fit shadow-2xl overflow-x-auto no-scrollbar max-w-full">
        <TabButton
          active={activeTab === "boutique"}
          onClick={() => setActiveTab("boutique")}
          icon={<Store size={18} />}
          label="Boutique"
        />
        <TabButton
          active={activeTab === "savoir"}
          onClick={() => setActiveTab("savoir")}
          icon={<Brain size={18} />}
          label="Savoir IA"
        />
        <TabButton
          active={activeTab === "personnalite"}
          onClick={() => setActiveTab("personnalite")}
          icon={<Bot size={18} />}
          label="Personnalité"
        />
        <TabButton
          active={activeTab === "connexions"}
          onClick={() => setActiveTab("connexions")}
          icon={<Globe size={18} />}
          label="Connexions"
        />
        <TabButton
          active={activeTab === "compte"}
          onClick={() => setActiveTab("compte")}
          icon={<UserIcon size={18} />}
          label="Mon Profil"
        />
      </div>

      <div className="mt-8">
        {activeTab === "boutique" && <BoutiqueTab merchant={merchant} initialKnowledge={knowledge} accessToken={accessToken || ""} />}
        {activeTab === "savoir" && <SavoirTab initialKnowledge={knowledge} />}
        {activeTab === "personnalite" && <PersonnaliteTab merchant={merchant} />}
        {activeTab === "connexions" && (
          <ConnexionsTab
            merchant={merchant}
            systemSettings={systemSettings}
            qrCode={qrCode || null}
          />
        )}
        {activeTab === "compte" && <CompteTab />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0",
        active ? "bg-vendeur-emerald text-vendeur-coal shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- ONGLET 1 : BOUTIQUE (PROFIL, LIVRAISON, PAIEMENTS) ---
function BoutiqueTab({ merchant, initialKnowledge, accessToken }: { merchant: any; initialKnowledge: any; accessToken: string }) {
  const queryClient = useQueryClient();
  const [localMerchant, setLocalMerchant] = useState(merchant);
  const [payments, setPayments] = useState(initialKnowledge?.businessRules?.paymentMethods || []);
  const [deliveryFees, setDeliveryFees] = useState(initialKnowledge?.businessRules?.deliveryFees || []);

  useEffect(() => {
    if (merchant) setLocalMerchant(merchant);
    if (initialKnowledge?.businessRules?.paymentMethods) setPayments(initialKnowledge.businessRules.paymentMethods);
    if (initialKnowledge?.businessRules?.deliveryFees) setDeliveryFees(initialKnowledge.businessRules.deliveryFees);
  }, [merchant, initialKnowledge]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/api/commerce/merchant", localMerchant);
      await apiClient.patch("/api/commerce/knowledge", {
        businessRules: {
          ...initialKnowledge?.businessRules,
          paymentMethods: payments,
          deliveryFees: deliveryFees
        }
      });
    },
    onSuccess: () => {
      toast.success("Réglages Boutique enregistrés ! ✨");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    }
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <section className="bg-vendeur-coal/50 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Store size={24} className="text-vendeur-emerald" />
              Profil de la Boutique
            </h2>
            <p className="text-xs text-white/40 font-medium">L'IA utilise ces infos pour présenter votre business.</p>
          </div>
          <button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-vendeur-emerald px-6 text-[10px] font-black uppercase text-vendeur-coal shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Tout Enregistrer
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <InputGroup label="Nom du commerce" value={localMerchant?.businessName} onChange={v => setLocalMerchant({...localMerchant, businessName: v})} placeholder="Ex: Ma Boutique Chic" />
          <InputGroup label="WhatsApp Business" value={localMerchant?.whatsappNumber} onChange={v => setLocalMerchant({...localMerchant, whatsappNumber: v})} placeholder="Ex: 07 00 00 00 00" />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Catégorie</label>
            <select
              className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all appearance-none cursor-pointer"
              value={localMerchant?.category || ""}
              onChange={e => setLocalMerchant({...localMerchant, category: e.target.value})}
            >
              <option value="fashion">👗 Mode & Beauté</option>
              <option value="food">🍔 Restauration & Food</option>
              <option value="beauty">💄 Soins & Cosmétiques</option>
              <option value="electronics">📱 Électronique & High-Tech</option>
              <option value="artisan">🛠️ Artisanat & Fait Main</option>
              <option value="services">💼 Prestations de Services</option>
              <option value="digital">📚 Produits Digitaux & Formations</option>
              <option value="home">🏠 Maison & Décoration</option>
              <option value="grocery">🛒 Épicerie & Supérette</option>
              <option value="health">💊 Santé & Bien-être</option>
              <option value="auto">🚗 Auto-Moto & Pièces</option>
              <option value="other">📦 Autre Commerce</option>
            </select>
          </div>
          <InputGroup label="Adresse / Zone" value={localMerchant?.address} onChange={v => setLocalMerchant({...localMerchant, address: v})} placeholder="Ex: Cocody, Abidjan" />
        </div>
      </section>

      {/* Grille de Livraison */}
      <section className="bg-vendeur-coal border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20">
            <Truck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase text-white leading-tight">Frais de Livraison</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Ces tarifs seront communiqués aux clients.</p>
          </div>
        </div>

        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-4 px-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
              <span>Zone / Commune</span>
              <span>Tarif (FCFA)</span>
           </div>

           {deliveryFees.map((fee: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-200">
                 <input
                    className="flex-1 h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm text-white focus:border-sky-500 transition-all outline-none"
                    placeholder="Ex: Riviera 3"
                    value={fee.zone}
                    onChange={(e) => {
                       const next = [...deliveryFees];
                       next[idx].zone = e.target.value;
                       setDeliveryFees(next);
                    }}
                 />
                 <input
                    type="number"
                    className="w-32 h-14 bg-black/40 border border-white/10 rounded-2xl px-5 text-sm text-white focus:border-sky-500 transition-all outline-none font-mono"
                    placeholder="1500"
                    value={fee.price}
                    onChange={(e) => {
                       const next = [...deliveryFees];
                       next[idx].price = parseInt(e.target.value) || 0;
                       setDeliveryFees(next);
                    }}
                 />
                 <button
                    onClick={() => setDeliveryFees(deliveryFees.filter((_: any, i: number) => i !== idx))}
                    className="p-3 text-white/20 hover:text-rose-500 transition-colors bg-white/5 rounded-xl"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
           ))}

           <button
              onClick={() => setDeliveryFees([...deliveryFees, { zone: "", price: 1000 }])}
              className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-widest hover:underline px-4 pt-2"
           >
              <Plus size={16} /> Ajouter une zone
           </button>
        </div>
      </section>

      {/* Moyens de Paiement */}
      <section className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Banknote size={24} className="text-emerald-400" />
              Moyens de Paiement
            </h2>
            <p className="text-xs text-white/40">Coordonnées pour les transferts d'argent.</p>
         </div>

         <div className="space-y-4">
            {payments.map((p: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-end animate-in slide-in-from-left-2 duration-300">
                 <div className="flex-1 space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white/20 ml-1">Opérateur</label>
                    <select
                      className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-xs text-white focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                      value={p.provider}
                      onChange={(e) => {
                         const next = [...payments];
                         next[idx].provider = e.target.value;
                         setPayments(next);
                      }}
                    >
                       <option value="Wave">Wave</option>
                       <option value="Orange Money">Orange Money</option>
                       <option value="MTN MoMo">MTN MoMo</option>
                       <option value="Moov Money">Moov Money</option>
                       <option value="Virement Bancaire">Virement</option>
                    </select>
                 </div>
                 <div className="flex-[1.5] space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-white/20 ml-1">Numéro / Détails</label>
                    <input
                      className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-5 text-xs text-white focus:border-emerald-500 outline-none transition-all font-mono"
                      value={p.number}
                      onChange={(e) => {
                         const next = [...payments];
                         next[idx].number = e.target.value;
                         setPayments(next);
                      }}
                      placeholder="Ex: 07 00 00 00 00"
                    />
                 </div>
                 <button
                   onClick={() => setPayments(payments.filter((_: any, i: number) => i !== idx))}
                   className="h-12 w-12 flex items-center justify-center bg-white/5 rounded-xl text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                 >
                    <Trash2 size={18} />
                 </button>
              </div>
            ))}

            <button
              onClick={() => setPayments([...payments, { provider: "Wave", number: "" }])}
              className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] hover:underline pt-2 px-1"
            >
               <Plus size={16} /> Ajouter un mode de paiement
            </button>
         </div>
      </section>

      {/* Alertes Push */}
      <section className="bg-vendeur-coal border border-white/10 p-8 rounded-[2.5rem] space-y-6">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5">
              <Bell size={24} />
           </div>
           <div>
              <h2 className="text-xl font-black text-white">Alertes Push</h2>
              <p className="text-xs text-white/40 font-medium leading-relaxed">Notifications en temps réel sur cet appareil.</p>
           </div>
        </div>

        <button
          onClick={async () => {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              await subscribeToPush(accessToken);
              toast.success("Alertes activées ! 🔔");
            } else {
              toast.error("Permission refusée.");
            }
          }}
          className="flex h-16 w-full md:w-auto px-10 items-center justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all active:scale-95"
        >
          <Sparkles size={18} className="text-amber-400" />
          Activer les Notifications
        </button>


      </section>
    </div>
  );
}

// --- ONGLET 2 : SAVOIR IA (FAQ UNIQUEMENT) ---
function SavoirTab({ initialKnowledge }: { initialKnowledge: any }) {
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState(initialKnowledge);

  useEffect(() => {
    if (initialKnowledge) setLocalData(initialKnowledge);
  }, [initialKnowledge]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch("/api/commerce/knowledge", data);
    },
    onSuccess: () => {
      toast.success("Savoir IA mis à jour ! 🧠");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    }
  });

  const handleAddFaq = () => {
    const faq = [...(localData?.faq || []), { question: "", answer: "" }];
    setLocalData({ ...localData, faq });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <section className="bg-vendeur-coal border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                <HelpCircle size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase text-white leading-tight">Mémoire de l'IA (FAQ)</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Donnez des réponses précises à votre IA.</p>
              </div>
            </div>
            <button
              onClick={() => saveMutation.mutate(localData)}
              disabled={saveMutation.isPending}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-vendeur-coal px-8 text-[10px] font-black uppercase shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Enregistrer le Savoir
            </button>
          </div>

          <div className="space-y-6">
            {(localData?.faq || []).map((item: any, i: number) => (
              <div key={i} className="relative group p-6 bg-black/20 border border-white/5 rounded-3xl space-y-4 hover:border-vendeur-emerald/30 transition-all">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/20 ml-1">Question Client</label>
                    <input
                      className="w-full bg-vendeur-coal border border-white/5 rounded-xl px-4 h-12 text-sm font-bold text-white focus:border-vendeur-emerald outline-none transition-all"
                      placeholder="Ex: Livrez-vous à Bassam ?"
                      value={item.question}
                      onChange={(e) => {
                         const faq = [...localData.faq];
                         faq[i].question = e.target.value;
                         setLocalData({...localData, faq});
                      }}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/20 ml-1">Réponse de l'IA</label>
                    <textarea
                      className="w-full bg-vendeur-coal border border-white/5 rounded-xl px-4 py-4 text-sm text-white/70 focus:border-vendeur-emerald outline-none min-h-[100px] transition-all resize-none"
                      placeholder="Oui, nous livrons partout à Bassam..."
                      value={item.answer}
                      onChange={(e) => {
                         const faq = [...localData.faq];
                         faq[i].answer = e.target.value;
                         setLocalData({...localData, faq});
                      }}
                    />
                 </div>
                <button
                  onClick={() => {
                    const faq = localData.faq.filter((_: any, idx: number) => idx !== i);
                    setLocalData({ ...localData, faq });
                  }}
                  className="absolute right-4 top-4 h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddFaq}
              className="w-full py-6 border-2 border-dashed border-white/10 rounded-[2rem] text-vendeur-emerald text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
            >
              <Plus size={16} /> Ajouter une information
            </button>
          </div>
      </section>
    </div>
  );
}

// --- ONGLET 3 : PERSONNALITE (STYLE UNIQUEMENT) ---
function PersonnaliteTab({ merchant }: { merchant: any }) {
  const queryClient = useQueryClient();
  const [aiSettings, setAiSettings] = useState(merchant?.aiSettings || {});

  useEffect(() => {
    if (merchant?.aiSettings) setAiSettings(merchant.aiSettings);
  }, [merchant]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch("/api/commerce/ai-settings", aiSettings);
    },
    onSuccess: () => {
      toast.success("Style de l'IA mis à jour ! ✨");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
      <section className="bg-vendeur-coal border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-10 shadow-2xl">
         <div className="flex items-center justify-between">
            <div className="space-y-1">
               <h2 className="text-2xl font-black text-white flex items-center gap-3">
                 <Sparkles size={24} className="text-amber-400" />
                 Style de Communication
               </h2>
               <p className="text-xs text-white/40">Définissez le caractère de votre IA.</p>
            </div>
            <button
               onClick={() => updateMutation.mutate()}
               disabled={updateMutation.isPending}
               className="h-12 bg-vendeur-emerald text-vendeur-coal px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
               {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : "Enregistrer"}
            </button>
         </div>

         <div className="grid gap-10">
            {/* Personnalité */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-vendeur-emerald ml-1">Tempérament Dominant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <PersonalityButton
                    active={aiSettings.personality === "friendly"}
                    onClick={() => setAiSettings({...aiSettings, personality: "friendly"})}
                    label="Friendly"
                    desc="Chaleureux & Sympa"
                    emoji="👋"
                 />
                 <PersonalityButton
                    active={aiSettings.personality === "professional"}
                    onClick={() => setAiSettings({...aiSettings, personality: "professional"})}
                    label="Professional"
                    desc="Sérieux & Direct"
                    emoji="💼"
                 />
                 <PersonalityButton
                    active={aiSettings.personality === "premium"}
                    onClick={() => setAiSettings({...aiSettings, personality: "premium"})}
                    label="Premium"
                    desc="Élégant & Rare"
                    emoji="💎"
                 />
              </div>
            </div>

            {/* Voix & Slang */}
            <div className="grid md:grid-cols-2 gap-6">
               <div className={cn(
                 "p-8 rounded-[2rem] border transition-all space-y-6",
                 aiSettings.voiceMode ? "bg-sky-500/5 border-sky-400/30" : "bg-white/5 border-white/5"
               )}>
                  <div className="flex items-center justify-between">
                     <div className="h-12 w-12 rounded-2xl bg-sky-400/10 flex items-center justify-center text-sky-400">
                        <Mic size={24} />
                     </div>
                     <ToggleButton
                        active={aiSettings.voiceMode}
                        onToggle={() => setAiSettings({...aiSettings, voiceMode: !aiSettings.voiceMode})}
                        color="bg-sky-400"
                     />
                  </div>
                  <div>
                    <h4 className="font-black text-white">Mode Note Vocale</h4>
                    <p className="text-xs text-white/40 mt-1">L'IA répondra par audio.</p>
                  </div>
               </div>

               <div className={cn(
                 "p-8 rounded-[2rem] border transition-all space-y-6",
                 aiSettings.localSlang ? "bg-amber-500/5 border-amber-400/30" : "bg-white/5 border-white/5"
               )}>
                  <div className="flex items-center justify-between">
                     <div className="h-12 w-12 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400">
                        <MessageSquare size={24} />
                     </div>
                     <ToggleButton
                        active={aiSettings.localSlang}
                        onToggle={() => setAiSettings({...aiSettings, localSlang: !aiSettings.localSlang})}
                        color="bg-amber-400"
                     />
                  </div>
                  <div>
                    <h4 className="font-black text-white">Ton Ivoirien (Slang)</h4>
                    <p className="text-xs text-white/40 mt-1">Utilise le Nouchi/etc pour plus de proximité.</p>
                  </div>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}

// --- ONGLET 4 : CONNEXIONS ---
function ConnexionsTab({ merchant, systemSettings, qrCode }: { merchant: any; systemSettings: any; qrCode: string | null }) {
  const queryClient = useQueryClient();

  const connectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/whatsapp/connect", {});
    },
    onSuccess: () => {
      toast.info("Initialisation de WhatsApp...");
    }
  });

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-500">
      <section className="space-y-6">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20">
              <Globe size={28} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">Canaux Connectés</h2>
              <p className="text-sm text-white/40">Gérez les plateformes où votre IA est active.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <SocialCard
              icon={<Instagram size={24} />}
              name="Instagram Business"
              status={merchant?.instagramConfig?.pageId ? "Actif" : "Non configuré"}
              active={!!merchant?.instagramConfig?.pageId}
              color="bg-pink-500"
           />
           <SocialCard
              icon={<TikTokIcon size={24} />}
              name="TikTok Shop"
              status="En développement 🚀"
              active={false}
              color="bg-white"
           />
        </div>
      </section>

      <section className="bg-vendeur-coal border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl">
         <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">Liaison WhatsApp</h2>
            <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-black">Indispensable pour vos ventes automatisées.</p>
         </div>

         <WhatsAppConnectionFlow
           merchant={{ ...merchant, systemSettings }}
           qrCode={qrCode}
           onInitBaileys={() => connectMutation.mutate()}
           onRefreshMerchant={() => queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
         />
      </section>
    </div>
  );
}

function CompteTab() {
  const { user, updateUser, logout } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    avatarUrl: user?.avatarUrl || ""
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await apiClient.patch("/api/auth/me", form);
      updateUser(res.data);
      toast.success("Profil mis à jour ! ✨");
    } catch (err) {
      toast.error("Échec de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500 max-w-2xl">
      <section className="bg-vendeur-coal/50 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] space-y-8 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-vendeur-emerald/10 rounded-2xl flex items-center justify-center text-vendeur-emerald border border-vendeur-emerald/20">
            <UserIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase text-white leading-tight">Mon Profil Personnel</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Gérez vos informations de compte.</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 py-4">
           <div className="relative group">
              <div className="h-24 w-24 rounded-[2rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
                {form.avatarUrl ? (
                  <img src={form.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-white/20">
                    <UserIcon size={40} />
                  </div>
                )}
              </div>
              <label className="absolute -right-2 -bottom-2 h-10 w-10 bg-vendeur-emerald text-vendeur-coal rounded-xl flex items-center justify-center cursor-pointer shadow-xl hover:scale-110 transition-all">
                <Camera size={18} />
                <input
                  type="text"
                  className="hidden"
                  placeholder="URL de l'image"
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                />
              </label>
           </div>
           <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Cliquez sur l'icône pour modifier l'URL de l'image</p>
        </div>

        <div className="grid gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom d'affichage</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-12 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner"
                value={form.displayName}
                onChange={e => setForm({ ...form, displayName: e.target.value })}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="space-y-1.5 opacity-50">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email (Non modifiable)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                disabled
                className="w-full h-14 rounded-2xl bg-black/20 border border-white/10 pl-12 pr-4 text-white/40 outline-none cursor-not-allowed"
                value={user?.email || ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">URL Photo de Profil</label>
            <input
              className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-4 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner text-xs"
              value={form.avatarUrl}
              onChange={e => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-vendeur-emerald/20"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              Enregistrer les modifications
              <Save size={18} />
            </>
          )}
        </button>
      </section>
    </div>
  );
}

// --- COMPOSANTS UI PARTAGES ---
function InputGroup({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">{label}</label>
      <input
        className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 px-5 text-white focus:border-vendeur-emerald outline-none transition-all shadow-inner"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function PersonalityButton({ active, onClick, label, desc, emoji }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group",
        active ? "bg-vendeur-emerald/10 border-vendeur-emerald shadow-lg" : "bg-white/5 border-white/5 hover:border-white/20"
      )}
    >
      <div className="relative z-10">
        <span className="text-2xl mb-2 block">{emoji}</span>
        <p className={cn("font-black text-sm uppercase tracking-widest", active ? "text-vendeur-emerald" : "text-white")}>{label}</p>
        <p className="text-[10px] text-white/40 font-medium mt-0.5">{desc}</p>
      </div>
      {active && <div className="absolute -right-2 -bottom-2 opacity-10"><Sparkles size={80} className="text-vendeur-emerald" /></div>}
    </button>
  );
}

function ToggleButton({ active, onToggle, color }: any) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-16 h-9 rounded-full relative transition-all duration-300 shadow-lg",
        active ? color : "bg-white/10"
      )}
    >
      <div className={cn(
        "absolute top-1 w-7 h-7 rounded-full bg-white transition-all duration-300 shadow-md",
        active ? "left-8" : "left-1"
      )} />
    </button>
  );
}

function SocialCard({ icon, name, status, active, color }: any) {
  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group",
      active ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-60"
    )}>
       <div className="flex items-center gap-6">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", color)}>
             {icon}
          </div>
          <div>
             <h4 className="text-lg font-black text-white">{name}</h4>
             <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{status}</p>
          </div>
       </div>
       <button className={cn(
         "h-10 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
         active ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-white/10 text-white/20 cursor-not-allowed"
       )}>
          {active ? "Détails" : "Lier"}
       </button>
    </div>
  );
}
