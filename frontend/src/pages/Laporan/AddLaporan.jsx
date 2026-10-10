import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api'; 
import { 
  ArrowLeft, Building2, MapPin, Calendar, UserCheck, ChevronDown, Loader2, AlertCircle, CheckCircle2,
  Save, X, Sun, Plus, Trash2, FileText, Users, Wrench, UploadCloud, Image as ImageIcon, Paperclip
} from 'lucide-react';
import KegiatanGeografisAdd from './KomponenAddLaporan/KegiatanGeografisAdd';

const defaultPersonilList = [
  'Dinas PUPR', 'Konsultan', 'Kontraktor', 'Kepala Kerja/Mandor', 'Pekerja', 'Tukang', 'Supir', 'Operator', 'Surveyor'
];

const defaultPeralatanList = [
  'Excavator', 'Dump Truck', 'Water Past', 'Theodolith', 'Concrete Mixer', 'Jack Hammer', 'Mesin Alcon', 'Mesin Las', 'Alat bantu'
];

export default function AddLaporan() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // STATE API DATA
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(editData?.project_id || '');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [rabOptions, setRabOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingRab, setIsLoadingRab] = useState(false);

  // STATE FORM TERPISAH
  const [formData, setFormData] = useState({ 
    tanggalPengawasan: editData?.tanggalPengawasan || new Date().toISOString().split('T')[0], 
    minggu_ke: editData?.minggu_ke || '', 
    namaPengawas: editData?.namaPengawas || '', 
    lokasi: editData?.lokasi || '', 
    catatan: editData?.catatan || '' 
  });
  
  const [cuacaItems, setCuacaItems] = useState([{ id: Date.now(), kondisi: 'Cerah', keterangan: '' }]);
  const [kegiatanItems, setKegiatanItems] = useState([{ id: Date.now(), rab_item_id: null, uraian: '', sta_awal: '', sta_akhir: '', volume: '', satuan: '', persentase: '' }]);
  const [personilItems, setPersonilItems] = useState([]);
  const [peralatanItems, setPeralatanItems] = useState([]);
  const [fotoLampiran, setFotoLampiran] = useState([]);
  const [dokumenLampiran, setDokumenLampiran] = useState([]);

  // STATE MODAL
  const [showPersonilModal, setShowPersonilModal] = useState(false);
  const [personilForm, setPersonilForm] = useState({ peran: '', jumlah: '' });
  const [showPeralatanModal, setShowPeralatanModal] = useState(false);
  const [peralatanForm, setPeralatanForm] = useState({ namaAlat: '', jumlah: '' });

  useEffect(() => {
    document.title = "Prisma Group - Input Laporan Harian";
    api.get('/projects-active-report').then(res => setProjects(res.data?.data || [])).finally(() => setIsLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) { setRabOptions([]); setScheduleData(null); return; }
    setIsLoadingRab(true);
    api.get(`/projects/${selectedProjectId}/schedules`).then(res => {
      setScheduleData(res.data.data);
      setFormData(prev => ({ ...prev, minggu_ke: '' }));
      const flattened = [];
      res.data.data.rab_data.forEach(kat => kat.items.forEach(item => {
        if (!item.is_subheader) flattened.push({ 
          id: item.id, 
          uraian: item.uraian_pekerjaan, 
          satuan: item.satuan, 
          volume: item.volume, 
          total_harga: item.total_harga, 
          kategori_nama: kat.nama_kategori 
        });
      }));
      setRabOptions(flattened);
    }).finally(() => setIsLoadingRab(false));
  }, [selectedProjectId]);

  const availableWeeks = scheduleData?.schedules ? [...new Set(scheduleData.schedules.map(s => parseInt(s.minggu_ke)))].sort((a, b) => a - b) : [];
  let optionsMingguIni = []; let optionsMingguLain = []; let scheduledItemsMap = new Map();
  
  if (scheduleData && scheduleData.schedules) {
    scheduleData.schedules.forEach(sched => {
      let detailItem = null; let namaKategori = '';
      scheduleData.rab_data.forEach(cat => { const itemMatch = cat.items.find(i => i.id === sched.rab_item_id); if (itemMatch) { detailItem = itemMatch; namaKategori = cat.nama_kategori; } });
      if (detailItem) {
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(formData.minggu_ke);
        if (!scheduledItemsMap.has(sched.rab_item_id)) scheduledItemsMap.set(sched.rab_item_id, { ...detailItem, kategori: namaKategori, is_this_week: isThisWeek });
        else if (isThisWeek) scheduledItemsMap.get(sched.rab_item_id).is_this_week = true;
      }
    });
    scheduledItemsMap.forEach(value => value.is_this_week ? optionsMingguIni.push(value) : optionsMingguLain.push(value));
  }
  const unscheduledRabOptions = rabOptions.filter(opt => !scheduledItemsMap.has(opt.id));

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // HANDLERS FILE & MODAL
  const handleUploadFile = (e, type) => {
    const files = Array.from(e.target.files).filter(file => {
      const limit = type === 'foto' ? 2 : 5;
      if (file.size > limit * 1024 * 1024) { alert(`File ${file.name} terlalu besar. Maksimal ${limit}MB.`); return false; }
      return true;
    });
    if (type === 'foto') setFotoLampiran([...fotoLampiran, ...files]);
    else setDokumenLampiran([...dokumenLampiran, ...files]);
    e.target.value = null;
  };
  const handleDeleteFile = (idx, type) => {
    if (type === 'foto') setFotoLampiran(fotoLampiran.filter((_, i) => i !== idx));
    else setDokumenLampiran(dokumenLampiran.filter((_, i) => i !== idx));
  };

  const addPersonil = (e) => { e.preventDefault(); setPersonilItems([...personilItems, { id: Date.now(), ...personilForm }]); setPersonilForm({ peran: '', jumlah: '' }); setShowPersonilModal(false); };
  const addAlat = (e) => { e.preventDefault(); setPeralatanItems([...peralatanItems, { id: Date.now(), ...peralatanForm }]); setPeralatanForm({ namaAlat: '', jumlah: '' }); setShowPeralatanModal(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return alert("Pilih Proyek terlebih dahulu.");
    if (!formData.minggu_ke) return alert("Pilih Minggu Ke- laporan ini.");
    setSubmitting(true); setErrorMsg('');
    
    try {
      const payload = new FormData();
      payload.append('tanggal', formData.tanggalPengawasan);
      payload.append('minggu_ke', formData.minggu_ke); 
      payload.append('pengawas', formData.namaPengawas);
      payload.append('lokasi', formData.lokasi);
      payload.append('catatan', formData.catatan); 
      
      const cuacaGabungan = cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | ');
      payload.append('cuaca', cuacaGabungan);
      payload.append('kondisi_cuaca', JSON.stringify(cuacaItems));
      
      // Kirim Array kegiatan langsung (semua parameter manual dan RAB dicampur dalam satu array JSON)
      payload.append('kegiatan', JSON.stringify(kegiatanItems));
      payload.append('personil', JSON.stringify(personilItems));
      payload.append('peralatan', JSON.stringify(peralatanItems));

      fotoLampiran.forEach(file => payload.append('foto[]', file));
      dokumenLampiran.forEach(file => payload.append('lampiran[]', file));

      await api.post(`/projects/${selectedProjectId}/daily-reports`, payload, { headers: { 'Content-Type': 'multipart/form-data' }});
      setSubmittedSuccess(true);
      setTimeout(() => navigate('/laporan'), 1500); 
    } catch (error) {
      setErrorMsg("Gagal menyimpan laporan. Silakan periksa kembali data Anda.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active {
            -webkit-transition: "color 9999s ease-out, background-color 9999s ease-out";
            -webkit-transition-delay: 9999s;
        }
      `}</style>

      <datalist id="peran-options">{defaultPersonilList.map(p => <option key={p} value={p} />)}</datalist>
      <datalist id="alat-options">{defaultPeralatanList.map(a => <option key={a} value={a} />)}</datalist>

      {/* HEADER */}
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
      {submittedSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs shadow-sm"><CheckCircle2 className="w-5 h-5 shrink-0" /><span>Laporan berhasil dikirim! Mengalihkan...</span></div>}

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        
        {/* INFO PENGAWASAN */}
        <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-5 backdrop-blur-sm">
          <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <Building2 className="w-4 h-4" /> Informasi Pengawasan
          </label>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Pilih Proyek yang Diawasi <span className="text-rose-500">*</span>
            </label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800/30">
                <Loader2 className="w-4 h-4 animate-spin" /> Sedang memuat daftar proyek...
              </div>
            ) : (
              <div className="relative">
                <select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner transition-colors">
                  <option value="" disabled>-- Klik di sini untuk memilih Proyek --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.nama_proyek} (SPK: {p.kode_kontrak || '-'})</option>)}
                </select>
                <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tgl Pengawasan <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" name="tanggalPengawasan" required value={formData.tanggalPengawasan} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner [color-scheme:light_dark] transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Minggu Ke- <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select name="minggu_ke" required value={formData.minggu_ke} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-inner cursor-pointer transition-colors">
                  <option value="" disabled>-- Pilih Minggu --</option>
                  {availableWeeks.length > 0 ? (
                    availableWeeks.map(w => <option key={w} value={w}>Minggu Ke-{w}</option>)
                  ) : (
                    <option value="" disabled>{selectedProjectId ? "Kosong (Buat di Kurva S)" : "Pilih proyek dahulu"}</option>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nama Pengawas <span className="text-rose-500">*</span></label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="namaPengawas" required value={formData.namaPengawas} onChange={handleInputChange} placeholder="Ketik nama pengawas" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lokasi Proyek <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="lokasi" required value={formData.lokasi} onChange={handleInputChange} placeholder="Contoh: Banjarmasin" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {selectedProjectId && (
          <>
            {/* CUACA & CATATAN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
              <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
                  <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><Sun className="w-4 h-4" /> Cuaca Lapangan</label>
                  <button type="button" onClick={() => { if (cuacaItems.length < 4) setCuacaItems([...cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }]); }} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Tambah</button>
                </div>
                <div className="space-y-4 mt-4 flex-1">
                  {cuacaItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 relative shadow-sm">
                      {cuacaItems.length > 1 && (
                        <button type="button" onClick={() => setCuacaItems(cuacaItems.filter(c => c.id !== item.id))} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-md"><Trash2 className="w-3 h-3" /></button>
                      )}
                      <div className="relative sm:col-span-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kondisi <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <select value={item.kondisi} onChange={(e) => { const newC = [...cuacaItems]; newC[index].kondisi = e.target.value; setCuacaItems(newC); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-inner transition-colors">
                            <option value="Cerah">Cerah</option><option value="Berawan">Berawan</option><option value="Hujan Gerimis">Gerimis</option><option value="Hujan Lebat">Hujan Lebat</option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="sm:col-span-2 space-y-1.5">
                         <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Waktu / Durasi</label>
                         <input type="text" value={item.keterangan} onChange={(e) => { const newC = [...cuacaItems]; newC[index].keterangan = e.target.value; setCuacaItems(newC); }} placeholder="Contoh: 08:00 - 12:00..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
                <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4"><FileText className="w-4 h-4" /> Catatan Tambahan</label>
                <textarea name="catatan" value={formData.catatan} onChange={handleInputChange} placeholder="Tuliskan kendala atau instruksi khusus di sini..." className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner custom-scrollbar transition-colors" />
              </div>
            </div>

            {/* KEGIATAN GEOGRAFIS - DI-INJECT GRAND TOTAL RAB & KUMULATIF */}
            <KegiatanGeografisAdd 
              kegiatanItems={kegiatanItems} 
              setKegiatanItems={setKegiatanItems} 
              rabOptions={rabOptions} 
              isLoadingRab={isLoadingRab}
              optionsMingguIni={optionsMingguIni} 
              optionsMingguLain={optionsMingguLain} 
              unscheduledRabOptions={unscheduledRabOptions}
              grandTotalRab={scheduleData?.grand_total_rab} 
              cumulativeActuals={scheduleData?.cumulative_actual}
            />

            {/* PERSONIL & ALAT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
              <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
                  <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex gap-2 uppercase tracking-wider"><Users className="w-4 h-4" /> Personil Lapangan</h2>
                  <button type="button" onClick={() => setShowPersonilModal(true)} className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 font-bold transition-colors shadow-sm"><Plus className="w-3.5 h-3.5 inline"/> Tambah</button>
                </div>
                <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                  {personilItems.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada personil diinput</p></div>
                  ) : (
                    personilItems.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.peran}</span>
                        <div className="flex gap-3 items-center">
                          <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md font-mono text-xs font-bold">{p.jumlah} Org</span>
                          <button type="button" onClick={() => setPersonilItems(personilItems.filter(i => i.id !== p.id))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
                  <h2 className="text-xs font-bold text-blue-600 dark:text-blue-500 flex gap-2 uppercase tracking-wider"><Wrench className="w-4 h-4" /> Pemakaian Alat</h2>
                  <button type="button" onClick={() => setShowPeralatanModal(true)} className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30 font-bold transition-colors shadow-sm"><Plus className="w-3.5 h-3.5 inline"/> Tambah</button>
                </div>
                <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                  {peralatanItems.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada alat diinput</p></div>
                  ) : (
                    peralatanItems.map(a => (
                      <div key={a.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{a.namaAlat}</span>
                        <div className="flex gap-3 items-center">
                          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md font-mono text-xs font-bold">{a.jumlah} Unit</span>
                          <button type="button" onClick={() => setPeralatanItems(peralatanItems.filter(i => i.id !== a.id))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* FOTO & DOKUMEN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
              <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
                  <h2 className="text-xs font-bold text-amber-600 dark:text-amber-500 flex gap-2 uppercase tracking-wider"><ImageIcon className="w-4 h-4"/> Dokumentasi (Foto)</h2>
                  <input type="file" id="fUploadAdd" hidden multiple accept="image/*" onChange={(e) => handleUploadFile(e, 'foto')}/>
                  <button type="button" onClick={() => document.getElementById('fUploadAdd').click()} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><UploadCloud className="w-3.5 h-3.5 inline"/> Upload</button>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {fotoLampiran.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada foto terlampir</p></div>
                  ) : (
                     fotoLampiran.map((f, i) => (
                       <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                         <span className="text-xs font-bold text-slate-800 dark:text-white truncate pr-2">{f.name}</span>
                         <button type="button" onClick={() => handleDeleteFile(i, 'foto')} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                       </div>
                     ))
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
                <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
                  <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex gap-2 uppercase tracking-wider"><Paperclip className="w-4 h-4"/> File Dokumen (Ops)</h2>
                  <input type="file" id="dUploadAdd" hidden multiple accept=".pdf,.xls,.xlsx,.doc,.docx" onChange={(e) => handleUploadFile(e, 'doc')}/>
                  <button type="button" onClick={() => document.getElementById('dUploadAdd').click()} className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-colors shadow-sm"><UploadCloud className="w-3.5 h-3.5 inline"/> Upload</button>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                  {dokumenLampiran.length === 0 ? (
                     <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada berkas terlampir</p></div>
                  ) : (
                     dokumenLampiran.map((d, i) => (
                       <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                         <span className="text-xs font-bold text-slate-800 dark:text-white truncate pr-2">{d.name}</span>
                         <button type="button" onClick={() => handleDeleteFile(i, 'dokumen')} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                       </div>
                     ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
              <button type="button" onClick={() => navigate('/laporan')} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm transition-colors text-xs flex items-center justify-center gap-2"><X className="w-4 h-4 inline mr-1" /> Batal</button>
              <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : <CheckCircle2 className="w-4 h-4 inline mr-1" />} Simpan Laporan Harian
              </button>
            </div>
          </>
        )}
      </form>

      {/* MODAL PERSONIL & ALAT */}
      {showPersonilModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-500"/> Tambah Personil</h3>
              <button type="button" onClick={() => setShowPersonilModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={addPersonil}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Nama Jabatan <span className="text-rose-500">*</span></label>
                  <input required list="peran-options" placeholder="Contoh: Pekerja..." value={personilForm.peran} onChange={e=>setPersonilForm({...personilForm, peran:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Orang <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" placeholder="0" value={personilForm.jumlah} onChange={e=>setPersonilForm({...personilForm, jumlah:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button type="button" onClick={()=>setShowPersonilModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors">Simpan Personil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPeralatanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-500"/> Tambah Alat</h3>
              <button type="button" onClick={() => setShowPeralatanModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={addAlat}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Peralatan <span className="text-rose-500">*</span></label>
                  <input required list="alat-options" placeholder="Contoh: Excavator..." value={peralatanForm.namaAlat} onChange={e=>setPeralatanForm({...peralatanForm, namaAlat:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Unit <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" placeholder="0" value={peralatanForm.jumlah} onChange={e=>setPeralatanForm({...peralatanForm, jumlah:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button type="button" onClick={()=>setShowPeralatanModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors">Simpan Alat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}