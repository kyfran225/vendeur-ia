import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07100d] flex flex-col items-center justify-center p-6 text-center">
          <div className="h-20 w-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-8">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tighter">Oups ! Quelque chose s'est mal passé.</h1>
          <p className="text-white/40 max-w-md mb-8 leading-relaxed">
            L'application a rencontré une erreur inattendue. Ne vous inquiétez pas, vos données sont en sécurité.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-emerald-300 px-8 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <RefreshCw size={20} /> Recharger l'application
          </button>
        </div>
      );
    }

    return this.children;
  }
}
