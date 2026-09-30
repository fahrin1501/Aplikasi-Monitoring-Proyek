import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Save, Loader2, Edit3, X, 
  ListPlus, CheckCircle2, TrendingUp, CalendarDays,
  Info, FileSpreadsheet, Compass
} from 'lucide-react';
import ScheduleWorkData from './ScheduleWorkData';

export default function ScheduleData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => { document.title = "Prisma Group - Data Jadwal Matrix"; }, []);

  const [userRole] = useState(() => {
    try {
      const userDataStr = localStorage.getItem('user_data');
      return userDataStr ? JSON.parse(userDataStr).role || 'Tamu' : 'Tamu';
    } catch {
      return 'Tamu';
    }
  });

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);

  const initialProject = location.state || { id: id, nama_proyek: 'Memuat Data...', kategori: 'Memuat...' };
  const [projectData, setProjectData] = useState(initialProject);
  
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveModal, setSaveModal] = useState(false);

  const [localWeeks, setLocalWeeks] = useState([]); 
  const [weekModal, setWeekModal] = useState({ show: false, minggu_ke: '', bulan: '', tanggal_awal: '', tanggal_akhir: '' });

  const fetchTimeSchedule = async () => {
    setIsLoading(true);
    try {
      const [projRes, schedRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/schedules`)
      ]);
      
      let rawSchedules = schedRes.data?.data?.schedules;
      let fetchedSchedules = Array.isArray(rawSchedules) ? rawSchedules : (rawSchedules ? Object.values(rawSchedules) : []);
      
      if (fetchedSchedules.length === 0 && canCreateData) {
        navigate(`/schedules/${id}/data/input`, { replace: true, state: projRes.data?.data || projRes.data });
        return; 
      }

      setProjectData(projRes.data?.data || projRes.data);
      setScheduleData(schedRes.data?.data || null);

      const wMap = {};
      fetchedSchedules.forEach(s => {
        const wNum = parseInt(s.minggu_ke);
        if (!wMap[wNum]) {
          wMap[wNum] = { 
            minggu_ke: wNum, 
            bulan: s.bulan || '', 
            tanggal_awal: s.tanggal_awal || '', 
            tanggal_akhir: s.tanggal_akhir || '', 
            target_kumulatif: parseFloat(s.target_kumulatif || 0)
          };
        }
      });
      setLocalWeeks(Object.values(wMap).sort((a,b) => a.minggu_ke - b.minggu_ke));

    } catch (error) {
      alert(`Gagal memuat jadwal: \n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTimeSchedule(); }, [id]);

  const handleBatalEdit = () => { setIsEditMode(false); fetchTimeSchedule(); };

  const handleWeekCumulativeChange = (weekNum, value) => {
    const val = value.replace(',', '.');
    if (isNaN(val) && val !== '.') return;
    
    setLocalWeeks(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(w => parseInt(w.minggu_ke) === parseInt(weekNum) ? { ...w, target_kumulatif: val } : w);
    });
  };

  const openWeekModal = (weekNum = null) => {
    const safeWeeks = Array.isArray(localWeeks) ? localWeeks : [];
    if (weekNum) {
      const existing = safeWeeks.find(w => parseInt(w.minggu_ke) === parseInt(weekNum));
      setWeekModal({ show: true, ...(existing || { minggu_ke: weekNum }) });
    } else {
      const maxW = safeWeeks.length > 0 ? Math.max(...safeWeeks.map(w => parseInt(w.minggu_ke) || 0)) : 0;
      setWeekModal({ show: true, minggu_ke: maxW + 1, bulan: '', tanggal_awal: '', tanggal_akhir: '', target_kumulatif: 0 });
    }
  };

  const saveWeekModal = () => {
    if(!weekModal.tanggal_awal || !weekModal.tanggal_akhir) return alert("Pilih Tanggal Mulai dan Akhir!");
    setLocalWeeks(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.find(w => parseInt(w.minggu_ke) === parseInt(weekModal.minggu_ke));
      if (exists) {
        return safePrev.map(w => parseInt(w.minggu_ke) === parseInt(weekModal.minggu_ke) ? { ...w, ...weekModal } : w);
      }
      return [...safePrev, { ...weekModal }].sort((a,b) => parseInt(a.minggu_ke) - parseInt(b.minggu_ke));
    });
    setWeekModal({ show: false, minggu_ke: '', bulan: '', tanggal_awal: '', tanggal_akhir: '' });
  };

  const handleRemoveWeek = (weekNum) => {
    if (window.confirm(`Anda yakin ingin menghapus kolom Target Minggu Ke-${weekNum}?\nKolom akan terhapus dari draf tampilan sebelum Anda menyimpannya ke database.`)) {
      setLocalWeeks(prev => {
        const safePrev = Array.isArray(prev) ? prev : [];
        return safePrev.filter(w => parseInt(w.minggu_ke) !== parseInt(weekNum));
      });
    }
  };

  const handleSaveSchedule = async () => {
    setSaveModal(false);
    setIsSaving(true);
    
    const safeWeeks = Array.isArray(localWeeks) ? localWeeks : [];
    const payloadWeeks = safeWeeks.map(w => ({
       ...w,
       target_kumulatif: parseFloat(w.target_kumulatif) || 0
    }));

    try {
      await api.post(`/projects/${id}/schedules`, { full_sync: true, weeks: payloadWeeks });
      alert("Target Jadwal Berhasil Disimpan!");
      setIsEditMode(false);
      fetchTimeSchedule();
    } catch (error) {
      alert("Gagal menyimpan perubahan jadwal.");
    } finally {
      setIsSaving(false);
    }
  };

  let grandTotalRAB = 0;
  if (scheduleData && scheduleData.rab_data) {
    const safeRabData = Array.isArray(scheduleData.rab_data) ? scheduleData.rab_data : Object.values(scheduleData.rab_data);
    grandTotalRAB = safeRabData.reduce((sum, cat) => {
      const safeItems = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
      return sum + safeItems.reduce((itemSum, item) => itemSum + Number(item.total_harga || 0), 0);
    }, 0);
  }

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

  return (
    <div className="w-full space-y-4 md:space-y-5 pb-20 relative animate-fade-in flex flex-col min-h-screen">
      
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button onClick={() => navigate('/projects')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-start lg:items-center gap-1.5 flex-wrap">
              <span>Matriks Time Schedule</span>
              {/* PERBAIKAN: DRAFT MODE MATCHING PROJECTDATA.JSX */}
              {isEditMode && <span className="px-2 py-0.5 ml-2 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 dark:border-blue-500/30 font-extrabold tracking-wider shadow-sm">DRAFT MODE</span>}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{projectData?.nama_proyek}</span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
                {projectData?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          
          {/* ACTION BUTTONS (GAYA KONSISTEN) */}
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all duration-300">
             {canCreateData && isEditMode && (
               <button onClick={handleBatalEdit} disabled={isSaving || isLoading} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all border border-slate-300 dark:border-slate-600 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                 <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Batal</span>
               </button>
             )}
             {canCreateData && (
               <button onClick={isEditMode ? () => setSaveModal(true) : () => setIsEditMode(true)} disabled={isSaving || isLoading || (!isEditMode && Array.isArray(localWeeks) && localWeeks.length === 0)} className={`flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300'}`}>
                 {isSaving ? <Loader2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" /> : (isEditMode ? <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> : <Edit3 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />)} 
                 <span className="hidden lg:inline">{isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Mode Edit Target')}</span>
               </button>
             )}
             {canCreateData && isEditMode && (
                <>
                   <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                   <button onClick={() => openWeekModal()} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                     <ListPlus className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Tambah Minggu</span>
                   </button>
                </>
             )}
          </div>

          {/* TAB NAVIGASI MODUL UTAMA */}
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0">
            <button onClick={() => navigate(`/projects/${id}/data`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Info className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span>
            </button>
            <button onClick={() => navigate(`/projects/${id}/rab`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span>
            </button>
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap">
              <CalendarDays className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Jadwal</span>
            </button>
            <button onClick={() => navigate(`/projects/${id}/kurva-s`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Kurva S</span>
            </button>
            <button onClick={() => navigate(`/projects/${id}/peta-gis`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span>
            </button>
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500">Memuat Matrix Jadwal...</p>
        </div>
      ) : (
        <ScheduleWorkData 
          scheduleData={scheduleData}
          localWeeks={localWeeks}
          isEditMode={isEditMode}
          canCreateData={canCreateData}
          grandTotalRAB={grandTotalRAB}
          handleWeekCumulativeChange={handleWeekCumulativeChange}
          openWeekModal={openWeekModal}
          handleRemoveWeek={handleRemoveWeek}
        />
      )}

      {/* MODAL PENGATURAN TANGGAL MINGGUAN */}
      {weekModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500"/> Atur Minggu Ke-{weekModal.minggu_ke}
              </h3>
              <button onClick={() => setWeekModal({ show: false })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan Ke- (Opsional)</label>
                <input type="number" value={weekModal.bulan} onChange={(e) => setWeekModal({...weekModal, bulan: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Mulai</label>
                <input type="date" value={weekModal.tanggal_awal} onChange={(e) => setWeekModal({...weekModal, tanggal_awal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors [color-scheme:light_dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Akhir</label>
                <input type="date" value={weekModal.tanggal_akhir} onChange={(e) => setWeekModal({...weekModal, tanggal_akhir: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors [color-scheme:light_dark]" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button onClick={() => setWeekModal({ show: false })} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm transition-colors">Batal</button>
              <button onClick={saveWeekModal} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-1.5 transition-colors">
                <Save className="w-3.5 h-3.5"/> Simpan Tanggal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI SIMPAN */}
      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-500/30">
              <Save className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Simpan Perubahan?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Target rencana mingguan akan diperbarui dan diterapkan langsung ke database S-Curve.</p>
            <div className="flex gap-3">
              <button onClick={() => setSaveModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={handleSaveSchedule} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}