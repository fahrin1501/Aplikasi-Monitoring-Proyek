import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import api from '../../../api'; 
import { 
  Calendar, MapPin, DollarSign, HardHat, 
  UserCheck, Compass, FileText, TrendingUp, FileSpreadsheet, Info, 
  Clock, Download, Users, CheckCircle2, Activity, 
  AlertTriangle, Edit3, Trash2, UploadCloud, Plus, Loader2, FileSignature, X, Camera
} from 'lucide-react';

// CACHE MEMORI: Simpan detail proyek per ID agar langsung muncul instan saat dibuka kembali
let cachedProjectDetails = {};

export default function ProjectData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  useEffect(() => {
    document.title = "Prisma Group - Data Utama";
  }, []);

  // Ambil data awal dari memory cache, sessionStorage, atau router state
  const getInitialProject = () => {
    if (cachedProjectDetails[id]) return cachedProjectDetails[id];
    try {
      const saved = sessionStorage.getItem(`cached_project_detail_${id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    if (location.state && location.state.tanggal_mulai) return location.state;
    return location.state || { id: id, nama_proyek: 'Memuat Data...' };
  };

  const initialProject = getInitialProject();
  const [project, setProject] = useState(initialProject);
  const projectId = project?.id || id;
  const projectData = project;

  // Jika data sudah ada di cache, jangan tampilkan layar loading penuh
  const hasCachedFullData = Boolean(project && project.tanggal_mulai);
  const [isLoading, setIsLoading] = useState(!hasCachedFullData);
  const [errorMsg, setErrorMsg] = useState('');

  // State Progres Fisik S-Curve
  const [progressData, setProgressData] = useState({ 
    plan: parseFloat(initialProject?.progress_plan) || 0, 
    actual: parseFloat(initialProject?.progress_actual) || 0, 
    deviasi: parseFloat(initialProject?.deviasi) || 0 
  });

  // State Edit Mode Utama
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState(initialProject || {});
  const [isSavingMain, setIsSavingMain] = useState(false);
  const isSaving = isSavingMain;

  // State Foto Banner / Sampul Proyek
  const [fotoSampul, setFotoSampul] = useState(null);
  const [newFotoPreview, setNewFotoPreview] = useState(null);
  const [removeFoto, setRemoveFoto] = useState(false); 

  // State Personel Modal
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({ id: null, nama: '', peran: '' });
  const [isSavingPersonnel, setIsSavingPersonnel] = useState(false);

  // State Konfirmasi Hapus Modal
  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });

  // Hak Akses (RBAC)
  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserRole(user.role || 'Tamu');
      } catch (error) {}
    }
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const canEditData = canCreateData;
  const canViewFinance = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  const canExportData = ['Administrator', 'Direktur'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  // Fetch Data Proyek (Silent jika cache sudah tersedia)
  const fetchProjectDetail = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const projRes = await api.get(`/projects/${id}`);
      const data = projRes.data?.data || projRes.data;
      
      setProject(data);
      setEditFormData(data);
      cachedProjectDetails[id] = data;
      try {
        sessionStorage.setItem(`cached_project_detail_${id}`, JSON.stringify(data));
      } catch {}

      setProgressData({ 
        plan: parseFloat(data.progress_plan) || 0, 
        actual: parseFloat(data.progress_actual) || 0, 
        deviasi: parseFloat(data.deviasi) || 0 
      });
    } catch (error) {
      if (!silent) setErrorMsg('Gagal memuat data proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    const hasData = hasCachedFullData || Boolean(cachedProjectDetails[id]);
    fetchProjectDetail(hasData); 
  }, [id]);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(angka) || 0);

  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';

  const getImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http')) return filename; 
    return `${BASE_URL}/storage/foto_proyek/${filename}`; 
  };

  const getDocUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  };

  const formatDateForInput = (val) => val ? String(val).substring(0, 10) : '';

  const handleMainChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoSampul(file);
      setNewFotoPreview(URL.createObjectURL(file));
      setRemoveFoto(false);
    }
  };

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
          Object.keys(payloadData).forEach(key => formData.append(key, payloadData[key] === null ? '' : payloadData[key]));
          if (fotoSampul) formData.append('foto_sampul', fotoSampul);
          if (removeFoto) formData.append('remove_foto', 'true');
          formData.append('_method', 'PUT'); 
          await api.post(`/projects/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' }}); 
        } else {
          await api.put(`/projects/${id}`, payloadData);
        }

        // Hapus cache lokal agar sinkronisasi data baru langsung terbaca
        delete cachedProjectDetails[id];
        try { 
          sessionStorage.removeItem(`cached_project_detail_${id}`);
          sessionStorage.removeItem('cached_projects_list');
        } catch {}

        await fetchProjectDetail(false); 
        setIsEditMode(false); 
        setFotoSampul(null); 
        setNewFotoPreview(null); 
        setRemoveFoto(false);
      } catch (error) { 
        alert("Gagal update proyek."); 
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
  const cancelEdit = cancelEditMode;
  const handleSaveProject = toggleEditMode;

  const openPersonnelModal = (person = null) => {
    if (person) setPersonnelForm({ id: person.id, nama: person.nama, peran: person.peran });
    else setPersonnelForm({ id: null, nama: '', peran: '' });
    setShowPersonnelModal(true);
  };

  const handleSavePersonnel = async (e) => {
    e.preventDefault();
    setIsSavingPersonnel(true);
    try {
      if (personnelForm.id) await api.put(`/personnels/${personnelForm.id}`, personnelForm);
      else await api.post(`/projects/${id}/personnels`, personnelForm);
      setShowPersonnelModal(false); 
      fetchProjectDetail(true); 
    } catch (error) { 
      alert("Gagal simpan personel."); 
    } finally { 
      setIsSavingPersonnel(false); 
    }
  };

  const handleUploadDocument = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('dokumen_lampiran[]', file));
    e.target.value = null;
    try {
      await api.post(`/projects/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
      fetchProjectDetail(true); 
      alert("Dokumen berhasil ditambahkan!");
    } catch (error) { 
      alert("Gagal upload dokumen."); 
    }
  };

  const confirmDeletePersonnel = (personId, personName) => setDeleteConfig({ show: true, type: 'personnel', id: personId, name: personName });
  const confirmDeleteDocument = (docId, docName) => setDeleteConfig({ show: true, type: 'document', id: docId, name: docName });

  const executeDelete = async () => {
    try {
      if (deleteConfig.type === 'project') { 
        await api.delete(`/projects/${deleteConfig.id}`); 
        delete cachedProjectDetails[id];
        try { 
          sessionStorage.removeItem(`cached_project_detail_${id}`);
          sessionStorage.removeItem('cached_projects_list');
        } catch {}
        alert("Proyek dihapus."); 
        navigate('/projects'); 
        return; 
      } else if (deleteConfig.type === 'personnel') {
        await api.delete(`/personnels/${deleteConfig.id}`);
      } else if (deleteConfig.type === 'document') {
        await api.delete(`/documents/${deleteConfig.id}`);
      }
      setDeleteConfig({ show: false, type: '', id: null, name: '' }); 
      fetchProjectDetail(true); 
    } catch (error) { 
      alert("Gagal menghapus data."); 
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); 
      link.href = url;
      link.setAttribute('download', `Data_Proyek_${project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`); 
      document.body.appendChild(link); 
      link.click(); 
      link.remove();
    } catch (error) { 
      alert("Gagal export Excel."); 
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); 
      link.href = url;
      link.setAttribute('download', `Executive_Summary_${project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link); 
      link.click(); 
      link.remove();
    } catch (error) { 
      alert("Gagal export PDF."); 
    }
  };

  // Indikator Progres
  const progressPlan = progressData.plan.toFixed(2); 
  const progressReal = progressData.actual.toFixed(2);
  const rawDeviasi = progressData.deviasi;
  const deviasi = rawDeviasi > 0 ? `+${rawDeviasi.toFixed(2)}` : rawDeviasi.toFixed(2);
  
  const calculatedStatus = project?.status || 'Persiapan';
  const displayStatus = (isGuest && (calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat')) ? 'Berjalan' : calculatedStatus;
  const isActuallyDelayed = calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat';

  return (
    <div className="w-full space-y-3.5 pb-2 relative">
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* HEADER UTAMA & DUA BOKS KONTROL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-2">
        
        {/* INFORMASI, FOTO SAMPUL & JUDUL PROYEK */}
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          {/* FOTO SAMPUL / BANNER PROYEK DI SEBELAH KIRI DATA UTAMA */}
          <div className="relative group shrink-0 mt-0.5 lg:mt-0">
            <input 
              type="file" 
              id="bannerUploadInput" 
              accept="image/*" 
              onChange={handleFotoChange} 
              className="hidden" 
              disabled={!isEditMode}
            />
            
            <div 
              onClick={() => {
                if (isEditMode) {
                  document.getElementById('bannerUploadInput')?.click();
                }
              }}
              className={`w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-500 overflow-hidden shadow-sm relative transition-all ${
                isEditMode ? 'cursor-pointer hover:ring-2 hover:ring-blue-500/50 hover:opacity-90' : ''
              }`}
              title={isEditMode ? "Klik untuk ganti foto sampul" : "Foto Sampul Proyek"}
            >
              {newFotoPreview ? (
                <img src={newFotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (project?.foto_sampul && !removeFoto) ? (
                <img src={getImageUrl(project.foto_sampul)} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-extrabold text-amber-500">
                  {project?.nama_proyek ? project.nama_proyek.charAt(0).toUpperCase() : 'P'}
                </span>
              )}

              {/* OVERLAY MODE EDIT */}
              {isEditMode && (
                <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                  <span className="text-[7px] font-bold mt-0.5">Ubah</span>
                </div>
              )}
            </div>

            {/* TOMBOL HAPUS FOTO SAAT MODE EDIT */}
            {isEditMode && (newFotoPreview || (project?.foto_sampul && !removeFoto)) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFotoSampul(null);
                  setNewFotoPreview(null);
                  setRemoveFoto(true);
                }}
                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-md z-10 transition-transform active:scale-95"
                title="Hapus Foto Sampul"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span>Data Utama Proyek</span>
              {isEditMode && (
                <span className="px-2 py-0.5 ml-1 text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 dark:border-blue-500/30 font-extrabold tracking-wider shadow-sm">
                  DRAFT MODE
                </span>
              )}
            </h1>
            
            <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate font-medium">{project?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate">
                SPK: {project?.kode_kontrak || project?.nomor_kontrak_kontraktor || '-'}
              </span>
              <span className="text-slate-400">•</span>
              <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(project?.kategori)}`}>
                {project?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        {/* CONTAINER KONTROL: BERTUMPUK DI MOBILE & TABLET, SEJAJAR DI DESKTOP */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          
          {/* BOKS KIRI: KONTROL AKSI (EDIT: BIRU, BATAL, SIMPAN, EXCEL: HIJAU, PDF: MERAH) */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-30 transition-all shrink-0">
            {canEditData && (
              isEditMode ? (
                <>
                  <button 
                    type="button"
                    onClick={cancelEdit} 
                    disabled={isSaving || isLoading} 
                    className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 whitespace-nowrap shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" /> 
                    <span>Batal</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleSaveProject} 
                    disabled={isSaving || isLoading} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-white" />
                    )} 
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                </>
              ) : (
                <button 
                  type="button"
                  onClick={() => setIsEditMode(true)} 
                  disabled={isLoading && !hasCachedFullData} 
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" /> 
                  <span>Edit</span>
                </button>
              )
            )}

            {!isEditMode && canExportData && (
              <>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                <button 
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isLoading && !hasCachedFullData}
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Excel</span>
                </button>
                <button 
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isLoading && !hasCachedFullData}
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>PDF</span>
                </button>
              </>
            )}
          </div>

          {/* BOKS KANAN: NAVIGASI TAB MENU (TAB DATA AKTIF ORANYE AMBER) */}
          <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0 shrink-0">
            <button 
              type="button"
              className="flex items-center justify-center gap-1.5 h-7 px-2.5 bg-amber-500 text-white dark:text-slate-950 text-[10px] sm:text-[11px] font-bold rounded-lg shadow-sm whitespace-nowrap shrink-0 cursor-default"
            >
              <Info className="w-3.5 h-3.5 shrink-0" /> 
              <span>Data</span>
            </button>

            {!isGuest && (
              <>
                <button 
                  type="button"
                  onClick={() => navigate(`/projects/${id}/rab`, { state: project })} 
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
                  <span>RAB</span>
                </button>

                <button 
                  type="button"
                  onClick={() => navigate(`/projects/${id}/kurva-s`, { state: project })} 
                  className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
                  <span>Kurva Schedule</span>
                </button>
              </>
            )}

            <button 
              type="button"
              onClick={() => navigate(`/projects/${id}/peta-gis`, { state: project })} 
              className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap shrink-0"
            >
              <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
              <span>Peta GIS</span>
            </button>
          </div>

        </div>
      </div>

      {/* LOADING STATE VS KONTEN UTAMA */}
      {isLoading && !hasCachedFullData ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Memuat rincian proyek...
          </p>
        </div>
      ) : errorMsg || !project?.tanggal_mulai ? ( 
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm text-center animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Proyek Tidak Ditemukan</h2>
          <button onClick={() => navigate('/projects')} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold mt-4 transition-colors">Kembali ke Daftar</button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          
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
              {!isGuest && (
                <div className={`p-2.5 md:p-3 rounded-xl border text-center flex flex-col justify-center ${isActuallyDelayed ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'}`}>
                  <span className={`text-[9px] md:text-[10px] uppercase tracking-wider block mb-1 ${isActuallyDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'}`}>Deviasi</span>
                  <p className={`text-sm md:text-lg font-mono font-bold ${isActuallyDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'}`}>{deviasi}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Data Kontrak & Administrasi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
                <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><FileSignature className="w-4 h-4" /> Kontrak & Keuangan</h2>
                <span className={`px-2.5 py-1 text-[10px] md:text-[11px] font-semibold rounded-lg border inline-block ${isActuallyDelayed ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>Status : {displayStatus}</span>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Nama Paket Pekerjaan</span>
                  {isEditMode ? <input type="text" name="nama_proyek" value={editFormData.nama_proyek || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-bold text-slate-800 dark:text-white text-sm leading-snug">{project.nama_proyek}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">No. Kontrak Konsultan</span>
                    {isEditMode ? <input type="text" name="kode_kontrak" value={editFormData.kode_kontrak || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Kosongkan jika belum ada" /> : <p className="font-semibold text-slate-800 dark:text-white font-mono break-all">{project.kode_kontrak || '-'}</p>}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">No. Kontrak Kontraktor</span>
                    {isEditMode ? <input type="text" name="nomor_kontrak_kontraktor" value={editFormData.nomor_kontrak_kontraktor || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Kosongkan jika belum ada" /> : <p className="font-semibold text-slate-800 dark:text-white font-mono break-all">{project.nomor_kontrak_kontraktor || '-'}</p>}
                  </div>
                </div>
                <div className={`grid grid-cols-1 ${canViewFinance ? 'sm:grid-cols-3' : 'sm:grid-cols-1'} gap-3`}>
                  {canViewFinance && (
                    <>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Nilai Kontrak (Pagu)</span>
                        {isEditMode ? <input type="number" name="nilai_kontrak" value={editFormData.nilai_kontrak || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" /> : <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1"><DollarSign className="w-4 h-4 shrink-0" /> <span className="truncate" title={formatRupiah(project.nilai_kontrak)}>{formatRupiah(project.nilai_kontrak)}</span></p>}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Sumber Dana</span>
                        {isEditMode ? <input type="text" name="sumber_dana" value={editFormData.sumber_dana || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="APBD" /> : <p className="font-semibold text-slate-800 dark:text-white truncate" title={project.sumber_dana || '-'}>{project.sumber_dana || '-'}</p>}
                      </div>
                    </>
                  )}
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">TA</span>
                    {isEditMode ? <input type="text" name="tahun_anggaran" value={editFormData.tahun_anggaran || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="2026" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.tahun_anggaran || '-'}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3"><Clock className="w-4 h-4" /> Jadwal & Lokasi</h2>
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1"><Calendar className="w-3.5 h-3.5 text-amber-500" /> Periode Kontrak (Waktu Pekerjaan)</span>
                  {isEditMode ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input type="date" name="tanggal_mulai" value={formatDateForInput(editFormData.tanggal_mulai)} onChange={handleMainChange} className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                      <span className="text-slate-400 text-[10px]">s/d</span>
                      <input type="date" name="tanggal_selesai" value={formatDateForInput(editFormData.tanggal_selesai)} onChange={handleMainChange} className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light_dark]" />
                    </div>
                  ) : <p className="font-semibold text-slate-800 dark:text-white">{project.tanggal_mulai} s/d {project.tanggal_selesai || 'Belum di Set'}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Waktu Pelaksanaan</span>
                    {isEditMode ? <input type="text" name="waktu_pelaksanaan" value={editFormData.waktu_pelaksanaan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-bold text-slate-800 dark:text-white font-mono">{project.waktu_pelaksanaan || '-'}</p>}
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Masa Pemeliharaan</span>
                    {isEditMode ? <input type="text" name="masa_pemeliharaan" value={editFormData.masa_pemeliharaan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-bold text-slate-800 dark:text-white font-mono">{project.masa_pemeliharaan || '-'}</p>}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1"><MapPin className="w-3.5 h-3.5 text-amber-500" /> Keterangan Wilayah Lokasi</span>
                  {isEditMode ? <input type="text" name="lokasi_wilayah" value={editFormData.lokasi_wilayah || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.lokasi_wilayah || '-'}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Stakeholders & Personel Lapangan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all flex flex-col ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <UserCheck className="w-4 h-4" /> Para Pihak (Stakeholders)
              </h2>
              <div className="space-y-3 text-xs flex-1">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">PPK (Pejabat Pembuat Komitmen) / Owner</span>
                  {isEditMode ? <input type="text" name="ppk" value={editFormData.ppk || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.ppk || '-'}</p>}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Kontraktor Pelaksana (Penyedia Jasa)</span>
                  {isEditMode ? <input type="text" name="kontraktor" value={editFormData.kontraktor || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.kontraktor || '-'}</p>}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] block mb-1">Konsultan Pengawas / Manajemen Konstruksi</span>
                  {isEditMode ? <input type="text" name="konsultan" value={editFormData.konsultan || ''} onChange={handleMainChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" /> : <p className="font-semibold text-slate-800 dark:text-white">{project.konsultan || '-'}</p>}
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all flex flex-col ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
                <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" /> Personel Lapangan
                </h2>
                {isEditMode && canCreateData && (
                  <button onClick={() => openPersonnelModal()} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                )}
              </div>
              <div className="space-y-3 text-xs flex-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {(project.personnels || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl h-full">
                    <HardHat className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500 font-medium">Belum ada tim terdaftar</p>
                  </div>
                ) : (
                  (project.personnels || []).map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><HardHat className="w-4 h-4 text-slate-500 dark:text-slate-400" /></div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{person.nama}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{person.peran}</p>
                        </div>
                      </div>
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

          {/* Section 4: Dokumen Administrasi & Deskripsi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all flex flex-col ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
                <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Dokumen Administrasi
                </h2>
                {isEditMode && canCreateData && (
                  <>
                    <input type="file" id="docUpload" className="hidden" multiple accept=".pdf,.xlsx,.xls,.dwg" onChange={handleUploadDocument} />
                    <button onClick={() => document.getElementById('docUpload').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all">
                      <UploadCloud className="w-3.5 h-3.5" /> Upload File
                    </button>
                  </>
                )}
              </div>
              
              <div className="space-y-2 text-xs flex-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {(project.documents || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl h-full">
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
                        <button type="button" onClick={() => window.open(getDocUrl(doc.path_file), '_blank')} title="Download / Buka File" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-50 dark:hover:bg-slate-700 shadow-sm"><Download className="w-3.5 h-3.5"/></button>
                        {isEditMode && canCreateData && (
                          <button type="button" onClick={() => confirmDeleteDocument(doc.id, doc.nama_file)} title="Hapus File" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-3 relative shadow-sm transition-all flex flex-col ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <FileText className="w-4 h-4" /> Deskripsi & Lingkup Pekerjaan
              </h2>
              {isEditMode ? (
                <textarea name="deskripsi" rows={5} value={editFormData.deskripsi || ''} onChange={handleMainChange} className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors custom-scrollbar" />
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 flex-1 overflow-y-auto custom-scrollbar">
                  {project.deskripsi || 'Tidak ada deskripsi.'}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* MODAL PERSONEL */}
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
                  <input type="text" required value={personnelForm.nama} onChange={(e) => setPersonnelForm({...personnelForm, nama: e.target.value})} placeholder="Contoh: Budi Santoso, S.T." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Peran <span className="text-rose-500">*</span></label>
                  <input type="text" required value={personnelForm.peran} onChange={(e) => setPersonnelForm({...personnelForm, peran: e.target.value})} placeholder="Contoh: Site Manager" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" />
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

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Anda yakin ingin menghapus <span className="font-bold text-slate-700 dark:text-slate-300">{deleteConfig.name}</span> secara permanen dari sistem?
              {deleteConfig.type === 'project' && (
                <span className="block mt-2 text-rose-500 font-medium">Peringatan: Seluruh data RAB, Jadwal, dan Laporan Harian yang terkait dengan proyek ini juga akan ikut terhapus!</span>
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