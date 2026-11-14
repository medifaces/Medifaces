# MEDIFACES v1.0
> **Smart Attendance, Better Healthcare**  
> Sistem absensi rumah sakit berbasis pengenalan wajah biometrik dan geofencing radius akurat.

---

## 🌟 Fitur Utama

- **Presensi Wajah & Liveness Detection**: Pemindaian kamera dengan deteksi kedipan alami (*liveness verification*) dan pencocokan template wajah biometrik.
- **Geofencing Haversine**: Verifikasi koordinat GPS terhadap titik pusat rumah sakit (Fakultas Vokasi UI, Depok: Lat `-6.3642`, Lng `106.8285`) dengan batas radius dinamis (default: 100 m) dan toleransi keterlambatan (15 menit).
- **Portal MSDM (Admin)**:
  - **Dashboard Real-Time**: 4 metrik staf, grafik tren kehadiran mingguan Recharts, rekap kedisiplinan per unit instalasi.
  - **Absensi Live & Deteksi**: Audit pemindaian real-time dan analisis alasan penolakan (di luar radius, wajah tidak cocok, liveness gagal).
  - **Data Pegawai**: Manajemen staf medis, status pendaftaran wajah biometrik, dan aktivasi akun.
  - **Jadwal & Shift**: Matriks alokasi mingguan staf x hari (Pagi, Siang, Malam, Libur).
  - **Riwayat Absensi**: Log presensi lengkap dengan foto bukti dan fasilitas koreksi manual.
  - **Laporan & Ekspor**: Rekap kehadiran per unit instalasi, ekspor Excel (CSV), dan cetak PDF resmi.
  - **Izin & Cuti**: Verifikasi surat keterangan dokter dan persetujuan instan (*Setujui* / *Tolak*).
  - **Pengaturan Sistem**: Pengaturan koordinat geofencing, radius, toleransi, ambang batas wajah, dan mode uji coba.
- **Aplikasi Pegawai (Mobile-First 390px)**:
  - Jam digital presisi tinggi (84px tabular-nums dengan detik 28px).
  - Ganti shift operasional (9 pilihan shift).
  - Indikator status GPS real-time.
  - Pengajuan izin sakit/cuti dengan unggah dokumen pendukung.
  - Pembaruan template biometrik wajah mandiri di profil.
  - Keamanan wajib ganti kata sandi pada login pertama (`must_change_password`).

---

## 🛠️ Tech Stack

- **Frontend**: Vite, React 18, Tailwind CSS, Lucide React, Recharts
- **Backend**: Netlify Functions (`/netlify/functions`)
- **Database**: PostgreSQL (Neon Database) via `@neondatabase/serverless` / Drizzle ORM
- **Keamanan**: Password hashing `bcryptjs` (10 rounds), token sesi `jsonwebtoken` (JWT 7 hari)
- **Deployment**: Netlify (Site ID: `f28d8b2f-99e6-489b-95c4-ac551cd176a3`)
- **Repository**: [https://github.com/medifaces/Medifaces.git](https://github.com/medifaces/Medifaces.git)

---

## 🔒 Konfigurasi Environment Variables

Aplikasi menggunakan environment variables untuk keamanan rahasia. **Jangan pernah menulis password, database URL, atau token rahasia ke dalam kode atau git commit.**

Template variabel dapat dilihat di file [`.env.example`](file:///.env.example):

```env
DATABASE_URL=
JWT_SECRET=
SEED_PASSWORD=
ALLOW_GPS_SIMULATION=
```

### Penjelasan Variabel:

| Variabel | Deskripsi | Nilai Rekomendasi / Default |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL Neon (`postgres://...`) | Disediakan oleh Neon Console |
| `JWT_SECRET` | Kunci rahasia untuk tanda tangan token JWT | String acak 32+ karakter |
| `SEED_PASSWORD` | Kata sandi default untuk akun awal dan aktivasi baru | `vokasi123` |
| `ALLOW_GPS_SIMULATION` | Menampilkan toggle simulasi GPS untuk mode uji coba | `true` atau `false` |

---

## 🗄️ Inisialisasi Database (PostgreSQL / Neon)

1. Buka dashboard Neon Anda di [console.neon.tech](https://console.neon.tech).
2. Buat database baru untuk proyek **MEDIFACES**.
3. Buka menu **SQL Editor** pada database tersebut.
4. Salin seluruh isi file [`schema.sql`](file:///schema.sql) dan jalankan (*Run*).
5. Script tersebut akan membuat tabel-tabel berikut beserta data seed awal:
   - `pengaturan` (konfigurasi geofencing dan ambang batas wajah)
   - `shifts` (9 shift operasional rumah sakit)
   - `users` (akun seed MSDM & Karyawan)
   - `jadwal` (jadwal mingguan staf)
   - `absensi` (transaksi presensi biometrik)
   - `pengajuan_izin` (permohonan cuti dan sakit)
   - `audit_log` (audit trail verifikasi dan penolakan)

---

## 🚀 Panduan Deploy ke Netlify

### Cara 1: Menggunakan Netlify Web Dashboard

1. Masuk ke [app.netlify.com](https://app.netlify.com) dan pilih situs:
   - **Site ID**: `f28d8b2f-99e6-489b-95c4-ac551cd176a3`
2. Buka menu **Site configuration** > **Environment variables**.
3. Tambahkan 4 variabel environment di atas (`DATABASE_URL`, `JWT_SECRET`, `SEED_PASSWORD`, `ALLOW_GPS_SIMULATION`).
4. Pada menu **Build & deploy**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. Lakukan deployment (baik via Git Push ke `https://github.com/medifaces/Medifaces.git` atau Netlify CLI).

### Cara 2: Menggunakan Netlify CLI

```bash
# Login ke Netlify
npx netlify login

# Link ke situs yang sudah ada
npx netlify link --id f28d8b2f-99e6-489b-95c4-ac551cd176a3

# Set environment variable di Netlify
npx netlify env:set DATABASE_URL "postgres://user:password@ep-xyz.neon.tech/neondb?sslmode=require"
npx netlify env:set JWT_SECRET "rahasia_jwt_medifaces_super_aman_2026"
npx netlify env:set SEED_PASSWORD "vokasi123"
npx netlify env:set ALLOW_GPS_SIMULATION "true"

# Build dan deploy ke production
npm run build
npx netlify deploy --prod
```

---

## 💻 Menjalankan di Komputer Lokal (Development)

```bash
# 1. Salin template env
cp .env.example .env

# 2. Isi nilai .env lokal Anda

# 3. Jalankan development server
npm run dev
```

Server Vite akan berjalan di `http://localhost:3000`.

---

## 👥 Akun Uji Coba (Seed Accounts)

| Peran | Email / Identitas | Password Awal | Catatan |
|---|---|---|---|
| **Admin MSDM** | `sdm@vokasi.ui.ac.id` | Nilai `SEED_PASSWORD` (*vokasi123*) | Mengakses Portal MSDM desktop |
| **Pegawai (Staf Medis)** | `sitimuliarahmah@gmail.com` (NIP: `48`) | Nilai `SEED_PASSWORD` (*vokasi123*) | Mengakses presensi mobile |

> **Catatan Keamanan**: Pada saat login pertama kali, sistem akan secara otomatis memunculkan modal aktivasi wajib ganti kata sandi baru (`must_change_password = true`).
