import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SitusLayout from "./components/SitusLayout.jsx";
import Landing from "./pages/Landing.jsx";
import TravelHome from "./pages/travel/TravelHome.jsx";
import Riwayat from "./pages/travel/Riwayat.jsx";
import StudioHome from "./pages/studio/StudioHome.jsx";
import Booth from "./pages/studio/Booth.jsx";
import GaleriIndex from "./pages/studio/GaleriIndex.jsx";
import GaleriView from "./pages/studio/GaleriView.jsx";
import GaleriSaya from "./pages/studio/GaleriSaya.jsx";
import Masuk from "./pages/akun/Masuk.jsx";
import Daftar from "./pages/akun/Daftar.jsx";
import Undang from "./pages/akun/Undang.jsx";
import Admin from "./pages/Admin.jsx";
import { useAuth } from "./lib/store.jsx";

function WajibLogin({ children }) {
  const { user, siap } = useAuth();
  const location = useLocation();
  if (!siap) return null; // masih memulihkan sesi dari token
  if (!user) return <Navigate to="/masuk" state={{ dari: location.pathname }} replace />;
  return children;
}

function GulirKeAtas() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <GulirKeAtas />
      <Routes>
        {/* Landing page — gerbang menuju dua situs */}
        <Route path="/" element={<Landing />} />

        {/* Panel admin (pengelola) */}
        <Route path="/admin" element={<Admin />} />

        {/* Situs Arkafa Travel */}
        <Route element={<SitusLayout situs="travel"><Outlet /></SitusLayout>}>
          <Route path="/travel" element={<TravelHome />} />
          <Route path="/travel/riwayat" element={<WajibLogin><Riwayat /></WajibLogin>} />
        </Route>

        {/* Situs Arkafa Photo Studio */}
        <Route element={<SitusLayout situs="studio"><Outlet /></SitusLayout>}>
          <Route path="/studio" element={<StudioHome />} />
          <Route path="/studio/booth" element={<Booth />} />
          <Route path="/studio/galeri" element={<GaleriIndex />} />
          <Route path="/studio/g/:token" element={<GaleriView />} />
          <Route path="/studio/saya" element={<WajibLogin><GaleriSaya /></WajibLogin>} />
        </Route>

        {/* Halaman akun bersama (netral) */}
        <Route element={<SitusLayout situs="akun"><Outlet /></SitusLayout>}>
          <Route path="/masuk" element={<Masuk />} />
          <Route path="/daftar" element={<Daftar />} />
          <Route path="/undang" element={<WajibLogin><Undang /></WajibLogin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
