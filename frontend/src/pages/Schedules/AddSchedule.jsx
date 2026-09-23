import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, CalendarDays, Save, Loader2, 
  Layers, Plus, Trash2, ListPlus
} from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();
  const { id } = useParams();
  const projectId = id;

  useEffect(() => {
    document.title = "Prisma Group - Jadwal Baru";
  }, []);

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // FORM PERIODE
  const [periodForm, setPeriodForm] = useState({
    bulan: '', minggu_ke: '', tanggal_mulai: '', tanggal_selesai: ''
  });

  // KERANJANG PEKERJAAN BATCH
  const [addedItems, setAddedItems] = useState([]); 
  const [draftDivisiId, setDraftDivisiId] = useState('');
  const [draftItemId, setDraftItemId] = useState('');

  useEffect(() => {
    if (!projectId) return navigate('/projects');

    const fetchTimeSchedule = async () => {
      setIsLoadingSchedule(true);
      try {
        const res = await api.get(`/projects/${projectId}/schedules`);
        setScheduleData(res.data.data);
      } catch (error) {
        console.error("Gagal menarik data jadwal:", error);
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    fetchTimeSchedule();
  }, [projectId, navigate]);

  const handlePeriodChange = (e) => setPeriodForm({ ...periodForm, [e.target.name]: e.target.value });

  // --- HANDLER TAMBAH KE KERANJANG ---
  const handleAddItem = () => {
    if (!draftDivisiId || !draftItemId) return alert("Pilih Divisi dan Uraian Pekerjaan terlebih dahulu!");
    if (addedItems.some(i => i.rab_item_id.toString() === draftItemId.toString())) return alert("Pekerjaan ini sudah ada di keranjang.");

    const divisi = scheduleData.rab_data.find(d => d.id.toString() === draftDivisiId);
    const itemAsli = divisi.items.find(i => i.id.toString() === draftItemId);

    // MENGAMBIL SISA BOBOT LANGSUNG DARI BACKEND LARAVEL
    const sisaBobot = Number(itemAsli.sisa_bobot) || 0;

    if (sisaBobot <= 0) {
       return alert("Pekerjaan ini sudah dijadwalkan 100% pada minggu-minggu sebelumnya!");
    }

    const newItem = {
      rab_item_id: itemAsli.id,
      kode_pekerjaan: itemAsli.kode_pekerjaan || '',
      uraian_pekerjaan: itemAsli.uraian_pekerjaan,
      kategori_nama: divisi.nama_kategori,
      bobot_divisi: divisi.bobot_divisi, // Informasi tambahan dari backend
      bobot_rencana: sisaBobot, // Default value diset full sisa
      sisa_bobot_asli: sisaBobot // Untuk validasi input
    };

    setAddedItems([...addedItems, newItem]);
    setDraftItemId(''); 
  };

  const handleRemoveItem = (idToRemove) => setAddedItems(addedItems.filter(item => item.rab_item_id !== idToRemove));

  const handleUpdateBobotKeranjang = (id, newValue) => {
    setAddedItems(addedItems.map(item => {
      if (item.rab_item_id === id) {
        let val = parseFloat(newValue) || 0;
        // Mencegah input melebihi sisa bobot
        if (val > item.sisa_bobot_asli) val = item.sisa_bobot_asli;
        return { ...item, bobot_rencana: val };
      }
      return item;
    }));
  };

  // FILTER DROPDOWN: Hanya tampilkan yang sisa bobotnya > 0 dan belum masuk keranjang
  const getAvailableItems = () => {
    if (!draftDivisiId || !scheduleData) return [];
    const divisi = scheduleData.rab_data.find(cat => cat.id.toString() === draftDivisiId);
    if (!divisi) return [];

    return divisi.items.filter(item => {
      if (item.is_subheader || Number(item.sisa_bobot) <= 0) return false;
      return !addedItems.some(draft => draft.rab_item_id === item.id);
    });
  };

  const totalDraftBobot = addedItems.reduce((sum, item) => sum + (Number(item.bobot_rencana) || 0), 0);

  const handleSaveSchedule = async () => {
    if (!periodForm.bulan || !periodForm.minggu_ke || !periodForm.tanggal_mulai || !periodForm.tanggal_selesai) {
      return alert("Lengkapi data Bulan, Minggu Ke-, serta Tanggal Mulai & Selesai!");
    }
    if (addedItems.length === 0) return alert("Keranjang masih kosong.");
    if (addedItems.some(item => Number(item.bobot_rencana) <= 0)) return alert("Bobot pekerjaan tidak boleh 0.");

    setIsSaving(true);
    try {
      const payloadArr = addedItems.map(item => ({
        rab_item_id: item.rab_item_id,
        bulan: parseInt(periodForm.bulan),
        minggu_ke: parseInt(periodForm.minggu_ke),
        tanggal_awal: periodForm.tanggal_mulai,
        tanggal_akhir: periodForm.tanggal_selesai,
        bobot_rencana: Number(item.bobot_rencana)
      }));

      await api.post(`/projects/${projectId}/schedules`, { schedules: payloadArr });
      alert(`Jadwal Minggu Ke-${periodForm.minggu_ke} Berhasil Disimpan!`);
      navigate(`/schedules/${projectId}/data`); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSchedule || !scheduleData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Mengambil data dari server...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-24 relative animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(`/schedules/${projectId}/data`)} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">Form Rencana Jadwal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Susun pekerjaan mingguan berdasarkan sisa RAB yang tersedia.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Proyek</label>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
             <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase block mb-1">Nama Proyek:</span>
             <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-3">{scheduleData?.project_info?.nama_proyek}</p>
          </div>
        </div>

        <div className="md:col-span-8 bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
          <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-2">
            <CalendarDays className="w-4 h-4" /> 1. Tentukan Periode Waktu <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500">Bulan Ke-</label><input type="number" min="1" name="bulan" value={periodForm.bulan} onChange={handlePeriodChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500">Minggu Ke-</label><input type="number" min="1" name="minggu_ke" value={periodForm.minggu_ke} onChange={handlePeriodChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500">Tanggal Mulai</label><input type="date" name="tanggal_mulai" value={periodForm.tanggal_mulai} onChange={handlePeriodChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs [color-scheme:light_dark]" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500">Tanggal Selesai</label><input type="date" name="tanggal_selesai" value={periodForm.tanggal_selesai} onChange={handlePeriodChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs [color-scheme:light_dark]" /></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2"><Layers className="w-4 h-4" /> 2. Target Pekerjaan</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Sistem otomatis mengambil sisa pekerjaan dari database.</p>
          </div>
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Target Diinput:</span>
            <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{Number(totalDraftBobot).toFixed(2)}%</span>
          </div>
        </div>

        <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40">
           <div className="flex flex-col lg:flex-row items-end gap-4">
             <div className="w-full lg:w-1/3 space-y-1.5">
               <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Divisi (Total: {scheduleData?.rab_data?.find(c=>c.id.toString()===draftDivisiId)?.bobot_divisi?.toFixed(2) || '0.00'}%)</label>
               <select value={draftDivisiId} onChange={(e) => { setDraftDivisiId(e.target.value); setDraftItemId(''); }} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs shadow-sm">
                 <option value="" disabled>-- Klik Pilih Divisi --</option>
                 {scheduleData.rab_data.map(cat => (
                   <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                 ))}
               </select>
             </div>
             
             <div className="w-full lg:w-1/2 space-y-1.5">
               <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Uraian Pekerjaan</label>
               <select value={draftItemId} onChange={(e) => setDraftItemId(e.target.value)} disabled={!draftDivisiId || getAvailableItems().length === 0} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs shadow-sm truncate">
                 <option value="" disabled>{!draftDivisiId ? '-- Pilih Divisi Dulu --' : getAvailableItems().length === 0 ? '-- Semua Pekerjaan Sudah Ditambahkan --' : '-- Klik Pilih Uraian Pekerjaan --'}</option>
                 {getAvailableItems().map(item => (
                   <option key={item.id} value={item.id}>{item.uraian_pekerjaan} (Sisa: {Number(item.sisa_bobot).toFixed(2)}%)</option>
                 ))}
               </select>
             </div>

             <div className="w-full lg:w-auto">
               <button onClick={handleAddItem} disabled={!draftDivisiId || !draftItemId} className="w-full lg:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                 <ListPlus className="w-4 h-4" /> Tambah 
               </button>
             </div>
           </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase shadow-sm border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="p-3 w-[55%] border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan Tersimpan</th>
                <th className="p-3 text-center w-[30%] border-r border-slate-200 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400">Target Rencana (%)</th>
                <th className="p-3 text-center w-[15%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
              {addedItems.length === 0 ? (
                 <tr><td colSpan="3" className="p-10 text-center text-slate-500 italic">Belum ada pekerjaan yang ditambahkan ke keranjang jadwal.<br/>Silakan pilih dari form di atas.</td></tr>
              ) : (
                addedItems.map((item, index) => (
                  <tr key={item.rab_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-4 border-r border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                      <span className="w-5 h-5 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shadow-sm">{index + 1}</span>
                      <div>
                        <div className="font-bold text-[11px] leading-snug">{item.kode_pekerjaan ? `${item.kode_pekerjaan} ` : ''}{item.uraian_pekerjaan}</div>
                        <div className="text-[9px] text-amber-600 mt-1 uppercase">{item.kategori_nama}</div>
                      </div>
                    </td>
                    <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle bg-emerald-50/10 dark:bg-emerald-900/5">
                      <div className="flex items-center justify-center gap-2">
                        <input 
                          type="number" step="any" min="0" max={item.sisa_bobot_asli}
                          value={item.bobot_rencana || ''}
                          onChange={(e) => handleUpdateBobotKeranjang(item.rab_item_id, e.target.value)}
                          className="w-24 bg-white dark:bg-slate-900 border border-emerald-300 text-center font-mono text-sm py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg text-emerald-700 shadow-inner" 
                        />
                        <span className="text-[9px] text-slate-400 block w-16 text-left">(Sisa Plafon:<br/>{Number(item.sisa_bobot_asli).toFixed(2)}%)</span>
                      </div>
                    </td>
                    <td className="p-2 text-center align-middle">
                      <button onClick={() => handleRemoveItem(item.rab_item_id)} className="p-1.5 mx-auto bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg shadow-sm"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {scheduleData && addedItems.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-2xl shadow-2xl flex items-center gap-4 md:gap-6 pointer-events-auto backdrop-blur-md bg-opacity-90">
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Bobot</span>
              <span className="text-lg font-extrabold font-mono text-emerald-600">{Number(totalDraftBobot).toFixed(2)}%</span>
            </div>
            <button onClick={handleSaveSchedule} disabled={isSaving} className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan M-{periodForm.minggu_ke}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}