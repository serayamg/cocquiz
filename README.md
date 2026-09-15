# QUIZ ARENA ⚡
### Interactive Training Quiz Platform for Corporate Learning & Workshops

**QUIZ ARENA** adalah platform kuis interaktif real-time yang dirancang khusus untuk kegiatan pelatihan, workshop, seminar, kelas sertifikasi, dan pembelajaran korporat. Aplikasi ini menghadirkan suasana kuis yang **cepat, kompetitif, menyenangkan, edukatif, dan profesional**, tanpa terasa seperti ujian formal.

---

## 🌟 Fitur Utama

1. **Initial Seed Database (15 Soal Code of Conduct & Business Ethics)**
   - 15 butir soal lengkap pilihan ganda A–D yang diambil dari dokumen resmi.
   - Komposisi tingkat kesulitan: **Low** (Soal 1–5), **Medium-Low** (Soal 6–10), dan **Medium / Case-Based** (Soal 11–15).
   - Dilengkapi penjelasan edukasi mendalam (*"Why This Is Correct"*).
2. **Multi-Role System**
   - **Super Admin**: Manajemen user, bank soal (CRUD & bulk import), konfigurasi kuis, analitik, dan export laporan.
   - **Quiz Host / Trainer**: Layar proyektor 1080p, kendali kuis (*Start*, *Pause*, *Show Answer*, *Leaderboard*, *Next Question*, *End Quiz*), QR Code scanner, dan kick participant.
   - **Participant**: Akses mobile-first tanpa perlu login, cukup masukkan nama dan Room Code 6-digit.
3. **Mobile-First Responsive UX**
   - Dioptimalkan untuk smartphone (320px–430px), tablet/iPad portrait & landscape, laptop, desktop, hingga layar proyektor (1920×1080).
   - Tombol touch-target besar (min. 48px), 4 warna kontras tinggi (A: Biru, B: Ungu, C: Teal, D: Oranye) dengan label huruf A/B/C/D yang aksesibel.
4. **Realtime Engine & Strict Anti-Cheat**
   - Latency sub-50ms menggunakan Server-Sent Events (SSE) stream hub & server timestamp.
   - Kunci jawaban dan penjelasan **TIDAK PERNAH dikirim** ke browser peserta sebelum batas waktu ronde berakhir.
   - Fitur *Answer Locked* langsung mengunci jawaban begitu ditekan.
5. **Server-Authoritative Fair Scoring**
   - **Base Score**: 1.000 poin untuk jawaban benar (0 jika salah).
   - **Speed Bonus**: 0–500 poin proporsional terhadap sisa waktu (kecepatan dihitung oleh server, bukan jam browser). Tidak ada speed bonus untuk jawaban salah.
   - **Streak Bonus**: +100 poin untuk 3 jawaban benar beruntun.
   - **Tie-Break Fair Ranking**: Jawaban Benar > Total Skor > Rata-rata Kecepatan Respons.
6. **Edukasi & Gamifikasi Komprehensif**
   - *Answer Distribution*: Diagram statistik sebaran pilihan peserta (A, B, C, D), waktu median, dan waktu jawaban tercepat.
   - *Why This Is Correct*: Kotak wawasan edukasi materi etika perbankan & tata kelola.
   - *Live Leaderboard*: Pergerakan peringkat dinamis (`↑2`, `↓1`, `—`).
   - *Winner Podium*: Perayaan animasi podium 3 besar (🥇, 🥈, 🥉) disertai confetti.
   - *Review Answers*: Peserta dapat meninjau kembali seluruh jawaban mereka beserta penjelasan lengkap setelah kuis usai.
7. **Admin Dashboard & Learning Analytics**
   - **Question Bank**: Tabel pencarian, filter kesulitan/topik/status, Question Editor modal, dan Import CSV/JSON.
   - **7-Step Create Quiz Wizard**: Langkah pembuatan kuis dari bank soal, pemilihan acak/berurutan, pengaturan waktu (5s–60s), dan 4 Game Modes (*Classic*, *Speed Challenge*, *Learning Mode*, *Team Battle*).
   - **Topic Analysis**: Grafik tingkat penguasaan materi (Dasar Etika, GCG, Benturan Kepentingan, Fraud Triangle, Kerahasiaan Data, Speak-Up, dll.).
   - **Automatic Training Insights**: Rekomendasi otomatis kepada trainer mengenai materi yang perlu diperkuat (*reinforcement*) sebelum sesi berakhir.
   - **Export Reports**: Unduh rekapitulasi leaderboard, daftar absensi (*attendance*), dan performa soal dalam format CSV.
