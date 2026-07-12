# Arkafa — Travel & Photo Studio (Demo)

Website demo berdasarkan PRD & Task Breakdown "Travel & Foto Studio". Terdiri dari
**tiga bagian terpisah**:

| Bagian | URL | Aksen stabilo |
|---|---|---|
| Landing Page (gerbang) | `/` | Kuning |
| Arkafa Travel | `/travel` | Kuning + terakota |
| Arkafa Photo Studio | `/studio` | Pink + plum |

Identitas visual mengikuti logo (`public/logo.png`) yang berupa sketsa pensil:
**konsep sketchbook** — latar kertas krem bertitik, tinta grafit, font tulisan
tangan (Caveat untuk judul, Patrick Hand untuk teks), border bergelombang ala
coretan, bayangan offset spidol, dan highlight stabilo. Logo menyatu ke kertas
lewat `mix-blend-mode: multiply`. Header: logo di pojok kiri, menu di tengah,
tombol akun (Masuk/Daftar) di pojok kanan. Copywriting tetap santai Gen-Z
("Gas Aja!", "bestie", "anti ribet").

Data tersimpan di **database PostgreSQL (Neon)** dan diakses lewat **API backend**
(folder `server/`). Frontend tidak lagi memakai localStorage kecuali untuk token
sesi dan photo strip hasil booth (gambar besar, per perangkat).

## Menjalankan

Butuh dua proses:

```bash
# 1) Backend API (port 4000)
cd server
npm install
npm run setup    # sekali saja: buat tabel + seed data demo (perlu DATABASE_URL di server/.env)
npm run dev

# 2) Frontend (port 5173)
npm install
npm run dev      # buka http://localhost:5173
npm run build    # build produksi ke folder dist/
```

## Akun demo

- **Nomor WhatsApp:** `089876543210`
- **Kata sandi:** `demo1234`

Akun ini sudah berisi riwayat pemesanan, tautan hasil foto, dan teman referral dummy.

## Fitur per modul (sesuai PRD)

**Arkafa Travel** (`/travel`) — EO liburan & gathering
- Katalog paket wisata (8 paket dummy: Lembang, Garut, Pangandaran, Dieng,
  Pulau Seribu, Bromo, Jogja, Bali) dengan harga per orang, minimal peserta,
  fasilitas, dan kategori acara.
- Filter jenis acara (open trip, private trip, family gathering, outing kantor,
  study tour) + destinasi + rencana tanggal + jumlah peserta (estimasi total otomatis).
- Konsultasi/pesan via WhatsApp (`wa.me`) dengan template otomatis berisi detail
  paket & rencana; nama disertakan jika login. Ada CTA "Racik Trip Custom".
- Riwayat pemesanan trip dengan status (`/travel/riwayat`, wajib login).

**Arkafa Photo Studio** (`/studio`)
- **Arkafa Photo Booth** (`/studio/booth`) — alur lengkap ala self photo studio:
  1. **Pilih layout** dengan harga per sesi (OG Strip 3 pose Rp25rb, Extra Strip
     4 pose Rp30rb, Feed-Ready Grid 2×2 Rp30rb, Main Character/polaroid Rp20rb).
  2. **Bayar** — simulasi kode sesi dari kasir (demo: `ARKAFA`); tamu mengisi
     nomor WhatsApp untuk terima link, pengguna login otomatis teridentifikasi.
  3. **Sesi foto** — countdown otomatis (3/5/10 detik), efek kilat, pose beruntun.
  4. **Edit & bingkai** — edit per pose (kecerahan/kontras/saturasi + jepret
     ulang), 8 warna bingkai, 5 filter, cap "Arkafa PHOTO BOOTH" + tanggal.
  5. **Output** — hanya **Cetak** (print CSS khusus strip) dan **Kirim Link**
     via WhatsApp (simulasi tautan bertoken); login → strip otomatis tersimpan
     ke Galeri Saya. Tombol kembali mundur per fase.
  *(Modul editor foto mandiri dihapus — arah bisnis: Travel + Photo Booth saja.)*
- Terima hasil foto (`/studio/galeri`): buka galeri via token ≥16 karakter.
- Galeri kiriman (`/studio/g/:token`): pilih foto, unduh tunggal / ZIP (JSZip),
  bagikan (Web Share API / salin tautan), pesan kedaluwarsa + minta perpanjangan.
- Galeri Saya (`/studio/saya`): daftar tautan (aktif/kedaluwarsa) + hasil edit.

