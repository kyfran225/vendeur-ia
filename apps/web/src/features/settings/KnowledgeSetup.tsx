import React, { useState, useEffect } from "react";
import { Brain, MapPin, Truck, HelpCircle, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/lib/apiClient";
import axios from "axios";
import { toast } from "sonner";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

export function KnowledgeSetup() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<any>(null);

  const { data: knowledge, isLoading } = useQuery({
    queryKey: ["knowledge"],
    queryFn: async () => {
      const res = await apiClient.get("/api/commerce/knowledge");
      return res.data;
    },
    enabled: !!accessToken
  });

  useEffect(() => {
    if (knowledge) {
      setLocalData(knowledge);
    }
  }, [knowledge]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiClient.patch("/api/commerce/knowledge", data);
    },
    onSuccess: () => {
      toast.success("Cerveau IA mis à jour ! 🧠");
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: () => toast.error("Échec de la sauvegarde")
  });

  if (isLoading || !localData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-vendeur-emerald" size={32} />
      </div>
    );
  }

  const handleAddFaq = () => {
    const faq = [...(localData.faq || []), { question: "", answer: "" }];
    setLocalData({ ...localData, faq });
  };

  const handleUpdateFaq = (index: number, field: string, value: string) => {
    const faq = [...localData.faq];
    faq[index] = { ...faq[index], [field]: value };
    setLocalData({ ...localData, faq });
  };

  const handleRemoveFaq = (index: number) => {
    const faq = localData.faq.filter((_: any, i: number) => i !== index);
    setLocalData({ ...localData, faq });
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black tracking-tight">Cerveau IA</h1>
        <p className="text-white/40">Enseignez les règles de votre boutique à votre IA.</p>
      </header>

      <div className="grid gap-6">
        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-400"><Truck size={20} /></div>
            <h2 className="text-xl font-black">Grille de Livraison</h2>
          </div>

          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-white/30">
                <span>Commune / Zone</span>
                <span>Prix (FCFA)</span>
             </div>

             {(localData.businessRules?.deliveryFees || []).map((fee: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center group animate-in slide-in-from-left-2 duration-200">
                   <input
                      className="flex-1 h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-sky-500 transition-all outline-none"
                      placeholder="Ex: Cocody"
                      value={fee.zone}
                      onChange={(e) => {
                         const fees = [...localData.businessRules.deliveryFees];
                         fees[idx].zone = e.target.value;
                         setLocalData({...localData, businessRules: {...localData.businessRules, deliveryFees: fees}});
                      }}
                   />
                   <input
                      type="number"
                      className="w-32 h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm text-white focus:border-sky-500 transition-all outline-none"
                      placeholder="1500"
                      value={fee.price}
                      onChange={(e) => {
                         const fees = [...localData.businessRules.deliveryFees];
                         fees[idx].price = parseInt(e.target.value) || 0;
                         setLocalData({...localData, businessRules: {...localData.businessRules, deliveryFees: fees}});
                      }}
                   />
                   <button
                      onClick={() => {
                        const fees = localData.businessRules.deliveryFees.filter((_: any, i: number) => i !== idx);
                        setLocalData({...localData, businessRules: {...localData.businessRules, deliveryFees: fees}});
                      }}
                      className="p-2 text-white/20 hover:text-rose-500 transition-colors"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
             ))}

             <button
                onClick={() => {
                   const fees = [...(localData.businessRules?.deliveryFees || []), { zone: "", price: 1000 }];
                   setLocalData({...localData, businessRules: {...localData.businessRules, deliveryFees: fees}});
                }}
                className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-widest hover:underline pt-2"
             >
                <Plus size={14} /> Ajouter une zone
             </button>
          </div>
        </section>

        <section className="bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400"><HelpCircle size={20} /></div>
            <h2 className="text-xl font-black">FAQ Boutique</h2>
          </div>
          <div className="space-y-6">
            {(localData.faq || []).map((item: any, i: number) => (
              <div key={i} className="relative group">
                <FaqItem
                  question={item.question}
                  answer={item.answer}
                  onUpdate={(field: string, val: string) => handleUpdateFaq(i, field, val)}
                />
                <button
                  onClick={() => handleRemoveFaq(i)}
                  className="absolute -right-2 -top-2 h-8 w-8 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddFaq}
              className="text-vendeur-emerald text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:underline"
            >
              <Plus size={14} /> Ajouter une question
            </button>
          </div>
        </section>

        <button
          onClick={() => saveMutation.mutate(localData)}
          disabled={saveMutation.isPending}
          className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-vendeur-coal font-black uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Enregistrer la mémoire
        </button>
      </div>
    </div>
  );
}

function FaqItem({ question, answer, onUpdate }: any) {
  return (
    <div className="space-y-2">
      <input
        className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs font-bold text-white focus:border-vendeur-emerald outline-none"
        placeholder="Question (ex: Quels sont vos horaires ?)"
        value={question}
        onChange={(e) => onUpdate("question", e.target.value)}
      />
      <textarea
        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white/70 focus:border-vendeur-emerald outline-none min-h-[80px]"
        placeholder="Réponse..."
        value={answer}
        onChange={(e) => onUpdate("answer", e.target.value)}
      />
    </div>
  );
}
