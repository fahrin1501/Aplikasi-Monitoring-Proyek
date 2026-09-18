import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../../api'; 
import { 
  Building2, ArrowLeft, Calendar, MapPin, DollarSign, HardHat, 
  UserCheck, Compass, FileText, TrendingUp, FileSpreadsheet, Info, 
  Clock, Download, Users, CheckCircle2, Activity, 
  ShieldCheck, Edit3, Trash2, UploadCloud, Plus, Loader2, AlertTriangle, FileSignature, Save, X
} from 'lucide-react';

export default function ProjectData() {
  const navigate = useNavigate();
  const { id } = useParams();

  // State Data Proyek
  const [project, setProject] = useState(null);
  const projectId = project?.id || id;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // State Progres Fisik S-Curve
  const [progressData, setProgressData] = useState({ plan: 0, actual: 0, deviasi: 0 });

  // State Edit Mode Utama (Inline)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingMain, setIsSavingMain] = useState(false);

  // State Foto Banner
  const [fotoSampul, setFotoSampul] = useState(null);
  const [newFotoPreview, setNewFotoPreview] = useState(null);
  const [removeFoto, setRemoveFoto] = useState(false); 

  // State Personel Modal (Tambah/Edit)
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({ id: null, nama: '', peran: '' });
  const [isSavingPersonnel, setIsSavingPersonnel] = useState(false);

  // State Konfirmasi Hapus Modal (Universal)
  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserRole(user.role || 'Tamu');
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }
  }, []);

  // Definisi Hak Akses
  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const canViewFinance = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  // FETCH DATA
  const fetchProjectDetail = async () => {
    try {
      const [projRes, schedRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/schedules`).catch(() => null)
      ]);

      setProject(projRes.data);
      setEditFormData(projRes.data);

      // Kalkulasi Real-time Progress Plan vs Actual
      if (schedRes && schedRes.data?.data) {
        const sData = schedRes.data.data;
        const plan = sData.schedules?.reduce((sum, s) => sum + parseFloat(s.bobot_rencana), 0) || 0;
        const actual = sData.realizations?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;
        
        setProgressData({
          plan,
          actual,
          deviasi: actual - plan
        });
      }

    } catch (error) {
      console.error("Error fetching project details:", error);
      setErrorMsg('Gagal memuat data proyek. Data mungkin dihapus atau server terputus.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(angka) || 0);
  };

  // Helper URL
  const getImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename;
    return `http://127.0.0.1:8000/storage/foto_proyek/${filename}`;
  };

  const getDocUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    return `http://127.0.0.1:8000/${path}`;
  };

  const formatDateForInput = (val) => {
    if (!val) return '';
    return String(val).substring(0, 10);
  };

  const handleMainChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoSampul(file);
      setNewFotoPreview(URL.createObjectURL(file));
      setRemoveFoto(false);
    }
  };

  // --- FUNGSI WARNA DINAMIS KATEGORI PROYEK ---
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

  // --- HANDLER UPDATE PROYEK UTAMA ---
  const toggleEditMode = async () => {
    if (isEditMode) {
      setIsSavingMain(true);
      try {
        const payloadData = { ...editFormData };
        delete payloadData.personnels;
        delete payloadData.documents;
        delete payloadData.created_at;
        delete payloadData.updated_at;
        delete payloadData.foto_sampul; 

        if (fotoSampul || removeFoto) {
          const formData = new FormData();
          Object.keys(payloadData).forEach(key => {
            formData.append(key, payloadData[key] === null ? '' : payloadData[key]);
          });
          
          if (fotoSampul) formData.append('foto_sampul', fotoSampul);
          if (removeFoto) formData.append('remove_foto', 'true');
          
          formData.append('_method', 'PUT'); 
          
          await api.post(`/projects/${id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }); 
        } else {
          await api.put(`/projects/${id}`, payloadData);
        }
        
        await fetchProjectDetail(); 
        setIsEditMode(false); 
        setFotoSampul(null);
        setNewFotoPreview(null);
        setRemoveFoto(false);
      } catch (error) {
        console.error("Gagal update proyek:", error);
        if (error.response?.data?.errors) {
          const errorList = Object.values(error.response.data.errors).flat().join('\n- ');
          alert(`Validasi Gagal:\n- ${errorList}`);
        } else if (error.response?.data?.message) {
          alert(`Gagal: ${error.response.data.message}`);
        } else {
          alert(`Sistem Terputus: ${error.message} (Cek koneksi atau ukuran foto)`);
        }
      } finally {
        setIsSavingMain(false);
      }
    } else {
      setEditFormData(project);
      setIsEditMode(true);
    }
  };

  const cancelEditMode = () => {
    setEditFormData(project);
    setIsEditMode(false);
    setFotoSampul(null);
    setNewFotoPreview(null);
    setRemoveFoto(false);
  };

  // --- HANDLER PERSONEL LAPANGAN ---
  const openPersonnelModal = (person = null) => {
    if (person) {
      setPersonnelForm({ id: person.id, nama: person.nama, peran: person.peran });
    } else {
      setPersonnelForm({ id: null, nama: '', peran: '' });
    }
    setShowPersonnelModal(true);
  };

  const handleSavePersonnel = async (e) => {
    e.preventDefault();
    setIsSavingPersonnel(true);
    try {
      if (personnelForm.id) {
        await api.put(`/personnels/${personnelForm.id}`, personnelForm);
      } else {
        await api.post(`/projects/${id}/personnels`, personnelForm);
      }
      setShowPersonnelModal(false);
      fetchProjectDetail(); 
    } catch (error) {
      console.error("Gagal simpan personel:", error);
      if (error.response?.status === 404) alert("Gagal (404): Route API Personel belum terdaftar di Backend Laravel.");
      else if (error.response?.status === 500) alert("Gagal (500): Ada masalah di Database / Model Laravel (Mungkin masalah $fillable).");
      else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat().join('\n- ');
        alert(`Validasi Gagal:\n- ${errorList}`);
      } else if (error.response?.data?.message) alert(`Gagal: ${error.response.data.message}`);
      else alert(`Error: ${error.message}`);
    } finally {
      setIsSavingPersonnel(false);
    }
  };

  // --- HANDLER UPLOAD DOKUMEN SUSULAN ---
  const handleUploadDocument = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach(file => formData.append('dokumen_lampiran[]', file));
    e.target.value = null;

    try {
      await api.post(`/projects/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchProjectDetail();
      alert("Dokumen berhasil ditambahkan!");
    } catch (error) {
      console.error("Gagal upload dokumen:", error);
      if (error.response?.status === 404) alert("Gagal: Route API untuk upload dokumen di Backend belum ditemukan.");
      else if (error.response?.data?.errors) {
        const errorList = Object.values(error.response.data.errors).flat().join('\n- ');
        alert(`Dokumen Ditolak:\n- ${errorList}`);
      } else alert(`Error Server: ${error.message} (File mungkin terlalu besar >2MB)`);
    }
  };

  // --- KUMPULAN FUNGSI KONFIRMASI HAPUS (UNIVERSAL) ---
  const confirmDeleteProject = () => {
    setDeleteConfig({ show: true, type: 'project', id: projectId, name: project.nama_proyek });
  };

  const confirmDeletePersonnel = (personId, personName) => {
    setDeleteConfig({ show: true, type: 'personnel', id: personId, name: personName });
  };

  const confirmDeleteDocument = (docId, docName) => {
    setDeleteConfig({ show: true, type: 'document', id: docId, name: docName });
  };

  const executeDelete = async () => {
    try {
      if (deleteConfig.type === 'project') {
        await api.delete(`/projects/${deleteConfig.id}`);
        alert("Proyek berhasil dihapus secara permanen.");
        navigate('/projects');
        return; 
      } 
      else if (deleteConfig.type === 'personnel') {
        await api.delete(`/personnels/${deleteConfig.id}`);
      } 
      else if (deleteConfig.type === 'document') {
        await api.delete(`/documents/${deleteConfig.id}`);
      }
      
      setDeleteConfig({ show: false, type: '', id: null, name: '' });
      fetchProjectDetail(); 
    } catch (error) {
      alert("Gagal menghapus data. Periksa koneksi ke server.");
    }
  };

  // --- HANDLER EXPORT EXCEL & PDF ---
  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const safeName = project.nama_proyek ? project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_') : 'Proyek';
      link.setAttribute('download', `Data_Proyek_${safeName}.xlsx`); 
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal export Excel:", error);
      alert("Gagal mengunduh Excel. Pastikan backend siap.");
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const safeName = project.nama_proyek ? project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_') : 'Proyek';
      link.setAttribute('download', `Executive_Summary_${safeName}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal export PDF:", error);
      alert("Gagal mengunduh PDF. Pastikan backend siap.");
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Memuat rincian proyek...</p>
    </div>
  );

  if (errorMsg || !project) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full text-center">
      <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
      <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Proyek Tidak Ditemukan</h2>
      <button onClick={() => navigate('/projects')} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold mt-4">Kembali ke Daftar</button>
    </div>
  );

  // --- FORMAT PROGRESS FISIK ---
  const progressPlan = progressData.plan.toFixed(2); 
  const progressReal = progressData.actual.toFixed(2);
  const rawDeviasi = progressData.deviasi;
  const deviasi = rawDeviasi > 0 ? `+${rawDeviasi.toFixed(2)}` : rawDeviasi.toFixed(2);
  
  // LOGIKA STATUS CERDAS (On Track, Terlambat, Kritis)
  let calculatedStatus = project?.status || 'Persiapan';
  if (calculatedStatus !== 'Selesai' && calculatedStatus !== 'Persiapan') {
    if (rawDeviasi < -5) calculatedStatus = 'Kritis';
    else if (rawDeviasi < 0) calculatedStatus = 'Terlambat';
    else calculatedStatus = 'On Track';
  }
  
  // PENYAMARAN STATUS (Tamu Tidak Melihat "Kritis" atau "Terlambat")
  const displayStatus = (isGuest && (calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat')) ? 'Berjalan' : calculatedStatus;
  const isActuallyDelayed = calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat';

  return (
    <div className="w-full space-y-5 relative pb-20">
      
      {/* --- TOP BAR NAVIGATION --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-4 shrink-0">
          <button onClick={() => navigate('/projects')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* AVATAR / BANNER FOTO PROYEK */}
          <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden group ${isEditMode ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900' : ''}`}>
            {newFotoPreview ? (
              <img src={newFotoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (project.foto_sampul && !removeFoto) ? (
              <img src={getImageUrl(project.foto_sampul)} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full font-extrabold text-slate-400 text-lg">
                {project.nama_proyek ? project.nama_proyek.charAt(0).toUpperCase() : <Building2 className="w-5 h-5" />}
              </div>
            )}

            {/* Overlay Menu Foto */}
            {isEditMode && (
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-sm">
                <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById('headerFotoInput').click(); }} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors" title="Ganti Foto">
                  <UploadCloud className="w-4 h-4" />
                </button>
                {((project.foto_sampul && !removeFoto) || newFotoPreview) && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setRemoveFoto(true); setFotoSampul(null); setNewFotoPreview(null); }} className="p-1.5 bg-rose-500/80 hover:bg-rose-500 rounded-full text-white transition-colors" title="Hapus Foto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <input type="file" id="headerFotoInput" className="hidden" accept="image/*" onChange={handleFotoChange} />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-start lg:items-center gap-1.5 flex-wrap">
              <span>Executive Summary Proyek</span>
              {/* BADGE DRAFT MODE */}
              {isEditMode && <span className="px-2 py-0.5 ml-2 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 font-extrabold tracking-wider">DRAFT MODE</span>}
            </h1>
            
            {/* SUB-HEADER & KATEGORI (EDITABLE & WARNA DINAMIS) */}
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{project.nama_proyek}</span>
              <span className="text-slate-400 mx-0.5">•</span>              
              {isEditMode ? (
                <select 
                  name="kategori" 
                  value={editFormData.kategori || ''} 
                  onChange={handleMainChange}
                  className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer animate-fade-in shadow-sm"
                >
                  <option value="" disabled>Pilih Kategori</option>
                  <option value="Infrastruktur Jalan & Jembatan">Infrastruktur Jalan & Jembatan</option>
                  <option value="Gedung & Bangunan Sipil">Gedung & Bangunan Sipil</option>
                  <option value="Sumber Daya Air & Irigasi">Sumber Daya Air & Irigasi</option>
                  <option value="Tata Lingkungan & Sanitasi">Tata Lingkungan & Sanitasi</option>
                  <option value="Preservasi Jalan">Preservasi Jalan</option>
                  <option value="Belum Ditentukan">Belum Ditentukan</option>
                </select>
              ) : (
                <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(project.kategori)}`}>
                  {project.kategori || 'Belum Ditentukan'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          
          {/* Action Buttons UTAMA (Hanya Tampil Jika Punya Akses Edit/Export) */}
          {!isGuest && (
            <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all duration-300">
              {canCreateData && isEditMode && (
                 <button onClick={cancelEditMode} disabled={isSavingMain} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                   <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> Batal
                 </button>
              )}

              {canCreateData && (
                <button onClick={toggleEditMode} disabled={isSavingMain} className={`flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm ${isEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-200'}`}>
                  {isSavingMain ? <Loader2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" /> : (isEditMode ? <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> : <Edit3 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />)} 
                  <span className="hidden lg:inline">{isSavingMain ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Mode Edit Draf')}</span>
                </button>
              )}
              
              {!isEditMode && (
                <>
                  {canCreateData && (
                    <button onClick={confirmDeleteProject} title="Hapus Proyek" className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                      <Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Hapus</span>
                    </button>
                  )}
                  
                  {/* --- TOMBOL EXPORT EXCEL & PDF --- */}
                  <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                  
                  <button onClick={handleExportExcel} title="Export Excel" className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                    <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export Excel</span>
                  </button>
                  
                  <button onClick={handleExportPDF} title="Export PDF" className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                    <Download className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export PDF</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Action Buttons Navigasi Modul */}
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar">
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap">
              <Info className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Data Utama</span>
            </button>
            
            {/* SEMBUNYIKAN NAVIGASI RAB & KURVA S UNTUK TAMU */}
            {!isGuest && (
              <>
                <button onClick={() => navigate(`/projects/${projectId}/rab`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                  <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span>
                </button>
                <button onClick={() => navigate(`/projects/${projectId}/kurva-s`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                  <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Kurva S</span>
                </button>
              </>
            )}

            <button onClick={() => navigate(`/projects/${projectId}/peta-gis`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT DETAILS --- */}
      <div className="space-y-4">
        
        {/* Section 1: Progress Snapshot */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between relative shadow-sm">
          <div className="w-full md:w-1/3 text-center md:text-left">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2 mb-1">
              <Activity className="w-4 h-4 text-amber-500" /> Indikator Progress Fisik
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 md:mt-0 px-2 md:px-0">Perbandingan target rencana S-Curve dengan realisasi lapangan.</p>
          </div>
          
          <div className={`w-full md:w-2/3 grid ${isGuest ? 'grid-cols-2' : 'grid-cols-3'} gap-2 sm:gap-4`}>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Plan</span>
              <p className="text-sm md:text-lg font-mono font-bold text-sky-600 dark:text-sky-400">{progressPlan}%</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-center">
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Actual</span>
              <p className="text-sm md:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{progressReal}%</p>
            </div>
            
            {/* SEMBUNYIKAN DEVIASI (NEGATIF INFO) DARI TAMU */}
            {!isGuest && (
              <div className={`p-2.5 md:p-3 rounded-xl border text-center flex flex-col justify-center ${isActuallyDelayed ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'}`}>
                <span className={`text-[9px] md:text-[10px] uppercase tracking-wider block mb-1 ${isActuallyDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'}`}>Deviasi</span>
                <p className={`text-sm md:text-lg font-mono font-bold ${isActuallyDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'}`}>
                  {deviasi}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Data Kontrak & Administrasi (Layout Simetris) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* KOLOM KIRI: Kontrak & Keuangan */}
          <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <FileSignature className="w-4 h-4" /> Kontrak & Keuangan
              </h2>
              {/* STATUS MENGGUNAKAN DISPLAY STATUS (SAMARAN UNTUK TAMU) */}
              <span className={`px-2.5 py-1 text-[10px] md:text-[11px] font-semibold rounded-lg border inline-block ${
                isActuallyDelayed ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' :
                'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
              }`}>
                Status : {displayStatus}
              </span>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Nama Paket Pekerjaan</span>
                {isEditMode ? (
                  <input type="text" name="nama_proyek" value={editFormData.nama_proyek || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{project.nama_proyek}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">No. Kontrak Konsultan</span>
                  {isEditMode ? (
                    <input type="text" name="kode_kontrak" value={editFormData.kode_kontrak || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Kosongkan jika belum ada" />
                  ) : (
                    <p className="font-semibold text-slate-800 dark:text-white font-mono break-all">{project.kode_kontrak || '-'}</p>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">No. Kontrak Kontraktor</span>
                  {isEditMode ? (
                    <input type="text" name="nomor_kontrak_kontraktor" value={editFormData.nomor_kontrak_kontraktor || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Kosongkan jika belum ada" />
                  ) : (
                    <p className="font-semibold text-slate-800 dark:text-white font-mono break-all">{project.nomor_kontrak_kontraktor || '-'}</p>
                  )}
                </div>
              </div>
              
              <div className={`grid grid-cols-1 ${canViewFinance ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-3`}>
                
                {/* HANYA TAMPILKAN NILAI KONTRAK DAN SUMBER DANA JIKA PUNYA AKSES KEUANGAN */}
                {canViewFinance && (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Nilai Kontrak (Pagu)</span>
                      {isEditMode ? (
                        <input type="number" name="nilai_kontrak" value={editFormData.nilai_kontrak || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                      ) : (
                        <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                          <DollarSign className="w-4 h-4 shrink-0" /> <span className="truncate" title={formatRupiah(project.nilai_kontrak)}>{formatRupiah(project.nilai_kontrak)}</span>
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                      <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Sumber Dana</span>
                      {isEditMode ? (
                        <input type="text" name="sumber_dana" value={editFormData.sumber_dana || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="APBD" />
                      ) : (
                        <p className="font-semibold text-slate-800 dark:text-white truncate" title={project.sumber_dana || '-'}>{project.sumber_dana || '-'}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">TA</span>
                  {isEditMode ? (
                    <input type="text" name="tahun_anggaran" value={editFormData.tahun_anggaran || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="2026" />
                  ) : (
                    <p className="font-semibold text-slate-800 dark:text-white">{project.tahun_anggaran || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Jadwal & Lokasi */}
          <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <Clock className="w-4 h-4" /> Jadwal & Lokasi
            </h2>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Periode Kontrak (Waktu Pekerjaan)</span>
                {isEditMode ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input type="date" name="tanggal_mulai" value={formatDateForInput(editFormData.tanggal_mulai)} onChange={handleMainChange} className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                    <span className="text-slate-400 text-[10px]">s/d</span>
                    <input type="date" name="tanggal_selesai" value={formatDateForInput(editFormData.tanggal_selesai)} onChange={handleMainChange} className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                  </div>
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-white">{project.tanggal_mulai} s/d {project.tanggal_selesai || 'Belum di Set'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Waktu Pelaksanaan</span>
                  {isEditMode ? (
                    <input type="text" name="waktu_pelaksanaan" value={editFormData.waktu_pelaksanaan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-white font-mono">{project.waktu_pelaksanaan || '-'}</p>
                  )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Masa Pemeliharaan</span>
                  {isEditMode ? (
                    <input type="text" name="masa_pemeliharaan" value={editFormData.masa_pemeliharaan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <p className="font-bold text-slate-800 dark:text-white font-mono">{project.masa_pemeliharaan || '-'}</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> Keterangan Wilayah Lokasi</span>
                {isEditMode ? (
                  <input type="text" name="lokasi_wilayah" value={editFormData.lokasi_wilayah || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-white">{project.lokasi_wilayah || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Stakeholders & Personel Lapangan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <UserCheck className="w-4 h-4" /> Para Pihak (Stakeholders)
            </h2>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">PPK (Pejabat Pembuat Komitmen) / Owner</span>
                {isEditMode ? (
                  <input type="text" name="ppk" value={editFormData.ppk || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-white">{project.ppk || '-'}</p>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Kontraktor Pelaksana (Penyedia Jasa)</span>
                {isEditMode ? (
                  <input type="text" name="kontraktor" value={editFormData.kontraktor || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-white">{project.kontraktor || '-'}</p>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Konsultan Pengawas / Manajemen Konstruksi</span>
                {isEditMode ? (
                  <input type="text" name="konsultan" value={editFormData.konsultan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <p className="font-semibold text-slate-800 dark:text-white">{project.konsultan || '-'}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm flex flex-col relative">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Personel Lapangan
              </h2>
              
              {/* TOMBOL TAMBAH PERSONEL - HANYA MUNCUL DI EDIT MODE */}
              {isEditMode && canCreateData && (
                <button onClick={() => openPersonnelModal()} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
            </div>
            
            <div className="space-y-3 text-xs flex-1">
              {(project.personnels || []).length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                   <HardHat className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 font-medium">Belum ada tim terdaftar</p>
                 </div>
              ) : (
                (project.personnels || []).map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <HardHat className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{person.nama}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{person.peran}</p>
                      </div>
                    </div>

                    {/* TOMBOL AKSI PERSONEL - HANYA MUNCUL DI EDIT MODE */}
                    {isEditMode && canCreateData && (
                      <div className="flex gap-2">
                        <button onClick={() => openPersonnelModal(person)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-slate-700"><Edit3 className="w-3.5 h-3.5"/></button>
                        <button onClick={() => confirmDeletePersonnel(person.id, person.nama)} className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Dokumen & Deskripsi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm relative">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4" /> Dokumen Administrasi
              </h2>
              
              {/* TOMBOL UPLOAD DOKUMEN - HANYA MUNCUL DI EDIT MODE */}
              {isEditMode && canCreateData && (
                <>
                  <input type="file" id="docUpload" className="hidden" multiple accept=".pdf,.xlsx,.xls,.dwg" onChange={handleUploadDocument} />
                  <button onClick={() => document.getElementById('docUpload').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all">
                    <UploadCloud className="w-3.5 h-3.5" /> Upload File
                  </button>
                </>
              )}
            </div>
            
            <div className="space-y-2 text-xs flex-1">
              {(project.documents || []).length === 0 ? (
                 <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                   <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 font-medium">Belum ada berkas terlampir</p>
                 </div>
              ) : (
                (project.documents || []).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-medium text-slate-800 dark:text-white truncate">{doc.nama_file}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{doc.ukuran || 'N/A'}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* IKON DOWNLOAD SELALU ADA - MEMBUKA FILE DI TAB BARU */}
                      <button 
                        type="button"
                        onClick={() => window.open(getDocUrl(doc.path_file), '_blank')} 
                        title="Download / Buka File" 
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-50 dark:hover:bg-slate-700 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5"/>
                      </button>
                      
                      {/* IKON HAPUS HANYA MUNCUL DI EDIT MODE */}
                      {isEditMode && canCreateData && (
                        <button 
                          type="button"
                          onClick={() => confirmDeleteDocument(doc.id, doc.nama_file)} 
                          title="Hapus File" 
                          className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-3 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <FileText className="w-4 h-4" /> Deskripsi & Lingkup Pekerjaan
            </h2>
            
            {isEditMode ? (
              <textarea name="deskripsi" rows={5} value={editFormData.deskripsi || ''} onChange={handleMainChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
            ) : (
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 h-[calc(100%-3rem)] overflow-y-auto">
                {project.deskripsi || 'Tidak ada deskripsi.'}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL: TAMBAH / EDIT PERSONEL               */}
      {/* ========================================== */}
      {showPersonnelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500"/> {personnelForm.id ? 'Edit Personel' : 'Tambah Personel Lapangan'}
              </h3>
              <button onClick={() => setShowPersonnelModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSavePersonnel}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required
                    value={personnelForm.nama}
                    onChange={(e) => setPersonnelForm({...personnelForm, nama: e.target.value})}
                    placeholder="Contoh: Budi Santoso, S.T." 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Peran <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required
                    value={personnelForm.peran}
                    onChange={(e) => setPersonnelForm({...personnelForm, peran: e.target.value})}
                    placeholder="Contoh: Site Manager" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPersonnelModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm">Batal</button>
                <button type="submit" disabled={isSavingPersonnel} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50">
                  {isSavingPersonnel ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  {isSavingPersonnel ? 'Menyimpan...' : 'Simpan Personel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: KONFIRMASI HAPUS (UNIVERSAL)          */}
      {/* ========================================== */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Anda yakin ingin menghapus <span className="font-bold text-slate-700 dark:text-slate-300">{deleteConfig.name}</span> secara permanen dari sistem?
              
              {/* Peringatan Khusus untuk Penghapusan Proyek */}
              {deleteConfig.type === 'project' && (
                <span className="block mt-2 text-rose-500 font-medium">
                  Peringatan: Seluruh data RAB, Jadwal, dan Laporan Harian yang terkait dengan proyek ini juga akan ikut terhapus!
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, type: '', id: null, name: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4"/> Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}