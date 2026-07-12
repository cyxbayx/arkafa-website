import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/store.jsx";
import { albumKedaluwarsa, formatTanggal, WA_ADMIN } from "../../data/dummy.js";

// Dasbor foto pengguna (PRD 5.5.2): tautan yang pernah diterima (dari server)
// + photo strip booth tersimpan (lokal per perangkat).

export default function GaleriSaya() {
  const { getLinks, getEdits } = useAuth();
  const [tautan, setTautan] = useState(null); // null = memuat
  const edits = getEdits();

  useEffect(() => {
    getLinks().then(setTautan).catch(() => setTautan([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="seksi">
      <div className="wadah">
        <h2>Galeri Saya 🖼️</h2>
        <p className="sub">
          Semua link hasil foto yang pernah kamu terima plus photo strip
          yang tersimpan di akunmu.
        </p>

        <h3 style={{ fontSize: "1.05rem", marginBottom: 12 }}>Tautan Hasil Foto</h3>
        {tautan === null ? (
          <p className="sub">Memuat tautan…</p>
        ) : tautan.length === 0 ? (
          <div className="kosong">
            <div className="besar">🔗</div>
            <p>Belum ada tautan foto. Tautan yang dikirim admin akan tercatat di sini.</p>
          </div>
        ) : (
          tautan.map((a) => {
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
                    Sesi {formatTanggal(a.tanggal)} · berlaku s/d {formatTanggal(a.kedaluwarsa)}
                  </div>
                </div>
                {mati ? (
                  <a
                    className="btn btn-wa btn-kecil"
                    href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(`Halo Admin Arkafa Photo Studio, mohon perpanjangan tautan album "${a.nama}" (token ${a.token}). Terima kasih.`)}`}
                    target="_blank" rel="noreferrer"
                  >
                    Minta Perpanjangan
                  </a>
                ) : (
                  <Link to={`/studio/g/${a.token}`} className="btn btn-utama btn-kecil">
                    Buka Galeri
                  </Link>
                )}
              </div>
            );
          })
        )}

        <h3 style={{ fontSize: "1.35rem", margin: "28px 0 12px" }}>Photo Strip Tersimpan</h3>
        {edits.length === 0 ? (
          <div className="kosong">
            <div className="besar">🎞️</div>
            <p style={{ marginBottom: 14 }}>
              Belum ada photo strip. Hasil sesi Photo Booth yang kamu unduh saat login
              akan tersimpan otomatis di sini.
            </p>
            <Link to="/studio/booth" className="btn btn-utama">Mulai Photo Booth</Link>
          </div>
        ) : (
          <div className="galeri-grid">
            {edits.map((e) => (
              <div className="galeri-foto" key={e.id}>
                <img src={e.url} alt={e.nama} loading="lazy" />
                <div className="aksi-foto">
                  <span style={{ color: "#fff", fontSize: "0.72rem", alignSelf: "center", flex: 1 }}>
                    {formatTanggal(e.tanggal)}
                  </span>
                  <a className="btn btn-utama btn-kecil" href={e.url} download={e.nama}>⬇</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
