// Titik masuk lokal/VPS — Vercel memakai api/index.js (tanpa listen).
import app from "./app.js";

const PROD = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 4000;
// lokal: hanya localhost; hosting (Render/VPS): harus 0.0.0.0
const HOST = process.env.HOST || (PROD ? "0.0.0.0" : "127.0.0.1");

app.listen(PORT, HOST, () => {
  console.log(`API Arkafa siap di http://${HOST}:${PORT}${PROD ? " (produksi)" : " (hanya localhost)"}`);
});
