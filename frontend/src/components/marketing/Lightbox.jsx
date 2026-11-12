import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Lightbox({ items, index, onClose, onNav, footer }) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav && onNav(1);
      if (e.key === "ArrowLeft") onNav && onNav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNav]);

  if (!item) return null;

  return (
    <motion.div
      data-testid="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <span className="font-meta text-[10px] text-neutral-400">
          {index + 1} / {items.length} — {item.title || item.original_filename || ""}
        </span>
        <button data-testid="lightbox-close" onClick={onClose} className="rounded-full border border-white/20 p-2 text-white transition-colors hover:bg-white hover:text-black">
          <X size={18} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
        {onNav && (
          <button data-testid="lightbox-prev" onClick={() => onNav(-1)} className="absolute left-4 z-10 rounded-full border border-white/20 bg-black/40 p-3 text-white transition-colors hover:bg-white hover:text-black md:left-10">
            <ChevronLeft size={20} />
          </button>
        )}
        {item.media_type === "video" ? <video controls src={item.url} className="max-h-[72vh] max-w-full md:max-w-[78vw]" /> : <motion.img
          key={item.asset_id || item.item_id || item.url}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          src={item.url}
          alt={item.title || item.original_filename || ""}
          className="max-h-[72vh] max-w-full object-contain md:max-w-[78vw]"
        />}
        {onNav && (
          <button data-testid="lightbox-next" onClick={() => onNav(1)} className="absolute right-4 z-10 rounded-full border border-white/20 bg-black/40 p-3 text-white transition-colors hover:bg-white hover:text-black md:right-10">
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {footer && (
        <div className="border-t border-white/10 bg-[#08090A]/80 px-6 py-5" onClick={(e) => e.stopPropagation()}>
          {footer}
        </div>
      )}
    </motion.div>
  );
}
