import { useState } from "react";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Lightbox from "./Lightbox";

export default function Film({ items = [] }) {
  const [open, setOpen] = useState(null);
  const stills = items.length ? items : [];

  return (
    <section id="film" className="border-y border-white/10 bg-[#0D0E10] py-24 lg:py-36">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-12">
        <div className="mb-14 flex items-end justify-between">
          <div>
            <p className="font-meta text-[10px] text-neutral-500">02 — Film &amp; Videography</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl">
              Gerak, cahaya, dan <span className="italic text-neutral-400">ritme</span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-relaxed text-neutral-500 md:block">
            Reel sinematik dan film pendek — direkam dengan gerakan kamera yang terukur dan kurasi warna khas studio.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="group relative aspect-video cursor-pointer overflow-hidden border border-white/10 lg:col-span-8"
            onClick={() => stills.length && setOpen(0)}
            data-testid="film-hero-frame"
          >
            {stills[0] && (
              <img src={stills[0].url} alt={stills[0].title} className="h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.06]" />
            )}
            <div className="absolute inset-0 bg-black/35 transition-colors duration-500 group-hover:bg-black/15" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-black/30 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
                <Play size={26} className="ml-1 text-white" fill="white" />
              </span>
            </div>
            <div className="absolute bottom-5 left-5">
              <p className="font-display text-2xl italic text-white">{stills[0]?.title || "Showreel"}</p>
              <p className="mt-1 font-meta text-[9px] text-white/70">SINEMATIK — 24 FPS</p>
            </div>
          </motion.div>

          <div className="flex flex-col gap-5 lg:col-span-4">
            {stills.slice(0, 4).map((f, i) => (
              <motion.button
                key={f.item_id || i}
                data-testid={`film-item-${i}`}
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setOpen(i)}
                className="group flex items-center gap-4 border border-white/10 bg-[#111316] p-3 text-left transition-colors duration-300 hover:border-white/30"
              >
                <img src={f.url} alt={f.title} className="h-16 w-24 shrink-0 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-lg italic text-white">{f.title}</span>
                  <span className="mt-1 block font-meta text-[9px] text-neutral-500">FILM STILL — {f.category?.toUpperCase()}</span>
                </span>
                <Play size={14} className="shrink-0 text-neutral-600 transition-colors group-hover:text-white" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {open !== null && stills.length > 0 && (
        <Lightbox items={stills} index={open} onClose={() => setOpen(null)} onNav={(d) => setOpen((open + d + stills.length) % stills.length)} />
      )}
    </section>
  );
}
