import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../lib/store.jsx";

export default function Daftar() {
  const { register, verifyOtp, pending } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [sandi, setSandi] = useState("");
  const [sandi2, setSandi2] = useState("");
  const [kodeRef, setKodeRef] = useState(params.get("ref") || "");
  const [otpDemo, setOtpDemo] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [error, setError] = useState("");

  async function kirim(e) {
    e.preventDefault();
    setError("");
    if (sandi !== sandi2) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    try {
      const otp = await register({ nama, wa, password: sandi, kodeReferral: kodeRef });
      setOtpDemo(otp);
    } catch (err) {
      setError(err.message);
    }
  }

  async function verifikasi(e) {
    e.preventDefault();
    setError("");
    try {
      await verifyOtp(otpInput);
      navigate("/undang");
    } catch (err) {
      setError(err.message);
    }
  }

  // Langkah 2: verifikasi OTP (simulasi WhatsApp)
  if (pending) {
    return (
      <section className="seksi">
        <div className="wadah auth-kotak">
          <div className="kartu">
            <h2 style={{ marginBottom: 6 }}>Verifikasi Nomor WhatsApp</h2>
            <p className="sub">
              Kami mengirim kode OTP 6 digit ke nomor <strong>{pending.wa}</strong>.
            </p>
            <div className="peringatan peringatan-biru">
              Demo: OTP tidak benar-benar dikirim. Kode Anda: <strong>{otpDemo}</strong>
            </div>
            {error && <div className="peringatan peringatan-merah">{error}</div>}
            <form onSubmit={verifikasi}>
              <div className="form-grup">
                <label htmlFor="otp">Kode OTP</label>
                <input
                  id="otp" type="text" inputMode="numeric" maxLength={6} required
                  placeholder="6 digit" value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  style={{ letterSpacing: 6, textAlign: "center", fontSize: "1.2rem" }}
                />
              </div>
              <button className="btn btn-utama btn-blok" type="submit">
                Verifikasi &amp; Masuk
              </button>
            </form>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="seksi">
      <div className="wadah auth-kotak">
        <div className="kartu">
          <h2 style={{ marginBottom: 6 }}>Join Arkafa ✨</h2>
          <p className="sub">
            Sekali daftar, riwayat travel dan galeri fotomu rapi tersimpan di satu akun.
          </p>

          {error && <div className="peringatan peringatan-merah">{error}</div>}

          <form onSubmit={kirim}>
            <div className="form-grup">
              <label htmlFor="nama">Nama lengkap</label>
              <input
                id="nama" type="text" required value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>
            <div className="form-grup">
              <label htmlFor="wa">Nomor WhatsApp</label>
              <input
                id="wa" type="tel" required placeholder="08xxxxxxxxxx"
                value={wa} onChange={(e) => setWa(e.target.value)}
              />
              <div className="bantuan">Digunakan untuk verifikasi dan komunikasi pemesanan.</div>
            </div>
            <div className="form-grup">
              <label htmlFor="sandi">Kata sandi</label>
              <input
                id="sandi" type="password" required minLength={8} value={sandi}
                onChange={(e) => setSandi(e.target.value)}
              />
              <div className="bantuan">Minimal 8 karakter.</div>
            </div>
            <div className="form-grup">
              <label htmlFor="sandi2">Ulangi kata sandi</label>
              <input
                id="sandi2" type="password" required minLength={8} value={sandi2}
                onChange={(e) => setSandi2(e.target.value)}
              />
            </div>
            <div className="form-grup">
              <label htmlFor="ref">Kode referral (opsional)</label>
              <input
                id="ref" type="text" placeholder="mis. ARKA7B2D" value={kodeRef}
                onChange={(e) => setKodeRef(e.target.value)}
              />
              <div className="bantuan">Punya kode dari teman? Masukkan di sini.</div>
            </div>
            <button className="btn btn-utama btn-blok" type="submit">Daftar</button>
          </form>

          <p style={{ marginTop: 14, fontSize: "0.9rem", textAlign: "center" }}>
            Sudah punya akun? <Link to="/masuk" state={location.state}>Masuk</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
