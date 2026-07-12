import { useState } from "react";
import { useAuth } from "../../lib/store.jsx";

export default function Pengaturan() {
  const { user, updateProfil } = useAuth();
  const [nama, setNama] = useState(user.nama);
  const [sandiBaru, setSandiBaru] = useState("");
  const [sandiUlang, setSandiUlang] = useState("");
  const [error, setError] = useState("");
  const [sukses, setSukses] = useState("");
  const [sibuk, setSibuk] = useState(false);

  async function simpan(e) {
    e.preventDefault();
    setError("");
    setSukses("");
    if (sandiBaru && sandiBaru !== sandiUlang) {
      setError("Konfirmasi kata sandi baru tidak sama.");
      return;
    }
    setSibuk(true);
    try {
      await updateProfil({ nama, sandiBaru: sandiBaru || undefined });
      setSandiBaru("");
      setSandiUlang("");
      setSukses("Perubahan tersimpan. ✔");
    } catch (err) {
      setError(err.message);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <section className="seksi">
      <div className="wadah auth-kotak">
        <div className="kartu">
          <h2 style={{ marginBottom: 6 }}>Pengaturan Akun ⚙️</h2>
          <p className="sub">Kelola nama dan kata sandi akunmu.</p>

          {error && <div className="peringatan peringatan-merah">{error}</div>}
          {sukses && <div className="peringatan peringatan-hijau">{sukses}</div>}

          <form onSubmit={simpan}>
            <div className="form-grup">
              <label htmlFor="wa-tampil">Nomor WhatsApp</label>
              <input id="wa-tampil" type="tel" value={user.wa} disabled />
              <div className="bantuan">Nomor WhatsApp tidak bisa diganti — hubungi admin bila berubah.</div>
            </div>
            <div className="form-grup">
              <label htmlFor="nama">Nama lengkap</label>
              <input
                id="nama" type="text" required value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
            </div>
            <div className="form-grup">
              <label htmlFor="sandiBaru">Kata sandi baru (opsional)</label>
              <input
                id="sandiBaru" type="password" minLength={8} value={sandiBaru}
                onChange={(e) => setSandiBaru(e.target.value)}
                placeholder="Kosongkan bila tidak ingin ganti"
              />
              <div className="bantuan">Minimal 8 karakter.</div>
            </div>
            {sandiBaru && (
              <div className="form-grup">
                <label htmlFor="sandiUlang">Ulangi kata sandi baru</label>
                <input
                  id="sandiUlang" type="password" minLength={8} required value={sandiUlang}
                  onChange={(e) => setSandiUlang(e.target.value)}
                />
              </div>
            )}
            <button className="btn btn-utama btn-blok" type="submit" disabled={sibuk}>
              {sibuk ? "Menyimpan…" : "Simpan Perubahan"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
