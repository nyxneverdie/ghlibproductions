import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Services({ services = [] }) {
  return (
    <section id="layanan" className="mx-auto max-w-[1600px] px-6 py-24 lg:px-12 lg:py-36">
      <div className="mb-14 flex items-end justify-between">
        <div>
          <p className="font-meta text-[10px] text-neutral-500">05 — Layanan</p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-white sm:text-5xl lg:text-6xl">
            Paket <span className="italic text-neutral-400">&amp; harga</span>
          </h2>
        </div>
        <p className="hidden max-w-xs text-sm leading-relaxed text-neutral-500 md:block">
          Setiap sesi mendapat galeri proofing pribadi, seleksi foto online, dan proses revisi terstruktur.
        </p>
      </div>

      <div className="border-t border-white/10">
        {services.map((s, i) => (
          <motion.div
            key={s.name}
            data-testid={`service-row-${i}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="group grid grid-cols-1 gap-3 border-b border-white/10 py-8 transition-colors duration-300 hover:bg-white/[0.03] md:grid-cols-12 md:items-center md:gap-6 md:py-10"
          >
            <div className="md:col-span-1 font-meta text-[10px] text-neutral-600">{String(i + 1).padStart(2, "0")}</div>
            <div className="md:col-span-4">
              <h3 className="font-display text-2xl tracking-tight text-white transition-transform duration-300 group-hover:translate-x-2 sm:text-3xl">{s.name}</h3>
            </div>
            <p className="text-sm leading-relaxed text-neutral-400 md:col-span-5">{s.desc}</p>
            <div className="flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
              <span className="font-meta text-[10px] text-neutral-300">{s.price}</span>
              <Link to="/book" data-testid={`service-book-${i}`} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:bg-white group-hover:text-black">
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
