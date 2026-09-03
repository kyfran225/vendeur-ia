import { useState, useMemo } from "react";
import { Search, X, Smile, ThumbsUp, Heart, Sparkles, Flame, Check } from "lucide-react";

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES: Record<string, { label: string; icon: string; emojis: string[] }> = {
  reactions: {
    label: "Populaires",
    icon: "🔥",
    emojis: ["👍", "❤️", "😂", "🔥", "🙏", "😮", "😢", "🎉", "👏", "💯", "✅", "🚀", "💰", "✨", "🤝", "📦"]
  },
  smileys: {
    label: "Visages & Émotions",
    icon: "😀",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
      "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
      "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
      "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
      "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
      "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯"
    ]
  },
  gestures: {
    label: "Mains & Personnes",
    icon: "👋",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
      "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
      "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
      "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂"
    ]
  },
  commerce: {
    label: "Commerce & Livraisons",
    icon: "🛍️",
    emojis: [
      "🛍️", "🛒", "📦", "🏷️", "💳", "💵", "💴", "💶", "💷", "💰",
      "🧾", "🎁", "🚚", "🚛", "🛵", "🚗", "📍", "🗺️", "📱", "📞",
      "✉️", "📧", "💼", "📊", "📈", "📉", "🏆", "🥇", "⭐", "🌟"
    ]
  },
  symbols: {
    label: "Symboles & Alertes",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
      "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
      "✅", "❌", "⚠️", "⛔", "🚫", "💯", "🔔", "🔕", "⚡", "✨"
    ]
  }
};

export function EmojiPickerPopover({ isOpen, onClose, onSelectEmoji }: EmojiPickerPopoverProps) {
  const [activeCategory, setActiveCategory] = useState<string>("reactions");
  const [searchQuery, setSearchQuery] = useState("");

  const allFilteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) {
      return EMOJI_CATEGORIES[activeCategory]?.emojis || [];
    }
    const q = searchQuery.toLowerCase();
    const result: string[] = [];
    Object.values(EMOJI_CATEGORIES).forEach((cat) => {
      cat.emojis.forEach((emoji) => {
        if (!result.includes(emoji)) {
          result.push(emoji);
        }
      });
    });
    return result;
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[120]" onClick={onClose} />
      <div 
        className="absolute bottom-16 left-4 z-[130] w-80 sm:w-96 bg-[#202c33] border border-[#2a3942] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#e9edef] animate-in fade-in slide-in-from-bottom-3 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search */}
        <div className="p-3 border-b border-[#2a3942] flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8696a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un émoji..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#111b21] border border-[#2a3942] rounded-xl text-xs text-white placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8696a0] hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8696a0] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Category Tabs */}
        {!searchQuery && (
          <div className="flex items-center px-2 py-1.5 bg-[#111b21] border-b border-[#2a3942] gap-1 overflow-x-auto no-scrollbar">
            {Object.entries(EMOJI_CATEGORIES).map(([key, cat]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key)}
                className={`px-3 py-1 rounded-lg text-sm transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeCategory === key
                    ? "bg-[#00a884]/20 text-[#00a884] font-bold border border-[#00a884]/40"
                    : "text-[#8696a0] hover:text-white hover:bg-white/5"
                }`}
                title={cat.label}
              >
                <span>{cat.icon}</span>
                <span className="text-[11px] hidden sm:inline">{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji Grid */}
        <div className="p-3 max-h-60 overflow-y-auto grid grid-cols-8 gap-1.5 custom-scrollbar">
          {allFilteredEmojis.map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              type="button"
              onClick={() => {
                onSelectEmoji(emoji);
              }}
              className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-[#111b21] active:scale-125 transition-transform cursor-pointer"
            >
              {emoji}
            </button>
          ))}
          {allFilteredEmojis.length === 0 && (
            <div className="col-span-8 py-8 text-center text-xs text-[#8696a0]">
              Aucun émoji trouvé
            </div>
          )}
        </div>

        {/* Footer Quick Bar */}
        <div className="px-3 py-2 bg-[#111b21] border-t border-[#2a3942] flex items-center justify-between text-[11px] text-[#8696a0]">
          <span>Cliquez pour insérer dans le message</span>
          <span className="text-[#00a884] font-medium">WhatsApp Style</span>
        </div>
      </div>
    </>
  );
}
