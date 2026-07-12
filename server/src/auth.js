import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-dev-jangan-dipakai-produksi";
const MASA_TOKEN = "7d";

// Rate limit login sederhana: 5 percobaan gagal / 60 detik per nomor
const gagalLogin = new Map(); // wa -> { hitung, sejak }

function normalisasiWA(wa) {
  let n = (wa || "").replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n || wa; // "admin" (username panel) lolos apa adanya
}

function buatKodeReferral() {
  const huruf = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let k = "ARKA";
  for (let i = 0; i < 4; i++) k += huruf[Math.floor(Math.random() * huruf.length)];
  return k;
}

export function buatToken(user) {
  return jwt.sign({ sub: user.id, peran: user.peran }, JWT_SECRET, { expiresIn: MASA_TOKEN });
}

function amanUser(u) {
  const { sandiHash, otp, otpBatas, ...aman } = u;
  return aman;
}

// ---- Middleware ----
export async function wajibLogin(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Harus login dulu." });
  try {
    const isi = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: isi.sub } });
    if (!user) return res.status(401).json({ error: "Akun tidak ditemukan." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Sesi tidak valid atau kedaluwarsa." });
  }
}

export function wajibAdmin(req, res, next) {
  if (req.user?.peran !== "admin") {
    return res.status(403).json({ error: "Khusus admin." });
  }
  next();
}

// ---- Rute ----
export const ruteAuth = Router();

ruteAuth.post("/daftar", async (req, res) => {
  const { nama, wa, sandi, referral } = req.body || {};
  const nomor = normalisasiWA(wa);
  if (!nama?.trim() || !nomor || !sandi) {
    return res.status(400).json({ error: "Nama, nomor WhatsApp, dan kata sandi wajib diisi." });
  }
  if (sandi.length < 8) {
    return res.status(400).json({ error: "Kata sandi minimal 8 karakter." });
  }
  const sudahAda = await prisma.user.findUnique({ where: { wa: nomor } });
  if (sudahAda) {
    return res.status(409).json({ error: "Nomor ini sudah terdaftar. Silakan masuk." });
  }

  let referredById = null;
  if (referral?.trim()) {
    const pengundang = await prisma.user.findUnique({ where: { kodeReferral: referral.trim().toUpperCase() } });
    if (!pengundang) return res.status(400).json({ error: "Kode referral tidak ditemukan." });
    referredById = pengundang.id;
  }

  // OTP demo: dibuat di server dan disimpan di DB, "dikirim" dengan
  // mengembalikannya di respons. Produksi: kirim lewat WhatsApp gateway
  // dan JANGAN kembalikan di respons.
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const user = await prisma.user.create({
    data: {
      nama: nama.trim(),
      wa: nomor,
      sandiHash: bcrypt.hashSync(sandi, 10),
      kodeReferral: buatKodeReferral(),
      referredById,
      otp,
      otpBatas: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  res.status(201).json({ user: amanUser(user), demoOtp: otp });
});

ruteAuth.post("/verifikasi", async (req, res) => {
  const { wa, otp } = req.body || {};
  const nomor = normalisasiWA(wa);
  const calon = await prisma.user.findUnique({ where: { wa: nomor } });
  if (!calon || !calon.otp || !calon.otpBatas || calon.otpBatas < new Date()) {
    return res.status(400).json({ error: "OTP kedaluwarsa. Daftar ulang untuk kirim OTP baru." });
  }
  if (calon.otp !== String(otp || "").trim()) {
    return res.status(400).json({ error: "Kode OTP salah." });
  }
  const user = await prisma.user.update({
    where: { wa: nomor },
    data: { verified: true, otp: null, otpBatas: null },
  });
  res.json({ user: amanUser(user), token: buatToken(user) });
});

ruteAuth.post("/masuk", async (req, res) => {
  const { wa, sandi } = req.body || {};
  const nomor = normalisasiWA(wa);

  const catatan = gagalLogin.get(nomor);
  if (catatan && catatan.hitung >= 5 && Date.now() - catatan.sejak < 60 * 1000) {
    return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi 1 menit lagi." });
  }

  const user = await prisma.user.findUnique({ where: { wa: nomor } });
  if (!user || !bcrypt.compareSync(sandi || "", user.sandiHash)) {
    const g = gagalLogin.get(nomor) || { hitung: 0, sejak: Date.now() };
    if (Date.now() - g.sejak > 60 * 1000) { g.hitung = 0; g.sejak = Date.now(); }
    g.hitung += 1;
    gagalLogin.set(nomor, g);
    return res.status(401).json({ error: "Nomor atau kata sandi salah." });
  }
  if (!user.verified) {
    return res.status(403).json({ error: "Akun belum diverifikasi OTP." });
  }
  gagalLogin.delete(nomor);
  res.json({ user: amanUser(user), token: buatToken(user) });
});

ruteAuth.get("/saya", wajibLogin, async (req, res) => {
  const teman = await prisma.user.findMany({
    where: { referredById: req.user.id, verified: true },
    select: { nama: true, dibuat: true },
    orderBy: { dibuat: "asc" },
  });
  res.json({
    user: amanUser(req.user),
    teman: teman.map((t) => ({
      // samarkan nama teman referral, sama seperti demo frontend
      nama: t.nama[0] + "*** " + (t.nama.split(" ")[1] || ""),
      tanggal: t.dibuat.toISOString().slice(0, 10),
    })),
  });
});
