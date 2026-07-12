// Rute publik & pelanggan: katalog paket, bingkai booth, galeri bertoken, kode sesi booth.
import { Router } from "express";
import { prisma } from "./db.js";
import { wajibLogin } from "./auth.js";

export const rutePublik = Router();

// Katalog paket wisata (hanya yang aktif & belum dihapus)
rutePublik.get("/paket", async (_req, res) => {
  const paket = await prisma.paket.findMany({
    where: { dihapus: false, aktif: true },
    orderBy: { hargaPerOrang: "asc" },
  });
  res.json(paket);
});

// Bingkai booth aktif, sesuai urutan
rutePublik.get("/bingkai", async (_req, res) => {
  const bingkai = await prisma.bingkai.findMany({
    where: { dihapus: false, aktif: true },
    orderBy: { urutan: "asc" },
  });
  res.json(bingkai);
});

// Galeri bertoken — validasi kedaluwarsa di server
rutePublik.get("/galeri/:token", async (req, res) => {
  const album = await prisma.album.findUnique({
    where: { token: req.params.token },
    include: { foto: true },
  });
  if (!album) return res.status(404).json({ error: "Album tidak ditemukan." });
  const kedaluwarsa = new Date(album.kedaluwarsa + "T23:59:59") < new Date();
  if (kedaluwarsa) {
    // jangan bocorkan isi foto bila sudah lewat masa berlaku
    const { foto, ...tanpaFoto } = album;
    return res.status(410).json({ error: "Album sudah kedaluwarsa.", album: tanpaFoto });
  }
  res.json(album);
});

// Riwayat pemesanan trip milik pengguna yang login
rutePublik.get("/pesanan/saya", wajibLogin, async (req, res) => {
  const pesanan = await prisma.pesanan.findMany({
    where: { userId: req.user.id },
    include: { paket: { select: { nama: true, lokasi: true, durasi: true } } },
    orderBy: { dibuat: "desc" },
  });
  res.json(pesanan);
});

// Daftar album yang diterima pengguna (Galeri Saya)
rutePublik.get("/galeri-saya", wajibLogin, async (req, res) => {
  const link = await prisma.linkGaleri.findMany({
    where: { userId: req.user.id },
    include: { album: { select: { token: true, nama: true, tanggal: true, kedaluwarsa: true } } },
  });
  res.json(link.map((l) => l.album));
});

// Kode sesi booth — demo: langsung terbit ("pembayaran" disimulasikan).
// Produksi: endpoint ini digantikan webhook pelunasan dari Midtrans/Xendit.
rutePublik.post("/booth/kode", async (req, res) => {
  const { wa, metode, layout, harga } = req.body || {};
  if (!wa || !metode || !layout) {
    return res.status(400).json({ error: "Nomor WA, metode bayar, dan layout wajib diisi." });
  }
  const huruf = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let kode = "";
  for (let i = 0; i < 6; i++) kode += huruf[Math.floor(Math.random() * huruf.length)];

  const catatan = await prisma.kodeSesi.create({
    data: { kode, wa: String(wa), metode, layout, harga: Number(harga) || 0 },
  });
  // Demo: kode dikembalikan di respons (frontend menampilkannya sebagai "terkirim ke WA").
  // Produksi: kirim via WhatsApp gateway, respons cukup { ok: true }.
  res.status(201).json({ kode: catatan.kode });
});
