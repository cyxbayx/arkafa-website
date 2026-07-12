import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/store.jsx";
import { api } from "../../lib/api.js";
import { formatRupiah } from "../../data/dummy.js";

// ===== Arkafa Photo Booth =====
// Alur: pilih layout (dengan harga) -> bayar/kode sesi (+identitas)
//       -> sesi foto -> edit per pose + bingkai -> output: cetak / kirim link.
// Kode sesi diterbitkan server (POST /booth/kode) dan tercatat di database
// agar admin bisa melihat kode yang terkirim (berjaga-jaga jika pesan WA gagal).

// Metode pembayaran non-tunai (semuanya simulasi di demo).
// Logo resmi tersimpan lokal di public/bayar/.
const METODE_BAYAR = [
  { id: "qris", nama: "QRIS", gambar: "/bayar/qris.png", ket: "Scan dari aplikasi bank / e-wallet mana pun" },
  { id: "gopay", nama: "GoPay", gambar: "/bayar/gopay.png", ket: "Konfirmasi lewat aplikasi Gojek/GoPay" },
  { id: "ovo", nama: "OVO", gambar: "/bayar/ovo.png", ket: "Konfirmasi lewat aplikasi OVO" },
  { id: "dana", nama: "DANA", gambar: "/bayar/dana.png", ket: "Konfirmasi lewat aplikasi DANA" },
  { id: "spay", nama: "ShopeePay", gambar: "/bayar/spay.png", ket: "Konfirmasi lewat aplikasi Shopee" },
  { id: "va", nama: "Transfer VA", ikon: "🏦", ket: "Virtual account semua bank" },
];

// QR simulasi (pola acak berpenanda — bukan QR sungguhan)
function QrPalsu({ seed }) {
  const n = 21, ukuran = 6;
  let s = seed || 12345;
  const acak = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const kotak = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const diFinder =
        (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      if (!diFinder && acak() > 0.52) kotak.push([x, y]);
    }
  }
  const finder = [[0, 0], [n - 7, 0], [0, n - 7]];
  return (
    <svg
      width={n * ukuran} height={n * ukuran}
      viewBox={`0 0 ${n * ukuran} ${n * ukuran}`}
      role="img" aria-label="Kode QR pembayaran (simulasi)"
    >
      <rect width="100%" height="100%" fill="#fff" />
      {kotak.map(([x, y], i) => (
        <rect key={i} x={x * ukuran} y={y * ukuran} width={ukuran} height={ukuran} fill="#1c1917" />
      ))}
      {finder.map(([fx, fy], i) => (
        <g key={"f" + i}>
          <rect x={fx * ukuran} y={fy * ukuran} width={7 * ukuran} height={7 * ukuran} fill="#1c1917" />
          <rect x={(fx + 1) * ukuran} y={(fy + 1) * ukuran} width={5 * ukuran} height={5 * ukuran} fill="#fff" />
          <rect x={(fx + 2) * ukuran} y={(fy + 2) * ukuran} width={3 * ukuran} height={3 * ukuran} fill="#1c1917" />
        </g>
      ))}
    </svg>
  );
}

const LAYOUTS = [
  { id: "strip3", emoji: "🎞️", nama: "OG Strip", pose: 3, cols: 1, rows: 3, harga: 25000, info: "3 pose klasik yang never fail" },
  { id: "strip4", emoji: "✨", nama: "Extra Strip", pose: 4, cols: 1, rows: 4, harga: 30000, info: "4 pose buat kamu yang banyak gaya" },
  { id: "grid4", emoji: "📱", nama: "Feed-Ready Grid", pose: 4, cols: 2, rows: 2, harga: 30000, info: "2×2 langsung cakep di feed" },
  { id: "polaroid", emoji: "⭐", nama: "Main Character", pose: 1, cols: 1, rows: 1, harga: 20000, info: "1 pose besar ala polaroid, kamu pusatnya" },
];

const FILTERS = [
  { id: "normal", nama: "No Filter", css: "" },
  { id: "mono", nama: "Mono", css: "grayscale(1)" },
  { id: "retro", nama: "Retro Film", css: "sepia(0.5) contrast(1.05)" },
  { id: "golden", nama: "Golden Hour", css: "sepia(0.22) saturate(1.3) brightness(1.05)" },
  { id: "dreamy", nama: "Dreamy", css: "brightness(1.1) contrast(0.92) saturate(0.88)" },
];

const EDIT_POSE = { brightness: 100, contrast: 100, saturate: 100 };

// Batasan per sesi (satu pembayaran)
const MAKS_RETAKE = 2;          // maksimal 2x jepret ulang
const DURASI_SESI = 5 * 60;     // 5 menit: sesi foto + edit

