import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/store.jsx";
import {
  WA_ADMIN, getKategori, formatRupiah, formatTanggal, STATUS_WARNA,
} from "../../data/dummy.js";

export default function Riwayat() {
  const { user, getBookings } = useAuth();
  const [bookings, setBookings] = useState(null); // null = masih memuat

  useEffect(() => {
    getBookings().then(setBookings).catch(() => setBookings([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hubungiAdmin(b) {
    const teks =
      `Halo Admin Arkafa Travel, saya ${user.nama}. ` +
      `Saya mau menanyakan pesanan ${b.id} (${b.paket.nama} — ${b.paket.lokasi}, ${formatTanggal(b.tanggal)}, ${b.peserta} peserta).`;
    window.open(`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(teks)}`, "_blank", "noopener");
  }

  return (
    <section className="seksi">
      <div className="wadah">
        <h2>Riwayat Pemesanan 🧾</h2>
        <p className="sub">
          Semua trip dan acara yang pernah kamu pesan, terurut dari yang terbaru.
          Status di-update langsung oleh admin.
        </p>

        {bookings === null ? (
          <p className="sub">Memuat riwayat…</p>
        ) : bookings.length === 0 ? (
          <div className="kosong">
            <div className="besar">🎒</div>
            <h3 style={{ marginBottom: 6 }}>Belum ada pemesanan</h3>
            <p style={{ marginBottom: 14 }}>
              Trip yang kamu pesan via WhatsApp akan dicatat admin di sini.
            </p>
            <Link to="/travel" className="btn btn-utama">Lihat Paket Wisata</Link>
          </div>
        ) : (
          bookings.map((b) => {
            const k = getKategori(b.kategori);
            return (
              <div className="daftar-item" key={b.id}>
                <div className="isi">
                  <h4>
                    {b.paket.nama}{" "}
                    <span className={"badge " + (STATUS_WARNA[b.status] || "badge-abu")}>{b.status}</span>
                  </h4>
                  <div className="meta">
                    📍 {b.paket.lokasi} · {b.paket.durasi}{k ? ` · ${k.nama}` : ""} · {b.peserta} peserta
                  </div>
                  <div className="meta">
                    Berangkat {formatTanggal(b.tanggal)} · No. pesanan {b.id} · dibuat {formatTanggal(b.dibuat.slice(0, 10))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="jadwal-harga">{formatRupiah(b.total)}</div>
                  <button className="btn btn-wa btn-kecil" style={{ marginTop: 8 }} onClick={() => hubungiAdmin(b)}>
                    Hubungi Admin
                  </button>
                </div>
              </div>
            );
          })
        )}

        <div className="demo-info">
          Riwayat ini dibaca dari database melalui API. Admin memperbarui status pesanan
          (<em>Menunggu Konfirmasi → Terkonfirmasi → Selesai</em>) melalui panel admin.
        </div>
      </div>
    </section>
  );
}
