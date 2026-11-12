# ghlibproduction

Aplikasi web untuk studio fotografi dan film: menampilkan portofolio dan layanan, menerima permintaan sesi, serta mengelola proyek dan proses review bersama klien.

## Fitur

- **Situs publik:** profil studio, layanan, portofolio, halaman legal, dan formulir pemesanan sesi.
- **Dashboard klien:** ringkasan proyek dan sesi, galeri proofing, pemilihan foto, permintaan revisi, riwayat aktivitas, notifikasi, dan persetujuan hasil akhir.
- **Dashboard admin:** pengelolaan klien, proyek, media, revisi, sesi, portofolio, dan informasi studio. Permintaan sesi dapat dikonversi menjadi proyek.
- **Membership:** pembayaran Pro melalui QRIS dengan unggahan bukti dan verifikasi manual oleh admin. Masa aktif bertambah 30 hari setelah disetujui.
- **Autentikasi:** login Google untuk klien dan login email/kata sandi untuk admin menggunakan Better Auth.

Halaman membership juga menampilkan sejumlah fitur yang masih dalam pengembangan; lihat keterangan pada halaman tersebut untuk statusnya.

## Teknologi

- React 19, React Router, Tailwind CSS, Axios, dan CRACO
- Python, FastAPI, dan asyncpg
- PostgreSQL dan Better Auth
- Vercel untuk routing dan deployment

## Struktur proyek

```text
├── api/                  # Entry point Vercel untuk FastAPI dan Better Auth
├── auth/                 # Konfigurasi autentikasi dan setup admin
├── backend/              # API, skema database, dan logika aplikasi
│   ├── routes_public.py
│   ├── routes_client.py
│   ├── routes_admin.py
│   ├── routes_membership.py
│   ├── auth_core.py
│   └── models.py
├── frontend/             # Aplikasi React
│   ├── public/
│   └── src/
│       ├── components/   # Komponen situs, dashboard, dan UI
│       ├── lib/          # Klien API dan konteks autentikasi
│       └── pages/        # Halaman publik, klien, dan admin
├── package.json          # Dependensi dan skrip Better Auth
├── requirements.txt      # Dependensi Python untuk deployment
└── vercel.json           # Build dan rewrite Vercel
```

## Persiapan

Siapkan Node.js 22, Yarn 1, Python 3.10 atau lebih baru, dan database PostgreSQL yang mendukung SSL. Siapkan juga kredensial Google OAuth serta konfigurasi lingkungan Vercel untuk menjalankan kedua handler API melalui origin yang sama.

Variabel lingkungan yang digunakan:

| Variabel | Kegunaan |
| --- | --- |
| `DATABASE_URL` | URL koneksi PostgreSQL untuk FastAPI dan Better Auth. |
| `BETTER_AUTH_URL` | Origin aplikasi yang melayani `/api/auth`. |
| `BETTER_AUTH_SECRET` | Secret untuk Better Auth. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Kredensial Google OAuth. |
| `ADMIN_EMAILS` | Daftar email admin dipisahkan koma untuk pengguna baru yang diprovisikan oleh API. |
| `CORS_ORIGINS` | Daftar origin yang diizinkan, dipisahkan koma. |
| `REACT_APP_BACKEND_URL` | Opsional; origin API frontend. Kosongkan bila API dilayani dari origin yang sama. |
| `ADMIN_SETUP_PASSWORD` | Kata sandi saat menjalankan skrip setup admin; minimal 8 karakter. |

Konfigurasikan redirect URI Google OAuth sesuai origin Better Auth, misalnya `https://domain-anda/api/auth/callback/google`. Simpan secret di environment lokal atau pengaturan environment Vercel; jangan masukkan nilainya ke repositori.

## Instalasi dan menjalankan

1. Instal dependensi dari root proyek:

   ```bash
   npm install
   python -m venv .venv
   source .venv/bin/activate
   pip install -r backend/requirements.txt
   cd frontend
   yarn install
   cd ..
   ```

2. Siapkan variabel lingkungan di atas untuk proses yang menjalankan aplikasi. Untuk Vercel CLI, variabel lokal dapat disediakan melalui `.env.local`; skrip Node dan migrasi juga perlu menerima variabelnya di environment proses.

3. Jalankan migrasi Better Auth sebelum menggunakan autentikasi:

   ```bash
   npm run auth:migrate
   ```

   FastAPI membuat tabel aplikasi dan mengisi profil serta portofolio awal saat startup jika belum tersedia.

4. Untuk menyiapkan akun admin bawaan, jalankan perintah berikut setelah migrasi, dengan `DATABASE_URL` dan `ADMIN_SETUP_PASSWORD` tersedia di environment:

   ```bash
   npm run auth:setup-admin
   ```

   Skrip ini menggunakan alamat email yang ditetapkan di [auth/setup-admin.js](auth/setup-admin.js). Periksa dan sesuaikan alamat tersebut sebelum menjalankannya untuk instalasi lain. Menjalankan ulang skrip pada akun yang sudah ada memperbarui kata sandinya dan menghapus sesi autentikasinya.

5. Jalankan aplikasi menggunakan Vercel CLI dari root agar rewrite untuk Better Auth dan FastAPI diterapkan:

   ```bash
   npx vercel dev
   ```

   Konfigurasi Vercel membangun frontend dari `frontend/build`. Pastikan `BETTER_AUTH_URL`, origin frontend, pengaturan OAuth, dan environment lokal sesuai dengan alamat yang digunakan.

Untuk menjalankan frontend secara terpisah, gunakan `cd frontend && yarn start`. Frontend tetap memerlukan API dan layanan autentikasi yang dapat diakses; API FastAPI saja tidak melayani endpoint Better Auth.

## Build dan pemeriksaan

```bash
cd frontend
yarn build
yarn test
```

Endpoint pemeriksaan API tersedia di `/api/health`. Deployment Vercel menggunakan perintah build dan rewrite yang tercantum dalam [vercel.json](vercel.json).