function formatWaktu(detik) {
  const m = Math.floor(detik / 60);
  const s = String(detik % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// Cache gambar desain bingkai agar tidak dimuat ulang tiap komposisi
const cacheGambarBingkai = new Map();
function muatGambar(src) {
  if (!cacheGambarBingkai.has(src)) {
    cacheGambarBingkai.set(
      src,
      new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = src;
      })
    );
  }
  return cacheGambarBingkai.get(src);
}

// Komposisi photo strip ke canvas (resolusi penuh)
async function komposisi(canvas, shots, layout, frame, filter, poseEdits) {
  // stempel: bila komposisi lain dimulai saat menunggu gambar, yang lama dibatalkan
  const stempel = String(Date.now()) + Math.random();
  canvas.dataset.stempel = stempel;

  const polaroid = layout.id === "polaroid";
  const cellW = polaroid ? 900 : 800;
  const cellH = polaroid ? 900 : 600;
  const pad = 56, gap = 28, footer = polaroid ? 220 : 160;
  canvas.width = pad * 2 + layout.cols * cellW + (layout.cols - 1) * gap;
  canvas.height = pad * 2 + layout.rows * cellH + (layout.rows - 1) * gap + footer;
  const ctx = canvas.getContext("2d");

  // Latar: desain gambar custom, gradasi, atau warna polos
  let gambarLatar = null;
  if (frame.gambar) {
    try {
      gambarLatar = await muatGambar(frame.gambar);
    } catch {
      gambarLatar = null; // gagal dimuat — jatuh ke warna dasar
    }
    if (canvas.dataset.stempel !== stempel) return;
  }
  if (gambarLatar) {
    const s = Math.max(canvas.width / gambarLatar.width, canvas.height / gambarLatar.height);
    const w = gambarLatar.width * s, h = gambarLatar.height * s;
    ctx.drawImage(gambarLatar, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  } else {
    if (frame.gradien) {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, frame.bg);
      g.addColorStop(1, frame.bg2);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = frame.bg;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  shots.forEach((shot, i) => {
    if (!shot) return;
    const col = i % layout.cols;
    const row = Math.floor(i / layout.cols);
    const x = pad + col * (cellW + gap);
    const y = pad + row * (cellH + gap);
    // crop "cover" agar sel terisi penuh tanpa distorsi
    const skala = Math.max(cellW / shot.width, cellH / shot.height);
    const sw = cellW / skala, sh = cellH / skala;
    const sx = (shot.width - sw) / 2, sy = (shot.height - sh) / 2;
    const pe = poseEdits?.[i] || EDIT_POSE;
    ctx.save();
    ctx.filter =
      `brightness(${pe.brightness}%) contrast(${pe.contrast}%) saturate(${pe.saturate}%) ` +
      (filter.css || "");
    ctx.drawImage(shot, sx, sy, sw, sh, x, y, cellW, cellH);
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 6;
    ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);
  });

  // Cap merek + tanggal di bingkai bawah
  const tengah = canvas.width / 2;
  const dasarY = canvas.height - pad - footer / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = frame.teks;
  ctx.font = "700 72px Caveat, Georgia, cursive";
  ctx.fillText("Arkafa", tengah, dasarY + 6);
  ctx.fillStyle = frame.sub;
  ctx.font = "30px 'Patrick Hand', Arial, cursive";
  const tanggal = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  ctx.fillText("PHOTO BOOTH  ✦  " + tanggal, tengah, dasarY + 46);
}

function normalisasiWA(wa) {
  let n = (wa || "").replace(/[^0-9]/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  return n;
}

export default function Booth() {
  const { user, saveEdit } = useAuth();
  const navigate = useNavigate();
  const [fase, setFase] = useState("pilih"); // pilih | bayar | sesi | hasil | output
  const [layoutId, setLayoutId] = useState("strip3");
  const [countdown, setCountdown] = useState(3);
  const [hadap, setHadap] = useState("user");
  const [shots, setShots] = useState([]); // canvas per pose
  const [poseKe, setPoseKe] = useState(0);
  const [hitung, setHitung] = useState(null); // angka countdown; 0 = "Cheese!"
  const [kilat, setKilat] = useState(false);
  const [frames, setFrames] = useState([]); // bingkai dari API (kelolaan admin)
  const [frameId, setFrameId] = useState(null);
  const [filterId, setFilterId] = useState("normal");
  const [poseEdits, setPoseEdits] = useState([]);
  const [poseAktif, setPoseAktif] = useState(null);
  const [kodeSesi, setKodeSesi] = useState("");
  const [kodeTerkirim, setKodeTerkirim] = useState(null); // kode yang "dikirim" ke WA
  const [metode, setMetode] = useState("qris");
  const [instruksi, setInstruksi] = useState(false); // sedang menampilkan cara bayar
  const [waTamu, setWaTamu] = useState("");
  const [retakeSisa, setRetakeSisa] = useState(MAKS_RETAKE);
  const [sisaWaktu, setSisaWaktu] = useState(null); // detik tersisa dalam sesi
  const [stripUrl, setStripUrl] = useState(null); // hasil final untuk output
  const [pesanKirim, setPesanKirim] = useState("");
  const [error, setError] = useState("");
  const [pesan, setPesan] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const hasilRef = useRef(null);
  const retakeRef = useRef(null);   // index pose yang diulang, null = sesi penuh
  const dimulaiRef = useRef(false); // cegah countdown ganda
  const disimpanRef = useRef(false); // strip sudah tersimpan ke galeri?

  const layout = LAYOUTS.find((l) => l.id === layoutId);
  const frame = frames.find((f) => f.id === frameId) || frames[0];

  // muat pilihan bingkai dari server
  useEffect(() => {
    api("/bingkai")
      .then((d) => {
        setFrames(d);
        setFrameId((id) => id || d[0]?.id);
      })
      .catch(() => {});
  }, []);
  const filter = FILTERS.find((f) => f.id === filterId);

  const thumbUrls = useMemo(
    () => shots.map((s) => (s ? s.toDataURL("image/jpeg", 0.6) : null)),
    [shots]
  );

  function filterPose(i) {
    const pe = poseEdits[i] || EDIT_POSE;
    return (
      `brightness(${pe.brightness}%) contrast(${pe.contrast}%) saturate(${pe.saturate}%) ` +
      (filter.css || "")
    );
  }

  // ---- Kamera hidup selama fase "sesi" ----
  useEffect(() => {
    if (fase !== "sesi") return;
    let batal = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Browser ini tidak mendukung akses kamera.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: hadap, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (batal) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadeddata = () => {
          if (!dimulaiRef.current) {
            dimulaiRef.current = true;
            mulaiPose(retakeRef.current ?? 0);
          }
        };
      } catch (err) {
        setFase("bayar");
        setError(
          err.name === "NotAllowedError"
            ? "Izin kamera ditolak nih 🥲 Izinkan akses kamera di pengaturan browser, lalu coba lagi ya."
            : err.name === "NotFoundError"
              ? "Kamera tidak ditemukan di perangkat ini."
              : "Kamera tidak dapat diakses: " + err.message
        );
      }
    })();
    return () => {
      batal = true;
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      dimulaiRef.current = false;
      setHitung(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  function tangkap() {
    const video = videoRef.current;
    const c = document.createElement("canvas");
    c.width = video.videoWidth || 1280;
    c.height = video.videoHeight || 720;
    const ctx = c.getContext("2d");
    if (hadap === "user") {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    return c;
  }

  function mulaiPose(index) {
    setPoseKe(index);
    let sisa = countdown;
    setHitung(sisa);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      sisa -= 1;
      if (sisa > 0) {
        setHitung(sisa);
        return;
      }
      clearInterval(timerRef.current);
      setHitung(0);
      const shot = tangkap();
      setShots((prev) => {
        const next = [...prev];
        next[index] = shot;
        return next;
      });
      setKilat(true);
      setTimeout(() => setKilat(false), 260);
      setTimeout(() => {
        if (retakeRef.current !== null) {
          retakeRef.current = null;
          setFase("hasil");
        } else if (index + 1 < layout.pose) {
          mulaiPose(index + 1);
        } else {
          setFase("hasil");
        }
      }, 1000);
    }, 1000);
  }

  // ---- Pembayaran non-tunai: pilih metode -> bayar -> kode dikirim ke WA ----
  function bayarSekarang() {
    setError("");
    const tujuan = user ? user.wa : normalisasiWA(waTamu);
    if (!tujuan || tujuan.length < 9) {
      setError("Isi nomor WhatsApp yang valid dulu ya — kode sesimu dikirim ke sana.");
      return;
    }
    setInstruksi(true);
  }

  async function mintaKode() {
    setError("");
    const tujuan = user ? user.wa : normalisasiWA(waTamu);
    try {
      // server menerbitkan kode + mencatatnya (cadangan admin jika WA gagal)
      const { kode } = await api("/booth/kode", {
        method: "POST",
        body: {
          wa: tujuan,
          metode: METODE_BAYAR.find((m) => m.id === metode)?.nama,
          layout: layout.nama,
          harga: layout.harga,
        },
      });
      setKodeTerkirim(kode);
      setKodeSesi("");
      setInstruksi(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function verifikasiBayar(e) {
    e.preventDefault();
    setError("");
    if (!kodeTerkirim) {
      setError("Selesaikan pembayaran dan kirim kode sesimu dulu ya.");
      return;
    }
    if (kodeSesi.trim().toUpperCase() !== kodeTerkirim) {
      setError("Kode sesi salah. Cek pesan WhatsApp-mu, atau minta bantuan admin — admin bisa melihat kodemu.");
      return;
    }
    mulaiSesi();
  }

  function mulaiSesi() {
    setError("");
    setPesan("");
    setPesanKirim("");
    setStripUrl(null);
    setShots(Array(layout.pose).fill(null));
    setPoseEdits(Array(layout.pose).fill(EDIT_POSE));
    setPoseAktif(null);
    setRetakeSisa(MAKS_RETAKE);
    setSisaWaktu(DURASI_SESI);
    retakeRef.current = null;
    disimpanRef.current = false;
    setFase("sesi");
  }

  function sesiBaru() {
    // sesi baru = pembayaran baru, kode lama hangus
    setKodeSesi("");
    setKodeTerkirim(null);
    setInstruksi(false);
    setPesanKirim("");
    setStripUrl(null);
    setFase("bayar");
  }

  function ulangiPose(index) {
    if (retakeSisa <= 0) {
      setError(`Jatah jepret ulang habis (maks. ${MAKS_RETAKE}x per sesi).`);
      return;
    }
    setError("");
    setPesan("");
    setRetakeSisa((r) => r - 1);
    setPoseEdits((prev) => prev.map((e, i) => (i === index ? EDIT_POSE : e)));
    retakeRef.current = index;
    setFase("sesi");
  }

  function ubahPose(kunci, nilai) {
    setPoseEdits((prev) =>
      prev.map((e, i) => (i === poseAktif ? { ...e, [kunci]: nilai } : e))
    );
  }

  // ---- Komposisi hasil ----
  useEffect(() => {
    if (fase !== "hasil" || !hasilRef.current || !frame) return;
    komposisi(hasilRef.current, shots, layout, frame, filter, poseEdits);
  }, [fase, shots, layout, frame, filter, poseEdits]);

  // ---- Timer sesi: berjalan selama fase foto & edit ----
  useEffect(() => {
    if (!["sesi", "hasil"].includes(fase) || sisaWaktu === null) return;
    if (sisaWaktu <= 0) {
      // waktu habis: dorong ke output dengan hasil apa adanya
      if (fase === "sesi") {
        clearInterval(timerRef.current);
        retakeRef.current = null;
        setFase("hasil"); // komposisi dirender dulu, siklus berikut ke output
      } else if (hasilRef.current) {
        setPesan("Waktu sesi habis ⏰ — silakan ambil hasilmu.");
        keOutput();
      }
      return;
    }
    const t = setTimeout(() => setSisaWaktu((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, sisaWaktu]);

  // ---- Ke layar output ----
  async function keOutput() {
    const canvas = hasilRef.current;
    if (!canvas || !frame) return;
    // pastikan komposisi terbaru (termasuk desain bingkai) selesai digambar
    await komposisi(canvas, shots, layout, frame, filter, poseEdits);
    const url = canvas.toDataURL("image/png");
    setStripUrl(url);
    if (user && !disimpanRef.current) {
      // auto-simpan ke Galeri Saya (sekali per sesi)
      const mini = document.createElement("canvas");
      const s = 480 / canvas.width;
      mini.width = 480;
      mini.height = Math.round(canvas.height * s);
      mini.getContext("2d").drawImage(canvas, 0, 0, mini.width, mini.height);
      saveEdit(
        `arkafa-photobooth-${new Date().toISOString().slice(0, 10)}.png`,
        mini.toDataURL("image/jpeg", 0.85)
      );
      disimpanRef.current = true;
    }
    setFase("output");
  }

  function cetak() {
    window.print();
  }

  function kirimLink() {
    const tujuan = user ? user.wa : normalisasiWA(waTamu);
    if (!tujuan || tujuan.length < 9) {
      setPesanKirim("nomor");
      return;
    }
    // simulasi: di produksi strip diunggah ke server dan diberi tautan bertoken
    const token = "bs" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
    const link = `${window.location.origin}/studio/g/${token}`;
    const teks =
      `Halo! Ini hasil photo strip kamu dari Arkafa Photo Booth 📸\n${link}\n` +
      `Tautan berlaku 30 hari. Makasih sudah foto bareng Arkafa!`;
    window.open(`https://wa.me/${tujuan}?text=${encodeURIComponent(teks)}`, "_blank", "noopener");
    setPesanKirim("terkirim");
  }

  function kembaliSelangkah() {
    setPesan("");
    setPoseAktif(null);
    if (fase === "bayar") setFase("pilih");
    else if (fase === "sesi") setFase("bayar");
    else if (fase === "output") setFase("hasil");
    else setFase("pilih"); // dari hasil: sesi sudah selesai, mundur ke awal
  }

  const labelKembali = {
    bayar: "Pilih Layout",
    sesi: "Pembayaran",
    hasil: "Pilih Layout",
    output: "Edit & Bingkai",
  };

  return (
    <>
      <div className="wadah kembali-bar sembunyi-cetak">
        {fase === "pilih" ? (
          <Link to="/studio" className="kembali">← Kembali ke Photo Studio</Link>
        ) : (
          <button className="kembali" onClick={kembaliSelangkah}>
            ← Kembali ke {labelKembali[fase]}
          </button>
        )}
      </div>
      <section className="seksi booth">
      <div className="wadah">
        <div className="booth-kepala sembunyi-cetak">
          <h2 className="booth-judul">Arkafa Photo Booth 📸</h2>
          <p className="booth-sub">
            No kaku-kaku ✌️ Pilih vibes-mu, countdown jalan sendiri, tinggal gaya —
            hasilnya photo strip aesthetic siap cetak atau dikirim ke HP-mu.
          </p>
        </div>

        {error && <div className="peringatan peringatan-merah sembunyi-cetak">{error}</div>}
        {pesan && <div className="peringatan peringatan-hijau sembunyi-cetak">{pesan}</div>}

        {/* ===== FASE 1: Pilih layout ===== */}
        {fase === "pilih" && (
          <>
            <div className="booth-langkah-label">① pilih layout-mu</div>
            <div className="grid-2 booth-pilihan">
              {LAYOUTS.map((l, i) => (
                <button
                  key={l.id}
                  className={"booth-layout miring-" + (i % 2) + (l.id === layoutId ? " terpilih" : "")}
                  onClick={() => setLayoutId(l.id)}
                >
                  <span
                    className="booth-mini"
                    style={{ gridTemplateColumns: `repeat(${l.cols}, 1fr)`, aspectRatio: l.rows > l.cols ? "9 / 16" : "1 / 1" }}
                  >
                    {Array.from({ length: l.pose }).map((_, j) => <span key={j} />)}
                  </span>
                  <span>
                    <strong>{l.emoji} {l.nama}</strong>
                    <span className="booth-chip">{l.pose} pose</span>
                    <span style={{ display: "block", fontSize: "0.85rem", color: "var(--tinta-2)" }}>{l.info}</span>
                    <span className="booth-harga">{formatRupiah(l.harga)} / sesi</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="booth-langkah-label">② atur sesimu</div>
            <div className="kartu booth-kartu" style={{ marginBottom: 24 }}>
              <div className="grid-2">
                <div>
                  <div className="booth-opsi-judul">⏱️ Countdown per pose</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[3, 5, 10].map((d) => (
                      <button
                        key={d}
                        className={"btn btn-kecil " + (countdown === d ? "btn-pop" : "btn-garis")}
                        onClick={() => setCountdown(d)}
                      >
                        {d} detik
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="booth-opsi-judul">📷 Pakai kamera</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className={"btn btn-kecil " + (hadap === "user" ? "btn-pop" : "btn-garis")}
                      onClick={() => setHadap("user")}
                    >
                      🤳 Depan
                    </button>
                    <button
                      className={"btn btn-kecil " + (hadap === "environment" ? "btn-pop" : "btn-garis")}
                      onClick={() => setHadap("environment")}
                    >
                      📷 Belakang
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button className="btn btn-pop booth-mulai" onClick={() => { setError(""); setFase("bayar"); }}>
                Lanjut ke Pembayaran · {formatRupiah(layout.harga)} →
              </button>
            </div>
          </>
        )}

        {/* ===== FASE 2: Bayar / kode sesi ===== */}
        {fase === "bayar" && (
          <div className="kartu booth-kartu" style={{ maxWidth: 520, margin: "0 auto" }}>
            <h3 className="booth-opsi-judul" style={{ fontSize: "1.5rem" }}>💳 Pembayaran</h3>
            <div className="bayar-ringkas">
              <span>{layout.emoji} {layout.nama} · {layout.pose} pose</span>
              <strong>{formatRupiah(layout.harga)}</strong>
            </div>

            {user ? (
              <div className="peringatan peringatan-hijau">
                Masuk sebagai <strong>{user.nama}</strong> — kode sesi &amp; link hasil
                dikirim ke WhatsApp-mu ({user.wa}), strip otomatis tersimpan ke Galeri Saya.
              </div>
            ) : (
              <div className="form-grup">
                <label htmlFor="wa-tamu">Nomor WhatsApp kamu</label>
                <input
                  id="wa-tamu" type="tel" placeholder="08xxxxxxxxxx"
                  value={waTamu} onChange={(e) => { setWaTamu(e.target.value); setError(""); }}
                />
                <div className="bantuan">
                  Kode sesi dan link hasil dikirim ke nomor ini.
                  Punya akun? <Link to="/masuk">Masuk</Link> biar strip-mu tersimpan di Galeri Saya.
                </div>
              </div>
            )}

            {!kodeTerkirim && !instruksi && (
              <>
                <div className="booth-opsi-judul">Pilih metode pembayaran</div>
                <div className="metode-grid">
                  {METODE_BAYAR.map((m) => (
                    <button
                      key={m.id}
                      className={"metode-item" + (metode === m.id ? " terpilih" : "")}
                      onClick={() => setMetode(m.id)}
                    >
                      <span className="metode-ikon">
                        {m.gambar ? <img src={m.gambar} alt={"Logo " + m.nama} /> : m.ikon}
                      </span>
                      <span>
                        <strong>{m.nama}</strong>
                        <span style={{ display: "block", fontSize: "0.78rem", color: "var(--tinta-2)" }}>
                          {m.ket}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
                <button className="btn btn-pop btn-blok" onClick={bayarSekarang}>
                  Bayar {formatRupiah(layout.harga)} →
                </button>
              </>
            )}

            {!kodeTerkirim && instruksi && (
              <>
                {metode === "qris" ? (
                  <div className="qr-kotak">
                    <QrPalsu seed={layout.harga + layout.pose * 7} />
                    <div style={{ fontWeight: 600 }}>Scan untuk membayar {formatRupiah(layout.harga)}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--tinta-2)" }}>
                      ARKAFA PHOTO BOOTH · NMID-SIMULASI · berlaku 5 menit
                    </div>
                  </div>
                ) : metode === "va" ? (
                  <div className="qr-kotak">
                    <div style={{ fontSize: "0.85rem", color: "var(--tinta-2)" }}>Nomor Virtual Account</div>
                    <div className="va-nomor">8808 0812 3456 7890</div>
                    <div style={{ fontWeight: 600 }}>Total: {formatRupiah(layout.harga)}</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--tinta-2)" }}>
                      a.n. Arkafa Photo Booth · semua bank · cek nominal sebelum kirim
                    </div>
                  </div>
                ) : (
                  <div className="qr-kotak">
                    <img
                      className="logo-bayar-besar"
                      src={METODE_BAYAR.find((m) => m.id === metode)?.gambar}
                      alt={"Logo " + METODE_BAYAR.find((m) => m.id === metode)?.nama}
                    />
                    <div style={{ fontWeight: 600 }}>
                      Tagihan {formatRupiah(layout.harga)} dikirim ke{" "}
                      {METODE_BAYAR.find((m) => m.id === metode)?.nama}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--tinta-2)" }}>
                      Buka aplikasinya di HP-mu dan konfirmasi pembayaran (simulasi).
                    </div>
                  </div>
                )}
                <button className="btn btn-pop btn-blok" style={{ marginBottom: 8 }} onClick={mintaKode}>
                  ✔ Saya Sudah Bayar — Kirim Kode ke WhatsApp
                </button>
                <button className="btn btn-garis btn-blok" onClick={() => setInstruksi(false)}>
                  Ganti Metode Pembayaran
                </button>
              </>
            )}

            {kodeTerkirim && (
              <>
                <div className="peringatan peringatan-hijau">
                  Kode sesi terkirim ke WhatsApp{" "}
                  <strong>{user ? user.wa : normalisasiWA(waTamu)}</strong> ✔
                </div>
                <form onSubmit={verifikasiBayar}>
                  <div className="form-grup">
                    <label htmlFor="kode">Masukkan kode sesi dari WhatsApp-mu</label>
                    <input
                      id="kode" type="text" required maxLength={6} placeholder="6 karakter"
                      value={kodeSesi} onChange={(e) => { setKodeSesi(e.target.value); setError(""); }}
                      style={{ textTransform: "uppercase", letterSpacing: 4, textAlign: "center", fontSize: "1.2rem" }}
                    />
                    <div className="bantuan">
                      Tidak menerima pesan? Hubungi admin — admin dapat melihat kode
                      yang terkirim untukmu.
                    </div>
                  </div>
                  <button className="btn btn-pop btn-blok" type="submit">
                    🎬 Mulai Sesi Foto ({layout.pose} pose)
                  </button>
                </form>
              </>
            )}

            <div className="demo-info">
              Demo: kode ditampilkan langsung di sini
              {kodeTerkirim && <> — kode sesimu: <code>{kodeTerkirim}</code></>}.
              Setiap kode juga tercatat di panel admin (tab Kode Sesi Booth), tempat
              admin mengirimkannya ke WhatsApp pelanggan lewat tombol "Kirim via WA".
            </div>
          </div>
        )}

        {/* ===== FASE 3: Sesi jepret ===== */}
        {fase === "sesi" && (
          <div className="kartu booth-kartu kamera-kotak">
            <div className="booth-pose-info">
              Pose <strong>{poseKe + 1}</strong> dari {layout.pose}
              <span className="booth-chip">{layout.emoji} {layout.nama}</span>
              {sisaWaktu !== null && (
                <span className={"booth-timer" + (sisaWaktu < 60 ? " merah" : "")}>
                  ⏳ {formatWaktu(sisaWaktu)}
                </span>
              )}
            </div>
            <div className="booth-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: hadap === "user" ? "scaleX(-1)" : "none" }}
              />
              {hitung !== null && (
                <div className={"booth-hitung" + (hitung === 0 ? " senyum" : "")}>
                  {hitung === 0 ? "Cheese! 📸" : hitung}
                </div>
              )}
              {kilat && <div className="booth-kilat" />}
              <div className="booth-titik">
                {Array.from({ length: layout.pose }).map((_, i) => (
                  <span key={i} className={shots[i] ? "isi" : i === poseKe ? "kini" : ""} />
                ))}
              </div>
            </div>
            <button className="btn btn-bahaya btn-kecil" onClick={() => setFase("bayar")}>
              Batalin Sesi
            </button>
          </div>
        )}

        {/* ===== FASE 4: Edit per pose + bingkai ===== */}
        {fase === "hasil" && (
          <div className="editor-tata">
            <div className="booth-hasil">
              <canvas ref={hasilRef} />
            </div>
            <div className="kartu booth-kartu">
              <h3 className="booth-opsi-judul" style={{ fontSize: "1.5rem" }}>✨ Slay! Tinggal finishing</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {sisaWaktu !== null && (
                  <span className={"booth-timer" + (sisaWaktu < 60 ? " merah" : "")}>
                    ⏳ {formatWaktu(sisaWaktu)}
                  </span>
                )}
                <span className="booth-chip">🔄 sisa jepret ulang: {retakeSisa}x</span>
              </div>

              <div className="booth-opsi-judul">🎨 Model bingkai</div>
              <div className="preset-baris">
                {frames.map((f) => (
                  <button
                    key={f.id}
                    className={"booth-swatch" + (frameId === f.id ? " terpilih" : "")}
                    style={
                      f.gambar
                        ? { backgroundImage: `url("${f.gambar}")`, backgroundSize: "cover", backgroundPosition: "center" }
                        : { background: f.gradien ? `linear-gradient(135deg, ${f.bg}, ${f.bg2})` : f.bg }
                    }
                    onClick={() => setFrameId(f.id)}
                    title={f.nama}
                  />
                ))}
              </div>
              <div className="bantuan" style={{ fontSize: "0.78rem", color: "var(--tinta-2)", margin: "-6px 0 12px" }}>
                {frame?.nama}
              </div>

              <div className="booth-opsi-judul">🪄 Filter</div>
              <div className="preset-baris">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    className={"btn btn-kecil " + (filterId === f.id ? "btn-pop" : "btn-garis")}
                    onClick={() => setFilterId(f.id)}
                  >
                    {f.nama}
                  </button>
                ))}
              </div>

              <div className="booth-opsi-judul">✏️ Edit per Pose</div>
              <div className="thumb-baris" style={{ marginTop: 0, marginBottom: 6 }}>
                {shots.map((s, i) => (
                  <button
                    key={i}
                    className={"thumb" + (poseAktif === i ? " aktif" : "")}
                    onClick={() => setPoseAktif(poseAktif === i ? null : i)}
                    title={`Edit pose ${i + 1}`}
                  >
                    {thumbUrls[i] && (
                      <img
                        src={thumbUrls[i]}
                        alt={`Pose ${i + 1}`}
                        style={{ filter: filterPose(i) }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {poseAktif === null ? (
                <div className="bantuan" style={{ fontSize: "0.78rem", color: "var(--tinta-2)", marginBottom: 14 }}>
                  Klik salah satu pose buat atur cahayanya atau jepret ulang.
                </div>
              ) : (
                <div className="pose-panel">
                  <div style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                    Pose {poseAktif + 1} {layout.pose > 1 && `dari ${layout.pose}`}
                  </div>
                  <div className="slider-baris">
                    <label>Kecerahan <span>{poseEdits[poseAktif]?.brightness}%</span></label>
                    <input
                      type="range" min={50} max={150}
                      value={poseEdits[poseAktif]?.brightness ?? 100}
                      onChange={(e) => ubahPose("brightness", Number(e.target.value))}
                    />
                  </div>
                  <div className="slider-baris">
                    <label>Kontras <span>{poseEdits[poseAktif]?.contrast}%</span></label>
                    <input
                      type="range" min={50} max={150}
                      value={poseEdits[poseAktif]?.contrast ?? 100}
                      onChange={(e) => ubahPose("contrast", Number(e.target.value))}
                    />
                  </div>
                  <div className="slider-baris">
                    <label>Saturasi <span>{poseEdits[poseAktif]?.saturate}%</span></label>
                    <input
                      type="range" min={0} max={200}
                      value={poseEdits[poseAktif]?.saturate ?? 100}
                      onChange={(e) => ubahPose("saturate", Number(e.target.value))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    <button
                      className="btn btn-garis btn-kecil"
                      onClick={() => ulangiPose(poseAktif)}
                      disabled={retakeSisa <= 0}
                      title={retakeSisa <= 0 ? `Jatah jepret ulang habis (maks. ${MAKS_RETAKE}x)` : undefined}
                    >
                      📸 Jepret Ulang ({retakeSisa}x lagi)
                    </button>
                    <button
                      className="btn btn-garis btn-kecil"
                      onClick={() => setPoseEdits((prev) => prev.map((e, i) => (i === poseAktif ? EDIT_POSE : e)))}
                    >
                      Reset Pose
                    </button>
                    <button className="btn btn-garis btn-kecil" onClick={() => setPoseAktif(null)}>
                      Tutup
                    </button>
                  </div>
                </div>
              )}

              <button className="btn btn-pop btn-blok" onClick={keOutput}>
                Selesai — Ambil Hasilmu →
              </button>
            </div>
          </div>
        )}

        {/* ===== FASE 5: Output — cetak / kirim link ===== */}
        {fase === "output" && (
          <div className="editor-tata">
            <div className="booth-hasil cetak-area">
              <img src={stripUrl} alt="Photo strip Arkafa" />
            </div>
            <div className="kartu booth-kartu sembunyi-cetak">
              <h3 className="booth-opsi-judul" style={{ fontSize: "1.5rem" }}>🎉 Strip-mu siap!</h3>

              {user && (
                <div className="peringatan peringatan-hijau">
                  Tersimpan otomatis di <Link to="/studio/saya">Galeri Saya</Link> ✔
                </div>
              )}

              <button className="btn btn-pop btn-blok" style={{ marginBottom: 10 }} onClick={cetak}>
                🖨️ Cetak Strip
              </button>

              <div className="booth-opsi-judul" style={{ marginTop: 8 }}>📲 Kirim link ke WhatsApp</div>
              {user ? (
                <div className="bantuan" style={{ marginBottom: 8 }}>
                  Dikirim ke nomor akunmu: <strong>{user.wa}</strong>
                </div>
              ) : (
                <div className="form-grup" style={{ marginBottom: 10 }}>
                  <input
                    type="tel" placeholder="08xxxxxxxxxx"
                    value={waTamu} onChange={(e) => { setWaTamu(e.target.value); setPesanKirim(""); }}
                  />
                </div>
              )}
              {pesanKirim === "nomor" && (
                <div className="peringatan peringatan-merah">Isi nomor WhatsApp yang valid dulu ya.</div>
              )}
              {pesanKirim === "terkirim" && (
                <div className="peringatan peringatan-hijau">
                  Pesan WhatsApp disiapkan ✔ (demo: tautannya belum aktif — di produksi
                  strip diunggah ke server dulu sehingga link bisa dibuka).
                </div>
              )}
              <button className="btn btn-utama btn-blok" style={{ marginBottom: 14 }} onClick={kirimLink}>
                Kirim Link
              </button>

              <button className="btn btn-garis btn-blok" style={{ marginBottom: 8 }} onClick={sesiBaru}>
                🔁 Sesi Baru (bayar lagi)
              </button>
              <button
                className="btn btn-bahaya btn-blok"
                onClick={() => navigate("/studio")}
                title="Sesi berakhir — kembali ke Photo Studio"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
      </section>
    </>
  );
}
