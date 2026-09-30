import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../api';
import { Save, Loader2, Target, Calendar, Plus, Trash2, CalendarDays } from 'lucide-react';

export default function AddScheduleModal({ projectId, projectData, projectBounds, onSuccess }) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  const [weeksForm, setWeeksForm] = useState([
    { id: Date.now(), bulan: '1', minggu_ke: '1', tanggal_mulai: '', tanggal_selesai: '', target_kumulatif: '' }
  ]);

  // Ekstrak batas absolut dari database untuk membatasi input kalender
  const projectStart = projectBounds?.start || '';
  const projectEnd = projectBounds?.end || '';

  const handleAddWeek = () => {
    const lastWeek = weeksForm[weeksForm.length - 1];
    const nextMingguKe = lastWeek && lastWeek.minggu_ke ? parseInt(lastWeek.minggu_ke) + 1 : weeksForm.length + 1;
    setWeeksForm([
      ...weeksForm, 
      { id: Date.now(), bulan: lastWeek ? lastWeek.bulan : '1', minggu_ke: nextMingguKe.toString(), tanggal_mulai: '', tanggal_selesai: '', target_kumulatif: '' }
    ]);
  };

  const handleRemoveWeek = (idToRemove) => {
    if (weeksForm.length === 1) return alert("Minimal harus ada 1 minggu target!");
    setWeeksForm(weeksForm.filter(w => w.id !== idToRemove));
  };

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
    for (let i = 0; i < weeksForm.length; i++) {
      const w = weeksForm[i];
      if (!w.minggu_ke || !w.tanggal_mulai || !w.tanggal_selesai) {
        return alert(`Mohon lengkapi data Minggu Ke, Tanggal Mulai, dan Tanggal Selesai pada baris ke-${i + 1}!`);
      }
      const targetVal = parseFloat(w.target_kumulatif) || 0;
      if (targetVal <= 0) return alert(`Target Kumulatif pada baris ke-${i + 1} harus diisi dan lebih dari 0!`);
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

      // Menggunakan full_sync: true agar menimpa sisa draft yang mungkin ada
      await api.post(`/projects/${projectId}/schedules`, { full_sync: true, weeks: payloadWeeks });
      alert(`Jadwal Awal Proyek Berhasil Disimpan!`);
      onSuccess(); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule. Pastikan koneksi server aman.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        
        {/* HEADER MODAL (Tombol X dihilangkan sesuai permintaan) */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-blue-600 dark:text-blue-500 flex items-center gap-2">
              <CalendarDays className="w-5 h-5"/> Setup Jadwal Pertama
            </h3>
            <p className="text-xs text-slate-500 mt-1">Proyek: <strong className="text-slate-700 dark:text-slate-300">{projectData?.nama_proyek}</strong></p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-slate-50 dark:bg-slate-900/20">
          {weeksForm.map((week, index) => (
            <div key={week.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative transition-all">
              
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 mb-4 gap-2">
                <h2 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2">
                  Minggu Ke-{week.minggu_ke || (index+1)}
                </h2>
                {weeksForm.length > 1 && (
                  <button onClick={() => handleRemoveWeek(week.id)} className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 text-[10px] font-medium rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Rentang Waktu</label>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-slate-500">Bulan Ke-</label>
                        <input type="number" min="1" value={week.bulan} onChange={(e) => handleWeekChange(week.id, 'bulan', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-slate-500">Minggu Ke-</label>
                        <input type="number" min="1" value={week.minggu_ke} onChange={(e) => handleWeekChange(week.id, 'minggu_ke', e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-slate-500">Tgl Mulai <span className="text-rose-500">*</span></label>
                        <input 
                          type="date" 
                          min={projectStart}
                          max={week.tanggal_selesai || projectEnd}
                          value={week.tanggal_mulai} 
                          onChange={(e) => handleWeekChange(week.id, 'tanggal_mulai', e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-medium text-slate-500">Tgl Akhir <span className="text-rose-500">*</span></label>
                        <input 
                          type="date" 
                          min={week.tanggal_mulai || projectStart}
                          max={projectEnd}
                          value={week.tanggal_selesai} 
                          onChange={(e) => handleWeekChange(week.id, 'tanggal_selesai', e.target.value)} 
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" 
                        />
                      </div>
                   </div>
                 </div>

                 <div className="space-y-4 md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Target S-Curve</label>
                    <div className="space-y-3 pt-1">
                      <label className="text-[10px] font-medium text-slate-500">Target Kumulatif (Plan) <span className="text-rose-500">*</span></label>
                      <div className="flex items-center gap-3">
                         <input 
                           type="text" 
                           placeholder="0.00"
                           value={week.target_kumulatif}
                           onChange={(e) => handleWeekChange(week.id, 'target_kumulatif', e.target.value)}
                           className="w-32 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-500/50 text-center font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-emerald-600 dark:text-emerald-400 py-3 shadow-inner"
                         />
                         <span className="font-extrabold text-emerald-600 dark:text-emerald-500 text-2xl">%</span>
                      </div>
                    </div>
                 </div>
              </div>
            </div>
          ))}
          
          <button 
            onClick={handleAddWeek}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 rounded-2xl bg-white dark:bg-slate-800 text-slate-500 hover:text-blue-500 font-bold text-xs flex justify-center items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-5 h-5" /> Tambah Minggu Berikutnya
          </button>
        </div>

        {/* FOOTER MODAL - Mengarahkan kembali ke Tab Data Utama jika dibatalkan */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex justify-end gap-3">
          <button onClick={() => navigate(`/projects/${projectId}/data`, { state: projectData })} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-600 text-xs shadow-sm transition-colors">
            Kembali
          </button>
          <button onClick={handleSaveSchedule} disabled={isSaving} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2 text-xs">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan & Render Matriks
          </button>
        </div>

      </div>
    </div>
  );
}