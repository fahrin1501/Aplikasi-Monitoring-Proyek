import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Building2, CalendarDays, Save, Loader2, 
  ChevronDown, Calendar, Layers, Plus, Trash2, CheckCircle2, ListPlus
} from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();

  // --- STATE DATA PROYEK ---
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  useEffect(() => {
    document.title = "Prisma Group - Jadwal Baru";
  }, []);

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // --- STATE PERIODE JADWAL ---
  const [periodForm, setPeriodForm] = useState({
    bulan: '',
    minggu_ke: '',
    tanggal_mulai: '',
    tanggal_selesai: ''
  });

  // --- STATE KERANJANG PEKERJAAN ---
  const [addedItems, setAddedItems] = useState([]); 
  const [draftDivisiId, setDraftDivisiId] = useState('');
  const [draftItemId, setDraftItemId] = useState('');

  // Fetch Daftar Proyek
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

  // Fetch Detail Proyek & RAB untuk jadwal
  const fetchTimeSchedule = async (projectId) => {
    setIsLoadingSchedule(true);
    try {
      const res = await api.get(`/projects/${projectId}/schedules`);
      setScheduleData(res.data.data);
      setAddedItems([]); // Reset keranjang jika ganti proyek
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
    setDraftDivisiId('');
    setDraftItemId('');
    if (pId) fetchTimeSchedule(pId);
  };

  const handlePeriodChange = (e) => {
    setPeriodForm({ ...periodForm, [e.target.name]: e.target.value });
  };

  // --- RUMUS PENGHITUNG BOBOT OTOMATIS ---
  // Menghitung total seluruh item pekerjaan (yang bukan subheader) di RAB proyek ini
  const totalItemsCount = scheduleData ? scheduleData.rab_data.reduce((sum, cat) => 
    sum + cat.items.filter(i => !i.is_subheader).length
  , 0) : 1;

  // Rumus: 100% dibagi jumlah item pekerjaan
  const bobotOtomatis = totalItemsCount > 0 ? (100 / totalItemsCount) : 0;

  // --- HANDLER TAMBAH KE KERANJANG ---
  const handleAddItem = () => {
    if (!draftDivisiId || !draftItemId) return alert("Pilih Divisi dan Uraian Pekerjaan terlebih dahulu!");

    if (addedItems.some(i => i.rab_item_id.toString() === draftItemId.toString())) {
      return alert("Pekerjaan ini sudah ada di daftar. Silakan pilih pekerjaan lain.");
    }

    const divisi = scheduleData.rab_data.find(d => d.id.toString() === draftDivisiId);
    const itemAsli = divisi.items.find(i => i.id.toString() === draftItemId);

    const newItem = {
      rab_item_id: itemAsli.id,
      kode_pekerjaan: itemAsli.kode_pekerjaan || '',
      uraian_pekerjaan: itemAsli.uraian_pekerjaan,
      kategori_nama: divisi.nama_kategori,
      bobot_rencana: bobotOtomatis
    };

    setAddedItems([...addedItems, newItem]);
    setDraftItemId(''); // Reset uraian agar bisa memilih yang lain
  };

  const handleRemoveItem = (idToRemove) => {
    setAddedItems(addedItems.filter(item => item.rab_item_id !== idToRemove));
  };

  // --- FILTER ITEM TERSEDIA ---
  // Hanya memunculkan item RAB yang: 1) Bukan subheader, 2) Belum ada di keranjang, 3) Belum diinput di backend
  const getAvailableItems = () => {
    if (!draftDivisiId || !scheduleData) return [];
    
    const divisi = scheduleData.rab_data.find(cat => cat.id.toString() === draftDivisiId);
    if (!divisi) return [];

    return divisi.items.filter(item => {
      if (item.is_subheader) return false;
      const inDraft = addedItems.some(draft => draft.rab_item_id === item.id);
      const inDatabase = scheduleData.schedules?.some(s => s.rab_item_id === item.id);
      return !inDraft && !inDatabase;
    });
  };

  const availableItems = getAvailableItems();
  const totalDraftBobot = addedItems.reduce((sum, item) => sum + item.bobot_rencana, 0);

  // --- HANDLER SIMPAN KE BACKEND ---
  const handleSaveSchedule = async () => {
    if (!periodForm.bulan || !periodForm.minggu_ke || !periodForm.tanggal_mulai || !periodForm.tanggal_selesai) {
      return alert("Mohon lengkapi data Bulan, Minggu Ke-, serta Tanggal Mulai & Selesai terlebih dahulu!");
    }

    if (addedItems.length === 0) {
      return alert("Anda belum menambahkan uraian pekerjaan satupun ke dalam jadwal.");
    }

    setIsSaving(true);
    try {
      const payloadArr = addedItems.map(item => ({
        rab_item_id: item.rab_item_id,
        bulan: parseInt(periodForm.bulan),
        minggu_ke: parseInt(periodForm.minggu_ke),
        tanggal_awal: periodForm.tanggal_mulai,
        tanggal_akhir: periodForm.tanggal_selesai,
        bobot_rencana: item.bobot_rencana
      }));

      await api.post(`/projects/${selectedProjectId}/schedules`, { schedules: payloadArr });
      
      alert(`Target Jadwal Minggu Ke-${periodForm.minggu_ke} Berhasil Disimpan!`);
      navigate(`/schedules/${selectedProjectId}`); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule. Pastikan koneksi server aman.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-24 relative animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/schedules')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">Form Rencana Jadwal</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Masukkan data periode waktu, lalu tambahkan uraian pekerjaan yang ditargetkan.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* KOTAK 1: PILIH PROYEK */}
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

        {/* KOTAK 2: PERIODE WAKTU */}
        {selectedProjectId && scheduleData && (
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 animate-fade-in backdrop-blur-sm">
            <label className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> 2. Tentukan Periode Waktu <span className="text-rose-500">*</span>
            </label>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Bulan Ke-</label>
                <input type="number" min="1" name="bulan" value={periodForm.bulan} onChange={handlePeriodChange} placeholder="1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Minggu Ke-</label>
                <input type="number" min="1" name="minggu_ke" value={periodForm.minggu_ke} onChange={handlePeriodChange} placeholder="1" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-inner" />
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

      {/* KOTAK 3: KERANJANG PEKERJAAN */}
      {selectedProjectId && scheduleData && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm animate-fade-in backdrop-blur-sm">
          
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4" /> 3. Target Pekerjaan & Bobot Otomatis
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Bobot dihitung otomatis: Total 100% dibagi {totalItemsCount} item pekerjaan di RAB = <strong className="text-emerald-600 dark:text-emerald-400">{bobotOtomatis.toFixed(2)}% per item</strong>.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Total Target Minggu Ini:</span>
              <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{totalDraftBobot.toFixed(2)}%</span>
            </div>
          </div>

          {/* FORM INLINE TAMBAH PEKERJAAN */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40">
             <div className="flex flex-col lg:flex-row items-end gap-4">
               <div className="w-full lg:w-1/3 space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pilih Divisi / Kategori</label>
                 <select value={draftDivisiId} onChange={(e) => { setDraftDivisiId(e.target.value); setDraftItemId(''); }} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm">
                   <option value="" disabled>-- Klik Pilih Divisi --</option>
                   {scheduleData.rab_data.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                   ))}
                 </select>
               </div>
               
               <div className="w-full lg:w-1/2 space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Pilih Uraian Pekerjaan</label>
                 <select value={draftItemId} onChange={(e) => setDraftItemId(e.target.value)} disabled={!draftDivisiId || availableItems.length === 0} className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50 shadow-sm truncate">
                   <option value="" disabled>{!draftDivisiId ? '-- Pilih Divisi Dulu --' : availableItems.length === 0 ? '-- Semua Pekerjaan Sudah Ditambahkan --' : '-- Klik Pilih Uraian Pekerjaan --'}</option>
                   {availableItems.map(item => (
                     <option key={item.id} value={item.id}>{item.uraian_pekerjaan}</option>
                   ))}
                 </select>
               </div>

               <div className="w-full lg:w-auto">
                 <button onClick={handleAddItem} disabled={!draftDivisiId || !draftItemId} className="w-full lg:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                   <ListPlus className="w-4 h-4" /> Tambah ke Keranjang
                 </button>
               </div>
             </div>
          </div>
          
          {/* TABEL HASIL PENAMBAHAN KERANJANG */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-sm border-b border-slate-200 dark:border-slate-700/60">
                <tr>
                  <th className="p-3 w-[60%] border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan Tersimpan</th>
                  <th className="p-3 text-center w-[25%] border-r border-slate-200 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400">Bobot Otomatis (%)</th>
                  <th className="p-3 text-center w-[15%]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                {addedItems.length === 0 ? (
                   <tr><td colSpan="3" className="p-10 text-center text-slate-500 dark:text-slate-400 italic">Belum ada pekerjaan yang ditambahkan ke keranjang jadwal.<br/>Silakan pilih dari form di atas.</td></tr>
                ) : (
                  addedItems.map((item, index) => (
                    <tr key={item.rab_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 border-r border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shadow-sm">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-bold text-[11px] leading-snug line-clamp-2" title={item.uraian_pekerjaan}>{item.kode_pekerjaan ? `${item.kode_pekerjaan} ` : ''}{item.uraian_pekerjaan}</div>
                          <div className="text-[9px] text-amber-600 dark:text-amber-500 mt-1 uppercase tracking-wide truncate">{item.kategori_nama}</div>
                        </div>
                      </td>
                      <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle bg-emerald-50/10 dark:bg-emerald-900/5">
                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{item.bobot_rencana.toFixed(2)}%</span>
                      </td>
                      <td className="p-2 text-center align-middle">
                        <button 
                          onClick={() => handleRemoveItem(item.rab_item_id)}
                          className="p-1.5 mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
                          title="Hapus dari Keranjang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FLOATING SAVE BUTTON */}
      {selectedProjectId && scheduleData && addedItems.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-2xl shadow-2xl flex items-center gap-4 md:gap-6 pointer-events-auto backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
            <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total Bobot Ditambahkan</span>
              <span className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{totalDraftBobot.toFixed(2)}%</span>
            </div>
            <button 
              onClick={handleSaveSchedule} 
              disabled={isSaving} 
              className="flex items-center justify-center gap-2 px-6 md:px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} 
              {isSaving ? 'Menyimpan...' : `Simpan Target M-${periodForm.minggu_ke}`}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}