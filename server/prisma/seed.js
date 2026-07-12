// Seed database Arkafa dengan data demo yang sama persis dengan frontend (src/data/dummy.js).
// Aman dijalankan berulang (upsert).
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---------- Paket wisata ----------
const PAKET = [
  {
    id: "lembang", nama: "Lembang & Floating Market", lokasi: "Bandung",
    durasi: "1 hari", hargaPerOrang: 250000, minPeserta: 10,
    kategori: ["open", "family", "kantor"],
    fasilitas: ["Transport PP", "Makan siang", "Tiket wisata", "Tour leader", "Dokumentasi"],
    ringkas: "Jalan santai keliling Lembang: Floating Market, Farmhouse, dan spot foto kekinian.",
  },
  {
    id: "garut", nama: "Garut Cipanas Gathering", lokasi: "Garut",
    durasi: "1 hari", hargaPerOrang: 300000, minPeserta: 20,
    kategori: ["family", "kantor"],
    fasilitas: ["Transport PP", "Villa transit + kolam air panas", "2x makan", "Games & doorprize", "MC/pemandu"],
    ringkas: "Paket gathering favorit: berendam air panas, games seru tim, dan makan bersama.",
  },
  {
    id: "pangandaran", nama: "Pantai Pangandaran", lokasi: "Pangandaran",
    durasi: "2 hari 1 malam", hargaPerOrang: 450000, minPeserta: 15,
    kategori: ["open", "family", "kantor"],
    fasilitas: ["Transport PP", "Hotel 1 malam", "3x makan", "Api unggun & BBQ", "Body rafting Green Canyon (opsional)"],
    ringkas: "Sunset di pantai barat, susur Green Canyon, dan malam keakraban di tepi laut.",
  },
  {
    id: "dieng", nama: "Dieng Negeri di Atas Awan", lokasi: "Wonosobo",
    durasi: "2 hari 1 malam", hargaPerOrang: 550000, minPeserta: 10,
    kategori: ["open", "study"],
    fasilitas: ["Transport PP", "Homestay 1 malam", "3x makan", "Sunrise Sikunir", "Tiket kawah & candi"],
    ringkas: "Kejar golden sunrise Sikunir, telaga warna, dan candi Arjuna yang legendaris.",
  },
  {
    id: "seribu", nama: "Pulau Seribu Escape", lokasi: "Kep. Seribu",
    durasi: "2 hari 1 malam", hargaPerOrang: 650000, minPeserta: 12,
    kategori: ["family", "kantor", "open"],
    fasilitas: ["Kapal PP", "Penginapan 1 malam", "3x makan", "Snorkeling + alat", "Dokumentasi underwater"],
    ringkas: "Snorkeling air biru, BBQ seafood, dan bersantai jauh dari hiruk pikuk kota.",
  },
  {
    id: "bromo", nama: "Bromo Sunrise Adventure", lokasi: "Malang",
    durasi: "2 hari 1 malam", hargaPerOrang: 750000, minPeserta: 8,
    kategori: ["open", "private"],
    fasilitas: ["Transport PP", "Jeep Bromo", "Penginapan 1 malam", "3x makan", "Tiket TN Bromo"],
    ringkas: "Sunrise di Penanjakan, lautan pasir, dan kawah Bromo — trip bucket list sejuta umat.",
  },
  {
    id: "jogja", nama: "Jogja Klasik & Merapi", lokasi: "Yogyakarta",
    durasi: "3 hari 2 malam", hargaPerOrang: 850000, minPeserta: 10,
    kategori: ["open", "family", "study"],
    fasilitas: ["Transport PP", "Hotel 2 malam", "6x makan", "Lava tour Merapi", "Borobudur & Malioboro"],
    ringkas: "Paket lengkap Jogja: candi, lava tour jeep, kuliner Gudeg, dan oleh-oleh Malioboro.",
  },
  {
    id: "bali", nama: "Bali Favorit", lokasi: "Bali",
    durasi: "4 hari 3 malam", hargaPerOrang: 2350000, minPeserta: 6,
    kategori: ["private", "family"],
    fasilitas: ["Tiket & transport", "Hotel 3 malam", "Makan full", "Uluwatu, Ubud, Nusa Penida", "Dokumentasi"],
    ringkas: "Itinerary Bali anti-mainstream yang bisa diracik sesuai keluarga atau tim Anda.",
  },
];

