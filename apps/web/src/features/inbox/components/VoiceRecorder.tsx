import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/apiClient";
import { useQueryClient } from "@tanstack/react-query";

interface VoiceRecorderProps {
  conversationId: string;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

export function VoiceRecorder({ conversationId, onRecordingStateChange }: VoiceRecorderProps) {
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    onRecordingStateChange?.(isRecording);
  }, [isRecording, onRecordingStateChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Pick best supported mimeType
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
        ? "audio/ogg;codecs=opus"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200); // 200ms chunk slices
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("[Audio Record Error]", err);
      toast.error("Impossible d'accéder au microphone. Veuillez autoriser l'accès.");
    }
  };

  const cancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendVoiceRecording = async () => {
    if (!mediaRecorderRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setIsSending(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/ogg";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < 1000) {
          toast.error("Enregistrement trop court.");
          setIsSending(false);
          setIsRecording(false);
          return;
        }

        const formData = new FormData();
        const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "m4a" : "ogg";
        formData.append("audio", audioBlob, `voice-memo.${extension}`);

        const res = await apiClient.post(`/api/commerce/conversations/${conversationId}/voice`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });

        toast.success(
          res.data?.transcription
            ? `Note vocale envoyée ! (Transcrit: "${res.data.transcription.slice(0, 30)}...")`
            : "Note vocale envoyée avec succès !"
        );
      } catch (err: any) {
        console.error("[Voice Send Error]", err);
        toast.error("Erreur lors de l'envoi de la note vocale.");
      } finally {
        setIsSending(false);
        setIsRecording(false);
        setRecordingTime(0);
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (isRecording || isSending) {
    return (
      <div className="flex-1 flex items-center justify-between gap-3 bg-red-950/30 border border-red-500/30 rounded-2xl px-4 py-2 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-widest text-rose-400">
            {isSending ? "Transcription & Envoi..." : `Enregistrement ${formatTime(recordingTime)}`}
          </span>
        </div>

        {/* Audio Wave Visualizer Simulation */}
        <div className="hidden sm:flex items-center gap-1">
          {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95].map((h, i) => (
            <div
              key={i}
              className="w-1 bg-rose-500/60 rounded-full animate-pulse"
              style={{
                height: `${Math.max(8, (h * (recordingTime % 3 + 1)) / 3)}px`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {!isSending && (
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-rose-400 transition-colors"
              title="Annuler"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={sendVoiceRecording}
            disabled={isSending}
            className="h-9 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <>
                <Send size={14} />
                <span>Envoyer</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-vendeur-emerald transition-all shrink-0 active:scale-95"
      title="Enregistrer une note vocale (Voice Memo)"
    >
      <Mic size={18} />
    </button>
  );
}
