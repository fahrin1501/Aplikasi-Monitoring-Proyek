import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import api from '../../../api';
import { 
  TrendingUp, ArrowLeft, Info, FileSpreadsheet, Compass, 
  Download, CheckCircle2, AlertTriangle, Loader2, Filter, X,
  CalendarDays, Edit3, Save, ListPlus
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import ScheduleWorkData from './Kurva_s/ScheduleWorkData';
import AddScheduleModal from './Kurva_s/AddScheduleModal';

export default function KurvaS({ selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => { document.title = "Prisma Group - Kurva S & Time Schedule"; }, []);

  const project = selectedProject || location.state || { id: id, nama_proyek: 'Memuat Data...'};
  const projectId = project.id || id;

  const [userRole] = useState(() => {
    try {
      const userDataStr = localStorage.getItem('user_data');
      return userDataStr ? JSON.parse(userDataStr).role || 'Tamu' : 'Tamu';
    } catch { return 'Tamu'; }
  });

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  // --- STATE DATA ---
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState(null);
  const [grandTotalRAB, setGrandTotalRAB] = useState(0);

  // --- STATE EDIT SCHEDULE (MACRO) ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveModal, setSaveModal] = useState(false);
  const [localWeeks, setLocalWeeks] = useState([]); 
  const [weekModal, setWeekModal] = useState({ show: false, minggu_ke: '', bulan: '', tanggal_awal: '', tanggal_akhir: '' });
  
  // STATE MODAL SETUP AWAL
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);

  // --- STATE CHART & FILTER (REMASTERED SCALING) ---
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filterMode, setFilterMode] = useState('Mingguan'); // Default Skala Sumbu X Mingguan
  const filterRef = useRef(null);
  
  const [fullChartData, setFullChartData] = useState([]);
  const [chartData, setChartData] = useState([]);

  // --- EXPORT STATE ---
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModal, setExportModal] = useState({ show: false, type: '' });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setShowFilterPopup(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSafeFloat = (val) => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateSlash = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  // --- FETCH DATA (GABUNGAN KURVA & SCHEDULE) ---
  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/schedules`);
      const data = res.data?.data;
      setScheduleData(data);
      setGrandTotalRAB(data?.grand_total_rab || 0);

      let rawSchedules = data?.schedules;
      let fetchedSchedules = Array.isArray(rawSchedules) ? rawSchedules : (rawSchedules ? Object.values(rawSchedules) : []);

      // ROUTING PINTAR: Munculkan Modal Setup Awal jika jadwal kosong
      if (fetchedSchedules.length === 0 && canCreateData) {
        setShowAddScheduleModal(true);
      }

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
      console.error("Gagal menarik data Kurva S:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (projectId) fetchSchedule(); }, [projectId]);

  // --- FUNGSI EDIT MATRIKS SCHEDULE ---
  const handleBatalEdit = () => { setIsEditMode(false); fetchSchedule(); };

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
    const payloadWeeks = safeWeeks.map(w => ({ ...w, target_kumulatif: parseFloat(w.target_kumulatif) || 0 }));

    try {
      await api.post(`/projects/${projectId}/schedules`, { full_sync: true, weeks: payloadWeeks });
      alert("Target Jadwal Berhasil Disimpan!");
      setIsEditMode(false);
      fetchSchedule();
    } catch (error) {
      alert("Gagal menyimpan perubahan jadwal.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- LABEL FILTER GRAFIK DINAMIS ---
  const getActiveFilterLabel = () => {
    let rangeLabel = (startDateFilter || endDateFilter) 
      ? `${startDateFilter ? formatIndoDate(startDateFilter) : 'Awal'} - ${endDateFilter ? formatIndoDate(endDateFilter) : 'Akhir'}`
      : 'Seluruh Waktu';
    return `Skala ${filterMode} | ${rangeLabel}`;
  };

  // --- EFEK PEMBUATAN RAW CHART (HARIAN DASAR) ---
  useEffect(() => {
    if (!scheduleData) return;

    const weekMap = {};
    const safeSchedules = Array.isArray(scheduleData.schedules) ? scheduleData.schedules : (scheduleData.schedules ? Object.values(scheduleData.schedules) : []);
    
    safeSchedules.forEach(s => {
      const w = parseInt(s.minggu_ke);
      if (!weekMap[w]) {
        weekMap[w] = { minggu_ke: w, bulan: s.bulan || null, tanggal_awal: s.tanggal_awal || null, tanggal_akhir: s.tanggal_akhir || null, target_kumulatif: 0 };
      }
      weekMap[w].target_kumulatif += getSafeFloat(s.target_kumulatif);
      if (!weekMap[w].tanggal_awal && s.tanggal_awal) weekMap[w].tanggal_awal = s.tanggal_awal;
      if (!weekMap[w].tanggal_akhir && s.tanggal_akhir) weekMap[w].tanggal_akhir = s.tanggal_akhir;
    });

    const sortedWeeks = Object.values(weekMap).sort((a, b) => a.minggu_ke - b.minggu_ke);

    const dailyRealisasi = {};
    const dailyRealisasiWeeks = {};
    let maxReportedDayStr = '';

    const safeRealizations = Array.isArray(scheduleData.realizations) ? scheduleData.realizations : (scheduleData.realizations ? Object.values(scheduleData.realizations) : []);

    safeRealizations.forEach(r => {
      if (!r.tgl_input) return;
      const ymd = r.tgl_input.split('T')[0];
      dailyRealisasi[ymd] = getSafeFloat(dailyRealisasi[ymd]) + getSafeFloat(r.bobot_realisasi);
      if (r.minggu_ke) dailyRealisasiWeeks[ymd] = r.minggu_ke;
      if (!maxReportedDayStr || ymd > maxReportedDayStr) maxReportedDayStr = ymd;
    });

    const pStart = scheduleData.project_info?.tanggal_mulai ? new Date(scheduleData.project_info.tanggal_mulai) : new Date(); pStart.setHours(0,0,0,0);
    const pEnd = scheduleData.project_info?.tanggal_selesai ? new Date(scheduleData.project_info.tanggal_selesai) : new Date(pStart.getTime() + (30 * 24 * 3600 * 1000)); pEnd.setHours(0,0,0,0);

    let minDate = new Date(pStart); let maxDate = new Date(pEnd);
    sortedWeeks.forEach(w => {
      if (w.tanggal_awal) { const d = new Date(w.tanggal_awal); if (!isNaN(d.getTime()) && d < minDate) minDate = d; }
      if (w.tanggal_akhir) { const d = new Date(w.tanggal_akhir); if (!isNaN(d.getTime()) && d > maxDate) maxDate = d; }
    });
    if (maxReportedDayStr) { const d = new Date(maxReportedDayStr); if (!isNaN(d.getTime()) && d > maxDate) maxDate = d; }

    minDate.setHours(0,0,0,0); maxDate.setHours(0,0,0,0);
    const totalDays = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 3600 * 24)) + 1);
    const today = new Date(); today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const tempChartData = [];
    let cumRealisasi = 0;

    for (let i = 0; i < totalDays; i++) {
      const currDate = new Date(minDate.getTime() + i * 24 * 3600 * 1000);
      const yyyymmdd = currDate.toISOString().split('T')[0];
      const shortDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const displayDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const dateSlash = formatDateSlash(yyyymmdd);

      let matchedWeek = sortedWeeks.find(w => w.tanggal_awal && w.tanggal_akhir && yyyymmdd >= w.tanggal_awal && yyyymmdd <= w.tanggal_akhir);
      let currentWeekNum = null;

      if (dailyRealisasiWeeks[yyyymmdd]) {
        currentWeekNum = parseInt(dailyRealisasiWeeks[yyyymmdd]);
        if (!matchedWeek && weekMap[currentWeekNum]) matchedWeek = weekMap[currentWeekNum];
      } else if (matchedWeek) {
        currentWeekNum = matchedWeek.minggu_ke;
      } else {
        const diffFromStart = Math.floor((currDate - pStart) / (1000 * 3600 * 24));
        currentWeekNum = diffFromStart >= 0 ? Math.floor(diffFromStart / 7) + 1 : 0;
        if (weekMap[currentWeekNum]) matchedWeek = weekMap[currentWeekNum];
      }

      const targetKumulatifMingguan = matchedWeek ? getSafeFloat(matchedWeek.target_kumulatif) : null;
      const actVal = getSafeFloat(dailyRealisasi[yyyymmdd]);
      const hasReportToday = dailyRealisasi[yyyymmdd] !== undefined;

      if (hasReportToday) cumRealisasi += actVal;
      const isFuture = yyyymmdd > todayStr && (!maxReportedDayStr || yyyymmdd > maxReportedDayStr);

      tempChartData.push({
        hariKe: i + 1, label: `H-${(i + 1).toString().padStart(2, '0')}`, dateString: yyyymmdd, dateSlash, displayDate, shortDate, mingguKe: currentWeekNum,
        isFuture, targetKumulatifMingguan, rencanaKumulatif: targetKumulatifMingguan, bobotRealisasi: actVal,
        realisasiKumulatif: isFuture && !hasReportToday ? null : getSafeFloat(cumRealisasi), hasReportToday
      });
    }

    setFullChartData(tempChartData);
  }, [scheduleData]);

  // --- EFEK AGREGASI CHART (HARIAN / MINGGUAN / BULANAN) ---
  useEffect(() => {
    if (fullChartData.length === 0) return;
    
    // 1. Lakukan Filter Rentang Tanggal Terlebih Dahulu
    let filtered = fullChartData;
    if (startDateFilter) filtered = filtered.filter(d => d.dateString >= startDateFilter);
    if (endDateFilter) filtered = filtered.filter(d => d.dateString <= endDateFilter);

    // 2. Terapkan Agregasi berdasarkan Skala Waktu (FilterMode)
    let aggregated = [];

    if (filterMode === 'Bulanan') {
      const monthMap = {};
      filtered.forEach(d => {
        const dateObj = new Date(d.dateString);
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        const shortMonth = dateObj.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        const longMonth = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        
        // Data akan terus tertimpa dan otomatis menyisakan hari terakhir dari bulan tersebut (Titik Agregat yang tepat)
        monthMap[monthKey] = {
          ...d,
          xAxisLabel: shortMonth,
          tooltipLabel: `Bulan: ${longMonth}`
        };
      });
      aggregated = Object.values(monthMap);
    } 
    else if (filterMode === 'Mingguan') {
      const weekMap = {};
      filtered.forEach(d => {
        const wKey = d.mingguKe || 0;
        if (wKey === 0) return; // Abaikan jika hari tidak masuk minggu manapun
        weekMap[wKey] = {
          ...d,
          xAxisLabel: `M-${wKey}`,
          tooltipLabel: `Minggu Ke-${wKey}`
        };
      });
      aggregated = Object.values(weekMap);
    } 
    else { // Mode 'Harian'
      aggregated = filtered.map(d => ({
        ...d,
        xAxisLabel: d.shortDate,
        tooltipLabel: d.displayDate
      }));
    }

    setChartData(aggregated);
  }, [fullChartData, startDateFilter, endDateFilter, filterMode]);

  // --- TOOLTIP GRAFIK DINAMIS ---
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const dataInfo = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-xl text-xs z-50 min-w-[150px]">
          <p className="font-extrabold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
            {dataInfo.tooltipLabel}
          </p>
          {payload.map((entry, index) => {
            if (entry.value === undefined || entry.value === null) return null; 
            return (
              <div key={index} className="flex justify-between items-center gap-6 font-medium mb-1.5 last:mb-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ color: entry.color }}>{getSafeFloat(entry.value).toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

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

  const executeExport = async () => {
    const type = exportModal.type;
    setExportModal({ show: false, type: '' }); 

    const chartElement = document.getElementById('chart-area'); 
    if (!chartElement) return alert("Area grafik tidak ditemukan!");

    if(type === 'excel') setIsExportingExcel(true);
    else setIsExportingPdf(true);

    try {
      const canvas = await html2canvas(chartElement, { scale: 1.5, backgroundColor: '#ffffff' });
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      const response = await api.post(`/projects/${projectId}/export-kurva/${type}`, {
        chart_image: base64Image,
        // Optional: Anda bisa menambahkan payload itemProgressData jika export backend membutuhkannya
        start_date: startDateFilter,
        end_date: endDateFilter,
        view_mode: filterMode.toLowerCase()
      }, { responseType: 'blob' });

      const safeLabel = getActiveFilterLabel().replace(/[^a-zA-Z0-9]/g, '_');
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kurva_S_${safeLabel}_${type === 'excel' ? 'Lengkap.xlsx' : 'Lengkap.pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed:", error);
      alert(`Gagal mengunduh ${type}. Internal Server Error.`);
    } finally {
      setIsExportingExcel(false);
      setIsExportingPdf(false);
    }
  };

  const isScheduleEmpty = !scheduleData?.schedules || scheduleData.schedules.length === 0;

  return (
    <div className="w-full space-y-5 pb-20 relative animate-fade-in flex flex-col min-h-screen">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* ========================================== */}
      {/* 1. HEADER NAVIGASI                         */}
      {/* ========================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <Link to={`/projects/${projectId}/data`} state={project} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span>Kurva S & Matriks Waktu</span>
              {isEditMode && <span className="px-2 py-0.5 ml-2 text-[10px] bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-md animate-pulse border border-amber-200 dark:border-amber-500/30 font-extrabold tracking-wider shadow-sm">DRAFT MODE</span>}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{project?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(project?.kategori)}`}>
                {project?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          
          {/* ACTION BUTTONS: FILTER GRAFIK */}
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-visible z-30 transition-all duration-300">
            
            {!isEditMode && (
              <div className="relative" ref={filterRef}>
                <button 
                  disabled={isLoading || isScheduleEmpty}
                  onClick={() => setShowFilterPopup(!showFilterPopup)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    showFilterPopup || filterMode !== 'Mingguan' || startDateFilter || endDateFilter
                      ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' 
                      : 'bg-transparent border-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Pengaturan Grafik</span>
                </button>

                {showFilterPopup && (
                  <div className="absolute right-0 md:left-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 animate-fade-in">
                    
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Skala Tampilan Sumbu X</h4>
                    <div className="flex bg-slate-100 dark:bg-slate-900/60 rounded-xl p-1 mb-5 shadow-inner border border-slate-200 dark:border-slate-700/50">
                      {['Harian', 'Mingguan', 'Bulanan'].map(mode => (
                        <button key={mode} onClick={() => setFilterMode(mode)} className={`flex-1 text-[10px] py-1.5 font-bold rounded-lg transition-all ${filterMode === mode ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                          {mode}
                        </button>
                      ))}
                    </div>

                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Filter Rentang Waktu (Opsional)</h4>
                    <div className="flex flex-col gap-3">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-medium text-slate-500">Mulai Tanggal</label>
                         <input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner [color-scheme:light_dark]" />
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-medium text-slate-500">Sampai Tanggal</label>
                         <input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner [color-scheme:light_dark]" />
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        {(startDateFilter || endDateFilter) && (
                          <button onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs shadow-sm transition-colors">Reset</button>
                        )}
                        <button onClick={() => setShowFilterPopup(false)} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-sm transition-colors">Tutup</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {!isGuest && !isEditMode && (
              <>
                <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                <button onClick={() => setExportModal({ show: true, type: 'excel' })} disabled={isLoading || isExportingExcel || isExportingPdf || isScheduleEmpty} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} <span className="hidden lg:inline">{isExportingExcel ? 'Memproses...' : 'Export Excel'}</span>
                </button>
                <button onClick={() => setExportModal({ show: true, type: 'pdf' })} disabled={isLoading || isExportingExcel || isExportingPdf || isScheduleEmpty} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} <span className="hidden lg:inline">{isExportingPdf ? 'Memproses...' : 'Export PDF'}</span>
                </button>
              </>
            )}
          </div>

          {/* TAB NAVIGASI MODUL UTAMA */}
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0">
            <button onClick={() => navigate(`/projects/${projectId}/data`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Info className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span>
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/rab`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span>
            </button>
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap">
              <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Kurva S & Matriks</span>
            </button>
            <button onClick={() => navigate(`/projects/${projectId}/peta-gis`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAMPILAN LABEL FILTER AKTIF */}
      {(filterMode !== 'Mingguan' || startDateFilter || endDateFilter) && !isEditMode && (
        <div className="flex flex-wrap gap-2 animate-fade-in -mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/20 shadow-sm">
            {getActiveFilterLabel()}
            <button onClick={() => {setFilterMode('Mingguan'); setStartDateFilter(''); setEndDateFilter('');}} className="hover:bg-blue-200 dark:hover:bg-blue-500/30 p-0.5 rounded-full transition-colors ml-1"><X className="w-3 h-3"/></button>
          </span>
        </div>
      )}

      {/* ========================================== */}
      {/* 2. LOADING STATE VS KONTEN UTAMA           */}
      {/* ========================================== */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Memproses Dashboard S-Curve...
          </p>
        </div>
      ) : (
        <div className="animate-fade-in space-y-5">
          {isScheduleEmpty && (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-400 text-sm mb-1">Time Schedule Belum Dibuat</h3>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Anda sudah memiliki data RAB, namun <strong>Time Schedule</strong> belum didistribusikan. Grafik Kurva S dan Parameter Rencana akan tetap terlihat kosong. Silakan atur jadwal terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          {/* BAGIAN ATAS: GRAFIK S-CURVE FULL WIDTH */}
          <div id="chart-area" className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl flex flex-col shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-4 gap-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Grafik Kurva S (S-Curve)
              </h3>
              <div className="flex items-center gap-3 text-[10px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-2.5 py-2 rounded-lg shadow-inner">
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> Target Plan</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Aktual Kumulatif</span>
              </div>
            </div>
            
            <div className="w-full h-[350px] overflow-x-auto custom-scrollbar">
              <div className={`h-full ${chartData.length > 30 ? 'min-w-[1500px]' : 'min-w-[600px]'}`}>
                {chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400 italic">Tidak ada data di rentang tanggal ini.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} className="dark:stroke-slate-700" />
                      {/* XAxis Menggunakan Label Agregasi Dinamis (Bulan, Minggu, Hari) */}
                      <XAxis dataKey="xAxisLabel" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="rencanaKumulatif" name="Target Rencana" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={true} />
                      <Line type="monotone" dataKey="realisasiKumulatif" name="Aktual Kumulatif" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* BAGIAN BAWAH: MATRIKS SCHEDULE (KOMPONEN ANAK) */}
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

        </div>
      )}

      {/* ========================================== */}
      {/* MODAL & POPUPS                             */}
      {/* ========================================== */}
      
      {/* MODAL SETUP AWAL (JIKA JADWAL KOSONG) */}
      {showAddScheduleModal && (
        <AddScheduleModal 
          projectId={projectId} 
          projectData={projectData} 
          onClose={() => setShowAddScheduleModal(false)} 
          onSuccess={() => {
            setShowAddScheduleModal(false);
            fetchSchedule();
          }} 
        />
      )}

      {weekModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 mb-5">
              <CalendarDays className="w-5 h-5" /> Atur Info Minggu Ke-{weekModal.minggu_ke}
            </h3>
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan Ke- (Opsional)</label>
                <input type="number" value={weekModal.bulan} onChange={(e) => setWeekModal({...weekModal, bulan: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Mulai</label>
                <input type="date" value={weekModal.tanggal_awal} onChange={(e) => setWeekModal({...weekModal, tanggal_awal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors [color-scheme:light_dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Akhir</label>
                <input type="date" value={weekModal.tanggal_akhir} onChange={(e) => setWeekModal({...weekModal, tanggal_akhir: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors [color-scheme:light_dark]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setWeekModal({ show: false })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={saveWeekModal} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-xl shadow-md flex justify-center items-center gap-1.5 transition-colors"><Save className="w-4 h-4"/> Set Tanggal</button>
            </div>
          </div>
        </div>
      )}

      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/20"><Save className="w-6 h-6 text-amber-600 dark:text-amber-500" /></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Simpan Perubahan?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Target rencana mingguan akan diperbarui dan diterapkan langsung ke database S-Curve.</p>
            <div className="flex gap-3">
              <button onClick={() => setSaveModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={handleSaveSchedule} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors"><CheckCircle2 className="w-4 h-4" /> Ya, Simpan</button>
            </div>
          </div>
        </div>
      )}

      {exportModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${exportModal.type === 'excel' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200'}`}>
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Ekspor Laporan Penuh?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Sistem akan memotret grafik di rentang <strong>{formatIndoDate(startDateFilter)} s/d {formatIndoDate(endDateFilter)}</strong> dan menggabungkannya bersama <strong>Tabel Matriks Schedule</strong> ke dalam format <strong className="uppercase">{exportModal.type}</strong>. 
            </p>
            <div className="flex gap-3">
              <button disabled={isExportingExcel || isExportingPdf} onClick={() => setExportModal({ show: false, type: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
              <button disabled={isExportingExcel || isExportingPdf} onClick={executeExport} className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-2 transition-all ${exportModal.type === 'excel' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {isExportingExcel || isExportingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} Proses
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}