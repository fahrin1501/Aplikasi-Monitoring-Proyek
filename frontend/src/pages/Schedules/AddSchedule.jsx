import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, CalendarDays, Save, Loader2, 
  Layers, Trash2, ListPlus, ChevronDown, CheckSquare, Target
} from 'lucide-react';

export default function AddSchedule() {
  const navigate = useNavigate();
  const { id } = useParams();
  const projectId = id;

  useEffect(() => {
    document.title = "Prisma Group - Jadwal Baru";
  }, []);

  const [projectData, setProjectData] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [periodForm, setPeriodForm] = useState({
    bulan: '', minggu_ke: '', tanggal_mulai: '', tanggal_selesai: ''
  });

  const [addedItems, setAddedItems] = useState([]); 
  const [draftDivisiId, setDraftDivisiId] = useState('');
  
  const [draftItemIds, setDraftItemIds] = useState([]); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [targetKumulatif, setTargetKumulatif] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    const fetchTimeSchedule = async () => {
      setIsLoadingSchedule(true);
      try {
        const [projRes, schedRes] = await Promise.all([
          api.get(`/projects/${projectId}`),
          api.get(`/projects/${projectId}/schedules`)
        ]);
        setProjectData(projRes.data);
        setScheduleData(schedRes.data.data);
      } catch (error) {
        console.error("Gagal menarik data jadwal:", error);
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    fetchTimeSchedule();
  }, [projectId, navigate]);

  const handlePeriodChange = (e) => setPeriodForm({ ...periodForm, [e.target.name]: e.target.value });

  const grandTotalRAB = scheduleData ? scheduleData.rab_data.reduce((sum, cat) => 
    sum + cat.items.reduce((itemSum, item) => itemSum + Number(item.total_harga || 0), 0)
  , 0) : 0;

  const getAvailableItems = () => {
    if (!draftDivisiId || !scheduleData) return [];
    
    let allItems = [];
    if (draftDivisiId === 'all') {
      scheduleData.rab_data.forEach(cat => {
        cat.items.forEach(item => allItems.push({ ...item, kategori_nama: cat.nama_kategori }));
      });
    } else {
      const divisi = scheduleData.rab_data.find(cat => cat.id.toString() === draftDivisiId);
      if (divisi) {
        divisi.items.forEach(item => allItems.push({ ...item, kategori_nama: divisi.nama_kategori }));
      }
    }

    return allItems.map(item => {
      if (item.is_subheader) return null;
      
      const bobotStandarHitungan = grandTotalRAB > 0 ? (Number(item.total_harga || 0) / grandTotalRAB) * 100 : 0;
      const realisasiAktual = scheduleData.realizations
        ?.filter(r => r.rab_item_id === item.id)
        ?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;
      const sisaPlafon = Math.max(0, bobotStandarHitungan - realisasiAktual);

      return { ...item, sisaPlafon };
    }).filter(item => {
      if (!item) return false;
      if (item.sisaPlafon <= 0) return false; 
      if (addedItems.some(draft => draft.rab_item_id === item.id)) return false; 
      return true;
    });
  };

  const availableItems = getAvailableItems();

  const toggleItem = (itemId) => {
    if (draftItemIds.includes(itemId)) {
      setDraftItemIds(draftItemIds.filter(id => id !== itemId));
    } else {
      setDraftItemIds([...draftItemIds, itemId]);
    }
  };

  const handleAddItems = () => {
    if (!draftDivisiId || draftItemIds.length === 0) return alert("Pilih Divisi dan centang minimal 1 Uraian Pekerjaan terlebih dahulu!");

    const itemsToAdd = availableItems.filter(i => draftItemIds.includes(i.id));

    const newItems = itemsToAdd.map(itemAsli => ({
      rab_item_id: itemAsli.id,
      kode_pekerjaan: itemAsli.kode_pekerjaan || '',
      uraian_pekerjaan: itemAsli.uraian_pekerjaan,
      kategori_nama: itemAsli.kategori_nama,
    }));

    setAddedItems([...addedItems, ...newItems]);
    setDraftItemIds([]); 
    setIsDropdownOpen(false); 
  };

  const handleRemoveItem = (idToRemove) => setAddedItems(addedItems.filter(item => item.rab_item_id !== idToRemove));

  const handleSaveSchedule = async () => {
    if (!periodForm.bulan || !periodForm.minggu_ke || !periodForm.tanggal_mulai || !periodForm.tanggal_selesai) {
      return alert("Mohon lengkapi data Bulan, Minggu Ke-, serta Tanggal Mulai & Selesai terlebih dahulu!");
    }
    if (addedItems.length === 0) return alert("Anda belum menambahkan uraian pekerjaan satupun ke dalam jadwal.");
    
    const targetVal = parseFloat(targetKumulatif.replace(',', '.')) || 0;
    if (targetVal <= 0) return alert("Target Kumulatif Mingguan harus diisi dan lebih dari 0!");

    setIsSaving(true);
    try {
      const portion = targetVal / addedItems.length;

      const payloadArr = addedItems.map(item => ({
        rab_item_id: item.rab_item_id,
        bulan: parseInt(periodForm.bulan),
        minggu_ke: parseInt(periodForm.minggu_ke),
        tanggal_awal: periodForm.tanggal_mulai,
        tanggal_akhir: periodForm.tanggal_selesai,
        bobot_rencana: portion
      }));

      await api.post(`/projects/${projectId}/schedules`, { schedules: payloadArr });
      alert(`Target Jadwal Minggu Ke-${periodForm.minggu_ke} Berhasil Disimpan!`);
      navigate(`/schedules/${projectId}/data`); 
    } catch (error) {
      alert("Gagal menyimpan Time Schedule. Pastikan koneksi server aman.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSchedule || !scheduleData || !projectData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-sm text-slate-500">Menyiapkan form jadwal...</p>
      </div>
    );
  }

  const namaProyekAktif = projectData?.nama_proyek || 'Memuat Data...';

  return (
    <div className="w-full space-y-6 pb-24 relative animate-fade-in">
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate(`/schedules/${projectId}/data`)} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">Form Rencana Jadwal</h1>
            <p className="text-xs text-slate-500 mt-1">Masukkan data periode waktu dan pilih pekerjaan yang akan dikerjakan.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Target Proyek</label>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner">
             <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase block mb-1">Nama Proyek:</span>
             <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-3">{namaProyekAktif}</p>
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
            <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-2"><Layers className="w-4 h-4" /> 2. Pilih Daftar Pekerjaan</h3>
            <p className="text-[10px] text-slate-500 mt-1">Pilih semua daftar pekerjaan yang direncanakan selesai dalam minggu ini.</p>
          </div>
        </div>

        {/* INPUT AREA YANG DIPERBAIKI (GRID + TINGGI TETAP) */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
             
             {/* KOTAK 1: PILIH DIVISI */}
             <div className="md:col-span-5 space-y-1.5">
               <label className="text-[10px] font-bold text-slate-600 uppercase">Filter Divisi Pekerjaan</label>
               <select 
                 value={draftDivisiId} 
                 onChange={(e) => { 
                   setDraftDivisiId(e.target.value); 
                   setDraftItemIds([]); 
                   setIsDropdownOpen(false);
                 }} 
                 className="w-full h-[42px] px-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
               >
                 <option value="" disabled>-- Pilih Filter List Pekerjaan --</option>
                 <option value="all" className="font-extrabold text-blue-600 dark:text-blue-400">❖ TAMPILKAN SEMUA PEKERJAAN LINTAS DIVISI</option>
                 {scheduleData.rab_data.map(cat => (
                   <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                 ))}
               </select>
             </div>
             
             {/* KOTAK 2: MULTI-SELECT URAIAN PEKERJAAN */}
             <div className="md:col-span-5 space-y-1.5 relative" ref={dropdownRef}>
               <label className="text-[10px] font-bold text-slate-600 uppercase">Centang Uraian Pekerjaan</label>
               
               <div 
                  onClick={() => { if(draftDivisiId && availableItems.length > 0) setIsDropdownOpen(!isDropdownOpen) }}
                  className={`w-full h-[42px] px-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs shadow-sm flex items-center justify-between transition-colors ${(!draftDivisiId || availableItems.length === 0) ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer hover:border-emerald-400'}`}
               >
                 <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                    {!draftDivisiId 
                      ? '-- Pilih Mode Divisi Dulu --' 
                      : availableItems.length === 0 
                        ? '-- Semua Pekerjaan Sudah Ditambahkan --' 
                        : draftItemIds.length > 0 
                          ? `${draftItemIds.length} Pekerjaan Terpilih` 
                          : '-- Klik untuk Memilih --'}
                 </span>
                 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ml-2 ${isDropdownOpen ? 'rotate-180' : ''}`} />
               </div>

               {isDropdownOpen && (
                 <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 flex gap-2">
                       <button onClick={() => setDraftItemIds(availableItems.map(i => i.id))} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 px-2 py-1.5 rounded transition-colors"><CheckSquare className="w-3.5 h-3.5"/> Pilih Semua</button>
                       <button onClick={() => setDraftItemIds([])} className="text-[10px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 px-3 py-1.5 rounded transition-colors">Kosongkan</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto custom-scrollbar">
                      {availableItems.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => toggleItem(item.id)}
                          className="flex items-start gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors"
                        >
                          <input 
                            type="checkbox" 
                            checked={draftItemIds.includes(item.id)}
                            readOnly
                            className="mt-1 rounded w-4 h-4 text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-snug">{item.uraian_pekerjaan}</span>
                            {draftDivisiId === 'all' && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold uppercase mt-0.5">{item.kategori_nama}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
             </div>

             {/* KOTAK 3: TOMBOL TAMBAH (MEMAKAI GRID SPAN DAN TINGGI TETAP) */}
             <div className="md:col-span-2">
               <button 
                 onClick={handleAddItems} 
                 disabled={!draftDivisiId || draftItemIds.length === 0} 
                 className="w-full h-[42px] px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 text-xs whitespace-nowrap"
               >
                 <ListPlus className="w-4 h-4 shrink-0" /> 
                 <span>Tambah Antrean</span>
               </button>
             </div>
           </div>
        </div>
        
        {/* TABEL HASIL (TANPA INPUT BOBOT) */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase shadow-sm border-b border-slate-200 dark:border-slate-700/60">
              <tr>
                <th className="p-3 w-[10%] text-center border-r border-slate-200 dark:border-slate-700/60">No</th>
                <th className="p-3 w-[75%] border-r border-slate-200 dark:border-slate-700/60">Divisi & Uraian Pekerjaan Tersimpan</th>
                <th className="p-3 text-center w-[15%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
              {addedItems.length === 0 ? (
                 <tr><td colSpan="3" className="p-10 text-center text-slate-500 italic">Belum ada pekerjaan yang dipilih untuk dijadwalkan pada minggu ini.</td></tr>
              ) : (
                addedItems.map((item, index) => (
                  <tr key={item.rab_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="p-4 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle font-mono font-bold text-slate-500">{index + 1}</td>
                    <td className="p-4 border-r border-slate-200 dark:border-slate-700/60">
                      <div className="font-bold text-[12px] leading-snug">{item.kode_pekerjaan ? `${item.kode_pekerjaan} ` : ''}{item.uraian_pekerjaan}</div>
                      <div className="text-[9px] text-amber-600 mt-1 uppercase font-semibold">{item.kategori_nama}</div>
                    </td>
                    <td className="p-3 text-center align-middle">
                      <button onClick={() => handleRemoveItem(item.rab_item_id)} className="p-2 mx-auto bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING SAVE BUTTON & KUMULATIF INPUT */}
      {scheduleData && addedItems.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center pointer-events-none px-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 md:p-3 rounded-2xl shadow-2xl flex flex-wrap items-center justify-center gap-4 md:gap-6 pointer-events-auto backdrop-blur-md bg-opacity-95">
            
            <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-4 md:pr-6">
              <Target className="w-6 h-6 text-emerald-500 hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target Kumulatif Mingguan:</span>
                <div className="flex items-center gap-1.5">
                   <input 
                     type="text" 
                     placeholder="0.00"
                     value={targetKumulatif}
                     onChange={(e) => {
                       const val = e.target.value.replace(',', '.');
                       if (isNaN(val) && val !== '.') return;
                       setTargetKumulatif(val);
                     }}
                     className="w-20 h-9 bg-slate-50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-600 text-center font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg text-emerald-700 dark:text-emerald-400 shadow-inner transition-colors"
                   />
                   <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-lg">%</span>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSchedule} disabled={isSaving} className="flex items-center justify-center gap-2 px-6 h-10 md:h-[42px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 transition-all active:scale-95 whitespace-nowrap">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />} Simpan M-{periodForm.minggu_ke}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}