**Panel Admin** (`/admin` — username `admin`, sandi `arkafa123`)
- Ringkasan operasional (pesanan per status, kode sesi terbit, album aktif, pengguna).
- Pesanan Trip: ubah status pesanan → langsung tampil di Riwayat pelanggan.
- Kode Sesi Booth: log semua kode yang diterbitkan (kode, nomor, metode bayar,
  layout, waktu). Tombol **Kirim via WA** membuka WhatsApp admin dengan pesan
  kode sudah terketik ke nomor pelanggan (pengiriman semi-manual, Rp0 — pola
  yang sama layak dipakai sampai volume besar, lalu ganti WhatsApp gateway).
- Paket Wisata: tambah paket baru (foto placeholder dulu — upload butuh backend),
  ubah harga/min. peserta, aktif/nonaktifkan, & hapus paket → langsung berlaku
  di halaman Arkafa Travel. Riwayat pesanan lama tetap utuh walau paketnya dihapus.
- Bingkai Booth: kelola model bingkai strip. Bawaan berisi 4 **desain custom
  Arkafa** (Sketchbook, Lovey Dovey, Starry Night, Confetti Pop — pola SVG buatan
  sendiri) + pilihan warna polos/gradasi. Admin bisa menambah bingkai baru dengan
  **upload file desain sendiri** (dikecilkan otomatis; produksi: object storage)
  atau meracik warna, lengkap dengan pratinjau langsung; juga aktif/nonaktifkan &
  hapus. Minimal satu bingkai aktif selalu tersisa. Desain digambar sebagai latar
  strip di canvas booth.
- Album Galeri: **upload album baru** (banyak foto sekaligus, masa berlaku
  bisa diatur, nomor WA pelanggan opsional) → server membuat tautan bertoken;
  tombol **Kirim Link via WA** membuka WhatsApp dengan pesan link sudah terketik.
  Juga: perpanjang masa berlaku +30 hari & hapus album (file ikut terhapus).
- Foto paket wisata & desain bingkai kini bisa di-upload dari panel admin;
  file tersimpan di `server/uploads/` (pengganti object storage selama fase
  gratis — di produksi tinggal alihkan ke R2/S3).

**Akun bersama**
- Daftar (`/daftar`): validasi duplikat nomor, sandi min. 8 karakter, kode referral
  opsional (terisi otomatis via `?ref=KODE`), verifikasi OTP (disimulasikan di layar).
- Masuk (`/masuk`): remember me, lupa kata sandi (simulasi), rate limiting
  5 percobaan/60 detik.
- Undang Teman (`/undang`): kode referral unik, salin/bagikan, daftar teman
  terverifikasi (nama disamarkan).

## Struktur kode

```
src/
├── data/dummy.js          # rute, jadwal, album foto, akun demo, util format
├── lib/store.jsx          # AuthProvider: auth, OTP, referral, data per pengguna
├── components/SitusLayout.jsx  # navbar+footer per situs (travel/studio/akun)
└── pages/
    ├── Landing.jsx
    ├── travel/  TravelHome, Riwayat
    ├── studio/  StudioHome, Editor, GaleriIndex, GaleriView, GaleriSaya
    └── akun/    Masuk, Daftar, Undang
```

## Backend (folder `server/`)

API Express + Prisma + PostgreSQL (Neon, tier gratis), berjalan di
`http://localhost:4000` (hanya localhost). Endpoint: auth (daftar/OTP/masuk,
JWT + bcrypt, rate limit), katalog paket, bingkai booth, galeri bertoken
(kedaluwarsa dicek server), pesanan, kode sesi booth, dan seluruh operasi panel
admin (dilindungi peran admin sungguhan — pengguna biasa ditolak 403).

Login admin: username `admin` / sandi `arkafa123` (tersimpan ter-hash).
Seluruh frontend sudah memakai API ini (Fase 2 selesai): katalog & riwayat
travel, auth + referral, booth (bingkai & kode sesi), galeri bertoken, dan
panel admin. Base URL API bisa dioverride dengan env `VITE_API_URL` saat deploy.

## Menuju produksi (belum termasuk)

Payment gateway Midtrans/Xendit untuk booth (sandbox-nya gratis, butuh akun),
WhatsApp gateway otomatis (sementara diganti pengiriman semi-manual via tombol
"Kirim via WA" — Rp0), pemindahan `server/uploads/` ke object storage, deploy
(hosting + domain), dan keputusan Open Questions PRD (F0-1).
