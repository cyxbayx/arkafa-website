// Rute panel admin — semua dilindungi wajibLogin + wajibAdmin.
import { Router } from "express";
import path from "node:path";
import fs from "node:fs";
import { prisma } from "./db.js";
import { wajibLogin, wajibAdmin } from "./auth.js";
import { unggah, simpanFile, namaAcak, buatTokenAlbum, DIR_UPLOAD } from "./upload.js";

export const ruteAdmin = Router();
ruteAdmin.use(wajibLogin, wajibAdmin);

// ---- Ringkasan ----
ruteAdmin.get("/ringkasan", async (_req, res) => {
  const [pesanan, kode, album, pengguna] = await Promise.all([
    prisma.pesanan.groupBy({ by: ["status"], _count: true }),
    prisma.kodeSesi.count(),
    prisma.album.findMany({ select: { kedaluwarsa: true } }),
    prisma.user.count({ where: { peran: "pelanggan" } }),
  ]);
  const kini = new Date();
  res.json({
    pesananPerStatus: Object.fromEntries(pesanan.map((p) => [p.status, p._count])),
    kodeSesi: kode,
    albumAktif: album.filter((a) => new Date(a.kedaluwarsa + "T23:59:59") >= kini).length,
    albumTotal: album.length,
    pengguna,
  });
});

// ---- Pesanan trip ----
ruteAdmin.get("/pesanan", async (_req, res) => {
  const pesanan = await prisma.pesanan.findMany({
    include: {
      user: { select: { nama: true } },
      paket: { select: { nama: true } },
    },
    orderBy: { dibuat: "desc" },
  });
  res.json(pesanan);
});

const STATUS_SAH = ["Menunggu Konfirmasi", "Terkonfirmasi", "Selesai", "Dibatalkan"];
ruteAdmin.patch("/pesanan/:id", async (req, res) => {
  const { status } = req.body || {};
  if (!STATUS_SAH.includes(status)) {
    return res.status(400).json({ error: "Status tidak dikenal." });
  }
  const pesanan = await prisma.pesanan.update({ where: { id: req.params.id }, data: { status } });
  res.json(pesanan);
});

// ---- Kode sesi booth ----
ruteAdmin.get("/kode", async (_req, res) => {
  const kode = await prisma.kodeSesi.findMany({ orderBy: { waktu: "desc" }, take: 100 });
  res.json(kode);
});

ruteAdmin.delete("/kode", async (_req, res) => {
  await prisma.kodeSesi.deleteMany();
  res.json({ ok: true });
});

// ---- Paket wisata ----
ruteAdmin.get("/paket", async (_req, res) => {
  // admin melihat juga paket nonaktif (tapi tidak yang sudah dihapus)
  const paket = await prisma.paket.findMany({ where: { dihapus: false }, orderBy: { hargaPerOrang: "asc" } });
  res.json(paket);
});

ruteAdmin.post("/paket", async (req, res) => {
  const { nama, lokasi, durasi, hargaPerOrang, minPeserta, kategori, fasilitas, ringkas, gambar } = req.body || {};
  if (!nama?.trim() || !lokasi?.trim()) {
    return res.status(400).json({ error: "Nama dan lokasi paket wajib diisi." });
  }
  const paket = await prisma.paket.create({
    data: {
      id: "pkt-" + Date.now().toString(36),
      nama: nama.trim(),
      lokasi: lokasi.trim(),
      durasi: durasi?.trim() || "1 hari",
      hargaPerOrang: Math.max(0, Number(hargaPerOrang) || 0),
      minPeserta: Math.max(1, Number(minPeserta) || 1),
      kategori: Array.isArray(kategori) && kategori.length ? kategori : ["open"],
      fasilitas: Array.isArray(fasilitas) ? fasilitas : [],
      ringkas: ringkas?.trim() || "",
      gambar: gambar || null,
    },
  });
  res.status(201).json(paket);
});

ruteAdmin.patch("/paket/:id", async (req, res) => {
  const boleh = ["nama", "lokasi", "durasi", "hargaPerOrang", "minPeserta", "kategori", "fasilitas", "ringkas", "gambar", "aktif"];
  const data = Object.fromEntries(Object.entries(req.body || {}).filter(([k]) => boleh.includes(k)));
  const paket = await prisma.paket.update({ where: { id: req.params.id }, data });
  res.json(paket);
});

ruteAdmin.delete("/paket/:id", async (req, res) => {
  // soft delete: riwayat pesanan yang menunjuk paket ini tetap utuh
  await prisma.paket.update({ where: { id: req.params.id }, data: { dihapus: true } });
  res.json({ ok: true });
});

// Upload/ganti foto paket → tersimpan di uploads/paket
ruteAdmin.post("/paket/:id/foto", unggah.single("foto"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File foto belum dipilih." });
  const url = simpanFile("paket", req.params.id + "-" + namaAcak(req.file.originalname), req.file.buffer);
  const paket = await prisma.paket.update({ where: { id: req.params.id }, data: { gambar: url } });
  res.json(paket);
});

