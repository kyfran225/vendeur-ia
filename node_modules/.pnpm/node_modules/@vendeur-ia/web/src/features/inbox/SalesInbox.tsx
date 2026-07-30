import React from "react";
import { MessageCircle, Search, MoreVertical, CheckCheck, ShieldCheck } from "lucide-react";

export function SalesInbox() {
  return (
    <div className="flex h-screen bg-vendeur-bg">
      {/* Sidebar List */}
      <aside className="w-96 border-r border-white/5 flex flex-col">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-black">Messages</h2>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input className="w-full bg-vendeur-coal border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm outline-none focus:border-vendeur-emerald transition-all" placeholder="Rechercher..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ChatListItem name="Marie-Laure" lastMsg="Est-ce que c'est dispo ?" time="14:22" unread={2} active />
          <ChatListItem name="Koffi Armand" lastMsg="J'ai envoyé le Wave" time="Hier" status="payment" />
          <ChatListItem name="Aicha Fashion" lastMsg="Merci beaucoup" time="Mer." />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <header className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/5" />
            <div>
              <p className="font-bold text-sm">Marie-Laure</p>
              <p className="text-[10px] text-vendeur-emerald font-black uppercase tracking-widest">En ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-sky-500/10 border border-sky-500/30 px-4 py-1.5 rounded-full flex items-center gap-2">
              <ShieldCheck size={14} className="text-sky-400" />
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">IA Active</span>
            </div>
            <button className="text-white/40 hover:text-white"><MoreVertical size={20} /></button>
          </div>
        </header>

        <div className="flex-1 p-8 space-y-6 overflow-y-auto">
          <ChatBubble role="user" text="Bonjour, je suis intéressée par la robe rouge en taille M." time="14:20" />
          <ChatBubble role="ai" text="Bonjour ! 👋 Oui, la Robe Ankara Élégance est disponible en taille M. Elle est au prix de 15.000 FCFA. Souhaitez-vous la réserver ?" time="14:21" />
          <ChatBubble role="user" text="Est-ce que c'est dispo ?" time="14:22" />
        </div>

        <footer className="p-6 bg-vendeur-coal/50">
          <div className="flex items-center gap-4 bg-vendeur-coal border border-white/10 rounded-[2rem] px-6 py-4">
            <input className="flex-1 bg-transparent outline-none text-sm" placeholder="Répondre manuellement..." />
            <button className="text-vendeur-emerald font-black text-xs uppercase tracking-widest">Envoyer</button>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ChatListItem({ name, lastMsg, time, unread, active, status }: any) {
  return (
    <div className={`p-6 flex items-center gap-4 cursor-pointer transition-all border-l-4 ${active ? "bg-vendeur-emerald/5 border-vendeur-emerald" : "hover:bg-white/[0.02] border-transparent"}`}>
      <div className="h-12 w-12 rounded-2xl bg-white/5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-bold text-sm truncate">{name}</p>
          <p className="text-[10px] text-white/30">{time}</p>
        </div>
        <p className="text-xs text-white/40 truncate">{lastMsg}</p>
      </div>
      {status === "payment" && <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
      {unread && <div className="h-5 w-5 rounded-full bg-vendeur-emerald flex items-center justify-center text-[10px] font-black text-vendeur-coal">{unread}</div>}
    </div>
  );
}

function ChatBubble({ role, text, time }: any) {
  return (
    <div className={`flex w-full ${role === "user" ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[70%] p-4 rounded-3xl ${role === "user" ? "bg-vendeur-coal border border-white/5 rounded-tl-none" : "bg-vendeur-emerald text-vendeur-coal rounded-tr-none"}`}>
        <p className="text-sm font-medium leading-relaxed">{text}</p>
        <div className="flex items-center justify-end gap-1 mt-2 opacity-50">
          <span className="text-[9px] font-bold">{time}</span>
          {role === "ai" && <CheckCheck size={12} />}
        </div>
      </div>
    </div>
  );
}
