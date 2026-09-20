import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api'; 
import { 
  ArrowLeft, Building2, MapPin, Calendar, UserCheck, 
  Sun, Users, Wrench, ListTodo, Plus, Trash2, CheckCircle2, 
  UploadCloud, Image as ImageIcon, Paperclip, Loader2, AlertCircle, Edit3, X, FileSpreadsheet, ChevronDown
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
  const [mingguKe, setMingguKe] = useState(null);

  const [formData, setFormData] = useState({
    tanggalPengawasan: editData?.tanggalPengawasan || new Date().toISOString().split('T')[0],
    namaPengawas: editData?.namaPengawas || '',
    lokasi: editData?.lokasi || ''
  });

  // --- STATE CUACA (ARRAY MULTIPLE) ---
  const [cuacaItems, setCuacaItems] = useState([
    { id: Date.now(), kondisi: 'Cerah', keterangan: '' }
  ]);

  const [kegiatanItems, setKegiatanItems] = useState(
    editData?.kegiatan?.length > 0 
      ? editData.kegiatan.map((k, i) => {
          return { id: i, rab_item_id: k.rab_item_id || '', uraian: k.uraian || '', koordinat_awal: k.sta_awal || '', koordinat_akhir: k.sta_akhir || '', volume: k.volume || '', satuan: k.satuan || '' };
      })
      : [{ id: Date.now(), rab_item_id: '', uraian: '', koordinat_awal: '', koordinat_akhir: '', volume: '', satuan: '' }]
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
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects-active-report');
        const allProjects = res.data?.data || res.data || [];
        setProjects(allProjects);
      } catch (error) {
        console.error("Gagal mengambil data proyek:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const selectedProject = projects.find(p => p.id.toString() === selectedProjectId.toString());
  
  useEffect(() => {
    const tglDipilih = formData.tanggalPengawasan;
    if (tglDipilih && selectedProject && selectedProject.tanggal_mulai) {
      const start = new Date(selectedProject.tanggal_mulai);
      const report = new Date(tglDipilih);
      const diffTime = report.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
      
      if (diffDays < 0) {
        setMingguKe('Invalid (Sebelum SPMK)');
      } else {
        const hitungMinggu = Math.floor(diffDays / 7) + 1;
        setMingguKe(hitungMinggu);
      }
    } else {
      setMingguKe(null);
    }
  }, [formData.tanggalPengawasan, selectedProject, projects]);

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

  const isScheduleEmpty = scheduleData && (!scheduleData.schedules || scheduleData.schedules.length === 0);

  if (scheduleData && scheduleData.schedules && scheduleData.schedules.length > 0) {
    const scheduledItemsMap = new Map();
    
    scheduleData.schedules.forEach(sched => {
      let detailItem = null;
      let namaKategori = '';
      
      scheduleData.rab_data.forEach(cat => {
        const itemMatch = cat.items.find(i => i.id === sched.rab_item_id);
        if (itemMatch) {
          detailItem = itemMatch;
          namaKategori = cat.nama_kategori;
        }
      });

      if (detailItem) {
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(mingguKe);
        if (!scheduledItemsMap.has(sched.rab_item_id)) {
          scheduledItemsMap.set(sched.rab_item_id, {
            ...detailItem,
            kategori: namaKategori,
            is_this_week: isThisWeek
          });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 2MB per foto.`);
        return false;
      }
      return true;
    });
    setFotoLampiran([...fotoLampiran, ...validFiles]);
  };

  const handleRemoveFoto = (index) => {
    setFotoLampiran(fotoLampiran.filter((_, i) => i !== index));
  };

  const handleDokumenLampiranChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 5MB per dokumen.`);
        return false;
      }
      return true;
    });
    setDokumenLampiran([...dokumenLampiran, ...validFiles]);
  };

  const handleRemoveDokumen = (index) => {
    setDokumenLampiran(dokumenLampiran.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedProjectId) return alert("Silakan Pilih Proyek terlebih dahulu sebelum menyimpan laporan.");
    if (isScheduleEmpty) return alert("Time Schedule Proyek ini belum dibuat! Laporan Harian hanya bisa ditambahkan pada proyek yang sudah memiliki Time Schedule.");

    setSubmitting(true);
    setErrorMsg('');
    
    try {
      const payload = new FormData();
      
      payload.append('tanggal', formData.tanggalPengawasan);
      payload.append('pengawas', formData.namaPengawas);
      payload.append('lokasi', formData.lokasi);
      
      // MENGGABUNGKAN SELURUH ITEM CUACA MENJADI 1 TEKS AGAR DB LAMA TIDAK ERROR
      const cuacaGabungan = cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | ');
      payload.append('cuaca', cuacaGabungan);
      
      // Kirim JSON mentahnya
      payload.append('kondisi_cuaca', JSON.stringify(cuacaItems));

      const payloadKegiatan = kegiatanItems.map(k => ({
        rab_item_id: k.rab_item_id,
        uraian: k.uraian,
        sta_awal: k.koordinat_awal,   
        sta_akhir: k.koordinat_akhir, 
        volume: k.volume,
        satuan: k.satuan
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
      console.error("Gagal mengirim laporan:", error);
      
      if (error.response?.status === 413) {
        setErrorMsg("Gagal: Total ukuran file (Foto/Dokumen) terlalu besar. Batas maksimal server (PHP) terlampaui.");
      } else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat().join(' | ');
        setErrorMsg(`Gagal Validasi: ${errorList}`);
      } else if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Gagal menyimpan data laporan beserta lampiran. Cek koneksi server.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20">
      
      <datalist id="peran-options">
        {defaultPersonilList.map(p => <option key={p} value={p} />)}
      </datalist>
      <datalist id="alat-options">
        {defaultPeralatanList.map(a => <option key={a} value={a} />)}
      </datalist>

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/laporan')}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0"
            title="Batal & Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
              <ListTodo className="w-5 h-5 md:w-6 md:h-6 text-amber-500 shrink-0 mt-1 md:mt-0 hidden sm:block" /> 
              <span>Input Laporan Harian Baru</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Entri data pengawasan cuaca, personil, peralatan, dan rincian pekerjaan
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fade-in shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {submittedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Laporan Harian berhasil dikirim dan terdaftar di database. Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* SECTION 1: Info Proyek & Pengawas */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2 uppercase tracking-wider">
              <Building2 className="w-4 h-4" /> Informasi Pengawasan
            </h2>
          </div>
          
          <div className="space-y-1.5 border-b border-slate-100 dark:border-slate-700/50 pb-4">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Pilih Proyek yang Diawasi <span className="text-rose-500">*</span>
            </label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
                <Loader2 className="w-4 h-4 animate-spin" /> Sedang memuat daftar proyek...
              </div>
            ) : (
              <select 
                required 
                value={selectedProjectId} 
                onChange={(e) => setSelectedProjectId(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold transition-colors cursor-pointer"
              >
                <option value="" disabled>-- Klik di sini untuk memilih Proyek --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.nama_proyek} (SPK: {p.kode_kontrak || '-'})</option>
                ))}
              </select>
            )}

            {isScheduleEmpty && selectedProjectId && (
              <div className="mt-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p><strong>Peringatan:</strong> Proyek ini belum memiliki <strong>Time Schedule</strong>. Laporan Harian hanya dapat dibuat untuk proyek yang jadwalnya sudah diset.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal Pengawasan <span className="text-rose-500">*</span></label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="date" name="tanggalPengawasan" required value={formData.tanggalPengawasan} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 [color-scheme:light_dark]" />
                </div>
                {mingguKe && (
                  <div className="px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                      {typeof mingguKe === 'number' ? `Minggu Ke-${mingguKe}` : mingguKe}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Pengawas <span className="text-rose-500">*</span></label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="namaPengawas" required value={formData.namaPengawas} onChange={handleInputChange} placeholder="Masukkan nama Anda" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Lokasi Proyek Utama <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="lokasi" required value={formData.lokasi} onChange={handleInputChange} placeholder="Contoh: Belitung Darat" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Cuaca (Dinamis Multiple) Konsisten dengan Kegiatan */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4" /> Kondisi Cuaca Lapangan
            </h2>
            <button 
              type="button" 
              onClick={() => {
                if (cuacaItems.length < 4) {
                  setCuacaItems([...cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }]);
                } else {
                  alert("Maksimal 4 entri cuaca per hari.");
                }
              }} 
              className="text-[10px] bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-amber-200 dark:border-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
          
          <div className="space-y-4">
            {cuacaItems.map((item, index) => (
              <div key={item.id} className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 items-start transition-all shadow-sm gap-3">
                <div className="w-full flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Sesi Cuaca {index + 1}
                  </span>
                  {cuacaItems.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => setCuacaItems(cuacaItems.filter(c => c.id !== item.id))} 
                      className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Kondisi Cuaca <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        value={item.kondisi}
                        onChange={(e) => { 
                          const newC = [...cuacaItems]; 
                          newC[index].kondisi = e.target.value; 
                          setCuacaItems(newC); 
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-sm transition-all"
                      >
                        <option value="Cerah">Cerah</option>
                        <option value="Berawan">Berawan</option>
                        <option value="Hujan Gerimis">Hujan Gerimis</option>
                        <option value="Hujan Lebat">Hujan Lebat</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase">Waktu / Durasi / Keterangan</label>
                    <input 
                      type="text" 
                      value={item.keterangan} 
                      onChange={(e) => { 
                        const newC = [...cuacaItems]; 
                        newC[index].keterangan = e.target.value; 
                        setCuacaItems(newC); 
                      }} 
                      placeholder="Contoh: 08:00 - 12:00..." 
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-sm" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Kegiatan & Volume Lapangan */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2 uppercase tracking-wider">
              <ListTodo className="w-4 h-4" /> Kegiatan & Geografis
            </h2>
            <button 
              type="button" 
              onClick={() => {
                if (kegiatanItems.length < 6) {
                  setKegiatanItems([...kegiatanItems, { id: Date.now(), rab_item_id: '', uraian: '', koordinat_awal: '', koordinat_akhir: '', volume: '', satuan: '' }]);
                } else {
                  alert("Maksimal 6 Kegiatan sesuai format form.");
                }
              }} 
              className="text-[10px] bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-amber-200 dark:border-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
          
          <div className="space-y-4">
            {kegiatanItems.map((item, index) => (
              <div key={item.id} className="flex flex-col bg-slate-50 dark:bg-slate-900/60 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/50 items-start transition-all shadow-sm gap-3">
                <div className="w-full flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Kegiatan {index + 1}
                  </span>
                  {kegiatanItems.length > 1 && (
                    <button type="button" onClick={() => setKegiatanItems(kegiatanItems.filter(k => k.id !== item.id))} className="text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="w-full">
                  <label className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold uppercase mb-1.5 flex items-center justify-between">
                    <span>Uraian Pekerjaan <span className="text-rose-500">*</span></span>
                    {isLoadingRab && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat RAB...</span>}
                  </label>
                  
                  {rabOptions.length > 0 ? (
                    <select
                      value={item.rab_item_id || (item.rab_item_id === null ? "manual" : "")}
                      onChange={(e) => handleKegiatanSelect(index, e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium mb-2 cursor-pointer truncate"
                    >
                      <option value="" disabled>-- Pilih Pekerjaan Terjadwal --</option>
                      {optionsMingguIni.length > 0 && (
                        <optgroup label={`>>> TARGET MINGGU INI (MINGGU KE-${mingguKe})`}>
                          {optionsMingguIni.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.uraian_pekerjaan} ({opt.kategori})</option>
                          ))}
                        </optgroup>
                      )}
                      {optionsMingguLain.length > 0 && (
                        <optgroup label=">>> TARGET MINGGU LAINNYA">
                          {optionsMingguLain.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.uraian_pekerjaan} ({opt.kategori})</option>
                          ))}
                        </optgroup>
                      )}
                      {optionsMingguIni.length === 0 && optionsMingguLain.length === 0 && (
                        <optgroup label=">>> BELUM ADA JADWAL">
                          {rabOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.kategori_nama} - {opt.uraian}</option>
                          ))}
                        </optgroup>
                      )}
                      <option value="manual">+ Pekerjaan Tambah/Kurang (Input Manual)</option>
                    </select>
                  ) : (
                    <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg mb-2 border border-rose-200 dark:border-rose-500/20">Time Schedule belum dibuat.</div>
                  )}

                  {(item.rab_item_id === null || rabOptions.length === 0) && (
                    <textarea 
                      rows="2" placeholder="Ketik manual uraian pekerjaan..." 
                      value={item.uraian} 
                      onChange={(e) => { const newK = [...kegiatanItems]; newK[index].uraian = e.target.value; setKegiatanItems(newK); }}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors" 
                    />
                  )}
                </div>
                
                <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                  <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl bg-white dark:bg-slate-800/80">
                    <label className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> STA Awal</label>
                    <input type="text" placeholder="-3.3191, 114.5911" value={item.koordinat_awal} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].koordinat_awal = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                  </div>

                  <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl bg-white dark:bg-slate-800/80">
                    <label className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> STA Akhir</label>
                    <input type="text" placeholder="-3.3215, 114.6102" value={item.koordinat_akhir} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].koordinat_akhir = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                  </div>

                  <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl bg-white dark:bg-slate-800/80 flex flex-col justify-center">
                    <div className="flex gap-3 w-full">
                      <div className="flex-1">
                        <label className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-2 block">Volume <span className="text-rose-500">*</span></label>
                        <input type="number" step="any" required placeholder="0.00" value={item.volume} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].volume = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-slate-700 dark:text-slate-300 font-bold uppercase mb-2 block text-center">Satuan</label>
                        <input type="text" placeholder="M3/Ls" value={item.satuan} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].satuan = e.target.value; setKegiatanItems(newK); }} className={`w-full border rounded-lg px-2 py-2 text-xs text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${item.rab_item_id ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed border-transparent' : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} readOnly={!!item.rab_item_id} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Personil & Peralatan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative flex flex-col backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Personil Lapangan
              </h2>
              <button 
                type="button" 
                onClick={() => openPersonilModal()}
                className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-emerald-200 dark:border-emerald-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto hide-scrollbar flex-1">
              {personilItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 font-medium text-xs">Belum ada personil diinput</p>
                </div>
              ) : (
                personilItems.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-colors">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{p.peran}</span>
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-md text-xs font-bold font-mono">
                        {p.jumlah} Org
                      </span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openPersonilModal(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"><Edit3 className="w-3.5 h-3.5"/></button>
                        <button type="button" onClick={() => setPersonilItems(personilItems.filter(item => item.id !== p.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative flex flex-col backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Pemakaian Peralatan
              </h2>
              <button 
                type="button" 
                onClick={() => openPeralatanModal()}
                className="text-[10px] bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-blue-200 dark:border-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto hide-scrollbar flex-1">
              {peralatanItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                  <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-slate-500 font-medium text-xs">Belum ada alat diinput</p>
                </div>
              ) : (
                peralatanItems.map((alat) => (
                  <div key={alat.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-colors">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">{alat.namaAlat}</span>
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-md text-xs font-bold font-mono">
                        {alat.jumlah} Unit
                      </span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openPeralatanModal(alat)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"><Edit3 className="w-3.5 h-3.5"/></button>
                        <button type="button" onClick={() => setPeralatanItems(peralatanItems.filter(item => item.id !== alat.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-md transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5: Upload Foto & Lampiran */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Dokumentasi Lapangan (Foto)
              </h2>
              <>
                <input type="file" id="fotoUploadAdd" className="hidden" multiple accept="image/*" onChange={handleFotoLampiranChange} />
                <button type="button" onClick={() => document.getElementById('fotoUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium rounded-lg border border-amber-200 dark:border-amber-500/20 transition-all">
                  <UploadCloud className="w-3.5 h-3.5" /> Upload Foto
                </button>
              </>
            </div>
            <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto pr-1">
              {fotoLampiran.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                   <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 font-medium">Belum ada foto terlampir</p>
                 </div>
              ) : (
                fotoLampiran.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Siap diunggah ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveFoto(idx)} title="Batal Unggah" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Paperclip className="w-4 h-4" /> File Lampiran (Opsional)
              </h2>
              <>
                <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleDokumenLampiranChange} />
                <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all">
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File
                </button>
              </>
            </div>
            <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto pr-1">
              {dokumenLampiran.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                   <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 font-medium">Belum ada berkas terlampir</p>
                 </div>
              ) : (
                dokumenLampiran.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Siap diunggah ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveDokumen(idx)} title="Batal Unggah" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action Submit & Cancel Button */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
          <button
            type="button"
            onClick={() => navigate('/laporan')}
            className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs active:scale-95 border border-slate-200 dark:border-slate-600 shadow-sm"
          >
            <X className="w-4 h-4" /> Batal
          </button>
          <button 
            type="submit" 
            disabled={submitting || isScheduleEmpty} 
            className="bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-slate-950 dark:text-white" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Memproses Data...' : 'Simpan Laporan Harian'}
          </button>
        </div>
      </form>

      {/* MODALS PERSONIL & PERALATAN */}
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Nama Jabatan <span className="text-rose-500">*</span></label>
                  <input type="text" required list="peran-options" value={personilForm.peran} onChange={(e) => setPersonilForm({...personilForm, peran: e.target.value})} placeholder="Contoh: Pekerja, Tukang..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Orang <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={personilForm.jumlah} onChange={(e) => setPersonilForm({...personilForm, jumlah: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-colors" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPersonilModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
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
                  <input type="text" required list="alat-options" value={peralatanForm.namaAlat} onChange={(e) => setPeralatanForm({...peralatanForm, namaAlat: e.target.value})} placeholder="Contoh: Excavator..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Unit <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={peralatanForm.jumlah} onChange={(e) => setPeralatanForm({...peralatanForm, jumlah: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono transition-colors" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPeralatanModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors">Simpan Alat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}