// Serverless function Vercel — seluruh permintaan /api/* diarahkan ke sini
// (lihat rewrites di vercel.json) dan ditangani aplikasi Express yang sama
// dengan yang dipakai di lokal.
import app from "../server/src/app.js";

export default app;
