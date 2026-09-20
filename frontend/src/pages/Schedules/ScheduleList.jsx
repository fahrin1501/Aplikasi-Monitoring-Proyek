import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 
import { 
  Search, Eye, Plus, CalendarDays, Calendar, MapPin, 
  Building2, AlertTriangle, Loader2, Edit3, Trash2, X, CheckCircle2
} from 'lucide-react';

export default function ScheduleList() {
  const navigate = useNavigate();
  
  // --- STATE MANAJEMEN ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE EDIT MODE & DELETE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ show: false, projectId: null, projectName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserRole(user.role || 'Tamu');
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }
  }, []);

  // Definisi Hak Akses
  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);

  const fetchProjects = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/projects');
      const dataProyek = response.data?.data || response.data || [];
      setProjects(Array.isArray(dataProyek) ? dataProyek : []);
    } catch (error) {
      setErrorMsg('Gagal memuat data proyek. Pastikan server terhubung.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // --- HANDLER HAPUS DATA JADWAL KE BACKEND ---
  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${deleteConfig.projectId}/schedules`);
      alert(`Seluruh jadwal untuk proyek ${deleteConfig.projectName} berhasil di-reset (dihapus).`);
      setDeleteConfig({ show: false, projectId: null, projectName: '' });
      fetchProjects(); // Refresh data
    } catch (error) {
      console.error("Gagal hapus jadwal:", error);
      alert('Gagal menghapus jadwal proyek. Pastikan koneksi server aman.');
    } finally {
      setIsDeleting(false);
    }
  };

  // --- LOGIKA FILTERING (PENCARIAN & STATUS) ---
  const filteredProjects = (projects || []).filter(p => {
    // 1. Abaikan/Sembunyikan proyek jika statusnya "Selesai" (Case Insensitive)
    if (p?.status?.toLowerCase() === 'selesai') {
      return false; 
    }

    // 2. Filter berdasarkan kata kunci pencarian
    const matchNama = p?.nama_proyek?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKontrak = p?.kode_kontrak?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchNama || matchKontrak;
  });

  return (
    <div className="space-y-6 w-full relative pb-20">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-wide">Daftar Time Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola target rencana jadwal (Barchart) untuk setiap proyek yang masih berjalan.</p>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">

          {/* Hapus Tombol Refresh Disini */}
          <div className="relative flex-1 md:flex-none min-w-[140px] shadow-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari proyek..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-white pl-9 pr-4 py-2.5 md:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {/* TAMPILKAN TOMBOL AKSI HANYA JIKA PUNYA HAK AKSES */}
            {canCreateData && (
              <>
                {isEditMode ? (
                  <button onClick={() => setIsEditMode(false)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap border border-slate-300 dark:border-slate-600">
                    <X className="w-4 h-4" /> Batal Edit
                  </button>
                ) : (
                  <button onClick={() => setIsEditMode(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-500/50 shadow-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold rounded-xl transition-all whitespace-nowrap">
                    <Edit3 className="w-4 h-4" /> Mode Edit
                  </button>
                )}

                <button onClick={() => navigate('/schedules/input')} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs px-3.5 py-2.5 md:py-2 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap">
                  <Plus className="w-4 h-4" /> <span>Buat Baru</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {/* --- Peringatan Mobile --- */}
      <div className="md:hidden p-8 text-center bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
         <Building2 className="w-10 h-10 mx-auto text-amber-500 mb-3 opacity-80" />
         <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Gunakan Layar Desktop</h3>
         <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Daftar Time Schedule hanya bisa diakses menggunakan layar lebar (Desktop/Tablet) untuk tampilan optimal.</p>
      </div>

      {/* --- KONTEN TABEL (HANYA MUNCUL DI DESKTOP / MD KE ATAS) --- */}
      {isLoading ? (
        <div className="hidden md:flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Memuat data proyek...</p>
        </div>
      ) : (
        <div className="hidden md:block bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-[40%]">Informasi Proyek</th>
                  <th className="p-4 w-[25%]">Periode Kontrak</th>
                  <th className="p-4 w-[15%]">Status Proyek</th>
                  <th className="p-4 text-center w-[20%]">Aksi Jadwal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                {filteredProjects.length > 0 ? filteredProjects.map((proj) => (
                  <tr key={proj.id} className={`transition-all group ${isEditMode ? 'hover:bg-rose-50/30 dark:hover:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 dark:text-white text-[13px] leading-snug line-clamp-2">{proj.nama_proyek}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-500/90 font-mono mt-1.5 font-bold">SPK: {proj.kode_kontrak}</div>
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500"><MapPin className="w-3 h-3"/> {proj.lokasi_wilayah}</div>
                    </td>
                    <td className="p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium"><Calendar className="w-3.5 h-3.5 text-blue-500" /> {proj.tanggal_mulai}</div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium"><Calendar className="w-3.5 h-3.5 text-rose-500" /> {proj.tanggal_selesai || 'Belum di-Set'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border inline-block ${
                        proj.status === 'Delayed' ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10'
                      }`}>{proj.status || 'Berjalan'}</span>
                    </td>
                    <td className="p-4 text-center">
                      {isEditMode ? (
                         <button 
                           onClick={() => setDeleteConfig({ show: true, projectId: proj.id, projectName: proj.nama_proyek })}
                           className="px-3.5 py-2 w-full justify-center bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-500 dark:text-rose-400 dark:border-rose-500/20 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm border border-rose-200 animate-fade-in"
                         >
                           <Trash2 className="w-3.5 h-3.5" /> Hapus Jadwal
                         </button>
                      ) : (
                         <button 
                           onClick={() => navigate(`/schedules/${proj.id}`, { state: proj })} 
                           className="px-3.5 py-2 w-full justify-center bg-white dark:bg-slate-700/80 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-500/20 text-slate-700 dark:text-amber-400 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-600 animate-fade-in"
                         >
                           <CalendarDays className="w-3.5 h-3.5" /> Buka Jadwal
                         </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <Building2 className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-medium">Data tidak ditemukan.</p>
                      <p className="text-[10px] mt-1 opacity-70">Proyek berstatus "Selesai" tidak ditampilkan di sini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS JADWAL (RESET) --- */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Reset Jadwal Proyek?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Semua target waktu dan item pekerjaan pada jadwal proyek <strong>{deleteConfig.projectName}</strong> akan dihapus permanen.
              <br/><br/>
              <span className="italic text-rose-500 font-medium">Anda harus menyusun ulang jadwal dari awal setelah proses ini.</span>
            </p>
            <div className="flex gap-3">
              <button disabled={isDeleting} onClick={() => setDeleteConfig({ show: false, projectId: null, projectName: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs disabled:opacity-50">Batal</button>
              <button disabled={isDeleting} onClick={executeDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-50">
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Ya, Reset Jadwal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}