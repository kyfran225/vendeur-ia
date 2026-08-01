import React, { useState } from "react";
import { X, Mail, Lock, User, LogIn, Sparkles, ChevronRight, Bot } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";

const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:3001";

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export function AuthSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: ""
  });

  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await apiClient.post("/api/auth/google", {
          token: tokenResponse.access_token,
        });
        setSession(res.data);
        toast.success("Bienvenue avec Google !");
        onClose();
      } catch (err: any) {
        toast.error("Erreur d'authentification Google");
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error("Échec de la connexion Google"),
  });

  if (!isOpen) return null;

  const handleGoogleAuth = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error("Connexion Google non configurée sur ce serveur.");
      return;
    }
    loginWithGoogle();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        await apiClient.post("/api/auth/forgot-password", { email: form.email });
        toast.success("Lien de réinitialisation envoyé !");
        setMode("login");
        return;
      }

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await apiClient.post(endpoint, form);

      // Assume backend returns { accessToken, refreshToken, user }
      setSession(res.data);
      toast.success(mode === "login" ? "Bienvenue !" : "Compte créé avec succès !");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-vendeur-coal border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute right-6 top-6 text-white/20 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-vendeur-emerald/10 border border-vendeur-emerald/20 mb-4">
            <Bot className="text-vendeur-emerald" size={32} />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {mode === "login" ? "Content de vous revoir" : mode === "register" ? "Rejoindre l'aventure" : "Mot de passe oublié"}
          </h2>
          <p className="text-sm text-white/40 mt-1">
            {mode === "login" ? "Accédez à votre machine de vente." : mode === "register" ? "Créez votre compte en quelques secondes." : "Entrez votre email pour recevoir un lien."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full h-12 bg-white text-black font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all border border-black/5 shadow-sm mb-6"
              >
                <GoogleIcon />
                {mode === "login" ? "Continuer avec Google" : "S'inscrire avec Google"}
              </button>

              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <span className="relative px-3 bg-vendeur-coal text-[10px] text-white/20 font-black uppercase tracking-widest">OU</span>
              </div>
            </>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Nom Complet</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  required
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all"
                  placeholder="Jean Dupont"
                  value={form.displayName}
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                required
                type="email"
                className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all"
                placeholder="jean@exemple.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Mot de passe</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[10px] font-bold text-vendeur-emerald hover:underline"
                  >
                    Oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  required
                  type="password"
                  className="w-full h-12 bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:border-vendeur-emerald outline-none transition-all"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-vendeur-emerald text-vendeur-coal font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-8 shadow-xl shadow-vendeur-emerald/20"
          >
            {loading ? <Sparkles className="animate-spin" size={20} /> : (
              <>
                {mode === "login" ? "Se Connecter" : mode === "register" ? "Créer mon compte" : "Envoyer le lien"}
                <ChevronRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-white/40">
            {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="ml-2 text-vendeur-emerald font-bold hover:underline"
            >
              {mode === "login" ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
