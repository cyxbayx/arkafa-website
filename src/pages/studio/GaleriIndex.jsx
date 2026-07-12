import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { albumKedaluwarsa, formatTanggal } from "../../data/dummy.js";

// Pintasan demo ke album seed di database (produksi: bagian ini tidak ada).
const ALBUM_DEMO = [
  { token: "a7Kd93mQx2LpZ8Rt", nama: "Dokumentasi Trip Bromo Sunrise", tanggal: "2026-06-28", kedaluwarsa: "2026-07-28", jumlah: 10 },
  { token: "Zt5vB1nWq8Ck4Hs7", nama: "Photo Strip Booth — 5 Juli", tanggal: "2026-07-05", kedaluwarsa: "2026-08-05", jumlah: 4 },
  { token: "Pj2xR6mYw9Ld3Fq5", nama: "Dokumentasi Gathering Lembang", tanggal: "2026-03-30", kedaluwarsa: "2026-05-01", jumlah: 6 },
];

export default function GaleriIndex() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function buka(e) {
    e.preventDefault();
    // menerima token mentah maupun tautan lengkap (…/studio/g/TOKEN)
    const bersih = token.trim().split("/").filter(Boolean).pop() || "";
    if (bersih.length < 16) {
      setError("Link-nya belum lengkap — salin utuh pesan link dari WhatsApp-mu, lalu tempel di sini.");
      return;
    }
    navigate(`/studio/g/${bersih}`);
  }

  return (
    <section className="seksi">
      <div className="wadah">
        <h2>Terima Hasil Foto 📥</h2>
        <p className="sub">
          Strip photo booth dan dokumentasi trip Arkafa Travel dikirim sebagai
          <strong> link pribadi ke WhatsApp kamu</strong> — cukup klik link-nya,
          galeri fotomu langsung terbuka. Tidak perlu memasukkan apa pun di sini.
        </p>

        <div className="kartu" style={{ maxWidth: 560 }}>
          <h3 style={{ fontSize: "1.35rem", marginBottom: 4 }}>Link-nya tidak bisa diklik?</h3>
          <p style={{ fontSize: "0.92rem", color: "var(--tinta-2)", marginBottom: 12 }}>
            Kadang link terpotong saat di-forward, atau kamu mau membukanya di
            perangkat lain. Tempel link (atau kode di bagian akhirnya) di sini.
          </p>
          <form onSubmit={buka}>
            <div className="form-grup">
              <label htmlFor="token">Tempel link dari WhatsApp-mu</label>
              <input
                id="token" type="text" placeholder="mis. https://arkafa.id/studio/g/a7Kd93…"
                value={token} onChange={(e) => { setToken(e.target.value); setError(""); }}
              />
              {error && <div className="bantuan" style={{ color: "#b91c1c" }}>{error}</div>}
            </div>
            <button className="btn btn-utama" type="submit">Buka Galeri</button>
          </form>
        </div>

        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: "1.6rem" }}>Contoh Galeri (Demo)</h2>
          <p className="sub">
            Di versi produksi, daftar ini tidak ada — pelanggan hanya menerima tautannya
            masing-masing via WhatsApp. Berikut album dummy untuk mencoba fitur:
            dokumentasi trip dan strip photo booth.
          </p>
          {ALBUM_DEMO.map((a) => {
            const mati = albumKedaluwarsa(a);
            return (
              <div className="daftar-item" key={a.token}>
                <div className="isi">
                  <h4>
                    {a.nama}{" "}
                    <span className={"badge " + (mati ? "badge-merah" : "badge-hijau")}>
                      {mati ? "Kedaluwarsa" : "Aktif"}
                    </span>
                  </h4>
                  <div className="meta">
                    Sesi {formatTanggal(a.tanggal)} · {a.jumlah} foto · berlaku s/d {formatTanggal(a.kedaluwarsa)}
                  </div>
                  <div className="meta" style={{ fontFamily: "Consolas, monospace" }}>token: {a.token}</div>
                </div>
                <Link to={`/studio/g/${a.token}`} className="btn btn-utama btn-kecil">
                  Buka Galeri
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
