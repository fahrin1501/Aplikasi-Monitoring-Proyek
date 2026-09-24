import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import api from '../../../api';
import { 
  TrendingUp, ArrowLeft, Info, FileSpreadsheet, Compass, 
  PieChart, Download, CheckCircle2, AlertTriangle, Loader2, Filter, X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function KurvaS({ selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    document.title = "Prisma Group - Kurva S";
  }, []);

  const project = selectedProject || location.state || { id: id, nama_proyek: 'Memuat Data...'};
  const projectId = project.id || id;

  const [isLoading, setIsLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState(null);
  const [userRole, setUserRole] = useState('Tamu');

  // --- STATE FILTER TANGGAL & MINGGUAN ---
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [projectBounds, setProjectBounds] = useState({ start: '', end: '' }); 
  
  const [activeWeek, setActiveWeek] = useState('Semua');
  const [showWeekFilter, setShowWeekFilter] = useState(false);
  const filterRef = useRef(null);
  
  const [fullChartData, setFullChartData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [itemProgressData, setItemProgressData] = useState([]);

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModal, setExportModal] = useState({ show: false, type: '' });

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const isGuest = userRole === 'Tamu';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowWeekFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Helper format tanggal DD/MM/YYYY
  const formatDateSlash = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/schedules`);
      setScheduleData(res.data.data);

      if (res.data.data?.project_info) {
        setProjectBounds({
          start: res.data.data.project_info.tanggal_mulai || '',
          end: res.data.data.project_info.tanggal_selesai || ''
        });
      }
    } catch (error) {
      console.error("Gagal menarik data Kurva S:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchSchedule();
  }, [projectId]);

  // --- HANDLER FILTER MINGGUAN DINAMIS ---
  const handleWeekSelect = (weekNum) => {
    setActiveWeek(weekNum);
    setShowWeekFilter(false);

    if (weekNum === 'Semua') {
      setStartDateFilter(projectBounds.start);
      setEndDateFilter(projectBounds.end);
      return;
    }

    // Cari jadwal minggu tersebut
    const targetSchedule = (scheduleData?.schedules || []).find(s => parseInt(s.minggu_ke) === parseInt(weekNum));
    if (targetSchedule && targetSchedule.tanggal_awal && targetSchedule.tanggal_akhir) {
      setStartDateFilter(targetSchedule.tanggal_awal);
      setEndDateFilter(targetSchedule.tanggal_akhir);
      return;
    }

    if (!projectBounds.start) return;

    // Fallback jika tanggal jadwal belum ditentukan
    const startDate = new Date(projectBounds.start);
    startDate.setHours(0, 0, 0, 0);

    const weekStart = new Date(startDate.getTime() + (weekNum - 1) * 7 * 24 * 3600 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 3600 * 1000);

    setStartDateFilter(weekStart.toISOString().split('T')[0]);
    setEndDateFilter(weekEnd.toISOString().split('T')[0]);
  };

  const handleManualDateChange = (type, value) => {
    if (type === 'start') setStartDateFilter(value);
    else setEndDateFilter(value);
    setActiveWeek('Kustom');
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

      const filteredChartData = chartData.filter(row => !row.isFuture);

      const response = await api.post(`/projects/${id}/export-kurva/${type}`, {
        chart_image: base64Image,
        item_progress: itemProgressData,
        chart_data: filteredChartData, 
        start_date: startDateFilter,
        end_date: endDateFilter,
        view_mode: 'harian' 
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kurva_S_${activeWeek !== 'Semua' && activeWeek !== 'Kustom' ? `Minggu_${activeWeek}_` : ''}${type === 'excel' ? 'Lengkap.xlsx' : 'Lengkap.pdf'}`);
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

  useEffect(() => {
    if (!scheduleData) return;

    let grandTotalRAB = 0;
    const allItems = [];
    (scheduleData.rab_data || []).forEach(cat => {
      (cat.items || []).forEach(item => {
        if (!item.is_subheader) {
          grandTotalRAB += Number(item.total_harga || 0);
          allItems.push({ ...item, kategori_nama: cat.nama_kategori });
        }
      });
    });

    // 1. Progress Tiap Item Pekerjaan (Berdasarkan Laporan Terverifikasi)
    const progressList = allItems.map(item => {
      const baseBobot = grandTotalRAB > 0 ? (Number(item.total_harga || 0) / grandTotalRAB) * 100 : 0;
      const itemRealisasi = (scheduleData.realizations || [])
        ?.filter(r => r.rab_item_id === item.id)
        ?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi || 0), 0) || 0;
      const progressPercent = baseBobot > 0 ? (itemRealisasi / baseBobot) * 100 : 0;
      
      return { 
        id: item.id, 
        nama: item.uraian_pekerjaan, 
        volume: item.volume || 0, 
        satuan: item.satuan || '-', 
        bobot: baseBobot, 
        progress: Math.min(progressPercent, 100),
        realisasiAktual: itemRealisasi 
      };
    }).filter(item => item.realisasiAktual > 0); 
    
    setItemProgressData(progressList);

    // 2. Pemetaan Jadwal Mingguan (Target Kumulatif & Rentang Tanggal)
    const weekMap = {};
    (scheduleData.schedules || []).forEach(s => {
      const w = parseInt(s.minggu_ke);
      if (!weekMap[w]) {
        weekMap[w] = {
          minggu_ke: w,
          bulan: s.bulan || null,
          tanggal_awal: s.tanggal_awal || null,
          tanggal_akhir: s.tanggal_akhir || null,
          target_kumulatif: 0
        };
      }
      weekMap[w].target_kumulatif += parseFloat(s.bobot_rencana || 0);
      if (!weekMap[w].tanggal_awal && s.tanggal_awal) weekMap[w].tanggal_awal = s.tanggal_awal;
      if (!weekMap[w].tanggal_akhir && s.tanggal_akhir) weekMap[w].tanggal_akhir = s.tanggal_akhir;
    });

    const sortedWeeks = Object.values(weekMap).sort((a, b) => a.minggu_ke - b.minggu_ke);

    // 3. Pemetaan Realisasi Harian dari Laporan Terverifikasi
    const dailyRealisasi = {};
    const dailyRealisasiWeeks = {};
    let maxReportedDayStr = '';

    (scheduleData.realizations || []).forEach(r => {
      if (!r.tgl_input) return;
      const ymd = r.tgl_input.split('T')[0];
      dailyRealisasi[ymd] = (dailyRealisasi[ymd] || 0) + parseFloat(r.bobot_realisasi || 0);
      if (r.minggu_ke) {
        dailyRealisasiWeeks[ymd] = r.minggu_ke;
      }
      if (!maxReportedDayStr || ymd > maxReportedDayStr) {
        maxReportedDayStr = ymd;
      }
    });

    // 4. Rentang Tanggal Keseluruhan
    const pStart = scheduleData.project_info?.tanggal_mulai ? new Date(scheduleData.project_info.tanggal_mulai) : new Date();
    pStart.setHours(0,0,0,0);
    const pEnd = scheduleData.project_info?.tanggal_selesai ? new Date(scheduleData.project_info.tanggal_selesai) : new Date(pStart.getTime() + (30 * 24 * 3600 * 1000));
    pEnd.setHours(0,0,0,0);

    let minDate = new Date(pStart);
    let maxDate = new Date(pEnd);

    sortedWeeks.forEach(w => {
      if (w.tanggal_awal) {
        const d = new Date(w.tanggal_awal);
        if (!isNaN(d.getTime()) && d < minDate) minDate = d;
      }
      if (w.tanggal_akhir) {
        const d = new Date(w.tanggal_akhir);
        if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
      }
    });

    if (maxReportedDayStr) {
      const d = new Date(maxReportedDayStr);
      if (!isNaN(d.getTime()) && d > maxDate) maxDate = d;
    }

    minDate.setHours(0,0,0,0);
    maxDate.setHours(0,0,0,0);

    const totalDays = Math.max(1, Math.floor((maxDate - minDate) / (1000 * 3600 * 24)) + 1);

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    const tempChartData = [];
    let cumRealisasi = 0;

    for (let i = 0; i < totalDays; i++) {
      const currDate = new Date(minDate.getTime() + i * 24 * 3600 * 1000);
      const yyyymmdd = currDate.toISOString().split('T')[0];
      const shortDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const displayDate = currDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
      const dateSlash = formatDateSlash(yyyymmdd);

      // Cari minggu yang menaungi tanggal ini (berdasarkan tanggal_awal s/d tanggal_akhir)
      let matchedWeek = sortedWeeks.find(w => {
        if (w.tanggal_awal && w.tanggal_akhir) {
          return yyyymmdd >= w.tanggal_awal && yyyymmdd <= w.tanggal_akhir;
        }
        return false;
      });

      let currentWeekNum = null;
      if (dailyRealisasiWeeks[yyyymmdd]) {
        currentWeekNum = parseInt(dailyRealisasiWeeks[yyyymmdd]);
        if (!matchedWeek && weekMap[currentWeekNum]) {
          matchedWeek = weekMap[currentWeekNum];
        }
      } else if (matchedWeek) {
        currentWeekNum = matchedWeek.minggu_ke;
      } else {
        const diffFromStart = Math.floor((currDate - pStart) / (1000 * 3600 * 24));
        currentWeekNum = diffFromStart >= 0 ? Math.floor(diffFromStart / 7) + 1 : 0;
        if (weekMap[currentWeekNum]) {
          matchedWeek = weekMap[currentWeekNum];
        }
      }

      // LOGIKA UTAMA: Target kumulatif flat/horizontal di sepanjang tanggal_awal s/d tanggal_akhir
      const targetKumulatifMingguan = matchedWeek ? Number(matchedWeek.target_kumulatif.toFixed(2)) : null;

      const actVal = dailyRealisasi[yyyymmdd] || 0;
      const hasReportToday = dailyRealisasi[yyyymmdd] !== undefined;

      if (hasReportToday) {
        cumRealisasi += actVal;
      }

      const isFuture = yyyymmdd > todayStr && (!maxReportedDayStr || yyyymmdd > maxReportedDayStr);

      // Deviasi dihitung terhadap target kumulatif minggu terkait
      const deviasiVal = (hasReportToday && targetKumulatifMingguan !== null) 
        ? Number((cumRealisasi - targetKumulatifMingguan).toFixed(2)) 
        : null;

      tempChartData.push({
        hariKe: i + 1,
        label: `H-${(i + 1).toString().padStart(2, '0')}`,
        dateString: yyyymmdd,
        dateSlash: dateSlash,
        displayDate: displayDate,
        shortDate: shortDate,
        mingguKe: currentWeekNum,
        isFuture,
        targetKumulatifMingguan: targetKumulatifMingguan,
        rencanaKumulatif: targetKumulatifMingguan, // Titik garis rencana
        bobotRealisasi: actVal,
        realisasiKumulatif: isFuture && !hasReportToday ? null : Number(cumRealisasi.toFixed(2)),
        deviasi: deviasiVal,
        hasReportToday
      });
    }

    setFullChartData(tempChartData);

    if (!startDateFilter && !endDateFilter && tempChartData.length > 0) {
      setStartDateFilter(tempChartData[0].dateString);
      setEndDateFilter(tempChartData[tempChartData.length - 1].dateString);
    }
  }, [scheduleData]);

  useEffect(() => {
    if (fullChartData.length === 0) return;
    let filtered = fullChartData;
    if (startDateFilter) filtered = filtered.filter(d => d.dateString >= startDateFilter);
    if (endDateFilter) filtered = filtered.filter(d => d.dateString <= endDateFilter);
    setChartData(filtered);
  }, [fullChartData, startDateFilter, endDateFilter]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataInfo = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl shadow-xl text-xs z-50">
          <p className="font-extrabold text-slate-800 dark:text-white mb-0.5">{dataInfo.displayDate}</p>
          <div className="flex items-center gap-2 text-[10px] text-amber-500 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700 font-bold uppercase tracking-wider">
            <span>{dataInfo.label}</span>
            {dataInfo.mingguKe && <span>• Minggu Ke-{dataInfo.mingguKe}</span>}
          </div>
          {payload.map((entry, index) => {
            if (entry.value === undefined || entry.value === null) return null; 
            return (
              <div key={index} className="flex justify-between items-center gap-6 font-medium mb-1.5 last:mb-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-slate-600 dark:text-slate-300">{entry.name}</span>
                </div>
                <span className="font-mono font-bold" style={{ color: entry.color }}>{Number(entry.value).toFixed(2)}%</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const isScheduleEmpty = !scheduleData?.schedules || scheduleData.schedules.length === 0;

  // Filter baris tabel hanya yang benar-benar ada laporan harian terverifikasi
  const deviasiTableData = chartData.filter(row => row.hasReportToday);

  return (
    <div className="w-full space-y-5 pb-20 relative animate-fade-in">
      
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
              <span>Monitoring Kurva S</span>
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
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-visible z-30">
            
            {/* FILTER MINGGUAN POP-UP */}
            <div className="relative" ref={filterRef}>
              <button 
                disabled={isLoading || isScheduleEmpty}
                onClick={() => setShowWeekFilter(!showWeekFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  showWeekFilter || (activeWeek !== 'Semua' && activeWeek !== 'Kustom')
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Filter className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Minggu</span>
              </button>

              {showWeekFilter && (
                <div className="absolute right-0 md:left-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 z-50 animate-fade-in">
                  <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">Filter Mingguan</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    <button 
                      onClick={() => handleWeekSelect('Semua')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm ${
                        activeWeek === 'Semua' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Semua
                    </button>
                    {Array.from({ length: scheduleData?.project_info?.total_minggu || 0 }).map((_, i) => {
                      const week = i + 1;
                      return (
                        <button 
                          key={week}
                          onClick={() => handleWeekSelect(week)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border shadow-sm ${
                            activeWeek === week ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          Minggu Ke-{week}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* KAPSUL DATE RANGE FILTER */}
            <div className="flex flex-col ml-1">
              <div className={`flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg shadow-inner overflow-hidden transition-opacity ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input 
                  type="date" 
                  value={startDateFilter} 
                  min={projectBounds.start}
                  max={endDateFilter || projectBounds.end}
                  onChange={e => handleManualDateChange('start', e.target.value)} 
                  disabled={isLoading}
                  className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none px-2.5 py-1.5 cursor-pointer disabled:cursor-not-allowed [color-scheme:light_dark]" 
                  title="Tanggal Mulai"
                />
                <span className="text-slate-400 text-[10px] font-bold px-1.5 bg-slate-100 dark:bg-slate-800/50 py-1.5 border-x border-slate-200 dark:border-slate-700/60">s/d</span>
                <input 
                  type="date" 
                  value={endDateFilter} 
                  min={startDateFilter || projectBounds.start}
                  max={projectBounds.end}
                  onChange={e => handleManualDateChange('end', e.target.value)} 
                  disabled={isLoading}
                  className="bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none px-2.5 py-1.5 cursor-pointer disabled:cursor-not-allowed [color-scheme:light_dark]" 
                  title="Tanggal Akhir"
                />
              </div>
            </div>

            {!isGuest && (
              <>
                <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-1 shrink-0 self-center"></div>
                <button onClick={() => setExportModal({ show: true, type: 'excel' })} disabled={isLoading || isExportingExcel || isExportingPdf || isScheduleEmpty} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} <span className="hidden lg:inline">{isExportingExcel ? 'Memproses...' : 'Export Excel'}</span>
                </button>
                <button onClick={() => setExportModal({ show: true, type: 'pdf' })} disabled={isLoading || isExportingExcel || isExportingPdf || isScheduleEmpty} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                  {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} <span className="hidden lg:inline">{isExportingPdf ? 'Memproses...' : 'Export PDF'}</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-10">
            <button onClick={() => navigate(`/projects/${projectId}/data`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><Info className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span></button>
            <button onClick={() => navigate(`/projects/${projectId}/rab`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span></button>
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap"><TrendingUp className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Kurva S</span></button>
            <button onClick={() => navigate(`/projects/${projectId}/peta-gis`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><Compass className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span></button>
          </div>
        </div>
      </div>

      {(activeWeek !== 'Semua') && (
        <div className="flex flex-wrap gap-2 animate-fade-in -mt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/20 shadow-sm">
            Tampilan: {activeWeek === 'Kustom' ? 'Kustomisasi Tanggal' : `Minggu Ke-${activeWeek}`}
            <button onClick={() => handleWeekSelect('Semua')} className="hover:bg-blue-200 dark:hover:bg-blue-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
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
            Memproses Matrix S-Curve Terkini...
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
                  Anda sudah memiliki data RAB, namun <strong>Time Schedule</strong> belum didistribusikan. Grafik Kurva S dan Parameter Rencana akan tetap terlihat kosong. Silakan atur jadwal di menu <strong>Time Schedule</strong> terlebih dahulu.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 z-10 relative">
            <div id="chart-area" className="lg:col-span-7 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl flex flex-col shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-4 gap-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" /> Grafik Rentang Tanggal
                </h3>
                
                <div className="flex items-center gap-3 text-[10px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-2.5 py-2 rounded-lg shadow-inner">
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> Target Mingguan</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Realisasi Kumulatif</span>
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
                        <XAxis dataKey="shortDate" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                        <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                        <Tooltip content={<CustomTooltip />} />
                        {/* GARIS TARGET RENCANA (Horizontal di sepanjang tanggal_awal s/d tanggal_akhir) */}
                        <Line type="monotone" dataKey="rencanaKumulatif" name="Target Mingguan" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={true} />
                        {/* GARIS REALISASI AKTUAL KUMULATIF */}
                        <Line type="monotone" dataKey="realisasiKumulatif" name="Kumulatif Realisasi" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><PieChart className="w-4 h-4 text-amber-500" /> Total Progress Pekerjaan</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[350px]">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700/80">
                    <tr>
                      <th className="px-3 py-2.5 w-[48%]">Item Pekerjaan</th>
                      <th className="px-2 py-2.5 text-center w-[18%]">Vol/Sat</th>
                      <th className="px-2 py-2.5 text-center w-[14%]">Bobot</th>
                      <th className="px-3 py-2.5 text-right w-[20%]">Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
                    {itemProgressData.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-10 text-slate-500 italic px-4 leading-relaxed">Belum ada realisasi pekerjaan.<br/>Buat <strong>Laporan Harian</strong> terlebih dahulu agar data progress muncul di sini.</td></tr>
                    ) : (
                      itemProgressData.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-3 py-3 text-slate-800 dark:text-slate-200">
                            <div className="truncate font-medium leading-snug" title={item.nama}>{item.nama}</div>
                          </td>
                          <td className="px-2 py-3 text-center text-slate-500 dark:text-slate-400 font-mono text-[10px] truncate">{item.volume} {item.satuan}</td>
                          <td className="px-2 py-3 text-center text-slate-500 dark:text-slate-400 font-mono text-[10px] font-bold">{item.bobot.toFixed(2)}%</td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`text-[10px] font-bold font-mono ${item.progress >= 100 ? 'text-emerald-500' : 'text-amber-600 dark:text-amber-400'}`}>
                                {item.progress.toFixed(1)}%
                              </span>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div className={`${item.progress >= 100 ? 'bg-emerald-500' : 'bg-amber-500'} h-full transition-all duration-500`} style={{ width: `${item.progress}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* TABEL PARAMETER EVALUASI DEVIASI (DATA TERLAPOR SAJA)    */}
          {/* ========================================================= */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Parameter Evaluasi Deviasi (Data Terlapor Saja)
              </h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
              <table className="w-full text-left border-collapse min-w-[900px] relative">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5 text-center w-28">Tanggal</th>
                    <th className="p-3.5 text-center w-20">Periode</th>
                    <th className="p-3.5 text-center w-24">Minggu Ke-</th>
                    <th className="p-3.5 text-right text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">Target Kumulatif (%)</th>
                    <th className="p-3.5 text-right text-emerald-600 dark:text-emerald-400">Realisasi Harian (%)</th>
                    <th className="p-3.5 text-right text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 font-extrabold">Kum. Realisasi (%)</th>
                    <th className="p-3.5 text-center w-24">Deviasi (%)</th>
                    <th className="p-3.5 text-center w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  {deviasiTableData.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-10 text-slate-500 italic">Belum ada laporan harian yang mengisi data progres realisasi.</td></tr>
                  ) : (
                    deviasiTableData.map((row, idx) => {
                      const isDevNegative = row.deviasi !== null && row.deviasi < 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3.5 text-center font-bold text-slate-800 dark:text-white bg-slate-50/50 dark:bg-slate-900/20">
                            {row.dateSlash}
                          </td>
                          <td className="p-3.5 text-center text-[11px] text-slate-500 font-mono">
                            {row.label}
                          </td>
                          <td className="p-3.5 text-center text-[11px] font-bold text-slate-700 dark:text-slate-300 font-sans">
                            {row.mingguKe ? `Minggu ${row.mingguKe}` : '-'}
                          </td>
                          <td className="p-3.5 text-right text-blue-600 dark:text-blue-400 font-bold bg-blue-50/30 dark:bg-blue-950/10">
                            {row.targetKumulatifMingguan !== null ? `${row.targetKumulatifMingguan.toFixed(2)}%` : '-'}
                          </td>
                          <td className="p-3.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                            {row.bobotRealisasi.toFixed(2)}%
                          </td>
                          <td className="p-3.5 text-right text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50/30 dark:bg-emerald-950/10">
                            {row.realisasiKumulatif !== null ? `${row.realisasiKumulatif.toFixed(2)}%` : '-'}
                          </td>
                          <td className={`p-3.5 text-center font-bold ${isDevNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {row.deviasi !== null ? (row.deviasi > 0 ? `+${row.deviasi.toFixed(2)}%` : `${row.deviasi.toFixed(2)}%`) : '-'}
                          </td>
                          <td className="p-3.5 text-center">
                            {row.deviasi === null ? (
                              <span className="text-slate-400 text-[10px]">-</span>
                            ) : isDevNegative ? (
                              <span className="inline-flex items-center justify-center w-24 gap-1 py-1 rounded-md text-[10px] font-sans font-bold bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm">
                                <AlertTriangle className="w-3 h-3" /> Terlambat
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-24 gap-1 py-1 rounded-md text-[10px] font-sans font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <CheckCircle2 className="w-3 h-3" /> Positif
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. MODAL EXPORT PDF/EXCEL                  */}
      {/* ========================================== */}
      {exportModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${exportModal.type === 'excel' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200'}`}>
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Ekspor Laporan Penuh?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Sistem akan memotret grafik di rentang <strong>{formatIndoDate(startDateFilter)} s/d {formatIndoDate(endDateFilter)}</strong> dan menggabungkannya bersama <strong>Tabel Progress</strong> dan <strong>Evaluasi Deviasi</strong> ke dalam format <strong className="uppercase">{exportModal.type}</strong>. 
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