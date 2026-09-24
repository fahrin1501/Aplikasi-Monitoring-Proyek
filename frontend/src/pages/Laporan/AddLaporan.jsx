import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api'; 
import { 
  ArrowLeft, Building2, MapPin, Calendar, UserCheck, 
  Sun, Users, Wrench, ListTodo, Plus, Trash2, CheckCircle2, 
  UploadCloud, Image as ImageIcon, Paperclip, Loader2, AlertCircle, ChevronDown, FileSpreadsheet, X
} from 'lucide-react';

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
  const [isLoadingRab, setIsLoadingRab] = useState(false);

  const [scheduleData, setScheduleData] = useState(null);

  // --- STATE PERUBAHAN: Form Utama (Tambah Minggu Ke) ---
  const [formData, setFormData] = useState({
    tanggalPengawasan: editData?.tanggalPengawasan || new Date().toISOString().split('T')[0],
    minggu_ke: editData?.minggu_ke || '',
    namaPengawas: editData?.namaPengawas || '',
    lokasi: editData?.lokasi || ''
  });

  const [cuacaItems, setCuacaItems] = useState([
    { id: Date.now(), kondisi: 'Cerah', keterangan: '' }
  ]);

  // --- STATE PERUBAHAN: Kegiatan (Tambah Persentase) ---
  const [kegiatanItems, setKegiatanItems] = useState(
    editData?.kegiatan?.length > 0 
      ? editData.kegiatan.map((k, i) => {
          return { id: i, rab_item_id: k.rab_item_id || '', uraian: k.uraian || '', koordinat_awal: k.sta_awal || '', koordinat_akhir: k.sta_akhir || '', volume: k.volume || '', satuan: k.satuan || '', persentase: k.persentase || '' };
      })
      : [{ id: Date.now(), rab_item_id: '', uraian: '', koordinat_awal: '', koordinat_akhir: '', volume: '', satuan: '', persentase: '' }]
  );

  const [personilItems, setPersonilItems] = useState(editData?.personil || []);
  const [peralatanItems, setPeralatanItems] = useState(editData?.peralatan || []);
  const [fotoLampiran, setFotoLampiran] = useState([]);
  const [dokumenLampiran, setDokumenLampiran] = useState([]);
  
  const [showPersonilModal, setShowPersonilModal] = useState(false);
  const [personilForm, setPersonilForm] = useState({ id: null, peran: '', jumlah: '' });
  
  const [showPeralatanModal, setShowPeralatanModal] = useState(false);
  const [peralatanForm, setPeralatanForm] = useState({ id: null, namaAlat: '', jumlah: '' });

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
    if (!selectedProjectId) {
      setRabOptions([]);
      setScheduleData(null);
      return;
    }

    const fetchScheduleAndRAB = async () => {
      setIsLoadingRab(true);
      try {
        const res = await api.get(`/projects/${selectedProjectId}/schedules`);
        const data = res.data.data;
        setScheduleData(data);
        
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
        // Cek dengan minggu_ke yang dipilih secara manual oleh user
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(formData.minggu_ke);
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
  const isScheduleEmpty = scheduleData && (!scheduleData.schedules || scheduleData.schedules.length === 0);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleKegiatanSelect = (index, selectedRabId) => {
    const newK = [...kegiatanItems];
    if (selectedRabId === "manual") {
      newK[index].rab_item_id = null;
      newK[index].uraian = '';
      newK[index].satuan = '';
    } else {
      const selectedRab = rabOptions.find(r => r.id.toString() === selectedRabId);
      if (selectedRab) {
        newK[index].rab_item_id = selectedRab.id;
        newK[index].uraian = selectedRab.uraian;
        newK[index].satuan = selectedRab.satuan || '';
      }
    }
    setKegiatanItems(newK);
  };

  const openPersonilModal = (item = null) => {
    if (item) setPersonilForm(item);
    else setPersonilForm({ id: Date.now(), peran: '', jumlah: '' });
    setShowPersonilModal(true);
  };

  const savePersonil = (e) => {
    e.preventDefault();
    const existingIndex = personilItems.findIndex(p => p.id === personilForm.id);
    if (existingIndex >= 0) {
      const updated = [...personilItems];
      updated[existingIndex] = personilForm;
      setPersonilItems(updated);
    } else {
      setPersonilItems([...personilItems, personilForm]);
    }
    setShowPersonilModal(false);
  };

  const openPeralatanModal = (item = null) => {
    if (item) setPeralatanForm(item);
    else setPeralatanForm({ id: Date.now(), namaAlat: '', jumlah: '' });
    setShowPeralatanModal(true);
  };

  const savePeralatan = (e) => {
    e.preventDefault();
    const existingIndex = peralatanItems.findIndex(p => p.id === peralatanForm.id);
    if (existingIndex >= 0) {
      const updated = [...peralatanItems];
      updated[existingIndex] = peralatanForm;
      setPeralatanItems(updated);
    } else {
      setPeralatanItems([...peralatanItems, peralatanForm]);
    }
    setShowPeralatanModal(false);
  };

  const handleFotoLampiranChange = (e) => {
    const files = Array.from(e.target.files).filter(file => {
      if (file.size > 2 * 1024 * 1024) { alert(`File ${file.name} terlalu besar. Maksimal 2MB.`); return false; }
      return true;
    });
    setFotoLampiran([...fotoLampiran, ...files]);
  };

  const handleRemoveFoto = (index) => setFotoLampiran(fotoLampiran.filter((_, i) => i !== index));

  const handleDokumenLampiranChange = (e) => {
    const files = Array.from(e.target.files).filter(file => {
      if (file.size > 5 * 1024 * 1024) { alert(`File ${file.name} terlalu besar. Maksimal 5MB.`); return false; }
      return true;
    });
    setDokumenLampiran([...dokumenLampiran, ...files]);
  };

  const handleRemoveDokumen = (index) => setDokumenLampiran(dokumenLampiran.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProjectId) return alert("Silakan Pilih Proyek terlebih dahulu sebelum menyimpan laporan.");
    if (!formData.minggu_ke) return alert("Silakan Pilih Minggu Ke-berapa laporan ini dibuat.");

    setSubmitting(true);
    setErrorMsg('');
    
    try {
      const payload = new FormData();
      payload.append('tanggal', formData.tanggalPengawasan);
      payload.append('minggu_ke', formData.minggu_ke); // PAYLOAD BARU
      payload.append('pengawas', formData.namaPengawas);
      payload.append('lokasi', formData.lokasi);
      
      const cuacaGabungan = cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | ');
      payload.append('cuaca', cuacaGabungan);
      payload.append('kondisi_cuaca', JSON.stringify(cuacaItems));

      const payloadKegiatan = kegiatanItems.map(k => ({
        rab_item_id: k.rab_item_id,
        uraian: k.uraian,
        sta_awal: k.koordinat_awal,   
        sta_akhir: k.koordinat_akhir, 
        volume: k.volume,
        satuan: k.satuan,
        persentase: k.persentase // PAYLOAD BARU
      }));

      payload.append('kegiatan', JSON.stringify(payloadKegiatan));
      payload.append('personil', JSON.stringify(personilItems));
      payload.append('peralatan', JSON.stringify(peralatanItems));

      fotoLampiran.forEach(file => payload.append('foto[]', file));
      dokumenLampiran.forEach(file => payload.append('lampiran[]', file));

      await api.post(`/projects/${selectedProjectId}/daily-reports`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
      setTimeout(() => navigate('/laporan'), 1500); 

    } catch (error) {
      if (error.response?.status === 413) setErrorMsg("Gagal: Total ukuran file (Foto/Dokumen) terlalu besar. Kurangi jumlah file Anda.");
      else if (error.response?.data?.errors) setErrorMsg(`Gagal Validasi: ${Object.values(error.response.data.errors).flat().join(' | ')}`);
      else if (error.response?.data?.message) setErrorMsg(error.response.data.message);
      else setErrorMsg("Gagal menyimpan laporan. Cek koneksi server.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">
      
      <datalist id="peran-options">{defaultPersonilList.map(p => <option key={p} value={p} />)}</datalist>
      <datalist id="alat-options">{defaultPeralatanList.map(a => <option key={a} value={a} />)}</datalist>

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button onClick={() => navigate('/laporan')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0 hidden sm:block" /> 
              <span>Input Laporan Harian Baru</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Entri data pengawasan cuaca, personil, peralatan, dan rincian pekerjaan</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-600 text-xs font-medium shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {submittedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Laporan Harian berhasil dikirim dan terdaftar di database. Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: Info Proyek & Pengawas (STYLING DIRAPIKAN) */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm">
          <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-2">
            <Building2 className="w-4 h-4" /> 1. Informasi Pengawasan
          </label>
          
          <div className="space-y-1.5 pb-2">
            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Pilih Proyek yang Diawasi <span className="text-rose-500">*</span>
            </label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-50 p-3 rounded-xl border border-amber-200"><Loader2 className="w-4 h-4 animate-spin" /> Sedang memuat daftar proyek...</div>
            ) : (
              <div className="relative">
                <select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-sm">
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
                <input type="date" name="tanggalPengawasan" required value={formData.tanggalPengawasan} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner [color-scheme:light_dark]" />
              </div>
            </div>

            {/* FIELD BARU: DROPDOWN MINGGU KE */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Minggu Ke- <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select name="minggu_ke" required value={formData.minggu_ke} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-inner cursor-pointer">
                  <option value="" disabled>-- Pilih Minggu --</option>
                  {[...Array(100)].map((_, i) => (
                    <option key={i+1} value={i+1}>Minggu Ke-{i+1}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nama Pengawas <span className="text-rose-500">*</span></label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="namaPengawas" required value={formData.namaPengawas} onChange={handleInputChange} placeholder="Ketik nama Anda" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lokasi Proyek <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="lokasi" required value={formData.lokasi} onChange={handleInputChange} placeholder="Contoh: Belitung Darat" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Cuaca */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
            <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4" /> 2. Kondisi Cuaca Lapangan
            </label>
            <button type="button" onClick={() => { if (cuacaItems.length < 4) setCuacaItems([...cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }]); else alert("Maksimal 4 entri cuaca per hari."); }} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Tambah Cuaca
            </button>
          </div>
          
          <div className="space-y-3">
            {cuacaItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 relative group shadow-sm">
                {cuacaItems.length > 1 && (
                  <button type="button" onClick={() => setCuacaItems(cuacaItems.filter(c => c.id !== item.id))} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full transition-transform hover:scale-110 shadow-md z-10"><Trash2 className="w-3 h-3" /></button>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Cuaca <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select value={item.kondisi} onChange={(e) => { const newC = [...cuacaItems]; newC[index].kondisi = e.target.value; setCuacaItems(newC); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner">
                      <option value="Cerah">Cerah</option><option value="Berawan">Berawan</option><option value="Hujan Gerimis">Hujan Gerimis</option><option value="Hujan Lebat">Hujan Lebat</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Waktu / Durasi / Keterangan</label>
                  <input type="text" value={item.keterangan} onChange={(e) => { const newC = [...cuacaItems]; newC[index].keterangan = e.target.value; setCuacaItems(newC); }} placeholder="Contoh: 08:00 - 12:00..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Kegiatan (DENGAN TAMBAHAN KOLOM PERSEN) */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4" /> 3. Kegiatan & Geografis
            </label>
            <button type="button" onClick={() => { if (kegiatanItems.length < 6) setKegiatanItems([...kegiatanItems, { id: Date.now(), rab_item_id: '', uraian: '', koordinat_awal: '', koordinat_akhir: '', volume: '', satuan: '', persentase: '' }]); else alert("Maksimal 6 Kegiatan."); }} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Tambah Kegiatan</button>
          </div>
          
          <div className="space-y-4">
            {kegiatanItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start shadow-sm">
                
                <div className="md:col-span-12 flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Uraian Pekerjaan {index + 1}
                  </span>
                  {kegiatanItems.length > 1 && (
                    <button type="button" onClick={() => setKegiatanItems(kegiatanItems.filter(k => k.id !== item.id))} className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md border border-rose-200 dark:border-rose-500/30 transition-colors hover:bg-rose-500 hover:text-white shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                
                <div className="md:col-span-12">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Pilih dari Jadwal / RAB <span className="text-rose-500">*</span></span>
                    {isLoadingRab && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat RAB...</span>}
                  </label>
                  
                  {rabOptions.length > 0 ? (
                    <div className="relative mb-2">
                      <select
                        value={item.rab_item_id || (item.rab_item_id === null ? "manual" : "")}
                        onChange={(e) => handleKegiatanSelect(index, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner truncate pr-10"
                      >
                        <option value="" disabled>-- Pilih Pekerjaan Terjadwal --</option>
                        {optionsMingguIni.length > 0 && <optgroup label={`>>> TARGET MINGGU INI`}>{optionsMingguIni.map(opt => <option key={opt.id} value={opt.id}>{opt.uraian_pekerjaan} ({opt.kategori})</option>)}</optgroup>}
                        {optionsMingguLain.length > 0 && <optgroup label=">>> TARGET MINGGU LAINNYA">{optionsMingguLain.map(opt => <option key={opt.id} value={opt.id}>{opt.uraian_pekerjaan} ({opt.kategori})</option>)}</optgroup>}
                        {unscheduledRabOptions.length > 0 && <optgroup label=">>> PEKERJAAN DI LUAR JADWAL (RAB TERDAFTAR)">{unscheduledRabOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.kategori_nama} - {opt.uraian}</option>)}</optgroup>}
                        <option value="manual">+ Pekerjaan Tambah/Kurang (Input Manual)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg mb-2 border border-rose-200 dark:border-rose-500/20">Mohon pilih proyek terlebih dahulu.</div>
                  )}

                  {(item.rab_item_id === null || rabOptions.length === 0) && (
                    <textarea rows="2" placeholder="Ketik manual uraian pekerjaan..." value={item.uraian} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].uraian = e.target.value; setKegiatanItems(newK); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner" />
                  )}
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> Titik Awal (STA Awal)</label>
                  <input type="text" placeholder="-3.3191, 114.5911" value={item.koordinat_awal} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].koordinat_awal = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> Titik Akhir (STA Akhir)</label>
                  <input type="text" placeholder="-3.3215, 114.6102" value={item.koordinat_akhir} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].koordinat_akhir = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner" />
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 flex flex-col justify-center shadow-sm">
                  {/* GRID BARU: VOLUME - SATUAN - PERSENTASE */}
                  <div className="grid grid-cols-12 gap-2 w-full">
                    <div className="col-span-5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Volume <span className="text-rose-500">*</span></label>
                      <input type="number" step="any" required placeholder="0" value={item.volume} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].volume = e.target.value; setKegiatanItems(newK); }} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-center" />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">Sat</label>
                      <input type="text" placeholder="M3" value={item.satuan} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].satuan = e.target.value; setKegiatanItems(newK); }} className={`w-full border rounded-lg px-1 py-2 text-[11px] font-bold text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner ${item.rab_item_id ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed border-transparent' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} readOnly={!!item.rab_item_id} />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">Persen (%)</label>
                      <input type="number" step="any" placeholder="0.0" value={item.persentase} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].persentase = e.target.value; setKegiatanItems(newK); }} className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-xs text-blue-700 dark:text-blue-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-center" />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4 & 5 (SAMA SEPERTI SEBELUMNYA TAPI RAPI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Personil Lapangan</h2>
              <button type="button" onClick={() => openPersonilModal()} className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/30 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Tambah</button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar flex-1 pr-1">
              {personilItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" /><p className="text-slate-500 font-medium text-xs">Belum ada personil diinput</p></div>
              ) : (
                personilItems.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.peran}</span>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-md text-xs font-bold font-mono">{p.jumlah} Org</span>
                      <button type="button" onClick={() => setPersonilItems(personilItems.filter(item => item.id !== p.id))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2"><Wrench className="w-4 h-4" /> Pemakaian Peralatan</h2>
              <button type="button" onClick={() => openPeralatanModal()} className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-blue-200 dark:border-blue-500/30 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Tambah</button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar flex-1 pr-1">
              {peralatanItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" /><p className="text-slate-500 font-medium text-xs">Belum ada alat diinput</p></div>
              ) : (
                peralatanItems.map((alat) => (
                  <div key={alat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{alat.namaAlat}</span>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md text-xs font-bold font-mono">{alat.jumlah} Unit</span>
                      <button type="button" onClick={() => setPeralatanItems(peralatanItems.filter(item => item.id !== alat.id))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Dokumentasi (Foto)</h2>
              <input type="file" id="fotoUploadAdd" className="hidden" multiple accept="image/*" onChange={handleFotoLampiranChange} />
              <button type="button" onClick={() => document.getElementById('fotoUploadAdd').click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><UploadCloud className="w-3.5 h-3.5" /> Upload Foto</button>
            </div>
            <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {fotoLampiran.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" /><p className="text-slate-500 font-medium">Belum ada foto</p></div>
              ) : (
                fotoLampiran.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
                    <div className="min-w-0 flex-1 pr-2"><p className="font-bold text-slate-800 dark:text-white truncate">{file.name}</p></div>
                    <button type="button" onClick={() => handleRemoveFoto(idx)} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm flex flex-col">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><Paperclip className="w-4 h-4" /> File Lampiran</h2>
              <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleDokumenLampiranChange} />
              <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-colors shadow-sm"><UploadCloud className="w-3.5 h-3.5" /> Upload File</button>
            </div>
            <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
              {dokumenLampiran.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" /><p className="text-slate-500 font-medium">Belum ada file</p></div>
              ) : (
                dokumenLampiran.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm">
                    <div className="min-w-0 flex-1 pr-2"><p className="font-bold text-slate-800 dark:text-white truncate">{file.name}</p></div>
                    <button type="button" onClick={() => handleRemoveDokumen(idx)} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Submit */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
          <button type="button" onClick={() => navigate('/laporan')} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-slate-600 shadow-sm transition-colors"><X className="w-4 h-4" /> Batal</button>
          <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold px-8 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Memproses Data...' : 'Simpan Laporan Harian'}
          </button>
        </div>
      </form>

      {/* MODALS PERSONIL & PERALATAN (TIDAK BERUBAH) */}
      {showPersonilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500"/> Form Personil</h3>
              <button onClick={() => setShowPersonilModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={savePersonil}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Jabatan <span className="text-rose-500">*</span></label>
                  <input type="text" required list="peran-options" value={personilForm.peran} onChange={(e) => setPersonilForm({...personilForm, peran: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={personilForm.jumlah} onChange={(e) => setPersonilForm({...personilForm, jumlah: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPersonilModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md">Simpan Personil</button>
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
                  <input type="text" required list="alat-options" value={peralatanForm.namaAlat} onChange={(e) => setPeralatanForm({...peralatanForm, namaAlat: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Unit <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={peralatanForm.jumlah} onChange={(e) => setPeralatanForm({...peralatanForm, jumlah: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPeralatanModal(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md">Simpan Alat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}