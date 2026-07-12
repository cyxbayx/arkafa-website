// Penyimpanan file lokal (folder server/uploads) — pengganti object storage
// selama fase gratis. Di produksi cukup ganti fungsi simpan ke R2/S3.
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vercel (serverless): filesystem read-only & tidak permanen — upload dinonaktifkan
// sampai tersambung object storage (mis. Cloudinary). Lokal/VPS: folder uploads.
const DI_SERVERLESS = Boolean(process.env.VERCEL);
export const DIR_UPLOAD = DI_SERVERLESS
  ? path.join("/tmp", "arkafa-uploads")
  : path.join(__dirname, "..", "uploads");

// URL publik server API (dipakai membangun URL file di respons)
export const URL_PUBLIK = process.env.PUBLIC_URL || "http://localhost:4000";

try {
  fs.mkdirSync(DIR_UPLOAD, { recursive: true });
} catch { /* filesystem read-only — upload memang nonaktif di serverless */ }

const EKST_SAH = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function ekstAman(namaAsli) {
  const e = path.extname(namaAsli || "").toLowerCase();
  return EKST_SAH.has(e) ? e : ".jpg";
}

// multer di memori — file kecil (foto), lalu kita tulis sendiri ke folder tujuan
export const unggah = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024, files: 60 }, // 12MB/file, maks 60 file
});

// Tulis buffer ke uploads/<folder>/<nama>. Mengembalikan URL publiknya.
export function simpanFile(folder, namaFile, buffer) {
  if (DI_SERVERLESS) {
    const e = new Error(
      "Upload file belum aktif di hosting gratis ini (serverless). " +
      "Fitur ini jalan penuh di localhost; untuk publik perlu object storage (mis. Cloudinary)."
    );
    e.status = 400;
    throw e;
  }
  const dir = path.join(DIR_UPLOAD, folder);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, namaFile), buffer);
  return `${URL_PUBLIK}/uploads/${folder}/${namaFile}`;
}

export function namaAcak(namaAsli) {
  return crypto.randomBytes(6).toString("hex") + ekstAman(namaAsli);
}

export function buatTokenAlbum() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let t = "";
  for (let i = 0; i < 20; i++) t += chars[crypto.randomInt(chars.length)];
  return t;
}
