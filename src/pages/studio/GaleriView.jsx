import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import JSZip from "jszip";
import { api } from "../../lib/api.js";
import { formatTanggal, WA_ADMIN } from "../../data/dummy.js";

// Galeri publik via tautan bertoken (PRD 5.3) — bisa dibuka tanpa login.
// Validasi token & masa berlaku dilakukan di server.

function unduhDataUri(url, namaFile) {
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  a.click();
}

export default function GaleriView() {
  const { token } = useParams();
  const [album, setAlbum] = useState(null);
  const [status, setStatus] = useState("muat"); // muat | siap | mati | hilang
  const [terpilih, setTerpilih] = useState(() => new Set());
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    setStatus("muat");
    api(`/galeri/${token}`)
      .then((data) => { setAlbum(data); setStatus("siap"); })
      .catch((err) => {
        if (err.status === 410) { setAlbum(err.data?.album || null); setStatus("mati"); }
        else setStatus("hilang");
      });
  }, [token]);

  if (status === "muat") {
    return (
      <section className="seksi">
        <div className="wadah"><p className="sub">Membuka album…</p></div>
      </section>
    );
  }

  if (status === "hilang") {
    return (
      <section className="seksi">
        <div className="wadah">
          <div className="kosong" style={{ maxWidth: 520, margin: "40px auto" }}>
            <div className="besar">🔒</div>
            <h3 style={{ marginBottom: 6 }}>Tautan tidak ditemukan</h3>
            <p style={{ marginBottom: 14 }}>
              Token <code>{token}</code> tidak dikenali. Periksa kembali tautan yang
              dikirim admin, atau hubungi kami.
            </p>
            <a className="btn btn-wa" href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent("Halo Admin Arkafa Photo Studio, tautan hasil foto saya tidak bisa dibuka. Mohon dibantu.")}`} target="_blank" rel="noreferrer">
              Hubungi Admin
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (status === "mati") {
    return (
      <section className="seksi">
        <div className="wadah">
          <div className="kosong" style={{ maxWidth: 520, margin: "40px auto" }}>
            <div className="besar">⏰</div>
            <h3 style={{ marginBottom: 6 }}>Tautan sudah kedaluwarsa</h3>
            <p style={{ marginBottom: 14 }}>
              {album ? (
                <>Album <strong>{album.nama}</strong> berlaku sampai {formatTanggal(album.kedaluwarsa)}.</>
              ) : (
                <>Album ini sudah melewati masa berlakunya.</>
              )}{" "}
              Silakan minta perpanjangan tautan ke admin.
            </p>
            <a
              className="btn btn-wa"
              href={`https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(`Halo Admin Arkafa Photo Studio, mohon perpanjangan tautan album "${album?.nama || token}" (token ${token}). Terima kasih.`)}`}
              target="_blank" rel="noreferrer"
            >
              Minta Perpanjangan via WhatsApp
            </a>
          </div>
        </div>
      </section>
    );
  }

  const semuaTerpilih = terpilih.size === album.foto.length;

  function toggle(id) {
    setTerpilih((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function pilihSemua() {
    setTerpilih(semuaTerpilih ? new Set() : new Set(album.foto.map((f) => f.id)));
  }

  async function unduhZip() {
    const daftar = album.foto.filter((f) => terpilih.size === 0 || terpilih.has(f.id));
    setSibuk(true);
    setPesan("");
    try {
      const zip = new JSZip();
      const map = daftar.map(async (f) => {
        const blob = await (await fetch(f.url)).blob();
        zip.file(f.nama, blob);
      });
      await Promise.all(map);
      const hasil = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(hasil);
      unduhDataUri(url, `arkafa-${album.nama.replace(/\s+/g, "-").toLowerCase()}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setPesan(`${daftar.length} foto berhasil dikemas dalam ZIP dan diunduh. ✔`);
    } catch {
      setPesan("Gagal membuat ZIP. Coba lagi.");
    } finally {
      setSibuk(false);
    }
  }

  async function bagikan(urlBagi, judul) {
    if (navigator.share) {
      try {
        await navigator.share({ title: judul, url: urlBagi });
        return;
      } catch { /* pengguna membatalkan — lanjut salin */ }
    }
    await navigator.clipboard.writeText(urlBagi);
    setPesan("Tautan disalin ke clipboard. ✔");
  }

  const urlGaleri = window.location.href;

  return (
    <section className="seksi">
      <div className="wadah">
        <h2>{album.nama}</h2>
        <p className="sub">
          Sesi {formatTanggal(album.tanggal)} · {album.foto.length} foto · tautan berlaku
          s/d {formatTanggal(album.kedaluwarsa)}{" "}
          <span className="badge badge-hijau">Aktif</span>
        </p>

        {pesan && <div className="peringatan peringatan-hijau">{pesan}</div>}

        <div className="aksi-bar">
          <button className="btn btn-garis btn-kecil" onClick={pilihSemua}>
            {semuaTerpilih ? "Batalkan Semua" : "Pilih Semua"}
          </button>
          <span style={{ fontSize: "0.85rem", color: "var(--teks-2)" }}>
            {terpilih.size > 0 ? `${terpilih.size} foto terpilih` : "Belum ada yang dipilih"}
          </span>
          <button className="btn btn-utama btn-kecil" onClick={unduhZip} disabled={sibuk}>
            {sibuk ? "Mengemas ZIP…" : terpilih.size > 0 ? `⬇ Unduh ${terpilih.size} Foto (ZIP)` : "⬇ Unduh Semua (ZIP)"}
          </button>
          <button className="btn btn-navy btn-kecil" onClick={() => bagikan(urlGaleri, `Galeri ${album.nama} — Arkafa`)}>
            🔗 Bagikan Galeri
          </button>
        </div>

        <div className="galeri-grid">
          {album.foto.map((f) => (
            <div className={"galeri-foto" + (terpilih.has(f.id) ? " terpilih" : "")} key={f.id}>
              <img src={f.url} alt={f.nama} loading="lazy" onClick={() => toggle(f.id)} style={{ cursor: "pointer" }} />
              <input
                type="checkbox" className="pilih" checked={terpilih.has(f.id)}
                onChange={() => toggle(f.id)} aria-label={"Pilih " + f.nama}
              />
              <div className="aksi-foto">
                <button className="btn btn-utama btn-kecil" onClick={() => unduhDataUri(f.url, f.nama)}>
                  ⬇ Unduh
                </button>
                <button className="btn btn-garis btn-kecil" style={{ background: "#fff" }} onClick={() => bagikan(urlGaleri + "#" + f.id, f.nama)}>
                  🔗
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="demo-info">
          Demo: foto adalah placeholder dummy. Unduhan tunggal memakai resolusi penuh;
          unduhan massal dikemas ZIP (mendukung ≥ 50 foto per batch). Tautan galeri ini
          bertoken acak {album.token.length} karakter dan tidak memerlukan login —{" "}
          <Link to="/daftar">pengguna terdaftar</Link> juga bisa melihatnya di Galeri Saya.
        </div>
      </div>
    </section>
  );
}
