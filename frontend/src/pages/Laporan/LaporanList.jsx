import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 
import { 
  Search, Eye, Plus, FileSpreadsheet, Calendar, MapPin, 
  UserCheck, ListTodo, Users, 
  Wrench, X, Loader2, AlertTriangle, CheckCircle2, Clock, Filter, Edit3, Trash2
} from 'lucide-react';

export default function LaporanList() {
  const navigate = useNavigate();
  
  // --- STATE MANAJEMEN ---
  const [laporanList, setLaporanList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = "Prisma Group - Daftar Laporan";
  }, []);
  
  // --- SEARCH & FILTER ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ status: 'Semua', startDate: '', endDate: '' });
  const filterRef = useRef(null);

  // --- EDIT & BATCH DELETE MODE ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ show: false, id: null, name: '' });
  const [stagedDeletions, setStagedDeletions] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserRole(user.role || 'Tamu');
      } catch (error) {}
    }
  }, []);

  // Definisi Hak Akses
  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  // --- FETCH DATA DARI LARAVEL ---
  const fetchLaporan = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/daily-reports');
      
      const formattedData = response.data.data.map(l => {
        const formatTgl = l.tanggal.replace(/-/g, '');
        const formatId = l.id.toString().padStart(3, '0');
        const isNewReport = (new Date() - new Date(l.created_at)) / (1000 * 60 * 60 * 24) <= 3;
        
        return {
          id: l.id,
          nomorLaporan: `LAP/${formatTgl}/${formatId}`,
          status: l.status || 'pending', 
          tanggalPengawasan: l.tanggal, 
          namaPengawas: l.pengawas,
          namaProyek: l.project ? l.project.nama_proyek : 'Proyek Tidak Diketahui',
          lokasi: l.lokasi,
          kegiatan: l.activities ? l.activities.map(a => a.uraian) : [],
          personil: l.personnels || [],
          peralatan: l.equipments || [],
          cuaca: l.cuaca || '-', 
          isNew: isNewReport,
          originalData: l 
        };
      });
      
      setLaporanList(formattedData);
    } catch (error) {
      console.error("Error fetching laporan:", error);
      setErrorMsg('Gagal memuat data laporan harian. Pastikan server terhubung.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setShowFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- BATCH DELETE LOGIC (MODE EDIT DRAF) ---
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
      await Promise.all(stagedDeletions.map(id => api.delete(`/daily-reports/${id}`)));
      setStagedDeletions([]); 
      await fetchLaporan(); 
      setIsEditMode(false); 
    } catch (error) {
      alert('Beberapa laporan gagal dihapus. Pastikan koneksi server stabil.');
      setStagedDeletions([]);
      await fetchLaporan();
      setIsEditMode(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBatalEdit = () => {
    setStagedDeletions([]);
    setIsEditMode(false);
  };

  const hitungTotal = (arrayData) => {
    return arrayData.reduce((total, item) => total + (Number(item.jumlah) || 0), 0);
  };

  // --- LOGIKA FILTER DINAMIS ---
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilter = (key) => {
    if (key === 'tanggal') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    } else {
      setFilters(prev => ({ ...prev, [key]: 'Semua' }));
    }
  };

  const filteredLaporan = laporanList.filter(l => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      l.namaProyek.toLowerCase().includes(query) ||
      l.nomorLaporan.toLowerCase().includes(query) ||
      l.namaPengawas.toLowerCase().includes(query) ||
      l.lokasi.toLowerCase().includes(query);
    
    // Penyamaran status saat pencarian filter
    const computedStatus = (isGuest && l.status === 'rejected') ? 'pending' : l.status;
    const matchStatus = filters.status === 'Semua' || computedStatus === filters.status;
    
    let matchTanggal = true;
    if (l.tanggalPengawasan) {
      if (filters.startDate && l.tanggalPengawasan < filters.startDate) matchTanggal = false;
      if (filters.endDate && l.tanggalPengawasan > filters.endDate) matchTanggal = false;
    }
    
    return matchSearch && matchStatus && matchTanggal;
  });

  const visibleLaporan = filteredLaporan.filter(l => !stagedDeletions.includes(l.id));

  // --- FUNGSI PEWARNAAN STATUS KONSISTEN ---
  const getStatusStyles = (status) => {
    if (status === 'approved') return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
    if (status === 'rejected') return "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
    return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"; 
  };

  const getStatusText = (status) => {
    if (status === 'approved') return "Disetujui";
    if (status === 'rejected') return "Ditolak";
    return "Pending";
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') return <CheckCircle2 className="w-3 h-3 inline mr-1" />;
    return <Clock className="w-3 h-3 inline mr-1" />;
  };

  const statusOptions = [
    { value: 'Semua', label: 'Semua' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Disetujui' },
    ...(isGuest ? [] : [{ value: 'rejected', label: 'Ditolak' }])
  ];

  return (
    <div className="space-y-6 w-full relative pb-20">
      
      {/* --- TOP ACTION BAR --- */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            Daftar Laporan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monitor dan kelola entri laporan pengawasan harian.</p>
        </div>
        
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 sm:gap-3 w-full xl:w-auto">
          
          {/* Hapus Tombol Refresh Disini */}
          
          {/* Search Input */}
          <div className="relative flex-1 lg:flex-none min-w-[140px] shadow-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari laporan..." 
              value={searchQuery} 
              disabled={isLoading}
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full lg:w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-white pl-9 pr-4 py-2.5 md:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            />
          </div>

          {/* Filter Dropdown Pop-up */}
          <div className="relative" ref={filterRef}>
            <button 
              disabled={isLoading}
              onClick={() => setShowFilter(!showFilter)} 
              className={`flex items-center gap-2 p-2.5 md:px-3.5 md:py-2 rounded-xl text-xs font-bold border transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${showFilter || filters.status !== 'Semua' || filters.startDate || filters.endDate ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 animate-fade-in">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700/60 pb-2">Filter Laporan</h4>
                
                <div className="space-y-5">
                  {/* TAG FILTER: STATUS */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Status Laporan</label>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map(opt => {
                        const isActive = filters.status === opt.value;
                        return (
                          <button 
                            key={opt.value}
                            onClick={() => handleFilterChange('status', opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${
                              isActive 
                                ? 'bg-amber-500 text-white border-amber-600' 
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* FILTER RENTANG TANGGAL */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Rentang Tanggal Pengawasan</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => handleFilterChange('startDate', e.target.value)} 
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[11px] text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none [color-scheme:light_dark]" 
                      />
                      <span className="text-slate-400 text-[10px] font-bold">s/d</span>
                      <input 
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => handleFilterChange('endDate', e.target.value)} 
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-[11px] text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none [color-scheme:light_dark]" 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button onClick={() => { setFilters({ status: 'Semua', startDate: '', endDate: '' }); setShowFilter(false); }} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Reset Semua</button>
                </div>
              </div>
            )}
          </div>

          {/* TAMPILKAN TOMBOL AKSI HANYA JIKA PUNYA HAK AKSES CREATE */}
          {canCreateData && (
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              {isEditMode ? (
                <>
                  <button onClick={handleBatalEdit} disabled={isSavingEdit || isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap border border-slate-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    <X className="w-4 h-4" /> Batal
                  </button>
                  <button onClick={handleSelesaiEdit} disabled={isSavingEdit || isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap disabled:opacity-50 border border-rose-700 disabled:cursor-not-allowed">
                    {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                    {isSavingEdit ? 'Menghapus...' : 'Eksekusi Hapus'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditMode(true)} disabled={isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 md:py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-500/50 shadow-sm text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold rounded-xl transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                  <Edit3 className="w-4 h-4" /> Mode Edit
                </button>
              )}

              <button onClick={() => navigate('/laporan/input')} disabled={isEditMode || isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs px-3.5 py-2.5 md:py-2 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-4 h-4" /> <span>Buat Laporan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- TAGS FILTER AKTIF --- */}
      {(filters.status !== 'Semua' || filters.startDate || filters.endDate) && (
        <div className="flex flex-wrap gap-2 animate-fade-in -mt-2">
          {filters.status !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/20">
              Status: {getStatusText(filters.status)}
              <button onClick={() => clearFilter('status')} className="hover:bg-amber-200 dark:hover:bg-amber-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
            </span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/20">
              Tanggal: {filters.startDate || 'Awal'} s/d {filters.endDate || 'Akhir'}
              <button onClick={() => clearFilter('tanggal')} className="hover:bg-blue-200 dark:hover:bg-blue-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
            </span>
          )}
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat data laporan...</p>
        </div>
      ) : (
        <>
          {/* ========================================== */}
          {/* TAMPILAN MOBILE: KUMPULAN KARTU            */}
          {/* ========================================== */}
          <div className="block md:hidden space-y-4">
            {visibleLaporan.length > 0 ? (
              visibleLaporan.map((laporan) => {
                const totalPersonil = hitungTotal(laporan.personil);
                const totalAlat = hitungTotal(laporan.peralatan);

                // Penyamaran status Ditolak untuk Tamu
                const finalStatus = (isGuest && laporan.status === 'rejected') ? 'pending' : laporan.status;

                return (
                  <div key={laporan.id} className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-4 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all ${isEditMode ? 'border-rose-300 dark:border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-700/60 hover:border-amber-500/30'}`}>
                    
                    {laporan.isNew && !isEditMode && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm animate-pulse z-10">New</div>
                    )}

                    {/* OVERLAY EDIT MODE */}
                    {isEditMode && canCreateData && (
                      <div className="absolute inset-0 bg-slate-900/5 dark:bg-slate-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center gap-3 animate-fade-in">
                        <button onClick={(e) => confirmDelete(e, laporan.id, laporan.nomorLaporan)} className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-transform hover:scale-110" title="Hapus Laporan">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-start gap-2 pt-2">
                      <div className="flex-1 pr-8">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">{laporan.namaProyek}</h3>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500/90 font-mono mt-1 font-bold">{laporan.nomorLaporan}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{laporan.namaPengawas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{laporan.tanggalPengawasan}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{laporan.lokasi}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/40 flex items-start gap-2">
                      <ListTodo className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-xs leading-relaxed line-clamp-2">
                          {laporan.kegiatan[0] || 'Tidak ada uraian kegiatan'}
                        </p>
                        {laporan.kegiatan.length > 1 && (
                          <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 font-medium">
                            + {laporan.kegiatan.length - 1} Kegiatan lainnya
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/40 text-center flex flex-col items-center">
                        <Users className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{totalPersonil} Org</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-700/40 text-center flex flex-col items-center">
                        <Wrench className="w-3.5 h-3.5 text-blue-500 mb-1" />
                        <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300">{totalAlat} Unit</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`flex-1 border text-[9px] font-bold px-3 py-2.5 rounded-xl whitespace-nowrap text-center uppercase tracking-wider ${getStatusStyles(finalStatus)}`}>
                        {getStatusIcon(finalStatus)} {getStatusText(finalStatus)}
                      </span>
                      
                      {!isEditMode && (
                        <button
                          onClick={() => navigate(`/laporan/${laporan.id}`, { state: { laporan: laporan.originalData } })}
                          className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700/80 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-700 dark:text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 shadow-sm"
                        >
                          <Eye className="w-4 h-4" /> Buka
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Laporan tidak ditemukan.</p>
                <p className="text-xs mt-1 text-slate-500">Sesuaikan filter atau kata kunci pencarian.</p>
              </div>
            )}
          </div>

          {/* ========================================== */}
          {/* TAMPILAN DESKTOP: TABEL STANDAR            */}
          {/* ========================================== */}
          <div className="hidden md:block bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-4 w-[25%]">Info Proyek & Laporan</th>
                    <th className="p-4 w-[18%]">Pengawas & Tanggal</th>
                    <th className="p-4 w-[25%]">Kegiatan Lapangan Utama</th>
                    <th className="p-4 w-[17%]">Personil & Alat</th>
                    <th className="p-4 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                  {visibleLaporan.length > 0 ? (
                    visibleLaporan.map((laporan) => {
                      const totalPersonil = hitungTotal(laporan.personil);
                      const totalAlat = hitungTotal(laporan.peralatan);

                      // Penyamaran status Ditolak untuk Tamu
                      const finalStatus = (isGuest && laporan.status === 'rejected') ? 'pending' : laporan.status;

                      return (
                        <tr key={laporan.id} className={`transition-all relative group ${isEditMode ? 'hover:bg-rose-50/30 dark:hover:bg-rose-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                          
                          <td className="p-4 align-top">
                            <div className="flex items-start gap-2">
                              <div className="font-bold text-slate-800 dark:text-white text-[13px] leading-snug line-clamp-2">
                                {laporan.namaProyek}
                              </div>
                              {laporan.isNew && (
                                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse shrink-0 mt-0.5">
                                  New
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-amber-600 dark:text-amber-500/90 font-mono mt-1.5 font-bold">{laporan.nomorLaporan}</div>
                            <div className="mt-1.5">
                              {/* --- BADGE STATUS DESKTOP --- */}
                              <span className={`border text-[9px] font-bold px-2.5 py-1 rounded-md inline-block uppercase tracking-wider ${getStatusStyles(finalStatus)}`}>
                                {getStatusIcon(finalStatus)} {getStatusText(finalStatus)}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 align-top space-y-2">
                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                              <span className="truncate">{laporan.namaPengawas}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              <span>{laporan.tanggalPengawasan}</span>
                            </div>
                            <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{laporan.lokasi}</span>
                            </div>
                          </td>

                          <td className="p-4 align-top">
                            <div className="flex items-start gap-1.5 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/40">
                              <ListTodo className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
                                  {laporan.kegiatan[0] || 'Tidak ada data kegiatan'}
                                </p>
                                {laporan.kegiatan.length > 1 && (
                                  <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1 font-medium">
                                    + {laporan.kegiatan.length - 1} Kegiatan lainnya
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 align-top space-y-1.5">
                            {/* HANYA PERSONIL DAN ALAT */}
                            <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/30">
                              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Users className="w-3 h-3" /> Personil</span>
                              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">{totalPersonil} Org</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/30">
                              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Wrench className="w-3 h-3" /> Peralatan</span>
                              <span className="font-mono font-medium text-blue-600 dark:text-blue-400">{totalAlat} Unit</span>
                            </div>
                          </td>

                          <td className="p-4 align-middle text-center">
                            {isEditMode && canCreateData ? (
                              <button 
                                onClick={(e) => confirmDelete(e, laporan.id, laporan.nomorLaporan)}
                                className="px-3.5 py-2 w-full justify-center bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-500 dark:text-rose-400 dark:border-rose-500/20 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm border border-rose-200 animate-fade-in"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                            ) : (
                              <button
                                onClick={() => navigate(`/laporan/${laporan.id}`, { state: { laporan: laporan.originalData } })}
                                className="px-3.5 py-2 w-full justify-center bg-white dark:bg-slate-700/80 hover:bg-amber-100 hover:text-amber-900 dark:hover:bg-amber-500/20 text-slate-700 dark:text-amber-400 text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-600 animate-fade-in"
                              >
                                <Eye className="w-3.5 h-3.5" /> Buka
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Laporan tidak ditemukan.</p>
                        <p className="text-xs mt-1 text-slate-500">Sesuaikan filter atau kata kunci pencarian.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- MODAL KONFIRMASI DRAFT HAPUS --- */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Laporan Ini?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Laporan <strong>{deleteConfig.name}</strong> akan dihilangkan sementara dari layar.
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

    </div>
  );
}