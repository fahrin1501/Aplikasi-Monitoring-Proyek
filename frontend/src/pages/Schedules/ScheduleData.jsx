import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Save, Loader2, AlertTriangle, Edit3, X, 
  ListPlus, CheckCircle2, Trash2, ChevronDown, Layers, CheckSquare
} from 'lucide-react';

// --- IMPORT KOMPONEN MATRIX YANG BARU DIBUAT ---
import ScheduleWorkData from './ScheduleWorkData';

export default function ScheduleData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    document.title = "Prisma Group - Data Jadwal Matrix";
  }, []);

  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);

  const initialProject = location.state || { id: id, nama_proyek: 'Memuat Data...', kategori: 'Memuat...' };
  const [projectData, setProjectData] = useState(initialProject);
  
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState([]); 

  const [saveModal, setSaveModal] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({ show: false, rabItemId: null, weekNum: null, itemName: '' });

  // STATE MODAL BATCH TAMBAH ITEM
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [targetPeriod, setTargetPeriod] = useState({ bulan: '', minggu_ke: '', start: '', end: '' });
  const [modalAddedItems, setModalAddedItems] = useState([]);
  const [draftDivisiId, setDraftDivisiId] = useState('');
  const [draftItemIds, setDraftItemIds] = useState([]); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [weekCumulativeInputs, setWeekCumulativeInputs] = useState({});

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const fetchTimeSchedule = async () => {
    setIsLoading(true);
    try {
      const [projRes, schedRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/schedules`)
      ]);
      setProjectData(projRes.data);
      setScheduleData(schedRes.data.data);
      setLocalSchedules(schedRes.data.data.schedules || []);
      setWeekCumulativeInputs({});
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTimeSchedule(); }, [id]);

  const handleBatalEdit = () => { setIsEditMode(false); fetchTimeSchedule(); };

  const executeDelete = () => {
    setLocalSchedules(prev => prev.filter(s => !(s.rab_item_id === deleteConfig.rabItemId && parseInt(s.minggu_ke) === deleteConfig.weekNum)));
    setDeleteConfig({ show: false, rabItemId: null, weekNum: null, itemName: '' });
  };

  const handleWeekCumulativeChange = (weekNum, value) => {
    const val = value.replace(',', '.');
    if (isNaN(val) && val !== '.') return;

    setWeekCumulativeInputs(prev => ({ ...prev, [weekNum]: val }));

    const valNum = parseFloat(val) || 0;
    const weekItems = localSchedules.filter(s => parseInt(s.minggu_ke) === weekNum);
    const portion = weekItems.length > 0 ? valNum / weekItems.length : 0;

    setLocalSchedules(prev => prev.map(s => {
      if (parseInt(s.minggu_ke) === weekNum) {
        return { ...s, bobot_rencana: portion };
      }
      return s;
    }));
  };

  const openAddItemModalFromMatrix = (weekNum) => {
    const existing = localSchedules.find(s => parseInt(s.minggu_ke) === weekNum);
    setTargetPeriod({
      bulan: existing?.bulan || '',
      minggu_ke: weekNum,
      start: existing?.tanggal_awal || '',
      end: existing?.tanggal_akhir || ''
    });
    setModalAddedItems([]); 
    setDraftDivisiId('');
    setDraftItemIds([]);
    setShowAddItemModal(true);
  };

  const grandTotalRAB = scheduleData ? scheduleData.rab_data.reduce((sum, cat) => 
    sum + cat.items.reduce((itemSum, item) => itemSum + Number(item.total_harga || 0), 0)
  , 0) : 0;

  const getAvailableItemsForModal = () => {
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
      const inModalDraft = modalAddedItems.some(draft => draft.rab_item_id === item.id);
      const inLocalSchedules = localSchedules.some(s => s.rab_item_id === item.id && parseInt(s.minggu_ke) === parseInt(targetPeriod.minggu_ke));
      return !inModalDraft && !inLocalSchedules;
    });
  };

  const availableItemsForModal = getAvailableItemsForModal();

  const toggleItemModal = (itemId) => {
    if (draftItemIds.includes(itemId)) setDraftItemIds(draftItemIds.filter(id => id !== itemId));
    else setDraftItemIds([...draftItemIds, itemId]);
  };

  const handleAddItemsToModalCart = () => {
    if (!draftDivisiId || draftItemIds.length === 0) return alert("Pilih Divisi dan centang Uraian Pekerjaan terlebih dahulu!");
    const itemsToAdd = availableItemsForModal.filter(i => draftItemIds.includes(i.id));

    const newItems = itemsToAdd.map(itemAsli => ({
      rab_item_id: itemAsli.id,
      kode_pekerjaan: itemAsli.kode_pekerjaan || '',
      uraian_pekerjaan: itemAsli.uraian_pekerjaan,
      kategori_nama: itemAsli.kategori_nama,
      bobot_rencana: 0, 
      minggu_ke: parseInt(targetPeriod.minggu_ke),
      bulan: targetPeriod.bulan,
      tanggal_awal: targetPeriod.start,
      tanggal_akhir: targetPeriod.end,
    }));

    setModalAddedItems([...modalAddedItems, ...newItems]);
    setDraftItemIds([]); 
    setIsDropdownOpen(false);
  };

  const handleRemoveFromModalCart = (idToRemove) => {
    setModalAddedItems(modalAddedItems.filter(item => item.rab_item_id !== idToRemove));
  };

  const handleSaveModalCartToWeek = () => {
    if(modalAddedItems.length === 0) return alert("Keranjang kosong! Tambahkan pekerjaan terlebih dahulu.");
    
    const weekNum = parseInt(targetPeriod.minggu_ke);
    const finalizedItems = modalAddedItems.map(item => ({
       ...item,
       bulan: targetPeriod.bulan,
       tanggal_awal: targetPeriod.start,
       tanggal_akhir: targetPeriod.end
    }));

    const updatedSchedules = [...localSchedules, ...finalizedItems];
    const weekItems = updatedSchedules.filter(s => parseInt(s.minggu_ke) === weekNum);
    const existingCumulative = weekCumulativeInputs[weekNum];
    
    if (existingCumulative) {
      const valNum = parseFloat(existingCumulative) || 0;
      const portion = valNum / weekItems.length;
      setLocalSchedules(updatedSchedules.map(s => {
         if (parseInt(s.minggu_ke) === weekNum) return { ...s, bobot_rencana: portion };
         return s;
      }));
    } else {
      setLocalSchedules(updatedSchedules);
    }
    
    setShowAddItemModal(false);
  };

  const handleSaveSchedule = async () => {
    setSaveModal(false);
    setIsSaving(true);
    
    const weeksMap = {};
    localSchedules.forEach(s => {
      if (!weeksMap[s.minggu_ke]) {
        weeksMap[s.minggu_ke] = {
          minggu_ke: parseInt(s.minggu_ke),
          bulan: parseInt(s.bulan) || null,
          tanggal_awal: s.tanggal_awal || null,
          tanggal_akhir: s.tanggal_akhir || null,
          rab_item_ids: []
        };
      }
      weeksMap[s.minggu_ke].rab_item_ids.push(s.rab_item_id);
    });

    const payloadWeeks = Object.values(weeksMap).map(weekData => {
       const eksistingTotal = localSchedules.filter(s => parseInt(s.minggu_ke) === weekData.minggu_ke).reduce((sum, s) => sum + parseFloat(s.bobot_rencana || 0), 0);
       const manualInput = weekCumulativeInputs[weekData.minggu_ke];
       const finalTarget = manualInput !== undefined ? parseFloat(manualInput.toString().replace(',', '.')) || 0 : eksistingTotal;

       return { ...weekData, target_kumulatif: finalTarget };
    });

    try {
      await api.post(`/projects/${id}/schedules`, { full_sync: true, weeks: payloadWeeks });
      alert("Perubahan Target Jadwal Berhasil Disimpan!");
      setIsEditMode(false);
      fetchTimeSchedule();
    } catch (error) {
      alert("Gagal menyimpan perubahan jadwal.");
    } finally {
      setIsSaving(false);
    }
  };

  // Kalkulasi total minggu dinamis
  let maxWeek = scheduleData?.project_info?.total_minggu || 4; 
  if (localSchedules && localSchedules.length > 0) {
    const maxScheduled = Math.max(...localSchedules.map(s => parseInt(s.minggu_ke) || 0));
    if (maxScheduled > maxWeek) maxWeek = maxScheduled;
  }
  const weeksArray = Array.from({length: maxWeek}, (_, i) => i + 1);

  return (
    <div className="w-full space-y-4 md:space-y-5 pb-20 relative animate-fade-in flex flex-col min-h-screen">
      
      {/* HEADER NAVIGASI */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 shrink-0">
        <div className="flex items-start gap-3 shrink-0">
          <button onClick={() => navigate('/projects')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          
          <div>
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
              Matriks Time Schedule
              {isEditMode && <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 font-extrabold tracking-wider">DRAFT MODE</span>}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{projectData?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
                {projectData?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {canCreateData && (
            <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all">
              {!isEditMode && (
                <button 
                  disabled={isLoading} 
                  onClick={() => navigate(`/schedules/${id}/data/input`)} 
                  className="flex items-center justify-center flex-1 lg:flex-none gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ListPlus className="w-4 h-4" /> <span className="hidden sm:inline">Buat Jadwal Pertama</span>
                </button>
              )}
              
              {!isEditMode && <div className="hidden sm:block w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1.5 shrink-0"></div>}
              
              {isEditMode ? (
                <>
                  <button onClick={handleBatalEdit} disabled={isSaving || isLoading} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors border border-slate-300 dark:border-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    <X className="w-3.5 h-3.5" /> Batal Edit
                  </button>
                  <button onClick={() => setSaveModal(true)} disabled={isSaving || isLoading} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg ml-1 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditMode(true)} disabled={isLoading || localSchedules.length === 0} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 px-3 py-2 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Edit3 className="w-3.5 h-3.5" /> Mode Edit Draf
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in backdrop-blur-sm">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Memuat Matrix Jadwal...</p>
        </div>
      ) : (
        <ScheduleWorkData 
          scheduleData={scheduleData}
          localSchedules={localSchedules}
          isEditMode={isEditMode}
          canCreateData={canCreateData}
          weeksArray={weeksArray}
          grandTotalRAB={grandTotalRAB}
          weekCumulativeInputs={weekCumulativeInputs}
          handleWeekCumulativeChange={handleWeekCumulativeChange}
          openAddItemModalFromMatrix={openAddItemModalFromMatrix}
          setDeleteConfig={setDeleteConfig}
        />
      )}

      {/* --- MODAL BATCH TAMBAH PEKERJAAN (EDIT MODE) --- */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Tambah Pekerjaan ke M-{targetPeriod.minggu_ke}
                </h3>
              </div>
              <button onClick={() => setShowAddItemModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute top-4 right-4"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40">
               {/* TANGGAL MINGGUAN */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/60">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan Ke- <span className="text-slate-400 font-normal">(Ops)</span></label>
                   <input type="number" min="1" value={targetPeriod.bulan} onChange={(e) => setTargetPeriod({...targetPeriod, bulan: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Mulai <span className="text-rose-500">*</span></label>
                   <input type="date" value={targetPeriod.start} onChange={(e) => setTargetPeriod({...targetPeriod, start: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm [color-scheme:light_dark]" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Selesai <span className="text-rose-500">*</span></label>
                   <input type="date" value={targetPeriod.end} onChange={(e) => setTargetPeriod({...targetPeriod, end: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm [color-scheme:light_dark]" />
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                 {/* KOTAK 1: PILIH DIVISI */}
                 <div className="md:col-span-5 space-y-1.5 relative">
                   <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Pilih Mode Filter Divisi</label>
                   <select 
                     value={draftDivisiId} 
                     onChange={(e) => { 
                        setDraftDivisiId(e.target.value); 
                        setDraftItemIds([]); 
                        setIsDropdownOpen(false);
                     }} 
                     className="w-full h-[42px] px-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm transition-colors"
                   >
                     <option value="" disabled>-- Pilih Filter List Pekerjaan --</option>
                     <option value="all" className="font-extrabold text-blue-600 dark:text-blue-400">❖ TAMPILKAN SEMUA PEKERJAAN LINTAS DIVISI</option>
                     {scheduleData?.rab_data.map(cat => (
                       <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                     ))}
                   </select>
                 </div>
                 
                 <div className="md:col-span-5 space-y-1.5 relative" ref={dropdownRef}>
                   <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">Centang Uraian Pekerjaan</label>
                   <div 
                      onClick={() => { if(draftDivisiId && availableItemsForModal.length > 0) setIsDropdownOpen(!isDropdownOpen) }}
                      className={`w-full h-[42px] px-3 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs shadow-sm flex items-center justify-between transition-colors ${(!draftDivisiId || availableItemsForModal.length === 0) ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer hover:border-emerald-400'}`}
                   >
                     <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {!draftDivisiId 
                          ? '-- Pilih Mode Divisi Dulu --' 
                          : availableItemsForModal.length === 0 
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
                           <button onClick={() => setDraftItemIds(availableItemsForModal.map(i => i.id))} className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 px-2 py-1.5 rounded transition-colors"><CheckSquare className="w-3.5 h-3.5"/> Pilih Semua</button>
                           <button onClick={() => setDraftItemIds([])} className="text-[10px] font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 px-3 py-1.5 rounded transition-colors">Kosongkan</button>
                        </div>
                        <div className="max-h-72 overflow-y-auto custom-scrollbar">
                          {availableItemsForModal.map(item => (
                            <div 
                              key={item.id} 
                              onClick={() => toggleItemModal(item.id)}
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
                                  <span className="text-[9px] text-amber-600 dark:text-amber-500 mr-1.5 uppercase font-bold mt-0.5">{item.kategori_nama}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                   )}
                 </div>

                 <div className="md:col-span-2">
                   <button 
                     onClick={handleAddItemsToModalCart} 
                     disabled={!draftDivisiId || draftItemIds.length === 0} 
                     className="w-full h-[42px] px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95 text-xs whitespace-nowrap"
                   >
                     <ListPlus className="w-4 h-4 shrink-0" /> Tambah
                   </button>
                 </div>
               </div>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[200px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-900/80 sticky top-0 z-10 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shadow-sm border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    <th className="p-3 w-[10%] text-center border-r border-slate-200 dark:border-slate-700/60">No</th>
                    <th className="p-3 w-[75%] border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan Tersimpan</th>
                    <th className="p-3 text-center w-[15%]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                  {modalAddedItems.length === 0 ? (
                     <tr><td colSpan="3" className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Belum ada pekerjaan yang ditambahkan ke keranjang ini.</td></tr>
                  ) : (
                    modalAddedItems.map((item, index) => (
                      <tr key={item.rab_item_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4 border-r border-slate-200 dark:border-slate-700/60 text-center align-middle font-mono font-bold text-slate-500">{index + 1}</td>
                        <td className="p-4 border-r border-slate-200 dark:border-slate-700/60">
                          <div className="font-bold text-[12px] leading-snug line-clamp-2" title={item.uraian_pekerjaan}>{item.kode_pekerjaan ? `${item.kode_pekerjaan} ` : ''}{item.uraian_pekerjaan}</div>
                          <div className="text-[9px] text-amber-600 dark:text-amber-500 mt-1 uppercase font-semibold">{item.kategori_nama}</div>
                        </td>
                        <td className="p-2 text-center align-middle">
                          <button 
                            onClick={() => handleRemoveFromModalCart(item.rab_item_id)}
                            className="p-2 mx-auto flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
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

            <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end items-center gap-3 shrink-0">
              <button onClick={() => setShowAddItemModal(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={handleSaveModalCartToWeek} disabled={modalAddedItems.length === 0} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" /> Simpan ke Minggu {targetPeriod.minggu_ke}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI SIMPAN --- */}
      {saveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-500/30">
              <Save className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Simpan Perubahan?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Target rencana kerja matriks akan diperbarui dan diterapkan langsung ke database.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSaveModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={handleSaveSchedule} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <CheckCircle2 className="w-4 h-4" /> Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL HAPUS 1 BARIS --- */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/30">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus dari M-{deleteConfig.weekNum}?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Anda yakin ingin menghapus jadwal <span className="font-bold text-slate-700 dark:text-slate-300">"{deleteConfig.itemName}"</span> pada minggu ini?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, rabItemId: null, weekNum: null, itemName: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 text-xs transition-colors">
                <Trash2 className="w-4 h-4" /> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}