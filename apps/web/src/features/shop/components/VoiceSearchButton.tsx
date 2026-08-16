import React, { useState, useEffect } from "react";
import { Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceSearchButtonProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function VoiceSearchButton({ onSearch, className = "" }: VoiceSearchButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.info("La recherche vocale n'est pas supportée par ce navigateur.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
        toast.info("🎙️ Parlez maintenant... (ex: 'Robe rouge', 'Montre', 'Savon')", {
          duration: 3000
        });
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        onSearch(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("[VoiceSearch Error]", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error("Impossible de capter la voix. Réessayez.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error("[VoiceSearch Exception]", err);
      setIsListening(false);
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={startListening}
        className={`h-9 px-3 rounded-xl flex items-center gap-1.5 transition-all text-xs font-black uppercase tracking-wider ${
          isListening
            ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40"
            : "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
        } ${className}`}
        title="Rechercher par la voix"
      >
        {isListening ? (
          <>
            <MicOff size={14} className="animate-spin" />
            <span className="text-[10px]">Écoute...</span>
          </>
        ) : (
          <>
            <Mic size={14} className="text-vendeur-emerald" />
            <span className="hidden sm:inline text-[10px]">Parler</span>
          </>
        )}
      </button>

      {isListening && transcript && (
        <div className="absolute right-0 top-12 z-50 px-3 py-1.5 bg-black/90 border border-vendeur-emerald/30 rounded-xl text-xs text-white backdrop-blur-md whitespace-nowrap flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <Volume2 size={12} className="text-vendeur-emerald animate-bounce" />
          <span className="font-medium text-white/90">&ldquo;{transcript}&rdquo;</span>
        </div>
      )}
    </div>
  );
}
