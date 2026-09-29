import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, CalendarDays, Save, Loader2, Target, Calendar, Plus, Trash2 } from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();
  const { id } = useParams();
  const projectId = id;

  useEffect(() => { document.title = "Prisma Group - Jadwal Awal Proyek"; }, []);

  const [projectData, setProjectData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // STATE MINGGUAN DINAMIS (Bisa ditambah lebih dari 1)
  const [weeksForm, setWeeksForm] = useState([
    { id: Date.now(), bulan: '1', minggu_ke: '1', tanggal_mulai: '', tanggal_selesai: '', target_kumulatif: '' }
  ]);

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

  // FUNGSI TAMBAH BARIS MINGGU
  const handleAddWeek = () => {
    const lastWeek = weeksForm[weeksForm.length - 1];
    const nextMingguKe = lastWeek && lastWeek.minggu_ke ? parseInt(lastWeek.minggu_ke) + 1 : weeksForm.length + 1;
    
    setWeeksForm([
      ...weeksForm, 
      { 
        id: Date.now(), 
        bulan: lastWeek ? lastWeek.bulan : '1', 
        minggu_ke: nextMingguKe.toString(), 
        tanggal_mulai: '', 
        tanggal_selesai: '', 
        target_kumulatif: '' 
      }
    ]);
  };

  // FUNGSI HAPUS BARIS MINGGU
  const handleRemoveWeek = (idToRemove) => {
    if (weeksForm.length === 1) return alert("Minimal harus ada 1 minggu target!");
    setWeeksForm(weeksForm.filter(w => w.id !== idToRemove));
  };

  // FUNGSI UBAH DATA DI DALAM BARIS
  const handleWeekChange = (id, field, value) => {
    setWeeksForm(weeksForm.map(w => {
      if (w.id === id) {
        if (field === 'target_kumulatif') {
          const val = value.replace(',', '.');
          if (isNaN(val) && val !== '.') return w;
          return { ...w, [field]: val };
        }
        return { ...w, [field]: value };
      }
      return w;
    }));
  };

  const handleSaveSchedule = async () => {
    // Validasi semua form
    for (let i = 0; i < weeksForm.length; i++) {
      const w = weeksForm[i];
      if (!w.minggu_ke || !w.tanggal_mulai || !w.tanggal_selesai) {
        return alert(`Mohon lengkapi data Minggu Ke, Tanggal Mulai, dan Tanggal Selesai pada baris ke-${i + 1}!`);
      }
      const targetVal = parseFloat(w.target_kumulatif) || 0;
      if (targetVal <= 0) {
        return alert(`Target Kumulatif pada baris ke-${i + 1} harus diisi dan lebih dari 0!`);
      }
    }

    setIsSaving(true);
    try {
      const payloadWeeks = weeksForm.map(w => ({
        minggu_ke: parseInt(w.minggu_ke),
        bulan: parseInt(w.bulan) || null,
        tanggal_awal: w.tanggal_mulai,
        tanggal_akhir: w.tanggal_selesai,
        target_kumulatif: parseFloat(w.target_kumulatif) || 0,
      }));

      const payload = {
        full_sync: false,
        weeks: payloadWeeks
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

      {/* INFORMASI PROYEK */}
      <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Proyek Aktif</label>
          <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-inner">
             <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{projectData?.nama_proyek || 'Memuat Data...'}</p>
          </div>
        </div>
      </div>

      {/* RENDER DYNAMIC WEEKS FORM */}
      <div className="space-y-4">
        {weeksForm.map((week, index) => (
          <div key={week.id} className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative animate-fade-in">
            
            {/* Tombol Hapus Baris (Tampil jika baris > 1) */}
            {weeksForm.length > 1 && (
              <button 
                onClick={() => handleRemoveWeek(week.id)}
                className="absolute top-4 right-4 p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-500 rounded-lg transition-colors border border-rose-200 dark:border-rose-500/30"
                title="Hapus Minggu Ini"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <label className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-4 h-4" /> Rentang Waktu (Baris {index + 1})</label>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan Ke-</label>
                      <input type="number" min="1" value={week.bulan} onChange={(e) => handleWeekChange(week.id, 'bulan', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Minggu Ke-</label>
                      <input type="number" min="1" value={week.minggu_ke} onChange={(e) => handleWeekChange(week.id, 'minggu_ke', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tgl Mulai <span className="text-rose-500">*</span></label>
                      <input type="date" value={week.tanggal_mulai} onChange={(e) => handleWeekChange(week.id, 'tanggal_mulai', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tgl Akhir <span className="text-rose-500">*</span></label>
                      <input type="date" value={week.tanggal_selesai} onChange={(e) => handleWeekChange(week.id, 'tanggal_selesai', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                    </div>
                 </div>
              </div>

              <div className="space-y-4 md:border-l md:border-slate-100 md:dark:border-slate-700/60 md:pl-6">
                 <label className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2"><Target className="w-4 h-4" /> Target S-Curve</label>
                 <div className="space-y-2 pt-2">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Target Kumulatif (Plan) <span className="text-rose-500">*</span></label>
                   <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="0.00"
                        value={week.target_kumulatif}
                        onChange={(e) => handleWeekChange(week.id, 'target_kumulatif', e.target.value)}
                        className="w-32 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-500/30 text-center font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-emerald-700 dark:text-emerald-400 py-3 shadow-inner"
                      />
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-500 text-2xl">%</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        ))}

        {/* TOMBOL TAMBAH MINGGU */}
        <button 
          onClick={handleAddWeek}
          className="w-full py-4 border-2 border-dashed border-blue-300 hover:border-blue-500 dark:border-blue-700 dark:hover:border-blue-500 rounded-2xl bg-blue-50/50 hover:bg-blue-100 dark:bg-blue-900/10 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex justify-center items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Tambah Minggu Berikutnya
        </button>
      </div>

      <div className="pt-4 sticky bottom-6 z-40">
        <button onClick={handleSaveSchedule} disabled={isSaving} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl disabled:opacity-50 transition-all active:scale-95 text-sm">
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin shrink-0" /> : <Save className="w-5 h-5 shrink-0" />} Simpan Total {weeksForm.length} Minggu & Buka Matriks
        </button>
      </div>
    </div>
  );
}