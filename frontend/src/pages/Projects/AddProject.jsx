import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 
import { 
  ArrowLeft, AlertCircle, Loader2, CheckCircle2, 
  FileSignature, Clock, Calendar, MapPin, 
  UserCheck, ImageIcon, FileText, UploadCloud, Trash2, Plus, DollarSign, X 
} from 'lucide-react';

export default function AddProject() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = "Prisma Group - Proyek Baru";
  }, []);

  // Form State Utama Proyek
  const [formData, setFormData] = useState({
    namaProyek: '',
    kategori: '', 
    kodeKontrak: '',              // Untuk Kontrak Konsultan
    nomorKontrakKontraktor: '',   // Untuk Kontrak Kontraktor
    sumberDana: '',
    tahunAnggaran: '', 
    nilaiKontrak: '',
    tanggalMulai: '', 
    tanggalSelesai: '',
    waktuPelaksanaan: '',
    masaPemeliharaan: '', 
    lokasiWilayah: '',
    ppk: '', 
    kontraktor: '',
    konsultan: '',
    deskripsi: ''
  });

  const [fotoSampul, setFotoSampul] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [dokumenLampiran, setDokumenLampiran] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // --- HANDLER FOTO BANNER ---
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoSampul(file);
      setFotoPreview(URL.createObjectURL(file)); 
    }
  };

  const handleRemoveFoto = () => {
    setFotoSampul(null);
    setFotoPreview(null);
  };

  // --- HANDLER DOKUMEN ---
  const handleDokumenChange = (e) => {
    const files = Array.from(e.target.files);
    setDokumenLampiran([...dokumenLampiran, ...files]);
  };

  const handleRemoveDokumen = (index) => {
    setDokumenLampiran(dokumenLampiran.filter((_, i) => i !== index));
  };

  // --- SUBMIT KE LARAVEL ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const formDataPayload = new FormData();
      
      formDataPayload.append('nama_proyek', formData.namaProyek);
      formDataPayload.append('kategori', formData.kategori);
      formDataPayload.append('kode_kontrak', formData.kodeKontrak); // Konsultan
      formDataPayload.append('nomor_kontrak_kontraktor', formData.nomorKontrakKontraktor); // Kontraktor
      formDataPayload.append('sumber_dana', formData.sumberDana);
      formDataPayload.append('tahun_anggaran', formData.tahunAnggaran);
      formDataPayload.append('nilai_kontrak', formData.nilaiKontrak);
      formDataPayload.append('tanggal_mulai', formData.tanggalMulai);
      if (formData.tanggalSelesai) {
        formDataPayload.append('tanggal_selesai', formData.tanggalSelesai);
      }
      formDataPayload.append('waktu_pelaksanaan', formData.waktuPelaksanaan);
      formDataPayload.append('masa_pemeliharaan', formData.masaPemeliharaan);
      formDataPayload.append('lokasi_wilayah', formData.lokasiWilayah);
      formDataPayload.append('ppk', formData.ppk);
      formDataPayload.append('kontraktor', formData.kontraktor);
      formDataPayload.append('konsultan', formData.konsultan);
      formDataPayload.append('deskripsi', formData.deskripsi);
      formDataPayload.append('status', 'Persiapan');

      // Masukkan File Foto
      if (fotoSampul) {
        formDataPayload.append('foto_sampul', fotoSampul);
      }

      // Masukkan File Dokumen Lampiran
      dokumenLampiran.forEach((file) => {
        formDataPayload.append('dokumen_lampiran[]', file);
      });

      // Mengirim Payload ke Laravel
      await api.post('/projects', formDataPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmitting(false);
      setSubmittedSuccess(true);
      
      setTimeout(() => setSubmittedSuccess(false), 4000);
      setTimeout(() => navigate('/projects'), 1500); 

    } catch (error) {
      console.error("Error submitting project:", error);
      
      if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat().join(' | ');
        setErrorMsg(`Gagal: ${errorList}`);
      } else if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Gagal menyimpan data proyek beserta lampiran. Cek koneksi server.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 md:space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0"
            title="Batal & Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
              <span>Input Master Proyek Baru</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Pendaftaran identitas proyek, data kontrak, jadwal, dan dokumen administrasi
            </p>
          </div>
        </div>
      </div>

      {/* PEMBERITAHUAN ERROR */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* PEMBERITAHUAN SUKSES */}
      {submittedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Data Proyek Baru berhasil dibuat dan terdaftar di database sistem. Mengalihkan...</span>
        </div>
      )}

      {/* FORM MANUAL */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Section 1: Identitas & Keuangan */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <FileSignature className="w-4 h-4" /> Data Kontrak & Keuangan
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nama Paket Pekerjaan <span className="text-rose-500">*</span></label>
              <input type="text" name="namaProyek" required value={formData.namaProyek} onChange={handleChange} placeholder="Contoh : Pembangunan Jembatan Sei Tabalong STA 04" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Bidang / Kategori <span className="text-rose-500">*</span></label>
              <select name="kategori" value={formData.kategori} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer appearance-none">
                <option value="" disabled>Pilih Kategori / Bidang</option>
                <option value="Infrastruktur Jalan & Jembatan">Infrastruktur Jalan & Jembatan</option>
                <option value="Gedung & Bangunan Sipil">Gedung & Bangunan Sipil</option>
                <option value="Sumber Daya Air & Irigasi">Sumber Daya Air & Irigasi</option>
                <option value="Tata Lingkungan & Sanitasi">Tata Lingkungan & Sanitasi</option>
                <option value="Preservasi Jalan">Preservasi Jalan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">No. Kontrak Konsultan (SPK) <span className="text-rose-500">*</span></label>
              <input type="text" name="kodeKontrak" required value={formData.kodeKontrak} onChange={handleChange} placeholder="Contoh : 027/114-SPK/DINKES/2026" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors font-mono" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">No. Kontrak Kontraktor <span className="text-rose-500">*</span></label>
              <input type="text" name="nomorKontrakKontraktor" value={formData.nomorKontrakKontraktor} onChange={handleChange} placeholder="Contoh : 600/012/PUPR/2026" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors font-mono" />
            </div>

            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Nilai Kontrak (Pagu) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input type="number" name="nilaiKontrak" required value={formData.nilaiKontrak} onChange={handleChange} placeholder="Contoh : 2500000000" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Sumber Dana <span className="text-rose-500">*</span></label>
                <input type="text" name="sumberDana" value={formData.sumberDana} onChange={handleChange} placeholder="Contoh : APBD DAK" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tahun Anggaran <span className="text-rose-500">*</span></label>
                <input type="number" name="tahunAnggaran" value={formData.tahunAnggaran} onChange={handleChange} placeholder="Contoh : 2026" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors font-mono" />
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Jadwal & Lokasi */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Jadwal Pelaksanaan & Lokasi
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal Mulai (Kontrak) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" name="tanggalMulai" required value={formData.tanggalMulai} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors [color-scheme:light_dark]" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Tanggal Selesai (PHO) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" name="tanggalSelesai" value={formData.tanggalSelesai} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors [color-scheme:light_dark]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Waktu Pelaksanaan <span className="text-rose-500">*</span></label>
              <input type="text" name="waktuPelaksanaan" value={formData.waktuPelaksanaan} onChange={handleChange} placeholder="Contoh : 180 Hari Kalender" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Masa Pemeliharaan <span className="text-rose-500">*</span></label>
              <input type="text" name="masaPemeliharaan" value={formData.masaPemeliharaan} onChange={handleChange} placeholder="Contoh : 180 Hari Kalender" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
            </div>

            <div className="lg:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Keterangan Wilayah Lokasi <span className="text-rose-500">*</span></label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="lokasiWilayah" value={formData.lokasiWilayah} onChange={handleChange} placeholder="Contoh : Kec. Murung Pudak" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Stakeholders */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" /> Para Pihak (Stakeholders)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">PPK / Owner <span className="text-rose-500">*</span></label>
              <input type="text" name="ppk" value={formData.ppk} onChange={handleChange} placeholder="Contoh : Dinas PUPR" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">Kontraktor Pelaksana <span className="text-rose-500">*</span></label>
              <input type="text" name="kontraktor" value={formData.kontraktor} onChange={handleChange} placeholder="Contoh : PT / CV Penyedia Jasa" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">Konsultan Pengawas / MK <span className="text-rose-500">*</span></label>
              <input type="text" name="konsultan" value={formData.konsultan} onChange={handleChange} placeholder="Contoh : PT / CV Konsultan" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Deskripsi & Lingkup Pekerjaan <span className="text-rose-500">*</span></label>
            <textarea name="deskripsi" rows={3} value={formData.deskripsi} onChange={handleChange} placeholder="Tuliskan spesifikasi umum atau batasan pekerjaan..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none" />
          </div>
        </div>

        {/* Section 4: Uploads */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* CARD 1: FOTO BANNER */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Foto Banner Proyek<span className="text-rose-500">*</span>
              </h2>
            </div>
            
            <div className={`border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500/50 rounded-xl text-center transition-all relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[160px] ${fotoPreview ? 'border-none p-0 bg-slate-900' : 'bg-slate-50 dark:bg-slate-900/40 p-6'}`}>
              {fotoPreview ? (
                <>
                  <img src={fotoPreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0 opacity-90" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center z-10 gap-3 backdrop-blur-sm">
                    <p className="text-white text-xs font-medium truncate max-w-[80%] px-3 py-1 bg-slate-900/50 rounded-md">
                      {fotoSampul?.name}
                    </p>
                    <button 
                      type="button" 
                      onClick={handleRemoveFoto} 
                      className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" /> Hapus Foto
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Pilih Foto Banner" />
                  <UploadCloud className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-500 mb-3 relative z-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold relative z-0">Klik atau Tarik Foto ke area ini</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1 relative z-0">Format: JPG, PNG, WEBP</p>
                </>
              )}
            </div>
          </div>

          {/* CARD 2: DOKUMEN LAMPIRAN */}
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Dokumen Administrasi<span className="text-rose-500">*</span>
              </h2>
              <>
                <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.xlsx,.xls,.dwg,.rar,.zip" onChange={handleDokumenChange} />
                <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all">
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File<span className="text-rose-500">*</span>
                </button>
              </>
            </div>
            
            <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto pr-1">
              {dokumenLampiran.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                   <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 font-medium">Belum ada berkas terlampir</p>
                 </div>
              ) : (
                dokumenLampiran.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Siap diunggah ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => handleRemoveDokumen(idx)} 
                      title="Batal Unggah" 
                      className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm transition-all active:scale-95"
                    >
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
            onClick={() => navigate('/projects')}
            className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs active:scale-95 border border-slate-200 dark:border-slate-600 shadow-sm"
          >
            <X className="w-4 h-4" /> Batal
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold px-8 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950 dark:text-white" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {submitting ? 'Memproses Data...' : 'Simpan & Daftarkan Proyek'}
          </button>
        </div>
      </form>
    </div>
  );
}