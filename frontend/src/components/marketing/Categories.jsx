import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function Categories({ categories = [], portfolio = [] }) {
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 120, damping: 18 });
  const y = useSpring(my, { stiffness: 120, damping: 18 });

  const previewFor = (cat) => portfolio.find((p) => p.category === cat)?.url || portfolio[0]?.url;

  const onMouseMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(e.clientX - r.left + 24);
    my.set(e.clientY - r.top - 140);
  };

  return (
    <section
      id="kategori"
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative mx-auto max-w-[1600px] px-6 py-24 lg:px-12 lg:py-36"
    >
      <p className="font-meta text-[10px] text-neutral-500">03 — Kategori</p>
      <h2 className="mt-4 font-display text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl">
        Apa yang bisa <span className="italic text-neutral-400">kami kerjakan</span>
      </h2>

      <div className="mt-16 border-t border-white/10">
        {categories.map((cat, i) => (
          <motion.button
            key={cat}
            data-testid={`category-row-${i}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHovered(cat)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => document.querySelector("#karya")?.scrollIntoView({ behavior: "smooth" })}
            className="group flex w-full items-center justify-between border-b border-white/10 py-7 text-left transition-all duration-300 hover:pl-4 md:py-9"
          >
            <span className="flex items-baseline gap-6 md:gap-10">
              <span className="font-meta text-[10px] text-neutral-600">{String(i + 1).padStart(2, "0")}</span>
              <span className={`font-display text-3xl tracking-tight transition-colors duration-300 sm:text-5xl lg:text-6xl ${hovered === cat ? "italic text-white" : "text-neutral-300"}`}>
                {cat}
              </span>
            </span>
            <ArrowUpRight className={`h-6 w-6 transition-all duration-300 ${hovered === cat ? "text-white" : "text-neutral-700"}`} />
          </motion.button>
        ))}
      </div>

      <motion.div
        style={{ x, y }}
        animate={{ opacity: hovered ? 1 : 0, scale: hovered ? 1 : 0.92 }}
        transition={{ duration: 0.25 }}
        className="pointer-events-none absolute left-0 top-0 z-20 hidden h-64 w-48 overflow-hidden border border-white/20 lg:block"
      >
        {hovered && <img src={previewFor(hovered)} alt={hovered} className="h-full w-full object-cover" />}
      </motion.div>
    </section>
  );
}
