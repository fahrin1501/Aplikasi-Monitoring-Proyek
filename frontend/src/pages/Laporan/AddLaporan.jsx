import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api'; 
import { 
  ArrowLeft, Building2, MapPin, Calendar, UserCheck, 
  CheckCircle2, Save, Loader2, AlertCircle, ChevronDown, X
} from 'lucide-react';

// IMPORT KOMPONEN MODULAR
import CuacaLapangan from './IsiLaporan/CuacaLapangan';
import KegiatanGeografis from './IsiLaporan/KegiatanGeografis';
import { PersonilCard, PeralatanCard } from './IsiLaporan/PersonilAlatLaporan';
import { FotoCard, DokumenCard } from './IsiLaporan/LampiranDokumentasi';

const defaultPersonilList = [
  'Dinas PUPR', 'Konsultan', 'Kontraktor', 'Kepala Kerja/Mandor', 
  'Pekerja', 'Tukang', 'Supir', 'Operator', 'Surveyor'
];

const defaultPeralatanList = [
  'Excavator', 'Dump Truck', 'Water Past', 'Theodolith', 
  'Concrete Mixer', 'Jack Hammer', 'Mesin Alcon', 'Mesin Las', 'Alat bantu'
];

export default function AddLaporan() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(editData?.project_id || '');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  
  const [rabOptions, setRabOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingRab, setIsLoadingRab] = useState(false);

  // STATE SENTRAL PENGGANTI FORMDATA (Selaras dengan komponen modular)
  const [editForm, setEditForm] = useState({
    tanggal: editData?.tanggalPengawasan || new Date().toISOString().split('T')[0],
    minggu_ke: editData?.minggu_ke || '',
    pengawas: editData?.namaPengawas || '',
    lokasi: editData?.lokasi || '',
    catatan: editData?.catatan || '',
    cuacaItems: [{ id: Date.now(), kondisi: 'Cerah', keterangan: '' }],
    activities: [{ id: Date.now(), rab_item_id: null, uraian: '', sta_awal: '', sta_akhir: '', volume: '', satuan: '', persentase: '' }],
    personnels: editData?.personil || [],
    equipments: editData?.peralatan || []
  });

  const [fotoLampiran, setFotoLampiran] = useState([]);
  const [dokumenLampiran, setDokumenLampiran] = useState([]);

  // State Modal Personil & Alat
  const [showPersonilModal, setShowPersonilModal] = useState(false);
  const [personilForm, setPersonilForm] = useState({ id: null, peran: '', jumlah: '', index: null });
  const [showPeralatanModal, setShowPeralatanModal] = useState(false);
  const [peralatanForm, setPeralatanForm] = useState({ id: null, namaAlat: '', jumlah: '', index: null });

  useEffect(() => {
    document.title = "Prisma Group - Input Laporan Harian";
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects-active-report');
        setProjects(res.data?.data || res.data || []);
      } catch (error) {
        console.error("Gagal mengambil data proyek:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) { setRabOptions([]); setScheduleData(null); return; }

    const fetchScheduleAndRAB = async () => {
      setIsLoadingRab(true);
      try {
        const res = await api.get(`/projects/${selectedProjectId}/schedules`);
        const data = res.data.data;
        setScheduleData(data);
        setEditForm(prev => ({ ...prev, minggu_ke: '' }));

        const flattenedItems = [];
        data.rab_data.forEach(kategori => {
          kategori.items.forEach(item => {
            if (!item.is_subheader) {
              flattenedItems.push({ id: item.id, uraian: item.uraian_pekerjaan, satuan: item.satuan, kategori_nama: kategori.nama_kategori });
            }
          });
        });
        setRabOptions(flattenedItems);
      } catch (error) {
        console.error("Gagal mengambil data jadwal/RAB:", error);
      } finally {
        setIsLoadingRab(false);
      }
    };

    fetchScheduleAndRAB();
  }, [selectedProjectId]);

  const availableWeeks = scheduleData?.schedules
    ? [...new Set(scheduleData.schedules.map(s => parseInt(s.minggu_ke)))].sort((a, b) => a - b)
    : [];

  let optionsMingguIni = [];
  let optionsMingguLain = [];
  let scheduledItemsMap = new Map();

  if (scheduleData && scheduleData.schedules) {
    scheduleData.schedules.forEach(sched => {
      let detailItem = null;
      let namaKategori = '';
      
      scheduleData.rab_data.forEach(cat => {
        const itemMatch = cat.items.find(i => i.id === sched.rab_item_id);
        if (itemMatch) { detailItem = itemMatch; namaKategori = cat.nama_kategori; }
      });

      if (detailItem) {
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(editForm.minggu_ke);
        if (!scheduledItemsMap.has(sched.rab_item_id)) {
          scheduledItemsMap.set(sched.rab_item_id, { ...detailItem, kategori: namaKategori, is_this_week: isThisWeek });
        } else if (isThisWeek) {
          scheduledItemsMap.get(sched.rab_item_id).is_this_week = true;
        }
      }
    });

    scheduledItemsMap.forEach(value => {
      if (value.is_this_week) optionsMingguIni.push(value);
      else optionsMingguLain.push(value);
    });
  }

  const unscheduledRabOptions = rabOptions.filter(opt => !scheduledItemsMap.has(opt.id));

  // Handlers Modal 
  const openPersonilModal = (item = null, index = null) => {
    if (item) setPersonilForm({ id: item.id || Date.now(), peran: item.peran, jumlah: item.jumlah, index: index });
    else setPersonilForm({ id: Date.now(), peran: '', jumlah: '', index: null });
    setShowPersonilModal(true);
  };
  const savePersonil = (e) => {
    e.preventDefault();
    const newArr = [...editForm.personnels];
    if (personilForm.index !== null) newArr[personilForm.index] = { id: personilForm.id, peran: personilForm.peran, jumlah: personilForm.jumlah };
    else newArr.push({ id: personilForm.id, peran: personilForm.peran, jumlah: personilForm.jumlah });
    setEditForm({...editForm, personnels: newArr}); setShowPersonilModal(false);
  };

  const openPeralatanModal = (item = null, index = null) => {
    if (item) setPeralatanForm({ id: item.id || Date.now(), namaAlat: item.nama_alat || item.namaAlat, jumlah: item.jumlah, index: index });
    else setPeralatanForm({ id: Date.now(), namaAlat: '', jumlah: '', index: null });
    setShowPeralatanModal(true);
  };
  const savePeralatan = (e) => {
    e.preventDefault();
    const newArr = [...editForm.equipments];
    if (peralatanForm.index !== null) newArr[peralatanForm.index] = { id: peralatanForm.id, nama_alat: peralatanForm.namaAlat, jumlah: peralatanForm.jumlah };
    else newArr.push({ id: peralatanForm.id, nama_alat: peralatanForm.namaAlat, jumlah: peralatanForm.jumlah });
    setEditForm({...editForm, equipments: newArr}); setShowPeralatanModal(false);
  };

  const handleUploadFile = (e, type) => {
    const files = Array.from(e.target.files).filter(file => {
      const limit = type === 'foto' ? 2 : 5;
      if (file.size > limit * 1024 * 1024) { alert(`File ${file.name} terlalu besar. Maksimal ${limit}MB.`); return false; }
      return true;
    });
    if (type === 'foto') setFotoLampiran([...fotoLampiran, ...files]);
    else setDokumenLampiran([...dokumenLampiran, ...files]);
  };
  const handleDeleteFile = (index, type) => {
    if (type === 'foto') setFotoLampiran(fotoLampiran.filter((_, i) => i !== index));
    else setDokumenLampiran(dokumenLampiran.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return alert("Silakan Pilih Proyek terlebih dahulu.");
    if (!editForm.minggu_ke) return alert("Silakan Pilih Minggu Ke-berapa laporan ini dibuat.");

    setSubmitting(true); setErrorMsg('');
    
    try {
      const payload = new FormData();
      payload.append('tanggal', editForm.tanggal);
      payload.append('minggu_ke', editForm.minggu_ke); 
      payload.append('pengawas', editForm.pengawas);
      payload.append('lokasi', editForm.lokasi);
      payload.append('catatan', editForm.catatan); 
      
      const cuacaGabungan = editForm.cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | ');
      payload.append('cuaca', cuacaGabungan);
      payload.append('kondisi_cuaca', JSON.stringify(editForm.cuacaItems));

      const payloadKegiatan = editForm.activities.map(k => ({
        rab_item_id: k.rab_item_id, uraian: k.uraian, sta_awal: k.sta_awal, sta_akhir: k.sta_akhir, volume: k.volume, satuan: k.satuan, persentase: k.persentase 
      }));

      payload.append('kegiatan', JSON.stringify(payloadKegiatan));
      payload.append('personil', JSON.stringify(editForm.personnels));
      payload.append('peralatan', JSON.stringify(editForm.equipments));

      fotoLampiran.forEach(file => payload.append('foto[]', file));
      dokumenLampiran.forEach(file => payload.append('lampiran[]', file));

      await api.post(`/projects/${selectedProjectId}/daily-reports`, payload, { headers: { 'Content-Type': 'multipart/form-data' }});
      setSubmitting(false); setSubmittedSuccess(true);
      setTimeout(() => navigate('/laporan'), 1500); 

    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Gagal menyimpan laporan. Cek koneksi server.");
      setSubmitting(false);
    }
  };

  const dummyReportData = { 
    project: projects.find(p => p.id === selectedProjectId), 
    attachments: [...fotoLampiran.map(f => ({ tipe: 'foto', nama_file: f.name })), ...dokumenLampiran.map(d => ({ tipe: 'dokumen', nama_file: d.name }))]
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
      `}</style>

      <datalist id="peran-options">{defaultPersonilList.map(p => <option key={p} value={p} />)}</datalist>
      <datalist id="alat-options">{defaultPeralatanList.map(a => <option key={a} value={a} />)}</datalist>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button onClick={() => navigate('/laporan')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">Input Laporan Harian Baru</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Entri data pengawasan cuaca, personil, peralatan, dan rincian pekerjaan</p>
          </div>
        </div>
      </div>

      {errorMsg && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-600 text-xs font-medium shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{errorMsg}</span></div>}
      {submittedSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs shadow-sm"><CheckCircle2 className="w-5 h-5 shrink-0" /><span>Laporan Harian berhasil dikirim dan terdaftar di database. Mengalihkan...</span></div>}

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        
        {/* BLOK UI INFORMASI PENGAWASAN YANG CANTIK (DIKEMBALIKAN KE ADD LAPORAN) */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm">
          <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-2">
            <Building2 className="w-4 h-4" /> Informasi Pengawasan
          </label>
          
          <div className="space-y-1.5 pb-2">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Pilih Proyek yang Diawasi <span className="text-rose-500">*</span>
            </label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-50 p-3 rounded-xl border border-amber-200"><Loader2 className="w-4 h-4 animate-spin" /> Sedang memuat daftar proyek...</div>
            ) : (
              <div className="relative">
                <select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-sm transition-colors">
                  <option value="" disabled>-- Klik di sini untuk memilih Proyek --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nama_proyek} (SPK: {p.kode_kontrak || '-'})</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tgl Pengawasan <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner [color-scheme:light_dark] transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Minggu Ke- <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select value={editForm.minggu_ke} onChange={e => setEditForm({...editForm, minggu_ke: e.target.value})} required className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-inner cursor-pointer transition-colors">
                  <option value="" disabled>-- Pilih Minggu --</option>
                  {availableWeeks.length > 0 ? (
                    availableWeeks.map(w => <option key={w} value={w}>Minggu Ke-{w}</option>)
                  ) : (
                    <option value="" disabled>{selectedProjectId ? "Belum ada jadwal minggu dibuat" : "Pilih proyek dahulu"}</option>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nama Pengawas <span className="text-rose-500">*</span></label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={editForm.pengawas} onChange={e => setEditForm({...editForm, pengawas: e.target.value})} required placeholder="Ketik nama Anda" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lokasi Proyek <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={editForm.lokasi} onChange={e => setEditForm({...editForm, lokasi: e.target.value})} required placeholder="Contoh: Belitung Darat" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
          <CuacaLapangan isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} />
          
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-sm p-4 md:p-5 rounded-2xl flex flex-col h-full backdrop-blur-sm">
             <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-3 shrink-0">
               <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Catatan Tambahan Laporan</h3>
             </div>
             <textarea name="catatan" value={editForm.catatan} onChange={(e) => setEditForm({...editForm, catatan: e.target.value})} placeholder="Tuliskan catatan khusus, kendala lapangan, atau instruksi pengawas di sini..." className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner custom-scrollbar transition-colors" />
          </div>
        </div>

        <KegiatanGeografis 
          isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm}
          rabOptions={rabOptions} isLoadingRab={isLoadingRab} mingguKe={editForm.minggu_ke}
          optionsMingguIni={optionsMingguIni} optionsMingguLain={optionsMingguLain} unscheduledRabOptions={unscheduledRabOptions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
          <PersonilCard isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} openPersonilModal={openPersonilModal} />
          <PeralatanCard isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} openPeralatanModal={openPeralatanModal} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
          <FotoCard isEditMode={true} reportData={dummyReportData} handleUploadFile={(e) => handleUploadFile(e, 'foto')} handleDeleteFile={(idx) => handleDeleteFile(idx, 'foto')} getDocUrl={() => '#'} />
          <DokumenCard isEditMode={true} reportData={dummyReportData} handleUploadFile={(e) => handleUploadFile(e, 'dokumen')} handleDeleteFile={(idx) => handleDeleteFile(idx, 'dokumen')} getDocUrl={() => '#'} />
        </div>

        {/* Action Submit */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
          <button type="button" onClick={() => navigate('/laporan')} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm transition-colors text-xs flex items-center justify-center gap-2"><X className="w-4 h-4" /> Batal</button>
          <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Memproses Data...' : 'Simpan Laporan Harian'}
          </button>
        </div>
      </form>

      {/* MODALS PERSONIL & PERALATAN */}
      {showPersonilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-500"/> Form Personil</h3>
              <button onClick={() => setShowPersonilModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={savePersonil}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Jabatan <span className="text-rose-500">*</span></label>
                  <input type="text" required list="peran-options" value={personilForm.peran} onChange={(e) => setPersonilForm({...personilForm, peran: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Orang <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={personilForm.jumlah} onChange={(e) => setPersonilForm({...personilForm, jumlah: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner transition-colors" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPersonilModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors">Simpan Personil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPeralatanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-500"/> Form Peralatan</h3>
              <button onClick={() => setShowPeralatanModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={savePeralatan}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Peralatan <span className="text-rose-500">*</span></label>
                  <input type="text" required list="alat-options" value={peralatanForm.namaAlat} onChange={(e) => setPeralatanForm({...peralatanForm, namaAlat: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Unit <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={peralatanForm.jumlah} onChange={(e) => setPeralatanForm({...peralatanForm, jumlah: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner transition-colors" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPeralatanModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors">Simpan Alat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}