import { Routes, Route, Navigate } from 'react-router-dom';

// Import Layout Wrapper
import MainLayout from './components/Layout/MainLayout';

// Import Pages Auth & Public
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';

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

// Import Modul Pengaturan Profil Perusahaan (Nested Routes)
import CompanyProfile from './pages/CompanyProfile/CompanyProfile';
import LandingPage from './pages/CompanyProfile/LandingPage';
import Layanan from './pages/CompanyProfile/Layanan';
import Event from './pages/CompanyProfile/Event';
import ContactInfo from './pages/CompanyProfile/ContactInfo';

export default function App() {
  return (
    <Routes>
      {/* ========================================== */}
      {/* RUTE PUBLIK (Tampil Penuh Tanpa Sidebar)     */}
      {/* ========================================== */}
      <Route path="/" element={<CompanyProfile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ========================================== */}
      {/* RUTE PROTECTED (Dibungkus MainLayout)        */}
      {/* ========================================== */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<DashboardUtama />} />
        
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/tambah" element={<AddProject />} />
        
        <Route path="/projects/projectdata" element={<ProjectData />} />
        <Route path="/projects/:id/data" element={<ProjectData />} />
        <Route path="/projects/:id/rab" element={<ProjectRAB />} />
        <Route path="/projects/:id/kurva-s" element={<KurvaS />} />
        <Route path="/projects/:id/peta-gis" element={<PetaGIS />} />

        {/* ALIAS RUTE JADWAL LAMA -> DIARAHKAN LANGSUNG KE KURVA S (All-in-One) */}
        <Route path="/schedules/:id/data/input" element={<KurvaS />} />
        <Route path="/schedules/:id/data" element={<KurvaS />} />
        
        {/* MODUL LAPORAN */}
        <Route path="/laporan" element={<LaporanList />} />
        <Route path="/laporan/input" element={<AddLaporan />} />
        <Route path="/laporan/:id" element={<LaporanData />} /> 
        
        {/* MODUL AKUN */}
        <Route path="/accounts" element={<AccountList />} />
        
      </Route>

      {/* Rute tidak ditemukan (Kembali ke Login) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}