// ---- Bingkai booth ----
ruteAdmin.get("/bingkai", async (_req, res) => {
  const bingkai = await prisma.bingkai.findMany({ where: { dihapus: false }, orderBy: { urutan: "asc" } });
  res.json(bingkai);
});

// Terima JSON (bingkai warna) maupun multipart dengan file "desain" (bingkai custom)
ruteAdmin.post("/bingkai", unggah.single("desain"), async (req, res) => {
  const { nama, bg, bg2, teks, sub } = req.body || {};
  if (!nama?.trim()) return res.status(400).json({ error: "Nama bingkai wajib diisi." });
  const id = "bk-" + Date.now().toString(36);
  const gambar = req.file
    ? simpanFile("bingkai", id + "-" + namaAcak(req.file.originalname), req.file.buffer)
    : null;
  const terakhir = await prisma.bingkai.aggregate({ _max: { urutan: true } });
  const bingkai = await prisma.bingkai.create({
    data: {
      id,
      nama: nama.trim(),
      bg: bg || "#fffdf7",
      bg2: bg2 || null,
      gradien: Boolean(bg2 && bg2 !== bg),
      gambar,
      teks: teks || "#1c1917",
      sub: sub || teks || "#78716c",
      urutan: (terakhir._max.urutan ?? 0) + 1,
    },
  });
  res.status(201).json(bingkai);
});

async function sisaBingkaiAktif(kecualiId) {
  return prisma.bingkai.count({ where: { dihapus: false, aktif: true, NOT: { id: kecualiId } } });
}

ruteAdmin.patch("/bingkai/:id", async (req, res) => {
  const { aktif } = req.body || {};
  if (aktif === false && (await sisaBingkaiAktif(req.params.id)) === 0) {
    return res.status(400).json({ error: "Minimal harus ada satu bingkai aktif." });
  }
  const bingkai = await prisma.bingkai.update({ where: { id: req.params.id }, data: { aktif: Boolean(aktif) } });
  res.json(bingkai);
});

ruteAdmin.delete("/bingkai/:id", async (req, res) => {
  if ((await sisaBingkaiAktif(req.params.id)) === 0) {
    return res.status(400).json({ error: "Minimal harus ada satu bingkai aktif." });
  }
  await prisma.bingkai.update({ where: { id: req.params.id }, data: { dihapus: true } });
  res.json({ ok: true });
});

// ---- Album galeri ----
ruteAdmin.get("/album", async (_req, res) => {
  const album = await prisma.album.findMany({
    include: { _count: { select: { foto: true } } },
    orderBy: { tanggal: "desc" },
  });
  res.json(album);
});

// Upload album baru: nama + (opsional) nomor WA pelanggan + masa berlaku + file foto
ruteAdmin.post("/album", unggah.array("foto", 60), async (req, res) => {
  const { nama, wa, hari } = req.body || {};
  if (!nama?.trim()) return res.status(400).json({ error: "Nama album wajib diisi." });
  if (!req.files?.length) return res.status(400).json({ error: "Pilih minimal satu foto." });

  const token = buatTokenAlbum();
  const kini = new Date();
  const batas = new Date(kini);
  batas.setDate(batas.getDate() + Math.max(1, Number(hari) || 30));

  const album = await prisma.album.create({
    data: {
      token,
      nama: nama.trim(),
      tanggal: kini.toISOString().slice(0, 10),
      kedaluwarsa: batas.toISOString().slice(0, 10),
      wa: wa?.trim() || null,
      foto: {
        create: req.files.map((f, i) => {
          const namaFile = String(i + 1).padStart(2, "0") + "-" + namaAcak(f.originalname);
          return {
            nama: f.originalname || namaFile,
            url: simpanFile(`album/${token}`, namaFile, f.buffer),
          };
        }),
      },
    },
    include: { _count: { select: { foto: true } } },
  });
  res.status(201).json(album);
});

// Hapus album + seluruh file fotonya
ruteAdmin.delete("/album/:token", async (req, res) => {
  const album = await prisma.album.findUnique({ where: { token: req.params.token } });
  if (!album) return res.status(404).json({ error: "Album tidak ditemukan." });
  await prisma.linkGaleri.deleteMany({ where: { albumToken: album.token } });
  await prisma.album.delete({ where: { token: album.token } }); // foto ikut terhapus (cascade)
  fs.rmSync(path.join(DIR_UPLOAD, "album", album.token), { recursive: true, force: true });
  res.json({ ok: true });
});

ruteAdmin.post("/album/:token/perpanjang", async (req, res) => {
  const hari = Math.max(1, Number(req.body?.hari) || 30);
  const album = await prisma.album.findUnique({ where: { token: req.params.token } });
  if (!album) return res.status(404).json({ error: "Album tidak ditemukan." });
  const dasar = Math.max(Date.now(), new Date(album.kedaluwarsa + "T00:00:00").getTime());
  const d = new Date(dasar);
  d.setDate(d.getDate() + hari);
  const baru = await prisma.album.update({
    where: { token: req.params.token },
    data: { kedaluwarsa: d.toISOString().slice(0, 10) },
  });
  res.json(baru);
});
