import { createContext, useContext, useEffect, useState } from "react";
import { api, simpanToken, hapusToken, getToken } from "./api.js";

// ===== Auth & data pengguna — kini lewat API backend (server/) =====
// localStorage hanya dipakai untuk: token sesi + photo strip hasil booth
// (strip berupa gambar besar, sengaja disimpan per perangkat di demo ini).

const KUNCI_STRIP = "arkafa_strip"; // { userId: [{id, nama, url, tanggal}] }

function bacaStrip() {
  try {
    return JSON.parse(localStorage.getItem(KUNCI_STRIP)) ?? {};
  } catch {
    return {};
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [siap, setSiap] = useState(false);   // sudah selesai cek sesi awal?
  const [pending, setPending] = useState(null); // { wa } — registrasi menunggu OTP

  // Pulihkan sesi dari token tersimpan
  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { user: u } = await api("/auth/saya");
          setUser(u);
        } catch {
          hapusToken(); // token kedaluwarsa/tidak valid
        }
      }
      setSiap(true);
    })();
  }, []);

  // --- Registrasi: server membuat akun + OTP (demo: OTP dikembalikan) ---
  async function register({ nama, wa, password, kodeReferral }) {
    const hasil = await api("/auth/daftar", {
      method: "POST",
      body: { nama, wa, sandi: password, referral: kodeReferral || undefined },
    });
    setPending({ wa: hasil.user.wa });
    return hasil.demoOtp;
  }

  // --- Verifikasi OTP → langsung login ---
  async function verifyOtp(kode) {
    if (!pending) throw new Error("Tidak ada pendaftaran yang menunggu verifikasi.");
    const { user: u, token } = await api("/auth/verifikasi", {
      method: "POST",
      body: { wa: pending.wa, otp: kode },
    });
    simpanToken(token);
    setPending(null);
    setUser(u);
    return u;
  }

  // --- Login (rate limit dijaga server) ---
  async function login(wa, sandi, rememberMe) {
    const { user: u, token } = await api("/auth/masuk", {
      method: "POST",
      body: { wa, sandi },
    });
    simpanToken(token, { ingat: rememberMe });
    setUser(u);
    return u;
  }

  function logout() {
    hapusToken();
    setUser(null);
  }

  // --- Ubah nama dan/atau kata sandi ---
  async function updateProfil({ nama, sandiBaru }) {
    const { user: u } = await api("/auth/saya", {
      method: "PATCH",
      body: { nama, sandiBaru },
    });
    setUser(u);
    return u;
  }

  // --- Data milik pengguna (dari server) ---
  async function getBookings() {
    if (!user) return [];
    return api("/pesanan/saya");
  }
  async function getLinks() {
    if (!user) return [];
    return api("/galeri-saya");
  }
  async function getFriends() {
    if (!user) return [];
    const { teman } = await api("/auth/saya");
    return teman;
  }

  // --- Photo strip booth (lokal per perangkat) ---
  function getEdits() {
    if (!user) return [];
    return bacaStrip()[user.id] || [];
  }
  function saveEdit(nama, url) {
    if (!user) return;
    const semua = bacaStrip();
    const daftar = semua[user.id] || [];
    daftar.unshift({ id: "e-" + Date.now(), nama, url, tanggal: new Date().toISOString().slice(0, 10) });
    semua[user.id] = daftar.slice(0, 20); // batas kuota sederhana
    try {
      localStorage.setItem(KUNCI_STRIP, JSON.stringify(semua));
    } catch { /* penyimpanan penuh — strip terbaru tetap bisa dicetak/dikirim */ }
  }

  const value = {
    user, siap, pending, register, verifyOtp, login, logout, updateProfil,
    getBookings, getLinks, getEdits, saveEdit, getFriends,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
