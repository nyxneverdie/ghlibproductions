import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ArrowDown } from "lucide-react";

const HERO_IMG =
  "https://images.unsplash.com/photo-1779912217816-9def5c2b8787?crop=entropy&cs=srgb&fm=jpg&q=85";

const EASE = [0.22, 1, 0.36, 1];

function RevealLine({ children, delay = 0, className = "" }) {
  return (
    <span className="mask-line">
      <motion.span
        className={className}
        initial={{ y: "112%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1.05, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero({ profile }) {
  const ref = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 60, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-5, 5]), { stiffness: 60, damping: 14 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const onMouseMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  return (
    <section
      ref={ref}
      onMouseMove={onMouseMove}
      className="grain relative flex min-h-screen flex-col overflow-hidden bg-[#08090A]"
    >
      <div className="pointer-events-none absolute inset-0 hidden lg:grid lg:grid-cols-4">
        <div className="border-r border-white/[0.05]" />
        <div className="border-r border-white/[0.05]" />
        <div className="border-r border-white/[0.05]" />
        <div />
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-center gap-12 px-6 pt-28 pb-16 lg:grid-cols-12 lg:gap-8 lg:px-12">
        <motion.div style={{ opacity: fade }} className="relative z-10 lg:col-span-7">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-meta text-[10px] text-neutral-500"
          >
            Studio Fotografi &amp; Film — {profile?.location || "Indonesia"}
          </motion.p>

          <h1 className="mt-8 font-display text-[15vw] leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-[6.5rem]">
            <RevealLine delay={0.2}>Mengabad</RevealLine>
            <RevealLine delay={0.32} className="italic text-neutral-400">momen yang</RevealLine>
            <RevealLine delay={0.44}>bertahan.</RevealLine>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
            className="mt-8 max-w-md text-sm leading-relaxed text-neutral-400 sm:text-base"
          >
            {profile?.tagline ||
              "Studio fotografi & film dengan sentuhan sinematik — dari sesi portrait hingga film wedding."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <button
              data-testid="hero-cta-portfolio"
              onClick={() => {
                const el = document.querySelector("#karya");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-full bg-white px-8 py-4 font-meta text-[10px] text-black transition-transform duration-300 hover:scale-[1.04]"
            >
              Lihat Karya
            </button>
            <Link
              to="/book"
              data-testid="hero-cta-booking"
              className="group rounded-full border border-white/20 px-8 py-4 font-meta text-[10px] text-white transition-colors duration-300 hover:bg-white/10"
            >
              Booking Sesi
              <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.55, ease: EASE }}
          style={{ perspective: 1200 }}
          className="relative z-10 lg:col-span-5"
        >
          <motion.div
            style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
            className="relative mx-auto aspect-[3/4] max-w-md overflow-hidden border border-white/10"
          >
            <motion.img
              src={HERO_IMG}
              alt="Di balik layar ghlibproduction"
              style={{ y: imgY, scale: imgScale }}
              className="h-[115%] w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute left-4 top-4 font-meta text-[9px] text-white/70" style={{ transform: "translateZ(40px)" }}>
              ROLL 01 — BEHIND THE SCENES
            </div>
            <div className="absolute bottom-4 left-4 font-meta text-[9px] text-white/70">STUDIO — {profile?.location || "INDONESIA"}</div>
          </motion.div>

          <div className="mx-auto mt-4 flex max-w-md items-center justify-between font-meta text-[9px] text-neutral-600">
            <span>35MM / KINO</span>
            <span>DIR.AKHIR — KURASI WARNA</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between px-6 pb-8 lg:px-12"
      >
        <span className="flex items-center gap-3 font-meta text-[9px] text-neutral-600">
          Gulir <ArrowDown size={12} className="animate-bounce" />
        </span>
        <span className="font-meta text-[9px] text-neutral-600">GH LIB — {new Date().getFullYear()}</span>
      </motion.div>
    </section>
  );
}