// ---------- Bingkai booth (desain SVG sama dengan frontend) ----------
function svgBingkai(latar, isi) {
  const w = 1000, h = 1400;
  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<rect width="${w}" height="${h}" fill="${latar}"/>` + isi + `</svg>`
    )
  );
}

function taburan(jumlah, gambarkan) {
  let s = "";
  for (let i = 0; i < jumlah; i++) {
    const x = 30 + ((i * 263 + 71) % 940);
    const y = 30 + ((i * 397 + 113) % 1340);
    const rot = (i * 47) % 360;
    const skala = 0.7 + ((i * 29) % 10) / 12;
    s += gambarkan(i, x, y, rot, skala);
  }
  return s;
}

const HATI = "M12 21C7 17 4 13.5 4 10a4.4 4.4 0 0 1 8-2.4A4.4 4.4 0 0 1 20 10c0 3.5-3 7-8 11z";
const BINTANG = "10,0 12.9,6.9 20,7.6 14.5,12.4 16.2,19.4 10,15.5 3.8,19.4 5.5,12.4 0,7.6 7.1,6.9";
const WARNA_KONFETI = ["#f472b6", "#fbbf24", "#38bdf8", "#4ade80", "#a78bfa", "#fb7185"];

const DESAIN_SKETSA = svgBingkai(
  "#f6f1e5",
  taburan(14, (i, x, y, rot, sk) =>
    `<rect x="${x}" y="${y}" width="${64 * sk}" height="${16 * sk}" rx="8" fill="#fcd34d" opacity="0.5" transform="rotate(${(rot % 30) - 15} ${x} ${y})"/>`
  ) +
  taburan(22, (i, x, y, rot, sk) =>
    i % 2
      ? `<circle cx="${(x + 130) % 1000}" cy="${y}" r="${10 * sk}" fill="none" stroke="#2b2926" stroke-width="2.5" opacity="0.45"/>`
      : `<path d="M-8 0 L8 0 M0 -8 L0 8" stroke="#2b2926" stroke-width="2.5" opacity="0.45" transform="translate(${x} ${(y + 60) % 1400}) rotate(${rot})"/>`
  )
);

const DESAIN_LOVEY = svgBingkai(
  "#fbcfe8",
  taburan(26, (i, x, y, rot, sk) =>
    `<path d="${HATI}" fill="${i % 3 === 0 ? "#ffffff" : "#f472b6"}" opacity="0.8" transform="translate(${x} ${y}) rotate(${rot} 12 12) scale(${(sk * 1.5).toFixed(2)})"/>`
  )
);

const DESAIN_BINTANG = svgBingkai(
  "#1e1b4b",
  taburan(32, (i, x, y, rot, sk) =>
    `<polygon points="${BINTANG}" fill="${i % 4 === 0 ? "#fde047" : "#e0e7ff"}" opacity="${i % 3 ? 0.7 : 0.95}" transform="translate(${x} ${y}) rotate(${rot} 10 10) scale(${(sk * 1.3).toFixed(2)})"/>`
  )
);

const DESAIN_KONFETI = svgBingkai(
  "#fffdf4",
  taburan(44, (i, x, y, rot, sk) => {
    const warna = WARNA_KONFETI[i % WARNA_KONFETI.length];
    return i % 2
      ? `<circle cx="${x}" cy="${y}" r="${(7 * sk).toFixed(1)}" fill="${warna}" opacity="0.85"/>`
      : `<rect x="${x}" y="${y}" width="${(20 * sk).toFixed(1)}" height="${(8 * sk).toFixed(1)}" rx="4" fill="${warna}" opacity="0.85" transform="rotate(${rot} ${x} ${y})"/>`;
  })
);

