import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Avatar bulat (inisial nama) yang membuka dropdown: Pengaturan Akun,
// Undang Teman, Keluar. Menggantikan klaster tautan akun di navbar.
export default function ProfilMenu({ user, onKeluar }) {
  const [buka, setBuka] = useState(false);
  const kotakRef = useRef(null);

  useEffect(() => {
    if (!buka) return;
    function tutupLuar(e) {
      if (kotakRef.current && !kotakRef.current.contains(e.target)) setBuka(false);
    }
    function tutupEsc(e) {
      if (e.key === "Escape") setBuka(false);
    }
    document.addEventListener("mousedown", tutupLuar);
    document.addEventListener("keydown", tutupEsc);
    return () => {
      document.removeEventListener("mousedown", tutupLuar);
      document.removeEventListener("keydown", tutupEsc);
    };
  }, [buka]);

  const inisial = (user.nama.trim()[0] || "A").toUpperCase();
  const namaDepan = user.nama.split(" ")[0];

  return (
    <div className="profil-menu" ref={kotakRef}>
      <button
        type="button"
        className="profil-avatar"
        onClick={() => setBuka((b) => !b)}
        aria-haspopup="menu"
        aria-expanded={buka}
        title={user.nama}
      >
        {inisial}
      </button>
      {buka && (
        <div className="profil-dropdown" role="menu">
          <div className="profil-dropdown-nama">Hai, {namaDepan}! 👋</div>
          <Link to="/akun/pengaturan" className="profil-dropdown-item" role="menuitem" onClick={() => setBuka(false)}>
            ⚙️ Pengaturan Akun
          </Link>
          <Link to="/undang" className="profil-dropdown-item" role="menuitem" onClick={() => setBuka(false)}>
            🤝 Undang Teman
          </Link>
          <button
            type="button"
            className="profil-dropdown-item profil-dropdown-keluar"
            role="menuitem"
            onClick={() => { setBuka(false); onKeluar(); }}
          >
            🚪 Keluar
          </button>
        </div>
      )}
    </div>
  );
}
