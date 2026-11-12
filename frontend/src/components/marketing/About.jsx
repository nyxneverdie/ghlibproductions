import { motion } from "framer-motion";

const ABOUT_IMG =
  "https://images.unsplash.com/photo-1691491918178-8a2e68b44919?crop=entropy&cs=srgb&fm=jpg&q=85";

export default function About({ profile, categories = [] }) {
  return (
    <section id="tentang" className="border-t border-white/10 bg-[#0D0E10] py-24 lg:py-36">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-6 lg:grid-cols-12 lg:gap-16 lg:px-12">
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <p className="font-meta text-[10px] text-neutral-500">04 — Tentang</p>
            <p className="mt-6 font-display text-2xl italic leading-snug text-neutral-300">
              "Fotografi bukan soal kamera,<br />tapi soal kehadiran."
            </p>
          </div>
        </div>

        <div className="lg:col-span-4">
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border border-white/10"
          >
            <img src={ABOUT_IMG} alt="Di studio" className="aspect-[3/4] w-full object-cover transition-transform duration-[1.4s] hover:scale-[1.04]" />
          </motion.div>
          <p className="mt-4 font-meta text-[9px] text-neutral-600">DI STUDIO — {profile?.location || "INDONESIA"}</p>
        </div>

        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-display text-4xl tracking-tight text-white sm:text-5xl">
              {profile?.studio_name || "ghlibproduction"}
            </h2>
            <p className="mt-8 text-sm leading-relaxed text-neutral-400 sm:text-base">
              {profile?.bio || "Studio kreatif yang berfokus pada fotografi dan film."}
            </p>
            <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-4">
              {(categories.length ? categories : ["Portrait", "Wedding", "Event", "Product", "Graduation", "Film"]).map((c) => (
                <div key={c} className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <span className="h-1 w-1 rounded-full bg-white" />
                  <span className="font-meta text-[10px] text-neutral-300">{c}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              {profile?.instagram && (
                <a href={profile.instagram} target="_blank" rel="noreferrer" data-testid="about-instagram"
                  className="rounded-full border border-white/20 px-6 py-3 font-meta text-[10px] text-white transition-colors duration-300 hover:bg-white hover:text-black">
                  Instagram
                </a>
              )}
              {profile?.youtube && (
                <a href={profile.youtube} target="_blank" rel="noreferrer" data-testid="about-youtube"
                  className="rounded-full border border-white/20 px-6 py-3 font-meta text-[10px] text-white transition-colors duration-300 hover:bg-white hover:text-black">
                  YouTube
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
