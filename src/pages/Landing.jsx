import { Link } from "react-router-dom";
import { WA_ADMIN } from "../data/dummy.js";
import { useAuth } from "../lib/store.jsx";
import ProfilMenu from "../components/ProfilMenu.jsx";

export default function Landing() {
  const { user, siap, logout } = useAuth();

  return (
    <div className="landing">
      <div className="landing-atas">
        <span className="logo">
          <span className="logo-gambar">
            <img src="/logo.png?v=2" alt="Arkafa" />
          </span>
        </span>
        <div className="landing-akun">
          {!siap ? null : user ? (
            <ProfilMenu user={user} onKeluar={logout} />
          ) : (
            <>
              <Link to="/masuk" className="btn btn-garis btn-kecil">Masuk</Link>
              <Link to="/daftar" className="btn btn-utama btn-kecil">Daftar</Link>
            </>
          )}
        </div>
      </div>

      <div className="wadah landing-tengah">
        <div className="landing-hero">
          <h1>
            Mau ke mana <span className="coret">hari ini</span>?
          </h1>
          <p>
            Setiap perjalanan layak dikenang, setiap momen layak diabadikan.
            Mulai dua-duanya dari sini 👇
          </p>

          <div className="portal-grid">
            <Link to="/travel" className="portal portal-travel">
              <h2>Arkafa Travel</h2>
              <p>
                Open trip, family gathering, sampai outing kantor ke tempat wisata —
                kamu tinggal kumpulkan orangnya, itinerary dan semua urusan biar kami yang atur 💨
              </p>
              <span className="masuk-portal">Gas ke Arkafa Travel →</span>
            </Link>

            <Link to="/studio" className="portal portal-studio">
              <h2>Arkafa Photo Studio</h2>
              <p>
                Photo booth kekinian dengan countdown otomatis &amp; edit per pose,
                plus hasil sesi studiomu dikirim lewat link pribadi. Aesthetic terjamin ✨
              </p>
              <span className="masuk-portal">Cus ke Photo Studio →</span>
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="wadah footer-grid">
          <div>
            <img src="/logo.png?v=2" alt="Arkafa" className="footer-logo" />
            <p>
              EO liburan, gathering, dan studio foto dalam satu atap.
              Melayani perjalanan dan mengabadikan momen Anda sejak 2026.
            </p>
          </div>
          <div>
            <h4>Layanan</h4>
            <ul>
              <li><Link to="/travel">Travel</Link></li>
              <li><Link to="/studio/booth">Photo Booth</Link></li>
            </ul>
          </div>
          <div>
            <h4>Hubungi Kami</h4>
            <ul>
              <li>Jl. Kenangan Indah No. 12, Bandung</li>
              <li>Senin–Minggu, 08.00–20.00 WIB</li>
              <li>
                <a href={`https://wa.me/${WA_ADMIN}`} target="_blank" rel="noreferrer">
                  WhatsApp: +62 812-3456-7890
                </a>
              </li>
              <li><a href="mailto:halo@arkafa.id">halo@arkafa.id</a></li>
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
