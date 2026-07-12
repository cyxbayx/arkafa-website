// Klien API Arkafa — satu pintu semua panggilan ke backend (server/).
// Base URL bisa dioverride lewat VITE_API_URL saat deploy.

// Dev: API di port 4000. Produksi: frontend & API satu origin (disajikan Express).
const BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "/api" : "http://localhost:4000/api");

export const KUNCI_TOKEN = "arkafa_token";        // sesi pelanggan
export const KUNCI_TOKEN_ADMIN = "arkafa_token_admin"; // sesi panel admin (terpisah)

export function getToken(admin = false) {
  const kunci = admin ? KUNCI_TOKEN_ADMIN : KUNCI_TOKEN;
  return localStorage.getItem(kunci) || sessionStorage.getItem(kunci) || null;
}

export function simpanToken(token, { admin = false, ingat = true } = {}) {
  const kunci = admin ? KUNCI_TOKEN_ADMIN : KUNCI_TOKEN;
  (ingat ? localStorage : sessionStorage).setItem(kunci, token);
}

export function hapusToken(admin = false) {
  const kunci = admin ? KUNCI_TOKEN_ADMIN : KUNCI_TOKEN;
  localStorage.removeItem(kunci);
  sessionStorage.removeItem(kunci);
}

async function kirim(path, { method, headers, body, admin }) {
  const token = getToken(admin);
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body });
  } catch {
    throw new Error("Tidak bisa terhubung ke server. Pastikan API-nya berjalan.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch { /* respons tanpa body */ }

  if (!res.ok) {
    const err = new Error(data?.error || `Terjadi kesalahan (${res.status}).`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Panggilan JSON. Melempar Error dengan pesan dari server bila gagal.
export function api(path, { method = "GET", body, admin = false } = {}) {
  return kirim(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    admin,
  });
}

// Upload multipart (FormData) — Content-Type diatur otomatis oleh browser.
export function apiUpload(path, formData, { admin = false } = {}) {
  return kirim(path, { method: "POST", headers: {}, body: formData, admin });
}
