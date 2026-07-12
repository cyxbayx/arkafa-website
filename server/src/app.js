// Aplikasi Express Arkafa — diekspor agar bisa dipakai dua cara:
// 1) lokal/VPS: dijalankan index.js (app.listen)
// 2) Vercel: diekspor api/index.js sebagai serverless function
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { ruteAuth } from "./auth.js";
import { rutePublik } from "./publik.js";
import { ruteAdmin } from "./admin.js";
import { DIR_UPLOAD } from "./upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD = process.env.NODE_ENV === "production";

const app = express();

// CORS hanya dibutuhkan saat frontend beda origin (mode dev)
const asal = ["http://localhost:5173"];
if (process.env.FRONTEND_URL) asal.push(process.env.FRONTEND_URL);
app.use(cors({ origin: asal }));

app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(DIR_UPLOAD)); // file foto album/paket/bingkai

app.get("/api/sehat", (_req, res) => res.json({ ok: true, waktu: new Date().toISOString() }));

app.use("/api/auth", ruteAuth);
app.use("/api", rutePublik);
app.use("/api/admin", ruteAdmin);

// Produksi non-serverless: sajikan frontend hasil build + fallback SPA (react-router)
const DIST = path.join(__dirname, "..", "..", "dist");
if (PROD && !process.env.VERCEL && fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
}

// Penanganan error terpusat
app.use((err, _req, res, _next) => {
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({
    error: err.status ? err.message : "Terjadi kesalahan di server.",
  });
});

export default app;
