import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import api from '../../../api';
import { 
  TrendingUp, ArrowLeft, Info, FileSpreadsheet, Compass, 
  PieChart, Download, CheckCircle2, AlertTriangle, Loader2, Filter, Clock, ChevronDown
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function KurvaS({ selectedProject }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const project = selectedProject || location.state || { id: id, nama_proyek: 'Memuat Data...'};
  const projectId = project.id || id;

  const [isLoading, setIsLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState(null);
  const [viewMode, setViewMode] = useState('mingguan'); 
  
  const [userRole, setUserRole] = useState('Tamu');
  const [chartData, setChartData] = useState([]);
  const [itemProgressData, setItemProgressData] = useState([]);

  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportModal, setExportModal] = useState({ show: false, type: '' });

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  useEffect(() => {
    document.title = "PrismaGroup - Kurva S";
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const isGuest = userRole === 'Tamu';

  useEffect(() => {
    function handleClickOutside(event) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/projects/${projectId}/schedules`);
        setScheduleData(res.data.data);
      } catch (error) {
        console.error("Gagal menarik data Kurva S:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) fetchSchedule();
  }, [projectId]);

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
      const canvas = await html2canvas(chartElement, { scale: 1, backgroundColor: '#ffffff' });
      const base64Image = canvas.toDataURL('image/png');

      const filteredChartData = chartData.filter(row => !row.isFuture);

      const response = await api.post(`/projects/${id}/export-kurva/${type}`, {
        chart_image: base64Image,
        item_progress: itemProgressData,
        chart_data: filteredChartData, 
        view_mode: viewMode
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kurva_S_${type === 'excel' ? 'Lengkap.xlsx' : 'Lengkap.pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(`Gagal mengunduh ${type}. Internal Server Error (500).`);
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

    const progressList = allItems.map(item => {
      const baseBobot = grandTotalRAB > 0 ? (Number(item.total_harga || 0) / grandTotalRAB) * 100 : 0;
      const itemRealisasi = (scheduleData.realizations || [])?.filter(r => r.rab_item_id === item.id)?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;
      const progressPercent = baseBobot > 0 ? (itemRealisasi / baseBobot) * 100 : 0;

      return {
        id: item.id,
        nama: item.uraian_pekerjaan,
        volume: item.volume || 0,
        satuan: item.satuan || '-',
        bobot: baseBobot,
        progress: Math.min(progressPercent, 100) 
      };
    });
    setItemProgressData(progressList);

    const startDate = scheduleData.project_info?.tanggal_mulai ? new Date(scheduleData.project_info.tanggal_mulai) : new Date();
    startDate.setHours(0,0,0,0);
    const endDate = scheduleData.project_info?.tanggal_selesai ? new Date(scheduleData.project_info.tanggal_selesai) : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); 
    endDate.setHours(0,0,0,0);

    let plannedTotalHari = Math.floor((endDate - startDate) / (1000*3600*24)) + 1;
    if (isNaN(plannedTotalHari) || plannedTotalHari <= 0) plannedTotalHari = 1;

    const dailyPlans = {};
    let maxPlannedDay = 0;
    
    (scheduleData.schedules || []).forEach(s => {
      const m = parseInt(s.minggu_ke);
      const bobotHarian = parseFloat(s.bobot_rencana) / 7;
      const startDay = (m - 1) * 7 + 1;
      const endDay = m * 7;
      if (endDay > maxPlannedDay) maxPlannedDay = endDay;
      
      for (let i = startDay; i <= endDay; i++) {
        dailyPlans[i] = (dailyPlans[i] || 0) + bobotHarian;
      }
    });

    const dailyRealisasi = {};
    let maxReportedDay = 0;
    (scheduleData.realizations || []).forEach(r => {
      const rDate = new Date(r.tgl_input);
      if (isNaN(rDate.getTime())) return;
      rDate.setHours(0,0,0,0);
      const dayNum = Math.floor((rDate - startDate) / (1000*3600*24)) + 1;
      
      if (dayNum > maxReportedDay) maxReportedDay = dayNum;
      dailyRealisasi[dayNum] = (dailyRealisasi[dayNum] || 0) + parseFloat(r.bobot_realisasi);
    });

    const actualTotalHari = Math.max(plannedTotalHari, maxPlannedDay, maxReportedDay);

    const today = new Date();
    today.setHours(0,0,0,0);
    const currentProjectDay = Math.floor((today - startDate) / (1000 * 3600 * 24)) + 1;

    const buckets = [];
    if (viewMode === 'harian') {
      for (let i = 1; i <= actualTotalHari; i++) buckets.push({ label: `H-${i.toString().padStart(2,'0')}`, dayStart: i, dayEnd: i });
    } else if (viewMode === 'bulanan') {
      const totalBulan = Math.ceil(actualTotalHari / 30);
      for (let i = 1; i <= totalBulan; i++) buckets.push({ label: `B-${i.toString().padStart(2,'0')}`, dayStart: (i-1)*30 + 1, dayEnd: i*30 });
    } else { 
      const totalMinggu = Math.ceil(actualTotalHari / 7);
      for (let i = 1; i <= totalMinggu; i++) buckets.push({ label: `M-${i.toString().padStart(2,'0')}`, dayStart: (i-1)*7 + 1, dayEnd: i*7 });
    }

    let cumRencana = 0;
    let cumRealisasi = 0;
    const sCurveArray = [];

    for (const b of buckets) {
      let bucketRencana = 0;
      let bucketRealisasi = 0;

      for (let i = b.dayStart; i <= b.dayEnd; i++) {
        bucketRencana += (dailyPlans[i] || 0);
        bucketRealisasi += (dailyRealisasi[i] || 0);
      }

      const isPlanEmpty = maxPlannedDay === 0 ? true : b.dayStart > maxPlannedDay;
      const isActEmpty = maxReportedDay === 0 ? true : b.dayStart > maxReportedDay;
      const isFuture = b.dayStart > currentProjectDay && b.dayStart > maxReportedDay;

      const dataPoint = { label: b.label, isPlanEmpty, isActEmpty, isFuture };

      if (!isPlanEmpty) {
        cumRencana += bucketRencana;
        dataPoint.bobotRencana = bucketRencana;
        dataPoint.rencanaKumulatif = Number(cumRencana.toFixed(2));
      }

      if (!isActEmpty) {
        cumRealisasi += bucketRealisasi;
        dataPoint.bobotRealisasi = bucketRealisasi;
        dataPoint.realisasiKumulatif = Number(cumRealisasi.toFixed(2));
        dataPoint.deviasi = Number((cumRealisasi - cumRencana).toFixed(2));
      }

      sCurveArray.push(dataPoint);
    }

    setChartData(sCurveArray);

  }, [scheduleData, viewMode]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-xl text-xs z-50">
          <p className="font-extrabold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">Periode: {label}</p>
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
  const titlePeriode = viewMode === 'harian' ? 'Harian' : viewMode === 'bulanan' ? 'Bulanan' : 'Mingguan';

  return (
    <div className="w-full space-y-5 pb-20 relative">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* ========================================== */}
      {/* 1. HEADER NAVIGASI (Selalu Tampil)           */}
      {/* ========================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <Link to={`/projects/${projectId}/data`} state={project} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5">
              <span>Monitoring Kurva S</span>
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{project.nama_proyek || project.namaProyek}</span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(project.kategori)}`}>
                {project.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-visible z-30">
            
            <div className="relative" ref={filterMenuRef}>
              <button 
                onClick={() => setShowFilterMenu(!showFilterMenu)} 
                className={`flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border ${showFilterMenu ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/80'} shadow-sm px-3 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all`}
              >
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
              </button>

              {showFilterMenu && (
                <div className="absolute top-full mt-2 right-0 lg:left-0 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 animate-fade-in">
                  <h4 className="text-[10px] uppercase font-extrabold text-slate-400 dark:text-slate-500 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">Tampilkan Total Keseluruhan:</h4>
                  <div className="flex flex-wrap gap-2">
                    {['harian', 'mingguan', 'bulanan'].map((mode) => {
                      const isActive = viewMode === mode;
                      return (
                        <button 
                          key={mode}
                          onClick={() => { setViewMode(mode); setShowFilterMenu(false); }}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm border ${isActive ? 'bg-blue-500 text-white border-blue-600' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {!isGuest && (
              <>
                <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-1 shrink-0"></div>
                <button onClick={() => setExportModal({ show: true, type: 'excel' })} disabled={isExportingExcel || isExportingPdf} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 whitespace-nowrap">
                  {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} <span className="hidden lg:inline">{isExportingExcel ? 'Memproses...' : 'Export Excel'}</span>
                </button>
                <button onClick={() => setExportModal({ show: true, type: 'pdf' })} disabled={isExportingExcel || isExportingPdf} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 whitespace-nowrap">
                  {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} <span className="hidden lg:inline">{isExportingPdf ? 'Memproses...' : 'Export PDF'}</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center w-full lg:w-auto justify-between gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-10">
            <button onClick={() => navigate(`/projects/${projectId}/data`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all"><Info className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span></button>
            <button onClick={() => navigate(`/projects/${projectId}/rab`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all"><FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span></button>
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default"><TrendingUp className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Kurva S</span></button>
            <button onClick={() => navigate(`/projects/${projectId}/peta-gis`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all"><Compass className="w-3.5 h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span></button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. KONDISI LOADING VS KONTEN UTAMA           */}
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
                  Anda sudah memiliki data RAB, namun <strong>Time Schedule</strong> belum didistribusikan. Grafik Kurva S dan Parameter Rencana akan tetap terlihat kosong. Silakan atur jadwal di menu <strong>Time Schedule</strong> terlebih dahulu agar garis rencana terbentuk.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 z-10 relative">
            <div id="chart-area" className="lg:col-span-7 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl flex flex-col shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 mb-4 gap-3">
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Grafik Kumulatif ({titlePeriode})</h3>
                
                <div className="flex items-center gap-3 text-[10px] bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-2.5 py-2 rounded-lg shadow-inner">
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold"><span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span> Rencana (Plan)</span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Realisasi (Act)</span>
                </div>
              </div>
              
              <div className="w-full h-[350px] overflow-x-auto custom-scrollbar">
                <div className={`h-full ${viewMode === 'harian' ? 'min-w-[1500px]' : 'min-w-[500px]'}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} className="dark:stroke-slate-700" />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" tickLine={false} axisLine={false} className="dark:stroke-slate-400" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="rencanaKumulatif" name="Kumulatif Rencana" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} />
                      <Line type="monotone" dataKey="realisasiKumulatif" name="Kumulatif Realisasi" stroke="#10b981" strokeWidth={3} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} />
                    </LineChart>
                  </ResponsiveContainer>
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
                      <tr><td colSpan="4" className="text-center py-8 text-slate-500 italic">RAB belum dibuat.</td></tr>
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

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-amber-500" /> Parameter Evaluasi Deviasi {titlePeriode}
              </h3>
            </div>
            <div className={`overflow-x-auto custom-scrollbar ${viewMode === 'harian' ? 'max-h-[500px]' : ''}`}>
              <table className="w-full text-left border-collapse min-w-[800px] relative">
                <thead className="sticky top-0 z-20 shadow-sm">
                  <tr className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-3 text-center w-20">Periode</th>
                    <th className="p-3 text-right text-blue-600 dark:text-blue-400">Rencana (%)</th>
                    <th className="p-3 text-right text-emerald-600 dark:text-emerald-400">Realisasi (%)</th>
                    <th className="p-3 text-right bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold">Kum. Rencana</th>
                    <th className="p-3 text-right bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold">Kum. Realisasi</th>
                    <th className="p-3 text-center w-24">Deviasi (%)</th>
                    <th className="p-3 text-center w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300 font-mono">
                  {chartData.filter(row => !row.isFuture).map((row, idx) => {
                    const isDevNegative = row.deviasi < 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 text-center font-bold text-slate-800 dark:text-white bg-slate-50/50 dark:bg-slate-900/20">{row.label}</td>
                        
                        <td className="p-3 text-right">{row.isPlanEmpty ? '-' : row.bobotRencana.toFixed(2)}</td>
                        <td className="p-3 text-right">{row.isActEmpty ? '-' : row.bobotRealisasi.toFixed(2)}</td>
                        
                        <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/30 dark:bg-blue-950/10">
                          {row.isPlanEmpty ? '-' : row.rencanaKumulatif.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/30 dark:bg-emerald-950/10">
                            {row.isActEmpty ? '-' : row.realisasiKumulatif.toFixed(2)}
                        </td>
                        
                        <td className={`p-3 text-center font-bold ${row.isActEmpty ? 'text-slate-400' : isDevNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {row.isActEmpty ? '-' : (row.deviasi > 0 ? `+${row.deviasi.toFixed(2)}` : row.deviasi.toFixed(2))}
                        </td>
                        
                        <td className="p-3 text-center">
                          {row.isPlanEmpty && row.isActEmpty ? (
                            <span className="text-slate-400 flex justify-center items-center gap-1 italic text-[10px]"><Clock className="w-3 h-3"/> Belum Berjalan</span>
                          ) : row.isActEmpty && !row.isPlanEmpty ? (
                            <span className="text-amber-500 dark:text-amber-400 flex justify-center items-center gap-1 italic text-[10px]"><Clock className="w-3 h-3"/> Menunggu Lap.</span>
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
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. MODAL EXPORT (Di Luar Konten Utama)       */}
      {/* ========================================== */}
      {exportModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${exportModal.type === 'excel' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200'}`}>
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Ekspor Laporan Penuh?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Sistem akan memotret grafik dan menggabungkannya bersama <strong>Tabel Progress</strong> dan <strong>Evaluasi Deviasi</strong> ke dalam format <strong className="uppercase">{exportModal.type}</strong>. 
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