const BINGKAI = [
  { id: "sketsa", nama: "Sketchbook Arkafa", gambar: DESAIN_SKETSA, bg: "#f6f1e5", teks: "#2b2926", sub: "#6b675f" },
  { id: "lovey", nama: "Lovey Dovey", gambar: DESAIN_LOVEY, bg: "#fbcfe8", teks: "#831843", sub: "#9d174d" },
  { id: "starry", nama: "Starry Night", gambar: DESAIN_BINTANG, bg: "#1e1b4b", teks: "#fef9c3", sub: "#a5b4fc" },
  { id: "konfeti", nama: "Confetti Pop", gambar: DESAIN_KONFETI, bg: "#fffdf4", teks: "#1c1917", sub: "#78716c" },
  { id: "milky", nama: "Milky", bg: "#fffdf7", teks: "#1c1917", sub: "#78716c" },
  { id: "midnight", nama: "Midnight", bg: "#18122b", bg2: "#312e81", gradien: true, teks: "#f5f3ff", sub: "#a5b4fc" },
  { id: "bubblegum", nama: "Bubblegum", bg: "#fbcfe8", bg2: "#f472b6", gradien: true, teks: "#831843", sub: "#9d174d" },
  { id: "grape", nama: "Grape Soda", bg: "#c4b5fd", bg2: "#7c3aed", gradien: true, teks: "#2e1065", sub: "#4c1d95" },
  { id: "matcha", nama: "Matcha", bg: "#d9f99d", bg2: "#4ade80", gradien: true, teks: "#14532d", sub: "#166534" },
  { id: "ocean", nama: "Ocean", bg: "#a5f3fc", bg2: "#38bdf8", gradien: true, teks: "#0c4a6e", sub: "#075985" },
  { id: "sunset", nama: "Sunset", bg: "#fed7aa", bg2: "#fb7185", gradien: true, teks: "#7c2d12", sub: "#9f1239" },
  { id: "butter", nama: "Butter", bg: "#fef3c7", bg2: "#fde047", gradien: true, teks: "#713f12", sub: "#a16207" },
].map((b, i) => ({ gradien: false, bg2: null, gambar: null, ...b, urutan: i }));

// ---------- Album galeri (foto placeholder SVG, sama dengan frontend) ----------
const PALET = [
  ["#f97316", "#7c2d12"], ["#0ea5e9", "#0c4a6e"], ["#8b5cf6", "#4c1d95"],
  ["#10b981", "#064e3b"], ["#f43f5e", "#881337"], ["#eab308", "#713f12"],
  ["#14b8a6", "#134e4a"], ["#6366f1", "#312e81"],
];