8. **Synthesized Web Audio Engine**
   - Efek suara tanpa file eksternal (menggunakan Web Audio API native): *Quiz Start*, *Countdown Ticks*, *Answer Locked*, *Correct Fanfare*, *Incorrect Buzzer*, dan *Podium Celebration*.
   - Tombol Mute / Unmute independen untuk host maupun peserta.

---

## 🚀 Quick Start (Menjalankan Secara Lokal)

### 1. Prasyarat
- **Node.js**: v18+ atau v20+ atau v24+
- **npm** atau **yarn** / **pnpm**

### 2. Instalasi Dependensi
```bash
cd c:\Users\sasib\Downloads\QuizCOC
npm install
```

### 3. Migrasi & Seed Database
```bash
# Push skema Prisma ke database SQLite lokal
npm run db:push

# Isi 15 butir soal resmi Code of Conduct dan akun bawaan
npm run db:seed
```

### 4. Menjalankan Aplikasi
```bash
# Mode Pengembangan (Dev)
npm run dev

# Atau Mode Produksi (Build & Start)
npm run build
npm run start
```
Aplikasi akan aktif di `http://localhost:3000`.

---

## 🔑 Akun & Room Demo Bawaan

| Role | Identitas / URL | Kredensial / Kode |
| :--- | :--- | :--- |
| **Super Admin** | `http://localhost:3000/admin/login` | Email: `admin@quizarena.com`<br>Password: `Admin@123456` |
| **Trainer Host** | `http://localhost:3000/admin/login` | Email: `trainer@quizarena.com`<br>Password: `Trainer@123456` |
| **Demo Host Screen** | `http://localhost:3000/host/784921` | Room Code: `784921` |
| **Peserta (Mobile)** | `http://localhost:3000/join/784921` | Cukup masukkan Nama Peserta |

---

## 🌐 Menghubungkan Smartphone & Laptop dalam Jaringan yang Sama

Untuk mencoba langsung via smartphone (scan QR code):
1. Cari alamat IP lokal komputer Anda di command line: `ipconfig` (misal: `192.168.1.50`).
2. Pastikan smartphone terhubung ke Wi-Fi yang sama.
3. Edit file `.env`:
   ```env
   NEXT_PUBLIC_APP_URL="http://192.168.1.50:3000"
   ```
4. Buka `http://192.168.1.50:3000/host/784921` di browser laptop/proyektor.
5. Scan QR Code yang muncul di layar menggunakan kamera smartphone Anda!

---

## 🚢 Panduan Deployment Produksi

### Opsi 1: Vercel / Node Server dengan PostgreSQL / Supabase
1. Buat database PostgreSQL di [Supabase](https://supabase.com) atau provider cloud lainnya.
2. Perbarui `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set environment variable `DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/[DB]?schema=public"`.
4. Jalankan `npx prisma db push && node prisma/seed.js`.
5. Deploy repository ke Vercel atau server Docker Anda.

---

## 📁 Struktur Direktori
```
QuizCOC/
├── prisma/
│   ├── schema.prisma          # Skema database relasional (User, QuizSession, Participant, Questions, Answers)
│   └── seed.js                # Seed script 15 butir soal Code of Conduct, user admin & demo session
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/         # Endpoint CRUD soal, login, wizard create, analitik, dan export
│   │   │   └── quiz/[code]/   # Endpoint SSE stream, join, answer, host-action, review
│   │   ├── admin/             # Halaman Admin (Dashboard, Bank Soal, Wizard, Analisis, Laporan)
│   │   ├── host/[code]/       # Host Projector Screen (1080p, QR code, timer, statistik, podium)
│   │   ├── join/[code]/       # Halaman registrasi peserta (Room Code, Nama, Unit Kerja)
│   │   ├── room/[code]/       # Tampilan peserta mobile (Waiting, Soal, Locked, Reveal, Scorecard, Review)
│   │   ├── globals.css        # Tema Deep Navy, animasi urgensi, tombol opsi A-D
│   │   ├── layout.tsx         # Root layout, viewport & PWA meta
│   │   └── page.tsx           # Halaman landing page publik
│   ├── components/
│   │   ├── AdminNav.tsx       # Navigasi admin bar
│   │   └── SoundToggle.tsx    # Tombol toggle audio Web Audio API
│   └── lib/
│       ├── prisma.ts          # Singleton Prisma Client
│       ├── quiz-hub.ts        # Realtime event bus SSE, state manager & anti-cheat engine
│       ├── scoring.ts         # Rumus kalkulasi skor, speed bonus, streak & leaderboard tie-break
│       └── sound.ts           # Synthesized Web Audio API sound generator
├── test_e2e.js                # Script uji otomatis 12 skenario end-to-end
├── package.json
└── tailwind.config.js
```

---

*QUIZ ARENA © 2026 • Interactive Training & Corporate Learning Platform*
