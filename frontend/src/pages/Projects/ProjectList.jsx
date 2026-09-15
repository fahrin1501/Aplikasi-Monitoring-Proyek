import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  Search, Plus, Edit3, Trash2, Filter, X, RotateCw,
  MapPin, Calendar, HardHat, 
  Loader2, AlertTriangle, Info, FileBox, CheckCircle2,
  UploadCloud, FileSpreadsheet
} from 'lucide-react';

export default function ProjectList() {
  const navigate = useNavigate();
  
  // --- STATE MANAJEMEN ---
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // --- SEARCH & FILTER ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ status: 'Semua', kategori: 'Semua', sumber_dana: 'Semua' });
  const filterRef = useRef(null);

  // --- EDIT & BATCH DELETE MODE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ show: false, id: null, name: '' });
  const [stagedDeletions, setStagedDeletions] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- IMPORT EXCEL MODE ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

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
  const canViewFinance = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  const fetchProjects = async (showMainLoader = true) => {
    if (showMainLoader) setIsLoading(true);
    else setIsRefreshing(true);
    
    setErrorMsg('');
    try {
      const response = await api.get('/projects');
      const dataProyek = response.data?.data || response.data || [];
      setProjects(Array.isArray(dataProyek) ? dataProyek : []);
    } catch (error) {
      setErrorMsg('Gagal memuat data proyek. Pastikan server terhubung.');
    } finally {
      if (showMainLoader) setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRefresh = () => fetchProjects(false);

  // --- LOGIKA HAPUS (DRAFT & PERMANENT) ---
  const confirmDelete = (e, id, name) => {
    e.stopPropagation();
    setDeleteConfig({ show: true, id, name });
  };

  const executeDraftDelete = () => {
    setStagedDeletions(prev => [...prev, deleteConfig.id]);
    setDeleteConfig({ show: false, id: null, name: '' });
  };

  const handleSelesaiEdit = async () => {
    if (stagedDeletions.length === 0) {
      setIsEditMode(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      await Promise.all(stagedDeletions.map(id => api.delete(`/projects/${id}`)));
      setStagedDeletions([]); 
      await fetchProjects(false); 
      setIsEditMode(false); 
    } catch (error) {
      alert('Beberapa proyek gagal dihapus. Pastikan tidak ada data laporan yang masih terikat.');
      setStagedDeletions([]);
      await fetchProjects(false);
      setIsEditMode(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBatalEdit = () => {
    setStagedDeletions([]);
    setIsEditMode(false);
  };

  // --- LOGIKA IMPORT EXCEL ---
  const handleImportFile = async () => {
    if (!importFile) return;
    setIsImporting(true);
    
    const formData = new FormData();
    formData.append('file', importFile);
    
    try {
      await api.post('/projects/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Data proyek berhasil di-import!');
      setShowImportModal(false);
      setImportFile(null);
      fetchProjects(false); 
    } catch (error) {
      const serverMsg = error.response?.data?.message || 'Gagal mengimpor file. Periksa koneksi atau format data.';
      alert(`Gagal Import: ${serverMsg}`);
    } finally {
      setIsImporting(false);
    }
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `http://127.0.0.1:8000/storage/foto_proyek/${filename}`;
  };

  // --- FUNGSI WARNA DINAMIS KATEGORI PROYEK ---
  const getCategoryStyle = (kat) => {
    switch (kat) {
      case 'Infrastruktur Jalan & Jembatan': return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      case 'Gedung & Bangunan Sipil': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'Sumber Daya Air & Irigasi': return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50';
      case 'Tata Lingkungan & Sanitasi': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Preservasi Jalan': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      default: return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
    }
  };

  // --- LOGIKA FILTER DINAMIS ---
  const uniqueStatus = ['Semua', ...new Set(projects.map(p => p.status || 'Persiapan'))];
  const uniqueSumber = ['Semua', ...new Set(projects.map(p => p.sumber_dana).filter(Boolean))];
  const uniqueKategori = ['Semua', ...new Set(projects.map(p => p.kategori || 'Belum Ditentukan'))];

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilter = (key) => setFilters(prev => ({ ...prev, [key]: 'Semua' }));

  const filteredProjects = projects.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      (p.nama_proyek && p.nama_proyek.toLowerCase().includes(query)) || 
      (p.kode_kontrak && p.kode_kontrak.toLowerCase().includes(query));
      
    const matchStatus = filters.status === 'Semua' || (p.status || 'Persiapan') === filters.status;
    const matchSumber = filters.sumber_dana === 'Semua' || p.sumber_dana === filters.sumber_dana;
    const matchKategori = filters.kategori === 'Semua' || (p.kategori || 'Belum Ditentukan') === filters.kategori;

    return matchSearch && matchStatus && matchSumber && matchKategori;
  });

  const visibleProjects = filteredProjects.filter(p => !stagedDeletions.includes(p.id));

  return (
    <div className="space-y-6 w-full relative pb-20">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            Daftar Project
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola dan pantau seluruh data administrasi konstruksi Anda.</p>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">
          
          <button onClick={handleRefresh} disabled={isRefreshing || isLoading || isSavingEdit} className="p-2.5 md:p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm">
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <div className="relative flex-1 md:flex-none min-w-[140px] shadow-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari proyek..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full md:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-white pl-9 pr-4 py-2.5 md:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
          </div>

          <div className="relative" ref={filterRef}>
            <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 p-2.5 md:px-3.5 md:py-2 rounded-xl text-xs font-bold border transition-all shadow-sm ${showFilter || filters.status !== 'Semua' || (canViewFinance && filters.sumber_dana !== 'Semua') || filters.kategori !== 'Semua' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
              <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 animate-fade-in">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700/60 pb-2">Filter Proyek</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Status Proyek</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueStatus.map(status => (
                        <button key={status} onClick={() => handleFilterChange('status', status)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${filters.status === status ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Kategori Proyek</label>
                    <div className="flex flex-wrap gap-2">
                      {uniqueKategori.map(kat => (
                        <button key={kat} onClick={() => handleFilterChange('kategori', kat)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${filters.kategori === kat ? 'bg-purple-600 text-white border-purple-700' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                          {kat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FILTER SUMBER DANA HANYA UNTUK ROLE TERTENTU */}
                  {canViewFinance && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Sumber Dana</label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSumber.map(sumber => (
                          <button key={sumber} onClick={() => handleFilterChange('sumber_dana', sumber)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${filters.sumber_dana === sumber ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                            {sumber}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button onClick={() => { setFilters({ status: 'Semua', kategori: 'Semua', sumber_dana: 'Semua' }); setShowFilter(false); }} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Reset Semua</button>
                </div>
              </div>
            )}
          </div>

          {/* TAMPILKAN TOMBOL AKSI HANYA JIKA ROLE MEMILIKI AKSES BIKIN/EDIT DATA */}
          {canCreateData && (
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {isEditMode ? (
                <>
                  <button onClick={handleBatalEdit} disabled={isSavingEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap border border-slate-300 dark:border-slate-600 disabled:opacity-50">
                    <X className="w-4 h-4" /> Batal
                  </button>
                  <button onClick={handleSelesaiEdit} disabled={isSavingEdit} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap disabled:opacity-50 border border-rose-700">
                    {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
                    {isSavingEdit ? 'Menyimpan...' : 'Eksekusi Hapus'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditMode(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-500/50 shadow-sm text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold rounded-xl transition-all whitespace-nowrap">
                  <Edit3 className="w-4 h-4" /> Mode Edit
                </button>
              )}

              <button onClick={() => setShowImportModal(true)} disabled={isEditMode} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2.5 md:py-2 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <FileSpreadsheet className="w-4 h-4" /> <span className="hidden sm:inline">Import Excel</span>
              </button>

              <button onClick={() => navigate('/projects/tambah')} disabled={isEditMode} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs px-3.5 py-2.5 md:py-2 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" /> <span>Proyek Baru</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- TAGS FILTER AKTIF --- */}
      {(filters.status !== 'Semua' || (canViewFinance && filters.sumber_dana !== 'Semua') || filters.kategori !== 'Semua') && (
        <div className="flex flex-wrap gap-2 animate-fade-in -mt-2">
          {filters.status !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/20">
              Status: {filters.status}
              <button onClick={() => clearFilter('status')} className="hover:bg-amber-200 dark:hover:bg-amber-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
            </span>
          )}
          {filters.kategori !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-lg border border-purple-200 dark:border-purple-500/20">
              Kat: {filters.kategori}
              <button onClick={() => clearFilter('kategori')} className="hover:bg-purple-200 dark:hover:bg-purple-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
            </span>
          )}
          {canViewFinance && filters.sumber_dana !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/20">
              Dana: {filters.sumber_dana}
              <button onClick={() => clearFilter('sumber_dana')} className="hover:bg-blue-200 dark:hover:bg-blue-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
            </span>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {/* --- KONTEN TABEL --- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium text-sm">Memuat Data Proyek...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-[40%]">Informasi Proyek</th>
                  <th className="p-4 w-[25%]">Konsultan Pengawas & Administrasi</th>
                  <th className="p-4 w-[20%] text-center">Progress S-Curve</th>
                  <th className="p-4 text-center w-[15%]">Aksi Proyek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                {visibleProjects.length > 0 ? visibleProjects.map((proj) => {
                  
                  // MENYAMARKAN STATUS NEGATIF (DELAYED) BAGI TAMU
                  const displayStatus = (isGuest && proj.status === 'Delayed') ? 'Berjalan' : (proj.status || 'Persiapan');
                  const isDelayed = displayStatus === 'Delayed';

                  return (
                    <tr 
                      key={proj.id} 
                      className={`transition-all group ${isEditMode ? 'hover:bg-rose-50/30 dark:hover:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                    >
                    
                      <td className="p-4 align-top flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-500 shrink-0 overflow-hidden shadow-sm">
                          {proj.foto_sampul ? (
                            <img src={getImageUrl(proj.foto_sampul)} alt="Banner" className="w-full h-full object-cover" />
                          ) : (
                            proj.nama_proyek ? proj.nama_proyek.charAt(0).toUpperCase() : '-'
                          )}
                        </div>
                        
                        <div>
                          {/* TAG BARIS ATAS: STATUS, TAHUN, DAN KATEGORI */}
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                             <span className={`px-2 py-0.5 text-[9px] font-bold rounded border inline-block ${
                               isDelayed ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'
                             }`}>{displayStatus}</span>
                             
                             <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                               {proj.tahun_anggaran || 'Tahun N/A'}
                             </span>

                             <span className={`px-2 py-0.5 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate max-w-[180px] ${getCategoryStyle(proj.kategori)}`}>
                               {proj.kategori || 'Belum Ditentukan'}
                             </span>
                          </div>
                          
                          <div className="font-bold text-slate-800 dark:text-white text-[13px] leading-snug line-clamp-2 pr-4">{proj.nama_proyek}</div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-500/90 font-mono mt-1 font-bold">{proj.kode_kontrak || '-'}</div>
                          <div className="flex items-center mt-1 text-[10px] text-slate-500"><MapPin className="w-3 h-3 mr-0.5"/>{proj.lokasi_wilayah || 'Lokasi belum diset'}</div>
                        </div>
                      </td>

                      <td className="p-4 align-top space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <HardHat className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                          <span className="truncate" title={proj.konsultan || 'Belum diset'}>{proj.konsultan || 'Konsultan Belum Diset'}</span>
                        </div>
                        
                        {/* SUMBER DANA HANYA UNTUK ROLE DENGAN AKSES KEUANGAN */}
                        {canViewFinance && (
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            <span>Sumber : <strong className="text-slate-700 dark:text-slate-300">{proj.sumber_dana || 'N/A'}</strong></span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1 border-t border-slate-100 dark:border-slate-700/60 pt-1.5">
                           <Calendar className="w-3.5 h-3.5 text-amber-500" /> 
                           <span>{proj.tanggal_mulai || '?'} <span className="text-slate-400 font-mono">s/d</span> {proj.tanggal_selesai || '?'}</span>
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30 flex flex-col justify-center items-center text-center">
                            <span className="text-[9px] text-blue-600 dark:text-blue-400 uppercase font-bold block mb-0.5 tracking-wider">Plan</span>
                            <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              {proj.progress_plan !== undefined ? parseFloat(proj.progress_plan).toFixed(2) : '0.00'}%
                            </span>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex flex-col justify-center items-center text-center">
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block mb-0.5 tracking-wider">Actual</span>
                            <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                              {proj.progress_actual !== undefined ? parseFloat(proj.progress_actual).toFixed(2) : '0.00'}%
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        {isEditMode ? (
                           <div className="flex flex-col gap-2">
                             <button 
                               onClick={(e) => confirmDelete(e, proj.id, proj.nama_proyek)}
                               className="px-3.5 py-2 w-full justify-center bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-500 dark:text-rose-400 dark:border-rose-500/20 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm border border-rose-200 animate-fade-in"
                             >
                               <Trash2 className="w-3.5 h-3.5" /> Hapus
                             </button>
                           </div>
                        ) : (
                           <button 
                             onClick={(e) => { e.stopPropagation(); navigate(`/projects/${proj.id}/data`); }} 
                             className="px-3.5 py-2 w-full justify-center bg-white dark:bg-slate-700/80 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-500/20 text-slate-700 dark:text-amber-400 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-600 animate-fade-in"
                           >
                             <Info className="w-3.5 h-3.5" /> Buka Data
                           </button>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400">
                      <FileBox className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-medium">Data tidak ditemukan.</p>
                      <p className="text-[10px] mt-1 opacity-70">Belum ada proyek atau tidak cocok dengan filter pencarian.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI DRAFT HAPUS --- */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Proyek Ini?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Proyek <strong>{deleteConfig.name}</strong> akan dihilangkan sementara dari layar.
              <br/><br/>
              <span className="italic text-rose-500 font-medium">Data akan dihapus permanen dari Database saat Anda menekan tombol "Eksekusi Hapus".</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, id: null, name: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs">Batal</button>
              <button onClick={executeDraftDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <Trash2 className="w-4 h-4"/> Sembunyikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL IMPORT EXCEL --- */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Import Project via Excel</h3>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500/50 rounded-xl p-8 mb-4 bg-slate-50 dark:bg-slate-900/50 relative transition-all group overflow-hidden">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={(e) => setImportFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <UploadCloud className="w-10 h-10 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 truncate px-4">
                {importFile ? importFile.name : "Seret file excel disini atau Klik"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Format yang didukung: .xlsx, .xls</p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl mb-6 text-left shadow-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                Note: Pastikan format kolom excel sudah benar dan sesuai template sebelum di-import agar data terbaca oleh sistem.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                disabled={isImporting}
                onClick={() => { setShowImportModal(false); setImportFile(null); }} 
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                disabled={isImporting || !importFile}
                onClick={handleImportFile} 
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-2 shadow-md transition-colors disabled:opacity-50"
              >
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4"/>} 
                {isImporting ? 'Mengimpor...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}