function makePhoto(seed, label, w = 1200, h = 800, sub = "Arkafa — foto demo") {
  const [c1, c2] = PALET[seed % PALET.length];
  const cx = 200 + ((seed * 137) % (w - 400));
  const cy = 150 + ((seed * 89) % (h - 300));
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="url(#g)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="180" fill="rgba(255,255,255,0.18)"/>` +
    `<circle cx="${cx + 220}" cy="${cy + 120}" r="90" fill="rgba(255,255,255,0.12)"/>` +
    `<text x="${w / 2}" y="${h / 2}" font-family="Arial" font-size="56" font-weight="bold" ` +
    `fill="rgba(255,255,255,0.9)" text-anchor="middle">${label}</text>` +
    `<text x="${w / 2}" y="${h / 2 + 60}" font-family="Arial" font-size="30" ` +
    `fill="rgba(255,255,255,0.6)" text-anchor="middle">${sub}</text>` +
    `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const ALBUM = [
  { token: "a7Kd93mQx2LpZ8Rt", nama: "Dokumentasi Trip Bromo Sunrise", tanggal: "2026-06-28", kedaluwarsa: "2026-07-28", jumlahFoto: 10, seedAwal: 3 },
  { token: "Zt5vB1nWq8Ck4Hs7", nama: "Photo Strip Booth — 5 Juli", tanggal: "2026-07-05", kedaluwarsa: "2026-08-05", jumlahFoto: 4, seedAwal: 11 },
  { token: "Pj2xR6mYw9Ld3Fq5", nama: "Dokumentasi Gathering Lembang", tanggal: "2026-03-30", kedaluwarsa: "2026-05-01", jumlahFoto: 6, seedAwal: 21 },
];

// ---------- Akun & pesanan demo ----------
const DEMO_BOOKINGS = [
  { id: "PSN-2026-0412", paketId: "bromo", kategori: "open", tanggal: "2026-07-18", peserta: 12, total: 9000000, status: "Menunggu Konfirmasi", dibuat: "2026-07-09" },
  { id: "PSN-2026-0398", paketId: "jogja", kategori: "family", tanggal: "2026-08-01", peserta: 25, total: 21250000, status: "Terkonfirmasi", dibuat: "2026-07-04" },
  { id: "PSN-2026-0341", paketId: "lembang", kategori: "kantor", tanggal: "2026-06-20", peserta: 30, total: 7500000, status: "Selesai", dibuat: "2026-06-15" },
  { id: "PSN-2026-0287", paketId: "pangandaran", kategori: "family", tanggal: "2026-05-30", peserta: 18, total: 8100000, status: "Dibatalkan", dibuat: "2026-05-27" },
];

async function main() {
  console.log("Seed: paket wisata…");
  for (const p of PAKET) {
    await prisma.paket.upsert({ where: { id: p.id }, update: p, create: p });
  }

  console.log("Seed: bingkai booth…");
  for (const b of BINGKAI) {
    await prisma.bingkai.upsert({ where: { id: b.id }, update: b, create: b });
  }

  console.log("Seed: album galeri…");
  for (const a of ALBUM) {
    const { jumlahFoto, seedAwal, ...data } = a;
    await prisma.album.upsert({ where: { token: a.token }, update: data, create: data });
    await prisma.foto.deleteMany({ where: { albumToken: a.token } });
    await prisma.foto.createMany({
      data: Array.from({ length: jumlahFoto }, (_, i) => ({
        albumToken: a.token,
        nama: `${a.nama.replace(/\s+/g, "-")}-${String(i + 1).padStart(2, "0")}.svg`,
        url: makePhoto(seedAwal + i, `Foto ${i + 1}`),
      })),
    });
  }

  console.log("Seed: akun admin & demo…");
  const admin = {
    nama: "Admin Arkafa",
    wa: "admin", // username login panel admin
    // ganti sandi admin dengan: ADMIN_SANDI=sandibaru node prisma/seed.js
    sandiHash: bcrypt.hashSync(process.env.ADMIN_SANDI || "arkafa123", 10),
    verified: true,
    peran: "admin",
    kodeReferral: "ARKAADMN",
  };
  await prisma.user.upsert({ where: { wa: "admin" }, update: admin, create: admin });

  const demo = {
    nama: "Budi Santoso",
    wa: "6289876543210",
    sandiHash: bcrypt.hashSync("demo1234", 10),
    verified: true,
    peran: "pelanggan",
    kodeReferral: "ARKA7B2D",
  };
  const budi = await prisma.user.upsert({ where: { wa: demo.wa }, update: demo, create: demo });

  for (const b of DEMO_BOOKINGS) {
    const { dibuat, ...data } = b;
    await prisma.pesanan.upsert({
      where: { id: b.id },
      update: {},
      create: { ...data, userId: budi.id, dibuat: new Date(dibuat + "T09:00:00") },
    });
  }

  for (const a of ALBUM) {
    await prisma.linkGaleri.upsert({
      where: { userId_albumToken: { userId: budi.id, albumToken: a.token } },
      update: {},
      create: { userId: budi.id, albumToken: a.token },
    });
  }

  console.log("Seed selesai ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
