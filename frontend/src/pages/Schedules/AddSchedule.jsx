import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Building2, CalendarDays, Save, Loader2, AlertTriangle, 
  ChevronDown, Calendar, Layers, Activity, CheckCircle2
} from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    document.title = "Prisma Group - Jadwal Baru";
  }, []);

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- STATE PERIODE (BARU) ---
  const [periodForm, setPeriodForm] = useState({
    bulan: '',
    minggu_ke: '',
    tanggal_mulai: '',
    tanggal_selesai: ''
  });

  // --- STATE BATCH INPUT ITEM RAB ---
  const [itemInputs, setItemInputs] = useState({}); // Format: { rab_item_id: bobot_rencana }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const dataProyek = res.data?.data || res.data || [];
        setProjects(Array.isArray(dataProyek) ? dataProyek : []);
      } catch (error) {
        console.error("Gagal menarik daftar proyek:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const fetchTimeSchedule = async (projectId) => {
    setIsLoadingSchedule(true);
    try {
      const res = await api.get(`/projects/${projectId}/schedules`);
      setScheduleData(res.data.data);
      setItemInputs({});
    } catch (error) {
      setScheduleData(null);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleProjectSelect = (e) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    setPeriodForm({ bulan: '', minggu_ke: '', tanggal_mulai: '', tanggal_selesai: '' });
    if (pId) fetchTimeSchedule(pId);
  };

  const handlePeriodChange = (e) => {
    setPeriodForm({ ...periodForm, [e.target.name]: e.target.value });
  };

  const handleItemInputChange = (rabItemId, value, sisaTersedia) => {
    if (value && isNaN(value)) return;
    const valFloat = parseFloat(value);
    
    // Validasi agar tidak melebihi sisa bobot RAB
    if (valFloat > (sisaTersedia + 0.02)) {
      alert(`Gagal! Target maksimal yang bisa diinput untuk item ini adalah ${sisaTersedia.toFixed(2)}%`);
      return;
    }

    setItemInputs(prev => {
      const newInputs = { ...prev };
      if (value === '' || valFloat <= 0) {
        delete newInputs[rabItemId];
      } else {
        newInputs[rabItemId] = valFloat;
      }
      return newInputs;
    });
  };

  // --- RUMUS PENGHITUNG BOBOT OTOMATIS ---
  const grandTotalRAB = scheduleData ? scheduleData.rab_data.reduce((sum, cat) => 
    sum + cat.items.reduce((itemSum, item) => itemSum + Number(item.total_harga || 0), 0)
  , 0) : 0;

  const getBobotItem = (item) => {
    if (!item || grandTotalRAB === 0) return 0;
    return (Number(item.total_harga || 0) / grandTotalRAB) * 100;
  };

  const calculateUsedBobot = (rabItemId) => {
    if (!scheduleData || !scheduleData.schedules) return 0;
    // Menghitung total bobot yang sudah di-jadwalkan (sebelumnya)
    return scheduleData.schedules
      .filter(s => s.rab_item_id === rabItemId)
      .reduce((sum, s) => sum + parseFloat(s.bobot_rencana), 0);
  };

  // Total Persentase yang sedang di-input saat ini
  const totalDraftBobot = Object.values(itemInputs).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

  // --- HANDLER SIMPAN KE BACKEND ---
  const handleSaveSchedule = async () => {
    if (!periodForm.bulan || !periodForm.minggu_ke || !periodForm.tanggal_mulai || !periodForm.tanggal_selesai) {
      return alert("Mohon lengkapi data Bulan, Minggu Ke-, serta Tanggal Mulai & Selesai terlebih dahulu!");
    }

    if (Object.keys(itemInputs).length === 0) {
      return alert("Anda belum memasukkan target bobot (%) pada item pekerjaan satupun.");
    }

    setIsSaving(true);
    try {
      const payloadArr = Object.keys(itemInputs).map(itemId => ({
        rab_item_id: parseInt(itemId),
        bulan: parseInt(periodForm.bulan),
        minggu_ke: parseInt(periodForm.minggu_ke),
        tanggal_awal: periodForm.tanggal_mulai,
        tanggal_akhir: periodForm.tanggal_selesai,
        bobot_rencana: parseFloat(itemInputs[itemId])
      }));

      // Mengirim array of schedules. Backend perlu disesuaikan untuk menerima bulan & tanggal nantinya.
      await api.post(`/projects/${selectedProjectId}/schedules`, { schedules: payloadArr });
      
      alert(`Target Jadwal Minggu Ke-${periodForm.minggu_ke} Berhasil Disimpan!`);
      navigate(`/schedules/${selectedProjectId}`); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule. Pastikan server merespon.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/schedules')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">Form Rencana Jadwal (Time Schedule)</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Isi rentang waktu mingguan, lalu masukkan target bobot pada daftar RAB di bawah.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" /> 1. Pilih Proyek <span className="text-rose-500">*</span>
            </label>
            {isLoadingSchedule && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
          </div>
          <div className="relative w-full">
            <select value={selectedProjectId} onChange={handleProjectSelect} disabled={isLoadingProjects} className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer truncate shadow-inner disabled:opacity-50">
              <option value="" disabled>-- Klik untuk Pilih Proyek --</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.nama_proyek}</option>))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-slate-400" /></div>
          </div>
        </div>

        {selectedProjectId && scheduleData && (
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 animate-fade-in backdrop-blur-sm">
            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> 2. Tentukan Periode Waktu <span className="text-rose-500">*</span>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Bulan Ke-</label>
                <input type="number" min="1" name="bulan" value={periodForm.bulan} onChange={handlePeriodChange} placeholder="Contoh: 1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Minggu Ke-</label>
                <input type="number" min="1" name="minggu_ke" value={periodForm.minggu_ke} onChange={handlePeriodChange} placeholder="Contoh: 1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tanggal Mulai</label>
                <input type="date" name="tanggal_mulai" value={periodForm.tanggal_mulai} onChange={handlePeriodChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner [color-scheme:light_dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Tanggal Selesai</label>
                <input type="date" name="tanggal_selesai" value={periodForm.tanggal_selesai} onChange={handlePeriodChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner [color-scheme:light_dark]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedProjectId && scheduleData && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm animate-fade-in backdrop-blur-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> 3. Target Pekerjaan & Bobot
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Isi angka persen (%) pada kolom input untuk item yang akan dikerjakan di periode ini.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Target Minggu Ini:</span>
              <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{totalDraftBobot.toFixed(2)}%</span>
            </div>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-sm border-b border-slate-200 dark:border-slate-700/60">
                <tr>
                  <th className="p-3 w-[45%] border-r border-slate-200 dark:border-slate-700/60">Divisi & Uraian Pekerjaan</th>
                  <th className="p-3 text-center w-[15%] border-r border-slate-200 dark:border-slate-700/60">Bobot RAB (%)</th>
                  <th className="p-3 text-center w-[20%] border-r border-slate-200 dark:border-slate-700/60">Sudah Dijadwalkan (%)</th>
                  <th className="p-3 text-center w-[20%] text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">Isi Target Mingguan (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                {scheduleData.rab_data.map(divisi => (
                  <React.Fragment key={`div-${divisi.id}`}>
                    <tr className="bg-amber-50/30 dark:bg-amber-900/10">
                      <td colSpan="4" className="p-3 font-extrabold text-amber-700 dark:text-amber-500 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700/60">
                        {divisi.kode_divisi ? `${divisi.kode_divisi}. ` : ''}{divisi.nama_kategori}
                      </td>
                    </tr>
                    {divisi.items.map(item => {
                      if (item.is_subheader) {
                        return (
                          <tr key={`sub-${item.id}`} className="bg-slate-50 dark:bg-slate-800/40">
                            <td colSpan="4" className="p-3 px-6 font-bold text-[11px] text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700/60">
                              {item.kode_pekerjaan ? `${item.kode_pekerjaan} ` : ''}{item.uraian_pekerjaan}
                            </td>
                          </tr>
                        );
                      }

                      const bobotRAB = getBobotItem(item);
                      const usedBobot = calculateUsedBobot(item.id);
                      const sisaTersedia = bobotRAB - usedBobot;
                      const isFull = sisaTersedia <= 0.01;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="p-3 px-6 border-r border-slate-200 dark:border-slate-700/60">
                            <div className="font-medium text-slate-700 dark:text-slate-300 leading-snug line-clamp-2" title={item.uraian_pekerjaan}>
                              {item.kode_pekerjaan ? `${item.kode_pekerjaan} ` : ''}{item.uraian_pekerjaan}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono mt-1">Vol: {item.volume} {item.satuan}</div>
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {bobotRAB.toFixed(2)}%
                          </td>
                          <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono text-slate-500">
                            <div className="flex flex-col items-center gap-1">
                              <span className={isFull ? 'text-emerald-500 font-bold' : ''}>{usedBobot.toFixed(2)}%</span>
                              <span className="text-[9px] text-slate-400">(Sisa: {Math.max(0, sisaTersedia).toFixed(2)}%)</span>
                            </div>
                          </td>
                          <td className="p-2 text-center align-middle bg-emerald-50/20 dark:bg-emerald-950/10">
                            {isFull ? (
                              <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3"/> Terpenuhi</span>
                            ) : (
                              <input 
                                type="number" step="any" min="0" max={sisaTersedia.toFixed(2)}
                                value={itemInputs[item.id] || ''}
                                onChange={(e) => handleItemInputChange(item.id, e.target.value, sisaTersedia)}
                                placeholder="0.00"
                                className="w-24 mx-auto bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-600 text-center font-mono text-sm py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg text-emerald-700 dark:text-emerald-400 shadow-inner transition-colors" 
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLOATING SAVE BUTTON */}
      {selectedProjectId && scheduleData && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-2xl shadow-2xl flex items-center gap-4 md:gap-6 pointer-events-auto backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Target Mingguan</span>
              <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{totalDraftBobot.toFixed(2)}%</span>
            </div>
            <button 
              onClick={handleSaveSchedule} 
              disabled={isSaving || totalDraftBobot <= 0} 
              className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
              {isSaving ? 'Menyimpan...' : 'Simpan Time Schedule'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}