import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import api from '../../api.js';
import { 
  Building2, Activity, AlertTriangle, DollarSign, 
  FileText, ArrowRight, TrendingUp, MapPin, 
  CheckCircle2, Calendar, Loader2, Clock, Plus, CalendarDays, ListTodo
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

export default function DashboardUtama() {
  const navigate = useNavigate();
  
  // --- STATE MANAJEMEN ---
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState({ totalProyek: 0, nilaiKontrak: '0', rataDeviasi: '0.00', proyekKritis: 0 });

  useEffect(() => {
      document.title = "Prisma Group - Dashboard";
    }, []);
  
  const [chartProgressData, setChartProgressData] = useState([]);
  const [proyekAktif, setProyekAktif] = useState([]);
  const [laporanTerbaru, setLaporanTerbaru] = useState([]);

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

  // BEDAH HAK AKSES BERDASARKAN ROLE:
  // 1. Hak Membuat Data (Hanya Admin, TL, Pengawas)
  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  
  // 2. Hak Melihat Keuangan / Pagu (Semua kecuali Pengawas & Tamu)
  const canViewFinance = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  
  // 3. Hak Melihat Informasi Sensitif / Negatif (Deviasi & Kritis) (Semua kecuali Tamu)
  const isGuest = userRole === 'Tamu';

  // --- FETCH & KALKULASI DATA REAL-TIME ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projRes, repRes] = await Promise.all([
          api.get('/projects'),
          api.get('/daily-reports')
        ]);

        const projects = projRes.data?.data || projRes.data || [];
        const reports = repRes.data?.data || [];

        // 1. Hitung KPI Dasar
        const totalProyek = projects.length;
        const nilaiKontrak = projects.reduce((sum, p) => sum + Number(p.nilai_kontrak || 0), 0);

        // 2. Susun 5 Laporan Terbaru
        const sortedReports = reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        const formattedReports = sortedReports.map(r => ({
          id: r.id,
          pengawas: r.pengawas,
          proyek: r.project?.nama_proyek || 'Proyek Dihapus',
          tanggal: r.tanggal,
          jumlahKegiatan: r.activities?.length || 0, // Menggunakan Jumlah Kegiatan sebagai ganti Cuaca
          status: r.status === 'approved' ? 'Verified' : 'Pending',
          originalData: r
        }));

        // 3. Analisis Mendalam 5 Proyek Terbaru untuk Grafik & Tabel
        const topProjects = projects.slice(0, 5);
        const schedulePromises = topProjects.map(p => api.get(`/projects/${p.id}/schedules`).catch(() => null));
        const scheduleResponses = await Promise.all(schedulePromises);

        let totalDeviasiSemua = 0;
        let countKritis = 0;
        const chartArr = [];
        const tableArr = [];

        topProjects.forEach((p, index) => {
          const sRes = scheduleResponses[index];
          if (sRes && sRes.data?.data) {
            const sData = sRes.data.data;
            
            const totalBobotRencana = sData.schedules?.reduce((sum, s) => sum + parseFloat(s.bobot_rencana), 0) || 0;
            const totalBobotRealisasi = sData.realizations?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;
            
            const deviasi = totalBobotRealisasi - totalBobotRencana;
            totalDeviasiSemua += deviasi;

            let status = 'On Track';
            if (deviasi < -5) { status = 'Kritis'; countKritis++; }
            else if (deviasi < 0) { status = 'Terlambat'; }
            if (totalBobotRencana === 0) status = 'Belum Mulai';

            chartArr.push({
              name: p.nama_proyek,
              plan: Number(totalBobotRencana.toFixed(2)),
              actual: Number(totalBobotRealisasi.toFixed(2)),
              deviasi: Number(deviasi.toFixed(2))
            });

            tableArr.push({
              id: p.id,
              nama: p.nama_proyek,
              progress: Number(totalBobotRealisasi.toFixed(2)),
              deviasi: deviasi > 0 ? `+${deviasi.toFixed(2)}` : deviasi.toFixed(2),
              status: status,
              numDev: deviasi
            });
          } else {
            chartArr.push({ name: p.nama_proyek, plan: 0, actual: 0, deviasi: 0 });
            tableArr.push({ id: p.id, nama: p.nama_proyek, progress: 0, deviasi: '0.00', status: 'Belum Mulai', numDev: 0 });
          }
        });

        // 4. Hitung Rata-Rata Deviasi Portofolio
        const rataDeviasi = topProjects.length > 0 ? (totalDeviasiSemua / topProjects.length) : 0;

        setKpiData({
          totalProyek,
          nilaiKontrak: new Intl.NumberFormat('id-ID').format(nilaiKontrak),
          rataDeviasi: rataDeviasi > 0 ? `+${rataDeviasi.toFixed(2)}` : rataDeviasi.toFixed(2),
          proyekKritis: countKritis
        });
        
        setChartProgressData(chartArr);
        setProyekAktif(tableArr);
        setLaporanTerbaru(formattedReports);

      } catch(error) {
        console.error("Gagal load data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-slate-800 dark:text-white mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-blue-600 dark:text-blue-400">Target Rencana: <span className="font-mono font-bold">{payload[0].value}%</span></p>
            <p className="text-emerald-600 dark:text-emerald-400">Realisasi Aktual: <span className="font-mono font-bold">{payload[1].value}%</span></p>
            
            {/* SEMBUNYIKAN INFO DEVIASI (BISA NEGATIF) DARI TAMU */}
            {!isGuest && (
              <p className={`pt-1 border-t border-slate-100 dark:border-slate-700/50 mt-1 ${payload[0].payload.deviasi < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                Deviasi Progres: <span className="font-mono font-bold">{payload[0].payload.deviasi > 0 ? '+' : ''}{payload[0].payload.deviasi}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 w-full h-[60vh] bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Menyinkronkan Data Server...</p>
        <p className="text-xs text-slate-400 mt-1">Mengalkulasi progress fisik dan status proyek.</p>
      </div>
    );
  }

  // Dinamis grid class untuk KPI Cards berdasarkan akses
  const visibleKpiCount = 1 + (canViewFinance ? 1 : 0) + (!isGuest ? 2 : 0);
  const gridClass = visibleKpiCount === 4 ? 'lg:grid-cols-4' : visibleKpiCount === 3 ? 'lg:grid-cols-3' : visibleKpiCount === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1';

  return (
    <div className="w-full space-y-6 pb-20 relative">
      
      {/* --- HEADER DASHBOARD --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
       <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-wide">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ringkasan portofolio pengawasan, progress fisik, dan laporan harian</p>
        </div>
        
        {/* TAMPILKAN TOMBOL ACTION HANYA JIKA ROLE PUNYA AKSES */}
        {canCreateData && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/schedules/input')} 
              className="flex-1 sm:flex-none px-4 py-2.5 md:py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <CalendarDays className="w-4 h-4 text-blue-500" /> <span className="hidden sm:inline">Buat</span> Schedule
            </button>
            <button 
              onClick={() => navigate('/laporan/input')} 
              className="flex-1 sm:flex-none px-4 py-2.5 md:py-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Buat Laporan
            </button>
          </div>
        )}
      </div>

      {/* --- KPI CARDS (Dinamis sesuai hak akses) --- */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridClass} gap-4`}>
        
        {/* Card 1: Total Proyek (Semua Bisa Lihat) */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
            <Building2 className="w-16 h-16 text-amber-500" />
          </div>
          <div className="relative z-10">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Proyek Di Kelola</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{kpiData.totalProyek}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">Data Aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Nilai Kontrak (Sembunyikan dari Pengawas & Tamu) */}
        {canViewFinance && (
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
              <DollarSign className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Pagu Kontrak</span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Rp</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-white truncate" title={`Rp ${kpiData.nilaiKontrak}`}>{kpiData.nilaiKontrak}</span>
              </div>
            </div>
          </div>
        )}

        {/* Card 3: Rata-rata Deviasi (Sembunyikan dari Tamu) */}
        {!isGuest && (
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-colors animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
              <Activity className="w-16 h-16 text-blue-500" />
            </div>
            <div className="relative z-10">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Deviasi Rata-rata</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${parseFloat(kpiData.rataDeviasi) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {kpiData.rataDeviasi}%
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${parseFloat(kpiData.rataDeviasi) < 0 ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                  {parseFloat(kpiData.rataDeviasi) < 0 ? 'Defisit' : 'Surplus'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Card 4: Proyek Kritis (Sembunyikan dari Tamu) */}
        {!isGuest && (
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 rounded-2xl shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-colors animate-fade-in">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
              <AlertTriangle className="w-16 h-16 text-rose-500" />
            </div>
            <div className="relative z-10">
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Proyek Kritis (Dev &lt; -5%)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold ${kpiData.proyekKritis > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {kpiData.proyekKritis}
                </span>
                {kpiData.proyekKritis > 0 ? (
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-500/20">Perhatian</span>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/20">Aman</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MAIN CONTENT AREA (Chart & Lists) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KIRI: GRAFIK PROGRESS PORTOFOLIO */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" /> Progress Rencana vs Realisasi
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">Perbandingan deviasi pada proyek-proyek terbaru yang dikerjakan.</p>
            </div>
            <button onClick={() => navigate('/projects')} className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold flex items-center gap-1 shrink-0 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors border border-blue-200 dark:border-blue-500/20">
              Semua Proyek <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="p-2 md:p-5 flex-1 min-h-[300px] w-full overflow-x-auto hide-scrollbar">
            <div className="min-w-[500px] h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} className="dark:stroke-slate-700/50" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value} className="dark:stroke-slate-400" />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} className="dark:stroke-slate-400" />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#e2e8f0', opacity: 0.2}} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="plan" name="Plan (Rencana)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="actual" name="Actual (Realisasi)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {chartProgressData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.deviasi < 0 ? (isGuest ? '#10b981' : '#f43f5e') : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* KANAN: FEED LAPORAN HARIAN TERKINI */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Laporan Harian Terkini
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] lg:max-h-[350px]">
            {laporanTerbaru.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic text-xs">Belum ada laporan lapangan yang dibuat.</div>
            ) : (
              laporanTerbaru.map((lap) => (
                <div key={lap.id} className="p-4 border-b border-slate-100 dark:border-slate-700/40 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group" onClick={() => navigate(`/laporan/${lap.id}`, { state: { laporan: lap.originalData } })}>
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate pr-2">{lap.pengawas}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 uppercase tracking-wider ${lap.status === 'Verified' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}>
                      {lap.status === 'Verified' ? <CheckCircle2 className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                      {lap.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-2 font-medium">
                    <MapPin className="w-3 h-3 shrink-0 text-rose-500" /> <span className="truncate">{lap.proyek}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 dark:text-slate-500">
                    <span className="flex items-center gap-1 font-medium"><Calendar className="w-3 h-3 text-blue-500" /> {lap.tanggal}</span>
                    
                    {/* INFO JUMLAH KEGIATAN */}
                    <span className="bg-slate-100 dark:bg-slate-900/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-semibold flex items-center gap-1">
                      <ListTodo className="w-3 h-3 text-amber-500" /> {lap.jumlahKegiatan} Kegiatan
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 text-center">
            <button onClick={() => navigate('/laporan')} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              Lihat Semua Laporan
            </button>
          </div>
        </div>

      </div>

      {/* --- TABEL STATUS PROYEK AKTIF --- */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" /> Rincian Parameter Proyek Aktif
          </h2>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
            Top {proyekAktif.length} Data Terbaru
          </span>
        </div>

        {/* Tampilan Mobile: Kartu Bersusun */}
        <div className="block sm:hidden p-4 space-y-4">
          {proyekAktif.length === 0 ? <p className="text-center text-xs text-slate-500 italic py-4">Belum ada proyek.</p> : proyekAktif.map((proyek) => {
            const isKritis = !isGuest && (proyek.status === 'Kritis' || proyek.status === 'Terlambat');
            const isBelumMulai = proyek.status === 'Belum Mulai';
            return (
              <div key={proyek.id} onClick={() => navigate(`/projects/${proyek.id}/data`)} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col gap-3 cursor-pointer shadow-sm hover:border-amber-500/30 transition-colors">
                <div>
                  <div className="text-[10px] font-mono font-bold text-amber-500 mb-1">#{proyek.id}</div>
                  <div className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{proyek.nama}</div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700/50 pt-2.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Progress</span>
                    <span className={`font-mono font-bold ${isBelumMulai ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{proyek.progress}%</span>
                  </div>
                  
                  {/* SEMBUNYIKAN DEVIASI DARI TAMU */}
                  {!isGuest && (
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-0.5">Deviasi</span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded border ${isBelumMulai ? 'text-slate-400 border-slate-200 dark:border-slate-700' : isKritis ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-500/30' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-slate-800 dark:text-amber-400 dark:border-amber-500/30'}`}>
                        {proyek.deviasi}%
                      </span>
                    </div>
                  )}

                  {/* SEMBUNYIKAN STATUS DARI TAMU */}
                  {!isGuest && (
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 font-bold">Status</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${isBelumMulai ? 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600' : isKritis ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'}`}>
                        {isKritis ? <AlertTriangle className="w-3 h-3" /> : isBelumMulai ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {proyek.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tampilan Desktop: Tabel Standard */}
        <div className="hidden sm:block overflow-x-auto">
          <table className={`w-full text-left border-collapse table-fixed ${isGuest ? 'min-w-[500px]' : 'min-w-[800px]'}`}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className={`p-4 ${isGuest ? 'w-[60%]' : 'w-[40%]'}`}>Nama Proyek</th>
                <th className="p-4 text-center w-[20%]">Progress (Actual)</th>
                
                {/* SEMBUNYIKAN KOLOM DEVIASI & STATUS DARI TAMU */}
                {!isGuest && (
                  <>
                    <th className="p-4 text-center w-[20%]">Deviasi Akhir</th>
                    <th className="p-4 text-center w-[20%]">Status Evaluasi</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs text-slate-700 dark:text-slate-300">
              {proyekAktif.length === 0 ? <tr><td colSpan={isGuest ? 2 : 4} className="text-center py-8 text-slate-500 italic font-medium">Belum ada proyek aktif.</td></tr> : proyekAktif.map((proyek) => {
                const isKritis = !isGuest && (proyek.status === 'Kritis' || proyek.status === 'Terlambat');
                const isBelumMulai = proyek.status === 'Belum Mulai';
                return (
                  <tr key={proyek.id} onClick={() => navigate(`/projects/${proyek.id}/data`)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group">
                    <td className="p-4 font-bold text-slate-800 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" title={proyek.nama}>
                      <span className="text-amber-500 mr-2 text-[10px] font-mono">#{proyek.id}</span>
                      {proyek.nama}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-mono font-bold ${isBelumMulai ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{proyek.progress}%</span>
                      </div>
                    </td>

                    {/* SEMBUNYIKAN ISI DEVIASI & STATUS DARI TAMU */}
                    {!isGuest && (
                      <>
                        <td className="p-4 text-center">
                          <span className={`font-mono font-bold px-2 py-1 rounded bg-slate-50 dark:bg-slate-900 border ${
                            isBelumMulai ? 'text-slate-400 border-slate-200 dark:border-slate-700' :
                            isKritis ? 'text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-500/30' : 'text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-500/30'
                          }`}>
                            {proyek.deviasi}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold border uppercase tracking-wider ${
                            isBelumMulai ? 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600' :
                            isKritis ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                          }`}>
                            {isBelumMulai ? <Clock className="w-3.5 h-3.5"/> : isKritis ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {proyek.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}