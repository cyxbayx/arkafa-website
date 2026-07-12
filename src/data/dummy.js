// ===== Konfigurasi statis & util format Arkafa =====
// Data dinamis (paket, bingkai, album, pesanan, akun) kini tinggal di database
// dan diambil lewat API (src/lib/api.js). File ini hanya berisi konstanta
// tampilan dan helper murni.

export const NAMA_PERUSAHAAN = "Arkafa";
export const WA_ADMIN = "6281234567890"; // nomor WhatsApp admin (dummy)

// Jenis acara Arkafa Travel (dipakai filter katalog & label)
export const KATEGORI_ACARA = [
  { id: "open", nama: "Open Trip" },
  { id: "private", nama: "Private Trip" },
  { id: "family", nama: "Family Gathering" },
  { id: "kantor", nama: "Outing Kantor" },
  { id: "study", nama: "Study Tour" },
];

export function getKategori(id) {
  return KATEGORI_ACARA.find((k) => k.id === id);
}

export const STATUS_WARNA = {
  "Menunggu Konfirmasi": "badge-kuning",
  "Terkonfirmasi": "badge-biru",
  "Selesai": "badge-hijau",
  "Dibatalkan": "badge-merah",
};

// ---------- Util format ----------

export function formatRupiah(n) {
  return "Rp" + n.toLocaleString("id-ID");
}

export function formatTanggal(date) {
  if (typeof date === "string") date = new Date(date + "T00:00:00");
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(date);
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function albumKedaluwarsa(album, now = new Date()) {
  return new Date(album.kedaluwarsa + "T23:59:59") < now;
}
