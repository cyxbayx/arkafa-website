import { Link } from "react-router-dom";

export default function StudioHome() {
  return (
    <>
      <section className="hero">
        <div className="wadah">
          <h1>
            Arkafa <span>Photo Studio</span>
          </h1>
          <p>
            Pose terbaikmu layak dapat panggung. Masuk booth, tunggu aba-aba,
            dan bawa pulang strip yang siap nge-feed ✨
          </p>
        </div>
      </section>

      <section className="seksi">
        <div className="wadah">
          <h2>Ada Apa Aja? 🎀</h2>
          <p className="sub">Semua kebutuhan foto kamu dalam satu tempat.</p>
          <div className="grid-3">
            <div className="kartu kartu-layanan">
              <span className="ikon">🤳</span>
              <h3>Arkafa Photo Booth</h3>
              <p>
                Vibes self-photo studio kekinian: pilih layout strip atau grid,
                countdown jalan otomatis, gaya bebas beberapa pose, lalu bawa pulang
                photo strip aesthetic dengan bingkai warna-warni dan filter.
              </p>
              <Link to="/studio/booth" className="btn btn-utama btn-kecil">Gas Mulai</Link>
            </div>
            <div className="kartu kartu-layanan">
              <span className="ikon">🔗</span>
              <h3>Terima Hasil Foto</h3>
              <p>
                Strip photo booth yang dikirim ke WhatsApp-mu dan dokumentasi trip
                bareng Arkafa Travel, semua mendarat di sini lewat link pribadi.
                Buka, pilih, unduh satuan atau sekaligus (ZIP), dan bagikan.
              </p>
              <Link to="/studio/galeri" className="btn btn-utama btn-kecil">Buka Hasil Foto</Link>
            </div>
            <div className="kartu kartu-layanan">
              <span className="ikon">🖼️</span>
              <h3>Galeri Saya</h3>
              <p>
                Pengguna terdaftar dapat melihat semua tautan foto yang pernah
                diterima serta photo strip hasil sesi booth, kapan pun dibutuhkan.
              </p>
              <Link to="/studio/saya" className="btn btn-utama btn-kecil">Buka Galeri Saya</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="seksi" style={{ paddingTop: 0 }}>
        <div className="wadah">
          <h2>Alur Terima Hasil Foto 📬</h2>
          <p className="sub">Dari cekrek sampai file mendarat di HP kamu.</p>
          <div className="kartu">
            <div className="langkah">
              <span className="nomor">1</span>
              <div><strong>Sesimu selesai</strong> — habis seru-seruan di photo booth, atau pulang trip bareng Arkafa Travel yang ada dokumentasinya.</div>
            </div>
            <div className="langkah">
              <span className="nomor">2</span>
              <div><strong>Link pribadi masuk WhatsApp-mu</strong> — hanya kamu yang bisa membukanya, dan ada masa berlakunya. Tinggal klik.</div>
            </div>
            <div className="langkah" style={{ marginBottom: 0 }}>
              <span className="nomor">3</span>
              <div><strong>Buka, pilih, bagikan</strong> — unduh satuan resolusi penuh atau semuanya sekaligus dalam satu file ZIP.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
