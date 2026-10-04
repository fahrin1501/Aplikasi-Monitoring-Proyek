import { Routes, Route, Navigate } from 'react-router-dom';

// Import Layout Wrapper Sistem Informasi
import MainLayout from './components/Layout/MainLayout';

// Import Pages Auth
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

// 1. IMPORT WEBSITE PUBLIK (Etalase Depan)
import CompanyProfile from './pages/CompanyProfile/CompanyProfile'; 

// Import Modul Dashboard & Proyek
import DashboardUtama from './pages/Dashboard/DashboardUtama';
import ProjectList from './pages/Projects/ProjectList';
import AddProject from './pages/Projects/AddProject';

// Import Detail Proyek
import ProjectData from './pages/Projects/ProjectDetail/ProjectData';
import ProjectRAB from './pages/Projects/ProjectDetail/ProjectRAB';
import KurvaS from './pages/Projects/ProjectDetail/KurvaS';
import PetaGIS from './pages/Projects/ProjectDetail/PetaGIS';

// Import Modul Laporan
import LaporanList from './pages/Laporan/LaporanList';
import AddLaporan from './pages/Laporan/AddLaporan';
import LaporanData from './pages/Laporan/LaporanData'; 

// Import Modul Akun
import AccountList from './pages/Accounts/AccountList';

// 2. IMPORT PENGATURAN PERUSAHAAN (Dapur CMS / Dalam Sidebar)
import PengaturanPerusahaan from './pages/CompanyProfile/PengaturanPerusahaan';

export default function App() {
  return (
    <Routes>
      {/* ============================================================== */}
      {/* AREA PUBLIK (Bisa diakses siapa saja, tanpa Sidebar)           */}
      {/* ============================================================== */}
      <Route path="/" element={<CompanyProfile />} /> 
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ============================================================== */}
      {/* AREA SISTEM INFORMASI (Harus Login, dibungkus Sidebar Layout)  */}
      {/* ============================================================== */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardUtama />} />
        
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/tambah" element={<AddProject />} />
        
        <Route path="/projects/projectdata" element={<ProjectData />} />
        <Route path="/projects/:id/data" element={<ProjectData />} />
        <Route path="/projects/:id/rab" element={<ProjectRAB />} />
        <Route path="/projects/:id/kurva-s" element={<KurvaS />} />
        <Route path="/projects/:id/peta-gis" element={<PetaGIS />} />

        {/* ALIAS RUTE JADWAL LAMA */}
        <Route path="/schedules/:id/data/input" element={<KurvaS />} />
        <Route path="/schedules/:id/data" element={<KurvaS />} />
        
        {/* MODUL LAPORAN */}
        <Route path="/laporan" element={<LaporanList />} />
        <Route path="/laporan/input" element={<AddLaporan />} />
        <Route path="/laporan/:id" element={<LaporanData />} /> 
        
        {/* MODUL AKUN */}
        <Route path="/accounts" element={<AccountList />} />

        {/* CMS: PENGATURAN PROFIL PERUSAHAAN */}
        <Route path="/pengaturan-perusahaan" element={<PengaturanPerusahaan />} />
      </Route>

      {/* RUTE CATCH-ALL (Jika rute tidak ditemukan, kembalikan ke Login) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}