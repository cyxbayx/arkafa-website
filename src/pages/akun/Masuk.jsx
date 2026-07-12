import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/store.jsx";

export default function Masuk() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [wa, setWa] = useState("");
  const [sandi, setSandi] = useState("");
  const [ingat, setIngat] = useState(true);
  const [error, setError] = useState("");
  const [lupa, setLupa] = useState(false);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(e) {
    e.preventDefault();
    setError("");
    setSibuk(true);
    try {
      await login(wa, sandi, ingat);
      navigate(location.state?.dari || "/travel/riwayat");
    } catch (err) {
      setError(err.message);
    } finally {
      setSibuk(false);
    }
  }

  if (lupa) {
    return (
      <section className="seksi">
        <div className="wadah auth-kotak">
          <div className="kartu">
            <h2 style={{ marginBottom: 6 }}>Lupa Kata Sandi</h2>
            <p className="sub">
              Masukkan nomor WhatsApp Anda. Kami akan mengirim tautan atur ulang kata sandi.
            </p>
            <div className="form-grup">
              <label htmlFor="wa-lupa">Nomor WhatsApp</label>
              <input id="wa-lupa" type="tel" placeholder="08xxxxxxxxxx" />
            </div>
            <div className="peringatan peringatan-biru">
              Demo: pengiriman tautan reset disimulasikan — di versi produksi tautan
              dikirim via OTP WhatsApp.
            </div>
            <button className="btn btn-utama btn-blok" onClick={() => setLupa(false)}>
              Kembali ke Halaman Masuk
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="seksi">
      <div className="wadah auth-kotak">
        <div className="kartu">
          <h2 style={{ marginBottom: 6 }}>Welcome back! 👋</h2>
          <p className="sub">Satu akun buat Arkafa Travel dan Photo Studio sekaligus.</p>

          {error && <div className="peringatan peringatan-merah">{error}</div>}

          <form onSubmit={kirim}>
            <div className="form-grup">
              <label htmlFor="wa">Nomor WhatsApp</label>
              <input
                id="wa" type="tel" required placeholder="08xxxxxxxxxx"
                value={wa} onChange={(e) => setWa(e.target.value)}
              />
            </div>
            <div className="form-grup">
              <label htmlFor="sandi">Kata sandi</label>
              <input
                id="sandi" type="password" required
                value={sandi} onChange={(e) => setSandi(e.target.value)}
              />
            </div>
            <div className="form-grup cek-baris">
              <input
                id="ingat" type="checkbox" checked={ingat}
                onChange={(e) => setIngat(e.target.checked)}
              />
              <label htmlFor="ingat" style={{ margin: 0, fontWeight: 400 }}>Ingat saya</label>
              <button
                type="button" onClick={() => setLupa(true)}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--aksen-tua)", cursor: "pointer", fontSize: "0.85rem", fontFamily: "inherit" }}
              >
                Lupa kata sandi?
              </button>
            </div>
            <button className="btn btn-utama btn-blok" type="submit" disabled={sibuk}>
              {sibuk ? "Memeriksa…" : "Masuk"}
            </button>
          </form>

          <p style={{ marginTop: 14, fontSize: "0.9rem", textAlign: "center" }}>
            Belum punya akun? <Link to="/daftar">Daftar sekarang</Link>
          </p>

          <div className="demo-info">
            Akun demo — WhatsApp: <code>089876543210</code>, kata sandi: <code>demo1234</code>.
            Login dibatasi 5 percobaan gagal per menit (rate limiting).
          </div>
        </div>
      </div>
    </section>
  );
}
