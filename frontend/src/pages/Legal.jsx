import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const documents = {
  privacy: {
    title: "Kebijakan Privasi",
    intro: "Kebijakan ini menjelaskan pemrosesan data pribadi dalam situs dan portal klien ghlibproduction.",
    sections: [
      ["Identitas dan kontak", "Layanan ghlibproduction dioperasikan oleh Muhammad Ghalib Afnan. Untuk pertanyaan atau permintaan terkait data pribadi, hubungi farisamrullah4321@gmail.com."],
      ["Data yang kami proses", "Ketika Anda masuk dengan Google, kami menerima nama, alamat email, dan foto profil yang tersedia untuk akun Anda. Kami menggunakan informasi tersebut untuk mengenali akun dan menghubungkannya dengan data klien studio. Sistem autentikasi juga dapat menyimpan informasi sesi serta token yang diberikan penyedia autentikasi."],
      ["Data booking dan proyek", "Kami dapat memproses nama, email, nomor telepon, jenis layanan, jadwal, lokasi, dan catatan booking. Dalam proyek klien, kami juga dapat menyimpan foto atau media, pilihan foto, komentar, permintaan revisi, notifikasi, serta bukti pembayaran membership yang Anda unggah untuk diverifikasi admin. Cookie sesi dan informasi teknis permintaan digunakan untuk menjalankan serta menjaga keamanan layanan."],
      ["Penggunaan dan penyimpanan", "Data digunakan untuk menjalankan portal, mengelola booking dan proyek, menyampaikan hasil, menangani revisi, berkomunikasi, dan menjaga keamanan. Data akun, foto, dan media klien disimpan selama akun masih aktif. Hubungi kami untuk meminta penutupan akun atau penghapusan data; penanganan permintaan mempertimbangkan kewajiban hukum dan hak pihak lain."],
      ["Penyedia layanan", "Kami menggunakan Google untuk login, Vercel untuk menjalankan aplikasi, dan Neon untuk menyimpan data. Penyedia tersebut memproses data yang diperlukan untuk menyediakan layanannya. Database kami berada di Amerika Serikat; penyedia layanan dapat memproses data di lokasi lain sesuai layanan yang mereka gunakan."],
      ["Hak dan permintaan", "Anda dapat menghubungi kami untuk meminta informasi, akses, perbaikan, atau penghapusan data pribadi sesuai ketentuan yang berlaku. Kami dapat meminta verifikasi identitas dan mempertimbangkan kewajiban hukum serta hak pihak lain."],
    ],
  },
  terms: {
    title: "Ketentuan Layanan",
    intro: "Ketentuan ini berlaku untuk penggunaan situs dan portal klien ghlibproduction.",
    sections: [
      ["Penyelenggara", "Layanan ghlibproduction disediakan oleh Muhammad Ghalib Afnan. Hubungi farisamrullah4321@gmail.com untuk pertanyaan tentang layanan."],
      ["Akun dan akses", "Anda bertanggung jawab menjaga akses ke akun Google yang digunakan untuk masuk. Login tidak otomatis membuat proyek; studio menghubungkan proyek ke akun klien berdasarkan email yang tercatat."],
      ["Booking dan pekerjaan studio", "Pengajuan booking adalah permintaan dan belum merupakan konfirmasi jadwal sampai disetujui studio. Harga, pembayaran, pembatalan, jadwal, dan revisi mengikuti perjanjian terpisah yang disepakati antara studio dan klien."],
      ["Hak dan penggunaan media", "Hak cipta, lisensi, dan penggunaan hasil mengikuti kesepakatan proyek. Studio dapat menggunakan foto klien untuk portofolio, dengan tetap memperhatikan kesepakatan proyek yang berlaku. Pengguna tidak boleh mengakses proyek orang lain tanpa izin atau mengganggu layanan."],
      ["Ketersediaan", "Layanan dapat mengalami gangguan atau pemeliharaan. Untuk pertanyaan atau kendala terkait layanan, hubungi studio melalui email kontak."],
      ["Privasi", "Pemrosesan data pribadi dijelaskan dalam Kebijakan Privasi ghlibproduction."],
    ],
  },
};

export default function Legal({ type }) {
  const document = documents[type];
  return (
    <main className="min-h-screen bg-[#08090A] px-6 py-12 text-white sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Link to="/" aria-label="Kembali ke beranda"><Logo /></Link>
        <p className="mt-16 font-meta text-[10px] text-neutral-500">GH LIB PRODUCTION</p>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl">{document.title}</h1>
        <p className="mt-6 text-sm leading-7 text-neutral-400">{document.intro}</p>
        <div className="mt-12 space-y-9">
          {document.sections.map(([title, body]) => (
            <section key={title}>
              <h2 className="font-display text-2xl text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-400">{body}</p>
            </section>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-6 border-t border-white/10 pt-6 text-xs text-neutral-400">
          <Link to="/" className="hover:text-white">Beranda</Link>
          <Link to={type === "privacy" ? "/ketentuan-layanan" : "/kebijakan-privasi"} className="hover:text-white">
            {type === "privacy" ? "Ketentuan Layanan" : "Kebijakan Privasi"}
          </Link>
        </div>
      </div>
    </main>
  );
}
