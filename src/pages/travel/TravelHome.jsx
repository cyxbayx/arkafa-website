import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  KATEGORI_ACARA, WA_ADMIN, getKategori,
  formatRupiah, formatTanggal, toISODate,
} from "../../data/dummy.js";
import { api } from "../../lib/api.js";
import { useAuth } from "../../lib/store.jsx";

// Arkafa Travel = EO liburan: open trip, private trip, family gathering,
// outing kantor, study tour — konsultasi & pemesanan difinalkan via WhatsApp.

const BATAS_AWAL = 6; // jumlah paket yang tampil dulu — sisanya lewat "Tampilkan Lainnya"

export default function TravelHome() {
  const { user } = useAuth();
  const hariIni = toISODate(new Date());
  const [kategori, setKategori] = useState("semua");
  const [lokasi, setLokasi] = useState("semua");
  const [tanggal, setTanggal] = useState("");
  const [peserta, setPeserta] = useState(15);
  const [tampil, setTampil] = useState(BATAS_AWAL);
  const daftarRef = useRef(null);

  // katalog paket dari API — perubahan admin (harga/nonaktif/tambah/hapus) ikut terbaca
  const [semuaPaket, setSemuaPaket] = useState([]);
  const [statusMuat, setStatusMuat] = useState("muat"); // muat | siap | gagal
  useEffect(() => {
    api("/paket")
      .then((data) => { setSemuaPaket(data); setStatusMuat("siap"); })
      .catch(() => setStatusMuat("gagal"));
  }, []);

  const daftarLokasi = useMemo(
    () => [...new Set(semuaPaket.map((p) => p.lokasi))],
    [semuaPaket]
  );

  const hasil = useMemo(() => {
    return semuaPaket.filter((p) => {
      if (kategori !== "semua" && !p.kategori.includes(kategori)) return false;
      if (lokasi !== "semua" && p.lokasi !== lokasi) return false;
      return true;
    });
  }, [semuaPaket, kategori, lokasi]);

  const terlihat = hasil.slice(0, tampil);
  const sisa = hasil.length - terlihat.length;

  // ganti filter = mulai lagi dari 6 paket pertama
  function gantiKategori(nilai) {
    setKategori(nilai);
    setTampil(BATAS_AWAL);
  }
  function gantiLokasi(nilai) {
    setLokasi(nilai);
    setTampil(BATAS_AWAL);
  }

  const tanggalLampau = tanggal && tanggal < hariIni;

  function konsultasiWA(p) {
    const baris = [
      `Halo Admin Arkafa Travel! Saya mau konsultasi paket wisata:`,
      user ? `• Nama: ${user.nama}` : null,
      `• Paket: ${p.nama} — ${p.lokasi} (${p.durasi})`,
      kategori !== "semua" ? `• Jenis acara: ${getKategori(kategori)?.nama}` : null,
      tanggal && !tanggalLampau ? `• Rencana tanggal: ${formatTanggal(tanggal)}` : null,
      `• Perkiraan peserta: ${peserta} orang`,
      `• Estimasi biaya: ${formatRupiah(p.hargaPerOrang * peserta)} (${formatRupiah(p.hargaPerOrang)}/orang)`,
      ``,
      `Mohon info ketersediaan tanggal dan itinerary lengkapnya ya. Terima kasih!`,
    ].filter(Boolean);
    const url = `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(baris.join("\n"))}`;
    window.open(url, "_blank", "noopener");
  }

  function tripCustomWA() {
    const teks =
      `Halo Admin Arkafa Travel! Saya ingin dibuatkan paket trip custom.` +
      (user ? `\n• Nama: ${user.nama}` : "") +
      (kategori !== "semua" ? `\n• Jenis acara: ${getKategori(kategori)?.nama}` : "") +
      (tanggal && !tanggalLampau ? `\n• Rencana tanggal: ${formatTanggal(tanggal)}` : "") +
      `\n• Perkiraan peserta: ${peserta} orang` +
      `\nBoleh dibantu susunkan destinasi & itinerary-nya? Terima kasih!`;
    window.open(`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(teks)}`, "_blank", "noopener");
  }

  return (
    <>
      <section className="hero">
        <div className="wadah">
          <h1>
            Mau Liburan Bareng? <span className="coret">Biar Kami yang Urus</span>
          </h1>
          <p>
            Arkafa Travel adalah teman perjalananmu: open trip, private trip,
            family gathering, sampai outing kantor ke tempat wisata. Kamu tinggal
            kumpulkan orangnya — transport, penginapan, makan, dan acara kami yang siapkan.
          </p>
        </div>
      </section>

      <section className="seksi">
        <div className="wadah">
          <div className="kartu">
            <h2 style={{ fontSize: "1.6rem", marginBottom: 14 }}>Cari Paket yang Pas</h2>
            <div className="grid-2">
              <div className="form-grup">
                <label htmlFor="kategori">Jenis acara</label>
                <select id="kategori" value={kategori} onChange={(e) => gantiKategori(e.target.value)}>
                  <option value="semua">Semua jenis acara</option>
                  {KATEGORI_ACARA.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </div>
              <div className="form-grup">
                <label htmlFor="lokasi">Destinasi</label>
                <select id="lokasi" value={lokasi} onChange={(e) => gantiLokasi(e.target.value)}>
                  <option value="semua">Semua destinasi</option>
                  {daftarLokasi.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="form-grup">
                <label htmlFor="tanggal">Rencana tanggal (opsional)</label>
                <input
                  id="tanggal" type="date" min={hariIni} value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                />
                {tanggalLampau && (
                  <div className="bantuan" style={{ color: "#b91c1c" }}>
                    Tanggal tidak boleh di masa lalu.
                  </div>
                )}
              </div>
              <div className="form-grup">
                <label htmlFor="peserta">Perkiraan jumlah peserta</label>
                <input
                  id="peserta" type="number" min={1} max={500} value={peserta}
                  onChange={(e) => setPeserta(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                />
              </div>
            </div>
            <div className="bantuan" style={{ color: "var(--tinta-2)" }}>
              Harga tertera per orang. Itinerary, tanggal, dan fasilitas bisa disesuaikan
              dengan kebutuhan rombonganmu.
            </div>
          </div>

          <div style={{ marginTop: 28 }} ref={daftarRef}>
            <h2 style={{ marginBottom: 4 }}>
              {kategori === "semua" ? "Paket Wisata" : "Paket " + getKategori(kategori)?.nama}
              {lokasi !== "semua" && ` · ${lokasi}`}
            </h2>
            <p className="sub">
              {statusMuat === "muat" ? "Memuat paket…" : `${hasil.length} paket tersedia — semua bisa di-custom.`}
            </p>

            {statusMuat === "gagal" && (
              <div className="peringatan peringatan-merah">
                Katalog tidak bisa dimuat — server API belum berjalan. Jalankan{" "}
                <code>npm run dev</code> di folder <code>server/</code> lalu muat ulang.
              </div>
            )}

            {hasil.length > 0 ? (
              <div className="grid-2">
                {terlihat.map((p) => {
                  const kurang = peserta < p.minPeserta;
                  return (
                    <div className="kartu paket-kartu" key={p.id}>
                      <img
                        className="paket-foto"
                        src={p.gambar || `/paket/${p.id}.jpg`}
                        alt={p.nama}
                        loading="lazy"
                      />
                      <div className="paket-isi">
                        <h3>{p.nama}</h3>
                        <div className="paket-meta">
                          📍 {p.lokasi} · 🕐 {p.durasi} · 👥 min. {p.minPeserta} orang
                        </div>
                        <p className="paket-ringkas">{p.ringkas}</p>
                        <div className="paket-chip-baris">
                          {p.kategori.map((k) => (
                            <span className="badge badge-abu" key={k}>{getKategori(k)?.nama}</span>
                          ))}
                        </div>
                        <ul className="paket-fasilitas">
                          {p.fasilitas.map((f) => <li key={f}>✔ {f}</li>)}
                        </ul>
                        <div className="paket-bawah">
                          <div>
                            <div className="jadwal-harga">{formatRupiah(p.hargaPerOrang)}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--tinta-2)" }}>
                              per orang · est. {formatRupiah(p.hargaPerOrang * peserta)} ({peserta} org)
                            </div>
                            {kurang && (
                              <div style={{ fontSize: "0.8rem", color: "#a16207" }}>
                                ⚠ minimal {p.minPeserta} peserta — bisa gabung open trip
                              </div>
                            )}
                          </div>
                          <button className="btn btn-wa" onClick={() => konsultasiWA(p)}>
                            Konsultasi via WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : statusMuat !== "siap" ? null : (
              <div className="kosong">
                <div className="besar">🗺️</div>
                <h3 style={{ marginBottom: 6 }}>Belum ada paket yang cocok</h3>
                <p style={{ marginBottom: 14 }}>
                  Kombinasi filter itu belum ada paketnya — tapi tenang, kami bisa racik
                  trip custom sesuai keinginanmu.
                </p>
                <button className="btn btn-utama" onClick={() => { gantiKategori("semua"); gantiLokasi("semua"); }}>
                  Lihat Semua Paket
                </button>
              </div>
            )}

            {sisa > 0 && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button className="btn btn-garis" onClick={() => setTampil((t) => t + BATAS_AWAL)}>
                  Tampilkan Lebih Banyak ↓
                </button>
              </div>
            )}
            {sisa === 0 && hasil.length > BATAS_AWAL && (
              <div style={{ textAlign: "center", marginTop: 18 }}>
                <button
                  className="btn btn-garis"
                  onClick={() => {
                    setTampil(BATAS_AWAL);
                    daftarRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Tampilkan Lebih Sedikit ↑
                </button>
              </div>
            )}
          </div>

          <div className="kartu" style={{ marginTop: 28, textAlign: "center" }}>
            <h3 style={{ fontSize: "1.6rem", marginBottom: 6 }}>Destinasi impianmu belum ada? 🗺️</h3>
            <p style={{ color: "var(--tinta-2)", marginBottom: 14 }}>
              Ceritakan rencana acaramu — tim kami susunkan destinasi, itinerary,
              dan anggarannya dari nol. Gratis konsultasi.
            </p>
            <button className="btn btn-wa" onClick={tripCustomWA}>
              Racik Trip Custom via WhatsApp
            </button>
          </div>

          {!user && (
            <div className="peringatan peringatan-biru" style={{ marginTop: 24 }}>
              💡 <Link to="/daftar">Daftar akun</Link> agar namamu otomatis tercantum saat
              konsultasi dan pesananmu tercatat di{" "}
              <Link to="/travel/riwayat">Riwayat Pemesanan</Link>.
            </div>
          )}
        </div>
      </section>

      <section className="seksi" style={{ paddingTop: 0 }}>
        <div className="wadah">
          <h2>Cara Pesan 🎒</h2>
          <p className="sub">Tiga langkah doang, sisanya biar tim Arkafa yang urus.</p>
          <div className="grid-3">
            <div className="kartu langkah" style={{ marginBottom: 0 }}>
              <span className="nomor">1</span>
              <div><strong>Pilih paketmu</strong><br />Tentukan destinasi, jenis acara, dan perkiraan peserta.</div>
            </div>
            <div className="kartu langkah" style={{ marginBottom: 0 }}>
              <span className="nomor">2</span>
              <div><strong>Konsultasi via WhatsApp</strong><br />Detail rencana keisi otomatis — tim kami bantu susun itinerary.</div>
            </div>
            <div className="kartu langkah" style={{ marginBottom: 0 }}>
              <span className="nomor">3</span>
              <div><strong>Fix jadwal, berangkat!</strong><br />Transport, penginapan, dan acara sudah kami siapkan.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
