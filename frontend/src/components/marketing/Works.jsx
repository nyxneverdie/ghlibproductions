import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Lightbox from "./Lightbox";

const SPANS = [
  "md:col-span-7 aspect-[4/3]",
  "md:col-span-5 aspect-[3/4] md:mt-24",
  "md:col-span-5 aspect-[3/4]",
  "md:col-span-7 aspect-[4/3] md:mt-24",
];

export default function Works({ items = [] }) {
  const [open, setOpen] = useState(null);

  return (
    <section id="karya" className="mx-auto max-w-[1600px] px-6 py-24 lg:px-12 lg:py-36">
      <div className="mb-16 flex items-end justify-between">
        <div>
          <p className="font-meta text-[10px] text-neutral-500">01 — Karya Terpilih</p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl">
            Cerita dalam <span className="italic text-neutral-400">bingkai</span>
          </h2>
        </div>
        <span className="hidden font-meta text-[10px] text-neutral-600 md:block">KLIK UNTUK MEMPERBESAR</span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
        {items.map((item, i) => (
          <motion.figure
            key={item.item_id}
            data-testid={`work-card-${i}`}
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 2) * 0.12 }}
            className={`group relative cursor-pointer overflow-hidden ${SPANS[i % 4]}`}
            onClick={() => setOpen(i)}
          >
            <img
              src={item.url}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/25" />
            <Plus className="absolute right-5 top-5 h-6 w-6 text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <figcaption className="absolute bottom-0 left-0 flex w-full items-end justify-between p-5">
              <span className="font-display text-xl italic text-white drop-shadow">{item.title}</span>
              <span className="font-meta text-[9px] text-white/70">{item.category}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-24 text-center text-sm text-neutral-600">Karya akan segera tampil di sini.</p>
      )}

      {open !== null && (
        <Lightbox items={items} index={open} onClose={() => setOpen(null)} onNav={(d) => setOpen((open + d + items.length) % items.length)} />
      )}
    </section>
  );
}
