import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/store.jsx";
import { WA_ADMIN } from "../data/dummy.js";

// Satu komponen layout, tiga identitas situs berbeda:
// - travel  : Arkafa Travel (tema oranye)
// - studio  : Arkafa Photo Studio (tema ungu)
// - akun    : halaman akun bersama (netral)
const SITUS = {
  travel: {
    tema: "tema-travel",
    label: "Travel",
    nama: "Arkafa Travel",
    tagline: "Partner liburan & gathering",
    beranda: "/travel",
    menu: [
      { ke: "/travel", label: "Paket Wisata", end: true },
      { ke: "/travel/riwayat", label: "Riwayat Pemesanan" },
    ],
  },
  studio: {
    tema: "tema-studio",
    label: "Photo Studio",
    nama: "Arkafa Photo Studio",
    tagline: "Booth, edit & hasil foto",
    beranda: "/studio",
    // tanpa menu — beranda Studio adalah pusat navigasinya
    menu: [],
  },
  akun: {
    tema: "",
    label: "Akun",
    nama: "Arkafa",
    tagline: "Akun & referral",
    beranda: "/",
    menu: [
      { ke: "/travel", label: "Arkafa Travel" },
      { ke: "/studio", label: "Photo Studio" },
    ],
  },
};

export default function SitusLayout({ situs, children }) {
  const s = SITUS[situs];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // tombol kembali tampil di semua halaman studio selain berandanya;
  // /studio/booth mengelola tombol kembalinya sendiri (mundur per fase sesi)
  const tampilKembali =
    situs === "studio" && pathname !== "/studio" && pathname !== "/studio/booth";

  function keluar() {
    logout();
    navigate("/");
  }

  const kelas = ({ isActive }) => "nav-link" + (isActive ? " aktif" : "");

  return (
    <div className={s.tema}>
      <header className="navbar">
        <div className="wadah navbar-isi">
          <span className="logo">
            <Link to="/" className="logo-gambar" title="Ke halaman utama Arkafa">
              <img src="/logo.png?v=2" alt="Arkafa" />
            </Link>
            <span className="logo-teks">
              {s.label}
              <small>{s.tagline}</small>
            </span>
          </span>
          {s.menu.length > 0 && (
            <nav className="nav-menu">
              {s.menu.map((m) => (
                <NavLink key={m.ke} to={m.ke} className={kelas} end={m.end}>
                  {m.label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="nav-akun">
            {user ? (
              <>
                <NavLink to="/undang" className={kelas}>Undang Teman</NavLink>
                <span className="nav-user">Hai, {user.nama.split(" ")[0]}!</span>
                <button className="btn btn-garis btn-kecil" onClick={keluar}>
                  Keluar
                </button>
              </>
            ) : (
              <>
                <NavLink to="/masuk" className={kelas}>Masuk</NavLink>
                <Link to="/daftar" className="btn btn-utama btn-kecil">Daftar</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {tampilKembali && (
          <div className="wadah kembali-bar">
            <Link to="/studio" className="kembali">← Kembali ke Photo Studio</Link>
          </div>
        )}
        {children}
      </main>

      <footer className="footer">
        <div className="wadah footer-grid">
          <div>
            <h4>{s.nama}</h4>
            <p>
              Bagian dari Arkafa — EO liburan, gathering, dan studio foto.
              Pemesanan difinalkan melalui WhatsApp.
            </p>
            <p style={{ marginTop: 8 }}>
              <a href={`https://wa.me/${WA_ADMIN}`} target="_blank" rel="noreferrer">
                WhatsApp Admin: +62 812-3456-7890
              </a>
            </p>
          </div>
          <div>
            <h4>Arkafa Travel</h4>
            <ul>
              <li><Link to="/travel">Paket Wisata</Link></li>
              <li><Link to="/travel/riwayat">Riwayat Pemesanan</Link></li>
            </ul>
          </div>
          <div>
            <h4>Arkafa Photo Studio</h4>
            <ul>
              <li><Link to="/studio/booth">Photo Booth</Link></li>
              <li><Link to="/studio/galeri">Terima Hasil Foto</Link></li>
              <li><Link to="/undang">Undang Teman</Link></li>
            </ul>
          </div>
        </div>
        <div className="wadah footer-garis footer-bawah">
          <span>© 2026 Arkafa. Seluruh hak cipta dilindungi.</span>
          <span>
            <a href="#">Kebijakan Privasi</a> · <a href="#">Syarat &amp; Ketentuan</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
