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

  // --- BATCH DELETE LOGIC ---
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

  // --- LOGIKA FILTER ---
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

  // --- PEWARNAAN STATUS ---
  const getStatusStyles = (status) => {
    if (status === 'approved') return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    if (status === 'rejected') return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"; 
  };

  const getStatusText = (status) => {
    if (status === 'approved') return "Disetujui";
    if (status === 'rejected') return "Ditolak";
    return "Pending";
  };

  const statusOptions = [
    { value: 'Semua', label: 'Semua' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Disetujui' },
    ...(isGuest ? [] : [{ value: 'rejected', label: 'Ditolak' }])
  ];

  return (
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8 font-sans bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={32} />
            Daftar Laporan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor dan kelola entri laporan pengawasan harian.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari laporan..." 
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none backdrop-blur-sm transition-all text-sm disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FILTER DROPDOWN */}
          <div className="relative" ref={filterRef}>
            <button 
              disabled={isLoading}
              onClick={() => setShowFilter(!showFilter)} 
              className={`p-2.5 border rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm disabled:opacity-50 ${
                showFilter || filters.status !== 'Semua' || filters.startDate || filters.endDate 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                  : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Filter size={20} />
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-5 z-50">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Filter Laporan</h4>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Status Laporan</label>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map(opt => (
                        <button 
                          key={opt.value}
                          onClick={() => handleFilterChange('status', opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            filters.status === opt.value 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Rentang Tanggal</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={filters.startDate} 
                        onChange={(e) => handleFilterChange('startDate', e.target.value)} 
                        className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-800 dark:text-white outline-none" 
                      />
                      <span className="text-gray-400 text-xs">s/d</span>
                      <input 
                        type="date" 
                        value={filters.endDate} 
                        onChange={(e) => handleFilterChange('endDate', e.target.value)} 
                        className="flex-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-800 dark:text-white outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button onClick={() => { setFilters({ status: 'Semua', startDate: '', endDate: '' }); setShowFilter(false); }} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Reset Filter</button>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS (RBAC) */}
          {canCreateData && (
            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
              {isEditMode ? (
                <>
                  <button onClick={handleBatalEdit} disabled={isSavingEdit || isLoading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl transition-all border border-gray-300 dark:border-gray-600 disabled:opacity-50">
                    <X size={18} /> Batal
                  </button>
                  <button onClick={handleSelesaiEdit} disabled={isSavingEdit || isLoading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm border border-rose-700 disabled:opacity-50">
                    {isSavingEdit ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} 
                    {isSavingEdit ? 'Memproses...' : 'Eksekusi'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditMode(true)} disabled={isLoading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/50 dark:bg-gray-800/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-gray-200 dark:border-gray-700 hover:border-rose-300 shadow-sm text-gray-700 dark:text-gray-300 hover:text-rose-600 text-sm font-bold rounded-xl transition-all backdrop-blur-sm disabled:opacity-50">
                  <Edit3 size={18} /> Mode Edit
                </button>
              )}

              <button onClick={() => navigate('/laporan/input')} disabled={isEditMode || isLoading} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50">
                <Plus size={18} /> Buat Laporan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER TAGS AKTIF */}
      {(filters.status !== 'Semua' || filters.startDate || filters.endDate) && (
        <div className="flex flex-wrap gap-2 mb-6 -mt-2">
          {filters.status !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-bold rounded-full border border-amber-500/20">
              Status: {getStatusText(filters.status)}
              <button onClick={() => clearFilter('status')} className="hover:bg-amber-500/20 p-0.5 rounded-full transition-colors"><X size={14}/></button>
            </span>
          )}
          {(filters.startDate || filters.endDate) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-bold rounded-full border border-blue-500/20">
              Tanggal: {filters.startDate || 'Awal'} - {filters.endDate || 'Akhir'}
              <button onClick={() => clearFilter('tanggal')} className="hover:bg-blue-500/20 p-0.5 rounded-full transition-colors"><X size={14}/></button>
            </span>
          )}
        </div>
      )}

      {/* NOTIFIKASI ERROR */}
      {errorMsg && (
        <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-medium">
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full bg-white/70 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-sm min-h-[400px]">
          <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memuat data laporan harian...</p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (CARD) */}
          <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
            {visibleLaporan.length > 0 ? (
              visibleLaporan.map((laporan) => {
                const totalPersonil = hitungTotal(laporan.personil);
                const totalAlat = hitungTotal(laporan.peralatan);
                const finalStatus = (isGuest && laporan.status === 'rejected') ? 'pending' : laporan.status;

                return (
                  <div key={laporan.id} className={`p-5 rounded-2xl border bg-white/70 dark:bg-gray-800/40 backdrop-blur-md shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all ${isEditMode ? 'border-rose-500/50 ring-2 ring-rose-500/20' : 'border-gray-200/60 dark:border-white/10'}`}>
                    
                    {laporan.isNew && !isEditMode && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">New</div>
                    )}

                    {isEditMode && canCreateData && (
                      <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <button onClick={(e) => confirmDelete(e, laporan.id, laporan.nomorLaporan)} className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-lg transition-transform hover:scale-110">
                          <Trash2 size={24} />
                        </button>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{laporan.nomorLaporan}</p>
                      <h3 className="font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2">{laporan.namaProyek}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 text-sm border-y border-gray-100 dark:border-gray-700/50 py-3">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><UserCheck size={14}/> Pengawas</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">{laporan.namaPengawas}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><Calendar size={14}/> Tanggal</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200 mt-1">{laporan.tanggalPengawasan}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><MapPin size={14}/> Lokasi</p>
                        <p className="font-medium text-gray-800 dark:text-gray-200 mt-1 line-clamp-1">{laporan.lokasi}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex items-start gap-2">
                        <ListTodo size={16} className="text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2">{laporan.kegiatan[0] || 'Tidak ada kegiatan'}</p>
                          {laporan.kegiatan.length > 1 && <p className="text-xs text-blue-500 mt-1 font-semibold">+ {laporan.kegiatan.length - 1} kegiatan lain</p>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wide ${getStatusStyles(finalStatus)}`}>
                        {finalStatus === 'approved' ? <CheckCircle2 size={14}/> : <Clock size={14}/>} {getStatusText(finalStatus)}
                      </span>
                      {!isEditMode && (
                        <button onClick={() => navigate(`/laporan/${laporan.id}`, { state: { laporan: laporan.originalData } })} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors font-semibold flex items-center gap-2 text-sm">
                          <Eye size={18} /> Buka
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white/70 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm">
                <FileSpreadsheet size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Laporan tidak ditemukan.</p>
                <p className="text-sm text-gray-500 mt-1">Coba sesuaikan filter atau kata kunci.</p>
              </div>
            )}
          </div>

          {/* DESKTOP VIEW (TABLE) */}
          <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-gray-800/40 backdrop-blur-md shadow-lg mb-8">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200/60 dark:border-white/10">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[25%]">Proyek & ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">Pengawas & Waktu</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[25%]">Kegiatan Utama</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60 dark:divide-white/10">
                {visibleLaporan.length > 0 ? (
                  visibleLaporan.map((laporan) => {
                    const totalPersonil = hitungTotal(laporan.personil);
                    const totalAlat = hitungTotal(laporan.peralatan);
                    const finalStatus = (isGuest && laporan.status === 'rejected') ? 'pending' : laporan.status;

                    return (
                      <tr key={laporan.id} className={`transition-colors group ${isEditMode ? 'hover:bg-rose-500/10' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}>
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{laporan.namaProyek}</span>
                            {laporan.isNew && <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">New</span>}
                          </div>
                          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">{laporan.nomorLaporan}</div>
                        </td>

                        <td className="px-6 py-4 align-top space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 font-medium">
                            <UserCheck size={16} className="text-gray-400" /> <span className="truncate">{laporan.namaPengawas}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar size={14} /> <span>{laporan.tanggalPengawasan}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="flex items-start gap-2 bg-gray-50/50 dark:bg-gray-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/50">
                            <ListTodo size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 line-clamp-2">{laporan.kegiatan[0] || 'Tidak ada uraian'}</p>
                              {laporan.kegiatan.length > 1 && <p className="text-xs text-blue-500 mt-1 font-semibold">+ {laporan.kegiatan.length - 1} kegiatan lain</p>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${getStatusStyles(finalStatus)}`}>
                             {finalStatus === 'approved' ? <CheckCircle2 size={14}/> : <Clock size={14}/>} {getStatusText(finalStatus)}
                          </span>
                          <div className="mt-3 space-y-1">
                            <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1"><Users size={12}/> SDM</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPersonil}</span></div>
                            <div className="flex justify-between text-xs text-gray-500"><span className="flex items-center gap-1"><Wrench size={12}/> Alat</span> <span className="font-semibold text-gray-700 dark:text-gray-300">{totalAlat}</span></div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle text-center">
                          {isEditMode && canCreateData ? (
                            <button onClick={(e) => confirmDelete(e, laporan.id, laporan.nomorLaporan)} className="w-full py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-600 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-rose-500/20">
                              <Trash2 size={16} /> Hapus
                            </button>
                          ) : (
                            <button onClick={() => navigate(`/laporan/${laporan.id}`, { state: { laporan: laporan.originalData } })} className="w-full py-2 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700">
                              <Eye size={16} /> Buka Detail
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <FileSpreadsheet size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Laporan tidak ditemukan.</p>
                      <p className="text-sm mt-1">Coba sesuaikan filter pencarian.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FOOTER LEGEND */}
      {!isLoading && visibleLaporan.length > 0 && (
        <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm p-4 mt-auto">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Keterangan Status & Ikon</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><CheckCircle2 size={16} className="text-emerald-500" /> <span>Valid & Disetujui</span></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Clock size={16} className="text-amber-500" /> <span>Menunggu Pengecekan</span></div>
            {!isGuest && <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><AlertTriangle size={16} className="text-rose-500" /> <span>Perlu Revisi / Ditolak</span></div>}
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 hidden md:block mx-2"></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Users size={16} className="text-gray-400" /> <span>Total Personil</span></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Wrench size={16} className="text-gray-400" /> <span>Total Peralatan</span></div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI DRAFT HAPUS */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <Trash2 size={28} className="text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Laporan Ini?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Laporan <strong>{deleteConfig.name}</strong> akan dihilangkan dari layar.
              <br/><br/>
              <span className="text-rose-500 font-medium text-xs">Akan dihapus permanen saat Anda menekan "Eksekusi".</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, id: null, name: '' })} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">Batal</button>
              <button onClick={executeDraftDelete} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-sm transition-colors">
                <Trash2 size={18}/> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}