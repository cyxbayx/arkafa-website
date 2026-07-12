import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, apiUpload, getToken, simpanToken, hapusToken } from "../lib/api.js";
import {
  albumKedaluwarsa, formatRupiah, formatTanggal, STATUS_WARNA, KATEGORI_ACARA,
} from "../data/dummy.js";

// ===== Panel Admin Arkafa =====
// Seluruh tab membaca/menulis database lewat API (/api/admin/*) dengan token
// akun ber-peran admin. Endpoint-nya menolak pengguna biasa (403).

const STATUS_PESANAN = ["Menunggu Konfirmasi", "Terkonfirmasi", "Selesai", "Dibatalkan"];

export default function Admin() {
  const [masuk, setMasuk] = useState(() => Boolean(getToken(true)));
  const [tab, setTab] = useState("ringkasan");
  const [versi, setVersi] = useState(0); // pemicu muat ulang data setelah perubahan
  const segarkan = () => setVersi((v) => v + 1);

  // ---- data panel (dimuat dari API) ----
  const [ringkasan, setRingkasan] = useState(null);
  const [pesanan, setPesanan] = useState([]);
  const [kodeLog, setKodeLog] = useState([]);
  const [paket, setPaket] = useState([]);
  const [bingkai, setBingkai] = useState([]);
  const [album, setAlbum] = useState([]);
  const [errData, setErrData] = useState("");

  useEffect(() => {
    if (!masuk) return;
    (async () => {
      try {
        const [r, p, k, pk, b, a] = await Promise.all([
          api("/admin/ringkasan", { admin: true }),
          api("/admin/pesanan", { admin: true }),
          api("/admin/kode", { admin: true }),
          api("/admin/paket", { admin: true }),
          api("/admin/bingkai", { admin: true }),
          api("/admin/album", { admin: true }),
        ]);
        setRingkasan(r); setPesanan(p); setKodeLog(k); setPaket(pk); setBingkai(b); setAlbum(a);
        setErrData("");
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          hapusToken(true);
          setMasuk(false);
        } else {
          setErrData(err.message);
        }
      }
    })();
  }, [masuk, versi]);

  // ---- aksi ----
  async function jalankan(aksi) {
    try {
      await aksi();
      segarkan();
    } catch (err) {
      setErrData(err.message);
    }
  }

  const ubahStatus = (id, status) =>
    jalankan(() => api(`/admin/pesanan/${id}`, { method: "PATCH", body: { status }, admin: true }));
  const hapusLogKode = () =>
    jalankan(() => api("/admin/kode", { method: "DELETE", admin: true }));

  // ---- login ----
  const [fUser, setFUser] = useState("");
  const [fSandi, setFSandi] = useState("");
  const [errLogin, setErrLogin] = useState("");
  const [sibukLogin, setSibukLogin] = useState(false);

  async function loginAdmin(e) {
    e.preventDefault();
    setErrLogin("");
    setSibukLogin(true);
    try {
      const { user, token } = await api("/auth/masuk", {
        method: "POST",
        body: { wa: fUser.trim(), sandi: fSandi },
      });
      if (user.peran !== "admin") {
        throw new Error("Akun ini bukan akun admin.");
      }
      simpanToken(token, { admin: true });
      setMasuk(true);
    } catch (err) {
      setErrLogin(err.message);
    } finally {
      setSibukLogin(false);
    }
  }

  function keluarAdmin() {
    hapusToken(true);
    setMasuk(false);
  }

  const kepala = (
    <header className="navbar">
      <div className="wadah navbar-isi">
        <Link to="/" className="logo" title="Ke halaman utama">
          <span className="logo-gambar"><img src="/logo.png?v=2" alt="Arkafa" /></span>
          <span className="logo-teks">
            Panel Admin
            <small>khusus pengelola Arkafa</small>
          </span>
        </Link>
        <div className="nav-akun">
          {masuk && (
            <button className="btn btn-garis btn-kecil" onClick={keluarAdmin}>Keluar</button>
          )}
        </div>
      </div>
    </header>
  );

  if (!masuk) {
    return (
      <>
        {kepala}
        <main>
          <section className="seksi">
            <div className="wadah auth-kotak">
              <div className="kartu">
                <h2 style={{ marginBottom: 6 }}>Masuk Admin 🔐</h2>
                <p className="sub">Halaman ini khusus pengelola Arkafa.</p>
                {errLogin && <div className="peringatan peringatan-merah">{errLogin}</div>}
                <form onSubmit={loginAdmin}>
                  <div className="form-grup">
                    <label htmlFor="au">Username</label>
                    <input id="au" type="text" required value={fUser} onChange={(e) => setFUser(e.target.value)} />
                  </div>
                  <div className="form-grup">
                    <label htmlFor="as">Kata sandi</label>
                    <input id="as" type="password" required value={fSandi} onChange={(e) => setFSandi(e.target.value)} />
                  </div>
                  <button className="btn btn-utama btn-blok" type="submit" disabled={sibukLogin}>
                    {sibukLogin ? "Memeriksa…" : "Masuk"}
                  </button>
                </form>
                {!import.meta.env.PROD && (
                  <div className="demo-info">
                    Demo — username: <code>admin</code>, sandi: <code>arkafa123</code>.
                    Diverifikasi server (sandi ter-hash, peran admin dicek di tiap permintaan).
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      {kepala}
      <main>
        <section className="seksi">
          <div className="wadah">
            <div className="tab-baris">
              {[
                ["ringkasan", "📊 Ringkasan"],
                ["pesanan", "🎒 Pesanan Trip"],
                ["kode", "🎟️ Kode Sesi Booth"],
                ["paket", "🗺️ Paket Wisata"],
                ["bingkai", "🎨 Bingkai Booth"],
                ["album", "🖼️ Album Galeri"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={"tab-tombol" + (tab === id ? " aktif" : "")}
                  onClick={() => setTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {errData && <div className="peringatan peringatan-merah">{errData}</div>}

            {/* ===== Ringkasan ===== */}
            {tab === "ringkasan" && (
              <>
                <h2>Ringkasan</h2>
                <p className="sub">Kondisi operasional Arkafa hari ini (dari database).</p>
                {!ringkasan ? (
                  <p className="sub">Memuat…</p>
                ) : (
                  <div className="grid-2">
                    <div className="kartu">
                      <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>🎒 Pesanan Trip</h3>
                      {STATUS_PESANAN.map((s) => (
                        <div key={s} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                          <span className={"badge " + (STATUS_WARNA[s] || "badge-abu")}>{s}</span>
                          <strong>{ringkasan.pesananPerStatus[s] || 0}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="kartu">
                      <h3 style={{ fontSize: "1.4rem", marginBottom: 8 }}>📸 Photo Booth</h3>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Kode sesi diterbitkan</span><strong>{ringkasan.kodeSesi}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Album galeri aktif</span><strong>{ringkasan.albumAktif} / {ringkasan.albumTotal}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Pengguna terdaftar</span><strong>{ringkasan.pengguna}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ===== Pesanan ===== */}
            {tab === "pesanan" && (
              <>
                <h2>Pesanan Trip</h2>
                <p className="sub">
                  Ubah status di sini — tersimpan ke database dan langsung tampil di
                  Riwayat Pemesanan pelanggan.
                </p>
                {pesanan.length === 0 ? (
                  <div className="kosong"><p>Belum ada pesanan tercatat.</p></div>
                ) : (
                  pesanan.map((b) => (
                    <div className="daftar-item" key={b.id}>
                      <div className="isi">
                        <h4>{b.paket?.nama || b.paketId} <span className="badge badge-abu">{b.id}</span></h4>
                        <div className="meta">
                          👤 {b.user?.nama || "(tamu)"} · {formatTanggal(b.tanggal)} · {b.peserta} peserta
                          {b.kategori && ` · ${KATEGORI_ACARA.find((k) => k.id === b.kategori)?.nama || b.kategori}`}
                        </div>
                        <div className="meta">Total {formatRupiah(b.total)} · dibuat {formatTanggal(b.dibuat.slice(0, 10))}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: "0.8rem", display: "block", marginBottom: 4 }}>Status</label>
                        <select
                          value={b.status}
                          onChange={(e) => ubahStatus(b.id, e.target.value)}
                          style={{ width: "auto" }}
                        >
                          {STATUS_PESANAN.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {/* ===== Kode sesi booth ===== */}
            {tab === "kode" && (
              <>
                <h2>Kode Sesi Booth</h2>
                <p className="sub">
                  Setiap kode yang diterbitkan tercatat di sini. Klik{" "}
                  <strong>Kirim via WA</strong> untuk mengirimkannya ke pelanggan dari
                  WhatsApp-mu — pesannya sudah terketik, tinggal tekan send.
                </p>
                {kodeLog.length === 0 ? (
                  <div className="kosong"><p>Belum ada kode sesi diterbitkan.</p></div>
                ) : (
                  <>
                    {kodeLog.map((k) => (
                      <div className="daftar-item" key={k.id} style={{ padding: "12px 16px" }}>
                        <div className="isi">
                          <h4 style={{ fontFamily: "Consolas, monospace", letterSpacing: 3 }}>{k.kode}</h4>
                          <div className="meta">
                            📱 {k.wa} · {k.layout} · {formatRupiah(k.harga)}
                            {k.metode && ` · via ${k.metode}`}
                          </div>
                          <div className="meta">
                            {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(k.waktu))}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <a
                            className="btn btn-wa btn-kecil"
                            href={`https://wa.me/${k.wa}?text=${encodeURIComponent(
                              `Halo! Ini kode sesi Arkafa Photo Booth kamu: *${k.kode}*\n\n` +
                              `Layout: ${k.layout} (${formatRupiah(k.harga)})\n` +
                              `Masukkan kodenya di layar booth untuk mulai sesi foto. Selamat berpose! 📸`
                            )}`}
                            target="_blank" rel="noreferrer"
                          >
                            Kirim via WA
                          </a>
                          <button
                            className="btn btn-garis btn-kecil"
                            onClick={() => navigator.clipboard.writeText(k.kode)}
                          >
                            Salin Kode
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-bahaya btn-kecil" onClick={hapusLogKode}>
                      Bersihkan Log
                    </button>
                  </>
                )}
              </>
            )}

            {/* ===== Paket wisata ===== */}
            {tab === "paket" && (
              <>
                <h2>Paket Wisata</h2>
                <p className="sub">
                  Tambah, ubah, nonaktifkan, atau hapus paket — tersimpan ke database dan
                  langsung berlaku di halaman Arkafa Travel.
                </p>
                <FormPaketBaru onTambah={segarkan} onError={setErrData} />
                {paket.map((p) => (
                  <BarisPaket key={p.id} paket={p} onSimpan={segarkan} onError={setErrData} />
                ))}
              </>
            )}

            {/* ===== Bingkai booth ===== */}
            {tab === "bingkai" && (
              <>
                <h2>Bingkai Photo Booth</h2>
                <p className="sub">
                  Model bingkai yang bisa dipilih pelanggan di layar edit booth —
                  langsung berlaku di sesi booth berikutnya.
                </p>
                <FormBingkaiBaru onTambah={segarkan} onError={setErrData} />
                {bingkai.map((b) => (
                  <BarisBingkai
                    key={b.id}
                    bingkai={b}
                    sisaAktif={bingkai.filter((x) => x.aktif).length}
                    onUbah={segarkan}
                    onError={setErrData}
                  />
                ))}
              </>
            )}

            {/* ===== Album galeri ===== */}
            {tab === "album" && (
              <>
                <h2>Album Galeri</h2>
                <p className="sub">
                  Upload dokumentasi trip / hasil sesi studio, lalu kirim link pribadinya
                  ke WhatsApp pelanggan.
                </p>
                <FormAlbumBaru onTambah={segarkan} onError={setErrData} />
                {album.map((a) => {
                  const mati = albumKedaluwarsa(a);
                  const linkGaleri = `${window.location.origin}/studio/g/${a.token}`;
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
                          {a._count.foto} foto · sesi {formatTanggal(a.tanggal)} · berlaku s/d {formatTanggal(a.kedaluwarsa)}
                          {a.wa && <> · 📱 {a.wa}</>}
                        </div>
                        <div className="meta" style={{ fontFamily: "Consolas, monospace" }}>/studio/g/{a.token}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <a
                          className="btn btn-wa btn-kecil"
                          href={`https://wa.me/${a.wa || ""}?text=${encodeURIComponent(
                            `Halo! Hasil fotomu dari Arkafa sudah siap 📸\n\n` +
                            `Album: ${a.nama}\nBuka di sini: ${linkGaleri}\n\n` +
                            `Link berlaku sampai ${a.kedaluwarsa}. Selamat menikmati!`
                          )}`}
                          target="_blank" rel="noreferrer"
                        >
                          Kirim Link via WA
                        </a>
                        <Link to={`/studio/g/${a.token}`} className="btn btn-garis btn-kecil">Lihat</Link>
                        <button
                          className="btn btn-utama btn-kecil"
                          onClick={() => jalankan(() => api(`/admin/album/${a.token}/perpanjang`, { method: "POST", body: { hari: 30 }, admin: true }))}
                        >
                          +30 Hari
                        </button>
                        <button
                          className="btn btn-bahaya btn-kecil"
                          onClick={() => {
                            if (!window.confirm(`Hapus album "${a.nama}" beserta seluruh fotonya? Link pelanggan ikut mati.`)) return;
                            jalankan(() => api(`/admin/album/${a.token}`, { method: "DELETE", admin: true }));
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div className="demo-info" style={{ marginTop: 24 }}>
              Panel ini membaca/menulis database (Neon PostgreSQL) melalui API dan
              dilindungi autentikasi peran admin di sisi server.
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

// Form upload album baru — foto tersimpan di server (folder uploads)
function FormAlbumBaru({ onTambah, onError }) {
  const [buka, setBuka] = useState(false);
  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [hari, setHari] = useState(30);
  const [files, setFiles] = useState([]);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    if (!files.length) {
      onError("Pilih minimal satu foto untuk album.");
      return;
    }
    setSibuk(true);
    try {
      const fd = new FormData();
      fd.append("nama", nama);
      const nomor = wa.replace(/[^0-9]/g, "");
      if (nomor) fd.append("wa", nomor.startsWith("0") ? "62" + nomor.slice(1) : nomor);
      fd.append("hari", hari);
      for (const f of files) fd.append("foto", f);
      await apiUpload("/admin/album", fd, { admin: true });
      setNama(""); setWa(""); setFiles([]); setBuka(false);
      onTambah();
    } catch (err) {
      onError(err.message);
    } finally {
      setSibuk(false);
    }
  }

  if (!buka) {
    return (
      <button className="btn btn-utama" style={{ marginBottom: 16 }} onClick={() => setBuka(true)}>
        + Upload Album Baru
      </button>
    );
  }

  return (
    <form className="kartu" style={{ marginBottom: 20 }} onSubmit={kirim}>
      <h3 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Album Baru 🖼️</h3>
      <div className="grid-2">
        <div className="form-grup">
          <label htmlFor="an">Nama album</label>
          <input id="an" required placeholder="contoh: Dokumentasi Trip Dieng — 20 Juli" value={nama} onChange={(e) => setNama(e.target.value)} />
        </div>
        <div className="form-grup">
          <label htmlFor="aw">Nomor WA pelanggan (opsional)</label>
          <input id="aw" type="tel" placeholder="08xxxxxxxxxx" value={wa} onChange={(e) => setWa(e.target.value)} />
          <div className="bantuan">Untuk tombol "Kirim Link via WA" nanti.</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div className="form-grup">
          <label htmlFor="ah">Masa berlaku (hari)</label>
          <input id="ah" type="number" min={1} style={{ width: 110 }} value={hari} onChange={(e) => setHari(e.target.value)} />
        </div>
        <div className="form-grup" style={{ flex: 1, minWidth: 220 }}>
          <label htmlFor="af">Foto (bisa banyak sekaligus)</label>
          <input id="af" type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
          {files.length > 0 && <div className="bantuan">{files.length} foto siap diupload.</div>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-utama btn-kecil" type="submit" disabled={sibuk}>
          {sibuk ? "Mengupload…" : "Upload & Buat Link"}
        </button>
        <button className="btn btn-garis btn-kecil" type="button" onClick={() => setBuka(false)}>Batal</button>
      </div>
    </form>
  );
}

// Baris editor paket: harga + min peserta + aktif/nonaktif + hapus
function BarisPaket({ paket, onSimpan, onError }) {
  const [harga, setHarga] = useState(paket.hargaPerOrang);
  const [minP, setMinP] = useState(paket.minPeserta);
  const [tersimpan, setTersimpan] = useState(false);

  async function simpan(dataTambahan = {}) {
    try {
      await api(`/admin/paket/${paket.id}`, {
        method: "PATCH",
        body: {
          hargaPerOrang: Math.max(0, Number(harga) || 0),
          minPeserta: Math.max(1, Number(minP) || 1),
          ...dataTambahan,
        },
        admin: true,
      });
      setTersimpan(true);
      setTimeout(() => setTersimpan(false), 1800);
      onSimpan();
    } catch (err) {
      onError(err.message);
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus paket "${paket.nama}" dari katalog? Riwayat pesanan lama tetap tersimpan.`)) return;
    try {
      await api(`/admin/paket/${paket.id}`, { method: "DELETE", admin: true });
      onSimpan();
    } catch (err) {
      onError(err.message);
    }
  }

  async function gantiFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append("foto", file);
      await apiUpload(`/admin/paket/${paket.id}/foto`, fd, { admin: true });
      onSimpan();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="daftar-item" style={{ opacity: paket.aktif === false ? 0.55 : 1 }}>
      <div className="isi">
        <h4>
          {paket.nama}{" "}
          <span className={"badge " + (paket.aktif === false ? "badge-merah" : "badge-hijau")}>
            {paket.aktif === false ? "Nonaktif" : "Aktif"}
          </span>
          {tersimpan && <span className="badge badge-biru" style={{ marginLeft: 6 }}>Tersimpan ✔</span>}
        </h4>
        <div className="meta">📍 {paket.lokasi} · {paket.durasi}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <label style={{ fontSize: "0.85rem" }}>
            Harga/orang
            <input
              type="number" min={0} step={5000} value={harga}
              onChange={(e) => setHarga(e.target.value)}
              style={{ width: 130, display: "block" }}
            />
          </label>
          <label style={{ fontSize: "0.85rem" }}>
            Min. peserta
            <input
              type="number" min={1} value={minP}
              onChange={(e) => setMinP(e.target.value)}
              style={{ width: 90, display: "block" }}
            />
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-utama btn-kecil" onClick={() => simpan()}>Simpan</button>
        <label className="btn btn-garis btn-kecil" style={{ cursor: "pointer" }}>
          📷 Ganti Foto
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={gantiFoto} />
        </label>
        <button
          className={"btn btn-kecil " + (paket.aktif === false ? "btn-garis" : "btn-bahaya")}
          onClick={() => simpan({ aktif: paket.aktif === false })}
        >
          {paket.aktif === false ? "Aktifkan" : "Nonaktifkan"}
        </button>
        <button className="btn btn-bahaya btn-kecil" onClick={hapus}>Hapus</button>
      </div>
    </div>
  );
}

// Form tambah paket baru
function FormPaketBaru({ onTambah, onError }) {
  const [buka, setBuka] = useState(false);
  const [f, setF] = useState({
    nama: "", lokasi: "", durasi: "1 hari", harga: 250000, minP: 10,
    kategori: [], fasilitas: "", ringkas: "",
  });

  function ubah(kunci, nilai) {
    setF((x) => ({ ...x, [kunci]: nilai }));
  }

  function toggleKategori(id) {
    setF((x) => ({
      ...x,
      kategori: x.kategori.includes(id)
        ? x.kategori.filter((k) => k !== id)
        : [...x.kategori, id],
    }));
  }

  async function kirim(e) {
    e.preventDefault();
    try {
      await api("/admin/paket", {
        method: "POST",
        body: {
          nama: f.nama,
          lokasi: f.lokasi,
          durasi: f.durasi,
          hargaPerOrang: Number(f.harga) || 0,
          minPeserta: Number(f.minP) || 1,
          kategori: f.kategori,
          fasilitas: f.fasilitas.split(",").map((s) => s.trim()).filter(Boolean),
          ringkas: f.ringkas,
        },
        admin: true,
      });
      setF({ nama: "", lokasi: "", durasi: "1 hari", harga: 250000, minP: 10, kategori: [], fasilitas: "", ringkas: "" });
      setBuka(false);
      onTambah();
    } catch (err) {
      onError(err.message);
    }
  }

  if (!buka) {
    return (
      <button className="btn btn-utama" style={{ marginBottom: 16 }} onClick={() => setBuka(true)}>
        + Tambah Paket Baru
      </button>
    );
  }

  return (
    <form className="kartu" style={{ marginBottom: 20 }} onSubmit={kirim}>
      <h3 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Paket Baru 🗺️</h3>
      <div className="grid-2">
        <div className="form-grup">
          <label htmlFor="pn">Nama paket</label>
          <input id="pn" required placeholder="contoh: Ciwidey Kawah Putih" value={f.nama} onChange={(e) => ubah("nama", e.target.value)} />
        </div>
        <div className="form-grup">
          <label htmlFor="pl">Lokasi/kota</label>
          <input id="pl" required placeholder="contoh: Bandung" value={f.lokasi} onChange={(e) => ubah("lokasi", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div className="form-grup">
          <label htmlFor="pd">Durasi</label>
          <input id="pd" style={{ width: 150 }} value={f.durasi} onChange={(e) => ubah("durasi", e.target.value)} />
        </div>
        <div className="form-grup">
          <label htmlFor="ph">Harga/orang</label>
          <input id="ph" type="number" min={0} step={5000} style={{ width: 150 }} value={f.harga} onChange={(e) => ubah("harga", e.target.value)} />
        </div>
        <div className="form-grup">
          <label htmlFor="pm">Min. peserta</label>
          <input id="pm" type="number" min={1} style={{ width: 110 }} value={f.minP} onChange={(e) => ubah("minP", e.target.value)} />
        </div>
      </div>
      <div className="form-grup">
        <label>Jenis acara</label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {KATEGORI_ACARA.map((k) => (
            <label key={k.id} style={{ fontSize: "0.9rem", display: "flex", gap: 5, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={f.kategori.includes(k.id)}
                onChange={() => toggleKategori(k.id)}
                style={{ width: "auto" }}
              />
              {k.nama}
            </label>
          ))}
        </div>
      </div>
      <div className="form-grup">
        <label htmlFor="pf">Fasilitas (pisahkan dengan koma)</label>
        <input id="pf" placeholder="Transport PP, Makan siang, Tiket wisata" value={f.fasilitas} onChange={(e) => ubah("fasilitas", e.target.value)} />
      </div>
      <div className="form-grup">
        <label htmlFor="pr">Deskripsi singkat</label>
        <input id="pr" placeholder="Satu kalimat penggoda tentang paket ini" value={f.ringkas} onChange={(e) => ubah("ringkas", e.target.value)} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-utama btn-kecil" type="submit">Simpan Paket</button>
        <button className="btn btn-garis btn-kecil" type="button" onClick={() => setBuka(false)}>Batal</button>
      </div>
      <div className="demo-info" style={{ marginTop: 12 }}>
        Foto paket memakai placeholder dulu — upload foto asli membutuhkan object storage.
      </div>
    </form>
  );
}

// Baris bingkai booth: pratinjau warna/desain + aktif/nonaktif + hapus
function BarisBingkai({ bingkai, sisaAktif, onUbah, onError }) {
  const aktif = bingkai.aktif;
  // minimal harus tersisa 1 bingkai aktif (server juga menjaganya)
  const terakhir = aktif && sisaAktif <= 1;

  const latar = bingkai.gambar
    ? `url("${bingkai.gambar}") center/cover`
    : bingkai.gradien
      ? `linear-gradient(135deg, ${bingkai.bg}, ${bingkai.bg2})`
      : bingkai.bg;

  async function ubahAktif() {
    try {
      await api(`/admin/bingkai/${bingkai.id}`, { method: "PATCH", body: { aktif: !aktif }, admin: true });
      onUbah();
    } catch (err) {
      onError(err.message);
    }
  }

  async function hapus() {
    if (!window.confirm(`Hapus bingkai "${bingkai.nama}"?`)) return;
    try {
      await api(`/admin/bingkai/${bingkai.id}`, { method: "DELETE", admin: true });
      onUbah();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="daftar-item" style={{ opacity: aktif ? 1 : 0.55 }}>
      <div className="isi" style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span
          title={bingkai.nama}
          style={{
            width: 54, height: 72, flexShrink: 0, background: latar,
            border: "2px solid var(--tinta)", borderRadius: 8,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            fontFamily: "Caveat, cursive", fontSize: "0.85rem", color: bingkai.teks,
            paddingBottom: 4,
          }}
        >
          Arkafa
        </span>
        <div>
          <h4>
            {bingkai.nama}{" "}
            <span className={"badge " + (aktif ? "badge-hijau" : "badge-merah")}>
              {aktif ? "Aktif" : "Nonaktif"}
            </span>
          </h4>
          <div className="meta">
            {bingkai.gambar
              ? "Desain custom"
              : bingkai.gradien
                ? `Gradasi ${bingkai.bg} → ${bingkai.bg2}`
                : `Polos ${bingkai.bg}`}
            {" · teks "}{bingkai.teks}
          </div>
          {terakhir && (
            <div className="meta" style={{ color: "#a16207" }}>
              ⚠ bingkai aktif terakhir — tidak bisa dinonaktifkan/dihapus
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className={"btn btn-kecil " + (aktif ? "btn-bahaya" : "btn-garis")}
          disabled={terakhir}
          onClick={ubahAktif}
        >
          {aktif ? "Nonaktifkan" : "Aktifkan"}
        </button>
        <button className="btn btn-bahaya btn-kecil" disabled={terakhir} onClick={hapus}>
          Hapus
        </button>
      </div>
    </div>
  );
}

// Form tambah bingkai booth baru — upload desain sendiri atau racik warna
function FormBingkaiBaru({ onTambah, onError }) {
  const [buka, setBuka] = useState(false);
  const [jenis, setJenis] = useState("desain"); // desain (upload) | warna
  const [nama, setNama] = useState("");
  const [gambar, setGambar] = useState(null); // data URL desain yang diupload
  const [bg, setBg] = useState("#fcd34d");
  const [gradasi, setGradasi] = useState(false);
  const [bg2, setBg2] = useState("#f9a8d4");
  const [teks, setTeks] = useState("#2b2926");
  const [err, setErr] = useState("");

  function pilihFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // kecilkan sebelum dikirim (produksi: upload langsung ke object storage)
      const maks = 1000;
      const s = Math.min(1, maks / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      setGambar(c.toDataURL("image/jpeg", 0.85));
      setErr("");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setErr("File gambarnya tidak bisa dibaca.");
    img.src = url;
  }

  async function kirim(e) {
    e.preventDefault();
    if (jenis === "desain" && !gambar) {
      setErr("Pilih dulu file desain bingkainya.");
      return;
    }
    try {
      if (jenis === "desain") {
        // kirim file desain sebagai upload — tersimpan di server, bukan di database
        const blob = await (await fetch(gambar)).blob();
        const fd = new FormData();
        fd.append("nama", nama);
        fd.append("teks", teks);
        fd.append("sub", teks);
        fd.append("desain", blob, "desain.jpg");
        await apiUpload("/admin/bingkai", fd, { admin: true });
      } else {
        await api("/admin/bingkai", {
          method: "POST",
          body: { nama, bg, ...(gradasi ? { bg2 } : {}), teks, sub: teks },
          admin: true,
        });
      }
      setNama("");
      setGambar(null);
      setErr("");
      setBuka(false);
      onTambah();
    } catch (errKirim) {
      onError(errKirim.message);
    }
  }

  if (!buka) {
    return (
      <button className="btn btn-utama" style={{ marginBottom: 16 }} onClick={() => setBuka(true)}>
        + Tambah Bingkai Baru
      </button>
    );
  }

  const latar =
    jenis === "desain" && gambar
      ? `url("${gambar}") center/cover`
      : gradasi && jenis === "warna"
        ? `linear-gradient(135deg, ${bg}, ${bg2})`
        : jenis === "warna"
          ? bg
          : "repeating-linear-gradient(45deg, #eee, #eee 8px, #f8f8f8 8px, #f8f8f8 16px)";

  return (
    <form className="kartu" style={{ marginBottom: 20 }} onSubmit={kirim}>
      <h3 style={{ fontSize: "1.3rem", marginBottom: 10 }}>Bingkai Baru 🎨</h3>
      {err && <div className="peringatan peringatan-merah">{err}</div>}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div
          style={{
            width: 90, height: 120, background: latar, flexShrink: 0,
            border: "2px solid var(--tinta)", borderRadius: 10,
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            fontFamily: "Caveat, cursive", fontSize: "1.05rem", color: teks, paddingBottom: 8,
          }}
        >
          Arkafa
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div className="form-grup">
            <label htmlFor="bn">Nama bingkai</label>
            <input id="bn" required placeholder="contoh: Cherry Pop" value={nama} onChange={(e) => setNama(e.target.value)} />
          </div>
          <div className="form-grup">
            <label>Jenis bingkai</label>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[["desain", "Desain custom (upload gambar)"], ["warna", "Warna polos/gradasi"]].map(([id, label]) => (
                <label key={id} style={{ fontSize: "0.9rem", display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="radio" name="jenis-bingkai" checked={jenis === id}
                    onChange={() => setJenis(id)} style={{ width: "auto" }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {jenis === "desain" ? (
            <div className="form-grup">
              <label htmlFor="bf">File desain (disarankan rasio potret, mis. 1000×1400)</label>
              <input id="bf" type="file" accept="image/*" onChange={pilihFile} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="form-grup">
                <label htmlFor="bw1">Warna utama</label>
                <input id="bw1" type="color" value={bg} onChange={(e) => setBg(e.target.value)} style={{ width: 64, height: 38, padding: 2 }} />
              </div>
              <label style={{ fontSize: "0.9rem", display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
                <input type="checkbox" checked={gradasi} onChange={(e) => setGradasi(e.target.checked)} style={{ width: "auto" }} />
                Gradasi dua warna
              </label>
              {gradasi && (
                <div className="form-grup">
                  <label htmlFor="bw2">Warna kedua</label>
                  <input id="bw2" type="color" value={bg2} onChange={(e) => setBg2(e.target.value)} style={{ width: 64, height: 38, padding: 2 }} />
                </div>
              )}
            </div>
          )}

          <div className="form-grup">
            <label htmlFor="bt">Warna teks caption ("Arkafa" di bawah strip)</label>
            <input id="bt" type="color" value={teks} onChange={(e) => setTeks(e.target.value)} style={{ width: 64, height: 38, padding: 2 }} />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button className="btn btn-utama btn-kecil" type="submit">Simpan Bingkai</button>
        <button className="btn btn-garis btn-kecil" type="button" onClick={() => setBuka(false)}>Batal</button>
      </div>
    </form>
  );
}
