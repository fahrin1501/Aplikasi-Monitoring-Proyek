import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, CalendarDays, Save, Loader2, Target, Calendar } from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();
  const { id } = useParams();
  const projectId = id;

  useEffect(() => { document.title = "Prisma Group - Jadwal Awal Proyek"; }, []);

  const [projectData, setProjectData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [periodForm, setPeriodForm] = useState({
    bulan: '1', minggu_ke: '1', tanggal_mulai: '', tanggal_selesai: ''
  });
  const [targetKumulatif, setTargetKumulatif] = useState('');

  useEffect(() => {
    if (!projectId) { navigate('/projects'); return; }
    const fetchTimeSchedule = async () => {
      setIsLoadingSchedule(true);
      try {
        const projRes = await api.get(`/projects/${projectId}`);
        setProjectData(projRes.data?.data || projRes.data);
      } catch (error) {
        alert("CRASH SERVER: " + (error.response?.data?.message || error.message));
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    fetchTimeSchedule();
  }, [projectId, navigate]);

  const handlePeriodChange = (e) => setPeriodForm({ ...periodForm, [e.target.name]: e.target.value });

  const handleSaveSchedule = async () => {
    if (!periodForm.bulan || !periodForm.minggu_ke || !periodForm.tanggal_mulai || !periodForm.tanggal_selesai) {
      return alert("Mohon lengkapi data Bulan, Minggu Ke-, serta Tanggal Mulai & Selesai terlebih dahulu!");
    }
    
    const targetVal = parseFloat(targetKumulatif.replace(',', '.')) || 0;
    if (targetVal <= 0) return alert("Target Kumulatif (Plan) harus diisi dan lebih dari 0!");

    setIsSaving(true);
    try {
      const payload = {
        full_sync: false,
        weeks: [{
            minggu_ke: parseInt(periodForm.minggu_ke),
            bulan: parseInt(periodForm.bulan) || null,
            tanggal_awal: periodForm.tanggal_mulai,
            tanggal_akhir: periodForm.tanggal_selesai,
            target_kumulatif: targetVal,
        }]
      };

      await api.post(`/projects/${projectId}/schedules`, payload);
      alert(`Jadwal Awal Proyek Berhasil Disimpan! Matriks Terbuka.`);
      navigate(`/schedules/${projectId}/data`); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule. Pastikan koneksi server aman.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSchedule || !projectData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in backdrop-blur-sm">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Menyiapkan wizard jadwal proyek...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 relative animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2"><CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-blue-500 shrink-0 hidden sm:block" /> <span>Buat Jadwal Pertama</span></h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tetapkan rentang tanggal dan target mingguan untuk mengawali kalender S-Curve.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/60 p-5 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-6 backdrop-blur-sm">
        <div className="space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Proyek Aktif</label>
          <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-inner">
             <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{projectData?.nama_proyek || 'Memuat Data...'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
             <label className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4" /> 1. Rentang Waktu</label>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan Ke-</label>
                  <input type="number" min="1" name="bulan" value={periodForm.bulan} onChange={handlePeriodChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Minggu Ke-</label>
                  <input type="number" min="1" name="minggu_ke" value={periodForm.minggu_ke} onChange={handlePeriodChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Mulai <span className="text-rose-500">*</span></label>
                  <input type="date" name="tanggal_mulai" value={periodForm.tanggal_mulai} onChange={handlePeriodChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Akhir <span className="text-rose-500">*</span></label>
                  <input type="date" name="tanggal_selesai" value={periodForm.tanggal_selesai} onChange={handlePeriodChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                </div>
             </div>
          </div>

          <div className="space-y-4 md:border-l md:border-slate-100 md:dark:border-slate-700/60 md:pl-6">
             <label className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2"><Target className="w-4 h-4" /> 2. Target S-Curve</label>
             <div className="space-y-2 pt-2">
               <label className="text-[10px] font-bold text-slate-500 uppercase">Target Kumulatif (Plan) Minggu {periodForm.minggu_ke} <span className="text-rose-500">*</span></label>
               <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Contoh: 5.50"
                    value={targetKumulatif}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      if (isNaN(val) && val !== '.') return;
                      setTargetKumulatif(val);
                    }}
                    className="w-32 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-500/30 text-center font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-400 py-3 shadow-inner"
                  />
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-500 text-2xl">%</span>
               </div>
               <p className="text-xs text-slate-400 mt-2 italic">Persentase ini akan menjadi patokan dasar evaluasi deviasi laporan harian untuk minggu tersebut.</p>
             </div>

             <div className="pt-6">
               <button onClick={handleSaveSchedule} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95">
                 {isSaving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />} Buka Matriks Jadwal
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}