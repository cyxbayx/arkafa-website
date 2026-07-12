import { useEffect, useState } from "react";
import { useAuth } from "../../lib/store.jsx";
import { formatTanggal } from "../../data/dummy.js";

export default function Undang() {
  const { user, getFriends } = useAuth();
  const [teman, setTeman] = useState([]);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    getFriends().then(setTeman).catch(() => setTeman([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tautanDaftar = `${window.location.origin}/daftar?ref=${user.kodeReferral}`;
  const teksAjak =
    `Halo! Aku pakai Arkafa untuk pesan tiket travel & terima hasil foto studio. ` +
    `Daftar pakai kode referral aku ya: ${user.kodeReferral}\n${tautanDaftar}`;

  async function salin(teks, info) {
    await navigator.clipboard.writeText(teks);
    setPesan(info);
    setTimeout(() => setPesan(""), 2500);
  }

  async function bagikan() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Ajak teman ke Arkafa", text: teksAjak });
        return;
      } catch { /* dibatalkan pengguna */ }
    }
    salin(teksAjak, "Pesan ajakan disalin ke clipboard. ✔");
  }

  return (
    <section className="seksi">
      <div className="wadah" style={{ maxWidth: 720 }}>
        <h2>Ajak Bestie-mu 🤝</h2>
        <p className="sub">
          Share kode referralmu — tiap teman yang daftar dan terverifikasi bakal
          kecatat di sini. Insentifnya menyusul sesuai program yang jalan.
        </p>

        {pesan && <div className="peringatan peringatan-hijau">{pesan}</div>}

        <div className="kode-kotak">
          <div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Kode referral Anda</div>
            <div className="kode">{user.kodeReferral}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-garis btn-kecil" style={{ color: "#fff", borderColor: "#475569" }} onClick={() => salin(user.kodeReferral, "Kode disalin. ✔")}>
              Salin Kode
            </button>
            <button className="btn btn-garis btn-kecil" style={{ color: "#fff", borderColor: "#475569" }} onClick={() => salin(tautanDaftar, "Tautan pendaftaran disalin. ✔")}>
              Salin Tautan
            </button>
            <a
              className="btn btn-wa btn-kecil"
              href={`https://wa.me/?text=${encodeURIComponent(teksAjak)}`}
              target="_blank" rel="noreferrer"
            >
              Bagikan via WhatsApp
            </a>
            <button className="btn btn-utama btn-kecil" onClick={bagikan}>
              Bagikan…
            </button>
          </div>
        </div>

        <div className="kartu">
          <h3 style={{ fontSize: "1.05rem", marginBottom: 4 }}>
            Teman Terdaftar <span className="badge badge-hijau">{teman.length} orang</span>
          </h3>
          <p className="sub" style={{ marginBottom: 12 }}>
            Hanya pendaftaran yang sudah terverifikasi yang dihitung. Nama disamarkan untuk privasi.
          </p>
          {teman.length === 0 ? (
            <div className="kosong">
              <div className="besar">🤝</div>
              <p>Belum ada teman yang mendaftar dengan kode Anda. Yuk mulai bagikan!</p>
            </div>
          ) : (
            teman.map((t, i) => (
              <div className="daftar-item" key={i} style={{ marginBottom: 8, padding: "12px 16px" }}>
                <div className="isi">
                  <h4 style={{ fontSize: "0.95rem" }}>{t.nama}</h4>
                  <div className="meta">Terdaftar {formatTanggal(t.tanggal)}</div>
                </div>
                <span className="badge badge-hijau">Terverifikasi</span>
              </div>
            ))
          )}
        </div>

        <div className="demo-info">
          Demo: teman terdaftar di atas adalah data dummy. Coba buka tautan referral Anda
          di jendela penyamaran (incognito) dan daftar akun baru — nama teman akan otomatis
          muncul di daftar ini setelah verifikasi OTP.
        </div>
      </div>
    </section>
  );
}
