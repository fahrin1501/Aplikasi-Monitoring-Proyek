import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Building2, CalendarDays, Save, Loader2, AlertTriangle, 
  ChevronDown, Calendar, Layers, Plus, Trash2, ListPlus, Activity
} from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [scheduleInputs, setScheduleInputs] = useState({});
  const [selectedWeek, setSelectedWeek] = useState('');
  
  const [draftDivisiId, setDraftDivisiId] = useState('');
  const [draftItemId, setDraftItemId] = useState('');
  const [draftBobot, setDraftBobot] = useState('');

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
      const data = res.data.data;
      setScheduleData(data);
      
      const initialInputs = {};
      if (data.schedules && data.schedules.length > 0) {
        data.schedules.forEach(item => {
          initialInputs[`${item.rab_item_id}_${item.minggu_ke}`] = item.bobot_rencana;
        });
      }
      setScheduleInputs(initialInputs);
    } catch (error) {
      setScheduleData(null);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const handleProjectSelect = (e) => {
    const pId = e.target.value;
    setSelectedProjectId(pId);
    setSelectedWeek(''); 
    setDraftDivisiId('');
    setDraftItemId('');
    if (pId) fetchTimeSchedule(pId);
  };

  const handleWeekSelect = (e) => {
    setSelectedWeek(e.target.value);
    setDraftDivisiId(''); 
    setDraftItemId('');
  };

  // --- RUMUS PENGHITUNG BOBOT OTOMATIS ---
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

  // --- HANDLER KERANJANG DINAMIS (TAMBAH / HAPUS) ---
  const handleAddToList = () => {
    if (!draftItemId || !draftBobot || draftBobot <= 0) {
      return alert("Pilih Item Pekerjaan dan masukkan Target Bobot (%) yang valid!");
    }

    const kategori = scheduleData.rab_data.find(c => c.id.toString() === draftDivisiId);
    const itemAsli = kategori?.items.find(i => i.id.toString() === draftItemId);
    
    const bobotRAB = getBobotItem(itemAsli);
    const realisasiAktual = 0; // NANTI DIAMBIL DARI API LAPORAN HARIAN
    const sisaBobotTersedia = bobotRAB - realisasiAktual;
    
    const totalInputSaatIni = calculateRowTotal(draftItemId, scheduleData.project_info.total_minggu);
    const bobotSebelumnya = parseFloat(scheduleInputs[`${draftItemId}_${selectedWeek}`]) || 0;
    const totalAkanDatang = (totalInputSaatIni - bobotSebelumnya) + parseFloat(draftBobot);

    // Validasi LOGIKA BARU: Tidak boleh melebihi "Sisa Target yang Belum Terealisasi"
    if (parseFloat(draftBobot) > (sisaBobotTersedia + bobotSebelumnya + 0.02)) { 
      return alert(`Gagal! Sisa plafon yang tersedia untuk diinput adalah ${(sisaBobotTersedia + bobotSebelumnya).toFixed(2)}% (Batas RAB - Total Realisasi)`);
    }

    setScheduleInputs(prev => ({ ...prev, [`${draftItemId}_${selectedWeek}`]: parseFloat(draftBobot) }));
    setDraftItemId('');
    setDraftBobot('');
  };

  const handleRemoveFromList = (rabItemId) => {
    setScheduleInputs(prev => {
      const newState = { ...prev };
      delete newState[`${rabItemId}_${selectedWeek}`]; 
      return newState;
    });
  };

  const handleInlineChange = (rabItemId, value) => {
    if (value && isNaN(value)) return;
    setScheduleInputs(prev => ({ ...prev, [`${rabItemId}_${selectedWeek}`]: value }));
  };

  const handleSaveSchedule = async () => {
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
      await api.post(`/projects/${selectedProjectId}/schedules`, { schedules: payloadArr });
      alert(`Target Jadwal Minggu Ke-${selectedWeek} Berhasil Disimpan!`);
      navigate(`/schedules/${selectedProjectId}`); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTanggalMinggu = (tglMulai, mingguKe) => {
    if (!tglMulai) return "Tgl Belum Diset";
    const startDate = new Date(tglMulai);
    if (isNaN(startDate.getTime())) return "";
    startDate.setDate(startDate.getDate() + ((mingguKe - 1) * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return `${startDate.toLocaleDateString('id-ID', options)} - ${endDate.toLocaleDateString('id-ID', options)}`;
  };

  const currentWeekItems = [];
  if (scheduleData && selectedWeek) {
    scheduleData.rab_data.forEach(cat => {
      cat.items.forEach(item => {
        if (!item.is_subheader && scheduleInputs[`${item.id}_${selectedWeek}`]) {
          currentWeekItems.push({ ...item, kategori_nama: cat.nama_kategori });
        }
      });
    });
  }

  const availableItems = draftDivisiId && scheduleData ? 
    scheduleData.rab_data.find(cat => cat.id.toString() === draftDivisiId)?.items.filter(item => 
      !item.is_subheader && !scheduleInputs[`${item.id}_${selectedWeek}`]
    ) || [] 
  : [];

  return (
    <div className="w-full space-y-6 pb-20 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/schedules')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">Form Input Time Schedule</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Susun target jadwal mingguan. Defisit target sebelumnya bisa di-input kembali.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">1. Pilih Proyek <span className="text-rose-500">*</span></label>
            {isLoadingSchedule && <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />}
          </div>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Building2 className="w-4 h-4 text-slate-400" /></div>
            <select value={selectedProjectId} onChange={handleProjectSelect} disabled={isLoadingProjects} className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer truncate shadow-inner">
              <option value="" disabled>-- Klik untuk Pilih Proyek --</option>
              {projects.map(p => (<option key={p.id} value={p.id}>{p.nama_proyek}</option>))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-slate-400" /></div>
          </div>
        </div>

        {selectedProjectId && scheduleData && scheduleData.project_info.total_minggu > 0 && (
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3 animate-fade-in">
            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">2. Pilih Minggu Pengisian <span className="text-rose-500">*</span></label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="w-4 h-4 text-slate-400" /></div>
              <select value={selectedWeek} onChange={handleWeekSelect} className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer truncate shadow-inner">
                <option value="" disabled>-- Pilih Minggu Ke-Berapa? --</option>
                {Array.from({ length: scheduleData.project_info.total_minggu }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Minggu Ke-{i + 1} ({formatTanggalMinggu(scheduleData.project_info.tanggal_mulai, i + 1)})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="w-4 h-4 text-slate-400" /></div>
            </div>
          </div>
        )}
      </div>

      {selectedWeek && scheduleData && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          
          {/* BAGIAN KIRI: Form Tambah Pekerjaan (Drafting) */}
          <div className="xl:col-span-4 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm animate-fade-in sticky top-4">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                <ListPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">3. Tambah Pekerjaan</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Pilih dari RAB dan atur bobot.</p>
              </div>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Pilih Divisi / Kategori</label>
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Layers className="w-3.5 h-3.5 text-slate-400" /></div>
                  <select value={draftDivisiId} onChange={(e) => { setDraftDivisiId(e.target.value); setDraftItemId(''); }} className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer truncate">
                    <option value="" disabled>-- Pilih Divisi Pekerjaan --</option>
                    {scheduleData.rab_data.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Uraian Pekerjaan <span className="text-rose-500">*</span></label>
                <select value={draftItemId} onChange={(e) => setDraftItemId(e.target.value)} disabled={!draftDivisiId || availableItems.length === 0} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer truncate">
                  <option value="" disabled>{!draftDivisiId ? '-- Pilih Divisi Terlebih Dahulu --' : availableItems.length === 0 ? '-- Semua Pekerjaan Telah Ditambahkan --' : '-- Pilih Item Pekerjaan --'}</option>
                  {availableItems.map(item => {
                    const bobotRAB = getBobotItem(item);
                    const realisasi = 0; // NANTI DARI API LAPORAN
                    const tersedia = bobotRAB - realisasi;
                    return (
                      <option key={item.id} value={item.id}>{item.uraian_pekerjaan} (Sisa Tersedia: {tersedia.toFixed(2)}%)</option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Target Bobot Minggu Ke-{selectedWeek} (%)</label>
                <div className="flex gap-2">
                  <input type="number" step="any" min="0" value={draftBobot} onChange={(e) => setDraftBobot(e.target.value)} placeholder="0.00" disabled={!draftItemId} className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-center text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 font-mono disabled:opacity-50 shadow-inner" />
                  <button onClick={handleAddToList} disabled={!draftItemId || !draftBobot} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md active:scale-95 shrink-0 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Tambah
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN KANAN: Daftar Pekerjaan Minggu Terpilih */}
          <div className="xl:col-span-8 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm animate-fade-in flex flex-col h-full min-h-[400px]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30 shrink-0">
                  <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">4. Pekerjaan Minggu Ke-{selectedWeek}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-block">
                    {formatTanggalMinggu(scheduleData.project_info.tanggal_mulai, selectedWeek)}
                  </p>
                </div>
              </div>
              <button onClick={handleSaveSchedule} disabled={isSaving || currentWeekItems.length === 0} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Daftar Ini
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0 m-0">
              {currentWeekItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Activity className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-500 dark:text-slate-400">Keranjang Minggu Ini Kosong</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">Tambahkan pekerjaan melalui form di sebelah kiri untuk merakit jadwal minggu ini.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 sticky top-0 z-10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-sm border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3 w-[45%] border-r border-slate-200 dark:border-slate-700/60">Divisi & Uraian Pekerjaan</th>
                      <th className="p-3 text-center w-[25%] text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700/60">Target M-{selectedWeek}</th>
                      <th className="p-3 text-center w-[20%] border-r border-slate-200 dark:border-slate-700/60">Sisa Tersedia</th>
                      <th className="p-3 text-center w-[10%]">Hapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                    {currentWeekItems.map(item => {
                      const bobotRAB = getBobotItem(item);
                      const realisasiAktual = 0; // NANTI DARI API LAPORAN
                      const sisaTersedia = bobotRAB - realisasiAktual;
                      
                      const totalInput = calculateRowTotal(item.id, scheduleData.project_info.total_minggu);
                      const isSelesai = sisaTersedia <= 0.01;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                          <td className="p-3 pr-2 border-r border-slate-200 dark:border-slate-700/60">
                            <div className="font-bold text-[11px] leading-snug line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                            <div className="text-[9px] text-amber-600 dark:text-amber-500 mt-1 uppercase tracking-wide truncate">{item.kategori_nama}</div>
                          </td>
                          <td className="p-2 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle bg-blue-50/10 dark:bg-blue-900/5">
                            <input 
                              type="number" step="any" min="0" 
                              value={scheduleInputs[`${item.id}_${selectedWeek}`] || ''}
                              onChange={(e) => handleInlineChange(item.id, e.target.value)}
                              className="w-20 mx-auto bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-600 text-center font-mono text-sm py-1 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 rounded text-blue-700 dark:text-blue-400 shadow-inner transition-all"
                            />
                            <div className="mt-1.5 text-[9px] text-slate-500 font-mono">
                              Total Akumulasi: {totalInput.toFixed(2)}%
                            </div>
                          </td>
                          <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`font-mono font-bold text-[11px] ${isSelesai ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                {sisaTersedia.toFixed(2)}%
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                (Bobot RAB - Realisasi)
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center align-middle">
                            <button 
                              onClick={() => handleRemoveFromList(item.id)}
                              className="p-1.5 mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 rounded md transition-colors shadow-sm"
                              title="Hapus dari Minggu Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}