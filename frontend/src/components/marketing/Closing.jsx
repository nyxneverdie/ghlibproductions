import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";

export function BookingCTA() {
  return (
    <section className="relative overflow-hidden border-t border-white/10 bg-[#0D0E10] py-28 lg:py-40">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl font-display text-5xl leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Punya momen yang layak <span className="italic text-neutral-400">diabadikan?</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex flex-wrap items-center gap-4"
        >
          <Link to="/book" data-testid="closing-book-button"
            className="rounded-full bg-white px-10 py-5 font-meta text-[10px] text-black transition-transform duration-300 hover:scale-[1.04]">
            Booking Sesi Sekarang
          </Link>
          <a href="mailto:hello@ghlibproduction.id" data-testid="closing-email-button"
            className="rounded-full border border-white/20 px-10 py-5 font-meta text-[10px] text-white transition-colors duration-300 hover:bg-white/10">
            Email Studio
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export function PortalCTA() {
  return (
    <section className="border-t border-white/10 bg-[#08090A] py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-12 px-6 lg:grid-cols-12 lg:items-center lg:px-12">
        <div className="lg:col-span-7">
          <p className="font-meta text-[10px] text-neutral-500">Portal Klien</p>
          <h2 className="mt-4 font-display text-4xl tracking-tight text-white sm:text-5xl">
            Ruang kerja pribadi <span className="italic text-neutral-400">untuk setiap klien</span>
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-400">
            Pilih foto favorit Anda dengan kuota yang jelas, beri catatan revisi per foto, pantau status
            proyek, dan unduh hasil akhir — tanpa bolak-balik pesan.
          </p>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
          <Link to="/login" data-testid="portal-login-button"
            className="w-full max-w-sm rounded-none border border-white/20 px-8 py-5 text-center font-meta text-[10px] text-white transition-colors duration-300 hover:bg-white hover:text-black lg:w-auto lg:min-w-[280px]">
            Masuk dengan Google
          </Link>
          <Link to="/book" data-testid="portal-register-note"
            className="w-full max-w-sm px-8 py-5 text-center font-meta text-[10px] text-neutral-500 transition-colors hover:text-white lg:w-auto lg:min-w-[280px]">
            Belum terhubung? Ajukan booking dulu
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Footer({ profile }) {
  return (
    <footer id="kontak" className="border-t border-white/10 bg-[#0D0E10]">
      <div className="mx-auto max-w-[1600px] px-6 pt-20 pb-10 lg:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 text-white">
              <LogoMark className="h-9 w-9" />
              <span className="font-display text-2xl italic">ghlib</span>
              <span className="font-meta text-[10px] text-neutral-400">production</span>
            </div>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-neutral-500">
              {profile?.tagline || "Studio fotografi & film."}
            </p>
          </div>
          <div className="md:col-span-3">
            <p className="font-meta text-[10px] text-neutral-500">Kontak</p>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li><a href={`mailto:${profile?.email || ""}`} className="transition-colors hover:text-white">{profile?.email}</a></li>
              <li>{profile?.phone}</li>
              <li>{profile?.location}</li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="font-meta text-[10px] text-neutral-500">Sosial</p>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li><a href={profile?.instagram || "#"} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">Instagram</a></li>
              <li><a href={profile?.youtube || "#"} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">YouTube</a></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <p className="font-meta text-[10px] text-neutral-500">Navigasi</p>
            <ul className="mt-6 space-y-3 text-sm text-neutral-300">
              <li><a href="#karya" className="transition-colors hover:text-white">Karya</a></li>
              <li><a href="#layanan" className="transition-colors hover:text-white">Layanan</a></li>
              <li><Link to="/book" className="transition-colors hover:text-white">Booking</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-20 select-none text-center font-display text-[13vw] italic leading-none text-white/[0.05] md:text-[10vw]">
          ghlibproduction
        </p>

        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 md:flex-row">
          <p className="font-meta text-[9px] text-neutral-600">© {new Date().getFullYear()} GH LIB PRODUCTION. HAK CIPTA DILINDUNGI.</p>
          <div className="flex flex-wrap justify-center gap-5 font-meta text-[9px] text-neutral-500">
            <Link to="/kebijakan-privasi" className="hover:text-white">Kebijakan Privasi</Link>
            <Link to="/ketentuan-layanan" className="hover:text-white">Ketentuan Layanan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
