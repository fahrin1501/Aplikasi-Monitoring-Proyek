import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, CalendarDays, Save, Loader2, AlertTriangle, Edit3, X, Filter, ListPlus, Clock, Target, CheckCircle2, Trash2, ChevronDown, Plus 
} from 'lucide-react';

export default function ScheduleData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

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
  const isGuest = userRole === 'Tamu';

  // State untuk menyimpan data Proyek dan Jadwal (Fallback UI agar tidak kosong saat loading)
  const initialProject = location.state || { id: id, nama_proyek: 'Memuat Data...', kategori: 'Memuat...' };
  const [projectData, setProjectData] = useState(initialProject);
  
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleInputs, setScheduleInputs] = useState({});
  
  // State Filter Tag Card
  const [filterWeek, setFilterWeek] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  // State Pop-up Konfirmasi
  const [saveModal, setSaveModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ show: false, rabItemId: null, weekNum: null, itemName: '' });
  const [deleteWeekConfig, setDeleteWeekConfig] = useState({ show: false, weekNum: null });

  // Handle klik di luar untuk menutup filter pop-up
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const grandTotalRAB = scheduleData ? scheduleData.rab_data.reduce((sum, cat) => 
    sum + cat.items.reduce((itemSum, item) => itemSum + Number(item.total_harga || 0), 0)
  , 0) : 0;

  const getBobotItem = (item) => {
    if (!item || grandTotalRAB === 0) return 0;
    return (Number(item.total_harga || 0) / grandTotalRAB) * 100;
  };

  const calculateRowTotal = (rabItemId, maxWeeks) => {
    let total = 0;
    for (let i = 1; i <= maxWeeks; i++) {
      total += parseFloat(scheduleInputs[`${rabItemId}_${i}`]) || 0;
    }
    return total;
  };

  const fetchTimeSchedule = async () => {
    setIsLoading(true);
    try {
      const [projRes, schedRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/schedules`)
      ]);
      
      setProjectData(projRes.data);
      const data = schedRes.data.data;
      setScheduleData(data);

      const initialInputs = {};
      if (data.schedules && data.schedules.length > 0) {
        data.schedules.forEach(item => {
          initialInputs[`${item.rab_item_id}_${item.minggu_ke}`] = item.bobot_rencana;
        });
      }
      setScheduleInputs(initialInputs);
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeSchedule();
  }, [id]);

  const handleInlineChange = (rabItemId, weekNum, value, bobotRAB) => {
    if (value && isNaN(value)) return;
    
    const valBaru = parseFloat(value) || 0;
    
    const realisasiAktual = scheduleData.realizations
      ?.filter(r => r.rab_item_id === rabItemId)
      ?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;
    
    const sisaBobotTersedia = bobotRAB - realisasiAktual;
    const valLamaDiMingguIni = parseFloat(scheduleInputs[`${rabItemId}_${weekNum}`]) || 0;
    const totalInputSaatIniLainnya = calculateRowTotal(rabItemId, scheduleData.project_info.total_minggu) - valLamaDiMingguIni;
    
    if ((totalInputSaatIniLainnya + valBaru) > (bobotRAB + 0.02)) {
       alert(`Gagal! Sisa plafon yang tersedia untuk item ini maksimal ${(sisaBobotTersedia - totalInputSaatIniLainnya).toFixed(2)}% (Batas RAB - Total Realisasi)`);
       return; 
    }

    setScheduleInputs(prev => ({ ...prev, [`${rabItemId}_${weekNum}`]: value }));
  };

  // --- HANDLER BATAL EDIT ---
  const handleBatalEdit = () => {
    setIsEditMode(false);
    fetchTimeSchedule(); 
  };

  // --- HANDLER HAPUS ITEM (LOKAL) ---
  const executeDelete = () => {
    setScheduleInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[`${deleteConfig.rabItemId}_${deleteConfig.weekNum}`];
      return newInputs;
    });
    setScheduleData(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => !(s.rab_item_id === deleteConfig.rabItemId && parseInt(s.minggu_ke) === deleteConfig.weekNum))
    }));
    setDeleteConfig({ show: false, rabItemId: null, weekNum: null, itemName: '' });
  };

  // --- HANDLER HAPUS 1 MINGGU FULL (LOKAL) ---
  const executeDeleteWeek = () => {
    const wNum = deleteWeekConfig.weekNum;
    setScheduleInputs(prev => {
      const newInputs = { ...prev };
      Object.keys(newInputs).forEach(key => {
        if (key.endsWith(`_${wNum}`)) delete newInputs[key];
      });
      return newInputs;
    });
    setScheduleData(prev => ({
      ...prev,
      schedules: prev.schedules.filter(s => parseInt(s.minggu_ke) !== wNum)
    }));
    setDeleteWeekConfig({ show: false, weekNum: null });
  };

  // --- HANDLER SIMPAN KE BACKEND ---
  const handleSaveSchedule = async () => {
    setSaveModal(false);
    setIsSaving(true);
    try {
      const payloadArr = [];
      Object.keys(scheduleInputs).forEach(key => {
        const value = parseFloat(scheduleInputs[key]);
        if (value > 0) {
          const [rab_item_id, minggu_ke] = key.split('_');
          payloadArr.push({
            rab_item_id: parseInt(rab_item_id),
            minggu_ke: parseInt(minggu_ke),
            bobot_rencana: value
          });
        }
      });
      await api.post(`/projects/${id}/schedules`, { schedules: payloadArr });
      alert("Perubahan Target Jadwal Berhasil Disimpan!");
      setIsEditMode(false);
      fetchTimeSchedule();
    } catch (error) {
      alert("Gagal menyimpan perubahan jadwal.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTanggalMinggu = (tglMulai, mingguKe) => {
    if (!tglMulai) return "Tanggal Proyek Belum Diset";
    const startDate = new Date(tglMulai);
    if (isNaN(startDate.getTime())) return "Format Tanggal Invalid";
    startDate.setDate(startDate.getDate() + ((mingguKe - 1) * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const format = (date) => {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}-${m}-${y}`; 
    };
    return `${format(startDate)} s/d ${format(endDate)}`;
  };

  const getItemInfo = (rabItemId) => {
    if (!scheduleData || !scheduleData.rab_data) return null;
    for (const cat of scheduleData.rab_data) {
      const item = cat.items.find(i => i.id.toString() === rabItemId.toString());
      if (item) return { ...item, kategori_nama: cat.nama_kategori };
    }
    return { uraian_pekerjaan: 'Item Tidak Ditemukan', kategori_nama: '-', bobot: 0 };
  };

  const totalWeeks = scheduleData?.project_info?.total_minggu || 0;
  
  // LOGIKA RENDER MINGGU
  let weeksToRender = [];
  if (filterWeek === 'all') {
    for (let i = 1; i <= totalWeeks; i++) {
      const hasData = scheduleData?.schedules?.some(s => parseInt(s.minggu_ke) === i);
      if (hasData) {
        weeksToRender.push(i);
      }
    }
  } else {
    weeksToRender = [parseInt(filterWeek)];
  }

  return (
    <div className="w-full space-y-5 pb-20 relative">

      {/* Kustomisasi Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* --- 1. HEADER NAVIGASI (Selalu Tampil) --- */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 mb-2">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/schedules')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          
          <div>
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
              Detail Time Schedule
              {isEditMode && <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 font-extrabold tracking-wider">DRAFT MODE</span>}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{projectData?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
                {projectData?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* TAG FILTER UI (POPOVER CARD) - Dimatikan saat Loading */}
          <div className="relative" ref={filterMenuRef}>
            <button 
              disabled={isLoading || isEditMode || totalWeeks === 0}
              onClick={() => setShowFilterMenu(!showFilterMenu)} 
              className={`flex items-center gap-2 bg-white dark:bg-slate-800/80 p-2 rounded-xl border ${showFilterMenu ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'} shadow-sm px-3 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Filter className="w-4 h-4 text-blue-500" />
              {filterWeek === 'all' ? 'Tampilkan Semua' : `Filter: M-${filterWeek}`}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
            </button>

            {showFilterMenu && (
              <div className="absolute top-full mt-2 right-0 md:left-auto w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-4 animate-fade-in">
                <h4 className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">Filter Minggu Ke-</h4>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => { setFilterWeek('all'); setShowFilterMenu(false); }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${filterWeek === 'all' ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                  >
                    Semua
                  </button>
                  {Array.from({ length: totalWeeks }).map((_, i) => {
                    const w = String(i + 1);
                    const isActive = filterWeek === w || filterWeek === parseInt(w);
                    return (
                      <button 
                        key={w}
                        onClick={() => { setFilterWeek(w); setShowFilterMenu(false); }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${isActive ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      >
                        M-{w}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* TAMPILKAN TOMBOL AKSI HANYA JIKA PUNYA HAK AKSES */}
          {canCreateData && (
            <div className="flex items-center bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all">
              {!isEditMode && (
                <button disabled={isLoading} onClick={() => navigate('/schedules/input')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ListPlus className="w-3.5 h-3.5" /> Tambah Pekerjaan
                </button>
              )}
              
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1.5 shrink-0"></div>
              
              {isEditMode ? (
                <>
                  <button onClick={handleBatalEdit} disabled={isSaving || isLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors border border-slate-300 dark:border-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <X className="w-3.5 h-3.5" /> Batal Edit
                  </button>
                  <button onClick={() => setSaveModal(true)} disabled={isSaving || isLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg ml-1 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan Perubahan
                  </button>
                </>
              ) : (
                <button onClick={() => { setIsEditMode(true); setFilterWeek('all'); }} disabled={isLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Edit3 className="w-3.5 h-3.5" /> Mode Edit Draf
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- 2. KONDISI LOADING VS KONTEN UTAMA --- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat Data Jadwal...</p>
        </div>
      ) : (!scheduleData || totalWeeks === 0) ? (
        <div className="p-8 text-center bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl animate-fade-in shadow-sm">
          <AlertTriangle className="w-10 h-10 mx-auto text-rose-500 dark:text-rose-400 mb-2" />
          <h3 className="font-bold text-rose-700 dark:text-rose-300">Tanggal Proyek Tidak Valid</h3>
          <p className="text-xs text-rose-600 mt-1">Kembali ke Menu Data Utama untuk mensetting tanggal mulai dan selesai.</p>
        </div>
      ) : weeksToRender.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <CalendarDays className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">Jadwal Belum Disusun</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">Anda belum menambahkan target pekerjaan ke dalam kalender Time Schedule.</p>
          
          {canCreateData && (
            <button onClick={() => navigate('/schedules/input')} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-amber-600 transition-colors flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Mulai Rencanakan Jadwal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {weeksToRender.map(weekNum => {
            const schedulesThisWeek = scheduleData.schedules.filter(s => parseInt(s.minggu_ke) === weekNum);
            
            return (
              <div key={weekNum} className={`bg-white dark:bg-slate-800/60 border rounded-2xl overflow-hidden shadow-sm transition-all animate-fade-in relative ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
                {isEditMode && <div className="absolute top-3 right-3 md:top-4 md:right-4 p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-500/30 transition-all z-10 animate-pulse"><Edit3 className="w-4 h-4" /></div>}
                
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-3 pr-12">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30 shrink-0">
                      <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Minggu Ke-{weekNum}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono font-medium">
                        {formatTanggalMinggu(scheduleData?.project_info?.tanggal_mulai, weekNum)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg font-bold text-slate-600 dark:text-slate-300 shadow-sm z-20">
                      {schedulesThisWeek.length} Pekerjaan
                    </span>
                    {/* TOMBOL HAPUS MINGGU (Hanya Muncul Saat Edit & Ada Otoritas) */}
                    {isEditMode && canCreateData && (
                      <button 
                        onClick={() => setDeleteWeekConfig({ show: true, weekNum: weekNum })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-lg text-[10px] font-bold transition-all shadow-sm z-20 relative"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus M-{weekNum}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-x-auto w-full custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <th className="p-4 border-r border-slate-200 dark:border-slate-700/60 w-[30%]">Divisi & Uraian Pekerjaan</th>
                        <th className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center w-[15%] text-blue-600 dark:text-blue-400">Target Rencana (M-{weekNum})</th>
                        <th className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center w-[15%] text-emerald-600 dark:text-emerald-400">Realisasi Aktual (M-{weekNum})</th>
                        <th className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center w-[15%]">Tgl Laporan / Verifikasi</th>
                        <th className="p-3 text-center w-[20%] bg-slate-100 dark:bg-slate-900/80 border-r border-slate-200 dark:border-slate-700/60">Info Status Bobot</th>
                        {isEditMode && canCreateData && <th className="p-3 text-center w-[5%] bg-rose-50/50 dark:bg-rose-900/10">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                      {schedulesThisWeek.length === 0 ? (
                        <tr><td colSpan={isEditMode && canCreateData ? 6 : 5} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Data kosong atau telah dihapus sementara.</td></tr>
                      ) : (
                        schedulesThisWeek.map(sched => {
                          const item = getItemInfo(sched.rab_item_id);
                          const bobotRAB = getBobotItem(item); 
                          
                          const totalInputSemuaMinggu = calculateRowTotal(sched.rab_item_id, scheduleData.project_info.total_minggu);
                          
                          const realisasiAktual = scheduleData.realizations
                            ?.filter(r => r.rab_item_id === sched.rab_item_id)
                            ?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;

                          const realisasiMingguIni = scheduleData.realizations
                            ?.filter(r => r.rab_item_id === sched.rab_item_id && parseInt(r.minggu_ke) === weekNum)
                            ?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;

                          const lastRealization = scheduleData.realizations
                            ?.filter(r => r.rab_item_id === sched.rab_item_id && parseInt(r.minggu_ke) === weekNum)
                            ?.pop();
                          
                          const sisaBobotTersedia = bobotRAB - realisasiAktual;
                          const isSelesai = sisaBobotTersedia <= 0.01;

                          return (
                            <tr key={sched.rab_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                              <td className="p-4 border-r border-slate-200 dark:border-slate-700/60">
                                <div className="font-bold text-[11px] leading-snug line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                                <div className="text-[9px] text-amber-600 dark:text-amber-500 mt-1 uppercase tracking-wide truncate">{item.kategori_nama}</div>
                              </td>
                              
                              <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle bg-blue-50/20 dark:bg-blue-900/10">
                                {isEditMode && canCreateData ? (
                                  <input 
                                    type="number" step="any" min="0" 
                                    value={scheduleInputs[`${sched.rab_item_id}_${weekNum}`] || ''} 
                                    onChange={(e) => handleInlineChange(sched.rab_item_id, weekNum, e.target.value, bobotRAB)} 
                                    className="w-20 mx-auto bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-600 text-center font-mono text-sm py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg text-blue-700 dark:text-blue-400 shadow-inner transition-colors" 
                                  />
                                ) : (
                                  <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{parseFloat(sched.bobot_rencana).toFixed(2)}%</span>
                                )}
                              </td>

                              <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle bg-emerald-50/20 dark:bg-emerald-900/10">
                                <span className={`font-mono font-bold text-sm ${realisasiMingguIni > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {realisasiMingguIni > 0 ? `${realisasiMingguIni.toFixed(2)}%` : '-'}
                                </span>
                              </td>
                              
                              <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 align-middle">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex justify-between items-center text-[9px] border border-slate-200 dark:border-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-800">
                                    <span className="text-slate-500">Input:</span>
                                    <span className={`font-mono ${lastRealization ? 'text-slate-700 dark:text-slate-300 font-bold' : 'text-slate-400 italic'}`}>
                                      {lastRealization ? lastRealization.tgl_input : 'Menunggu'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px] border border-slate-200 dark:border-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-800">
                                    <span className="text-slate-500">Verif:</span>
                                    <span className={`font-mono ${lastRealization ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 italic'}`}>
                                      {lastRealization ? lastRealization.tgl_verifikasi : 'Menunggu'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 align-middle bg-slate-50/30 dark:bg-slate-900/40">
                                <div className="flex flex-col gap-2 w-full max-w-[200px] mx-auto">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="text-slate-500">Total Di-Rencana:</span>
                                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{totalInputSemuaMinggu.toFixed(2)}%</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[10px] border-b border-slate-200 dark:border-slate-700 pb-1">
                                    <span className="text-slate-500">Total Di-Realisasi:</span>
                                    <span className={`font-mono font-bold ${realisasiAktual > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>{realisasiAktual.toFixed(2)}%</span>
                                  </div>
                                  
                                  <div className="flex justify-between items-end mt-1">
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Sisa Tersedia</span>
                                    <span className="font-mono font-bold text-sm text-slate-800 dark:text-white">{Math.max(0, sisaBobotTersedia).toFixed(2)}%</span>
                                  </div>
                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${isSelesai ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((totalInputSemuaMinggu / bobotRAB) * 100, 100)}%` }}></div>
                                  </div>
                                  <div className="flex justify-between items-center text-[9px]">
                                    <span className="text-slate-500 font-mono">Batas RAB: {bobotRAB.toFixed(2)}%</span>
                                    {isSelesai && <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold"><CheckCircle2 className="w-3 h-3"/> Terpenuhi</span>}
                                  </div>
                                </div>
                              </td>

                              {/* KOLOM AKSI HANYA TAMPIL SAAT EDIT MODE & PUNYA HAK */}
                              {isEditMode && canCreateData && (
                                <td className="p-3 text-center align-middle bg-slate-50/50 dark:bg-slate-900/40">
                                   <button 
                                      onClick={() => setDeleteConfig({ show: true, rabItemId: sched.rab_item_id, weekNum: weekNum, itemName: item.uraian_pekerjaan })}
                                      className="p-1.5 flex items-center justify-center text-rose-500 bg-rose-50 hover:bg-rose-500 dark:bg-rose-500/10 dark:hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm mx-auto border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                                      title="Hapus Baris Ini"
                                   >
                                     <Trash2 className="w-3.5 h-3.5" />
                                   </button>
                                </td>
                              )}

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}

        </div>
      )}

      {/* --- MODAL: KONFIRMASI SIMPAN PERUBAHAN --- */}
      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-500/30">
              <Save className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Simpan Perubahan?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Target rencana kerja akan diperbarui dan diterapkan langsung ke data Kurva S. Pastikan angka bobot sudah sesuai.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSaveModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Periksa Kembali</button>
              <button onClick={handleSaveSchedule} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: KONFIRMASI HAPUS ITEM 1 BARIS (LOKAL) --- */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Anda yakin ingin menghapus <span className="font-bold text-slate-700 dark:text-slate-300">{deleteConfig.itemName}</span> dari jadwal <span className="font-bold text-slate-700 dark:text-slate-300">Minggu Ke-{deleteConfig.weekNum}</span>?
              <br/><br/>
              <span className="italic text-rose-500 font-medium">Catatan: Penghapusan baru akan permanen setelah Anda menekan tombol "Simpan Perubahan".</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, rabItemId: null, weekNum: null, itemName: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <Trash2 className="w-4 h-4" /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: KONFIRMASI HAPUS 1 MINGGU FULL --- */}
      {deleteWeekConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <Trash2 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Jadwal M-{deleteWeekConfig.weekNum}?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Semua item pekerjaan dan target bobot pada <strong>Minggu Ke-{deleteWeekConfig.weekNum}</strong> akan dihapus seluruhnya dari layar.
              <br/><br/>
              <span className="italic text-rose-500 font-medium">Catatan: Anda tetap harus menekan tombol "Simpan Perubahan" agar perubahan ini masuk ke Database.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteWeekConfig({ show: false, weekNum: null })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={executeDeleteWeek} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <Trash2 className="w-4 h-4" /> Ya, Hapus M-{deleteWeekConfig.weekNum}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}