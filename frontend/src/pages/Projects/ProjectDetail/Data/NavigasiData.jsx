import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, UploadCloud, Trash2, Edit3, X, FileSpreadsheet, Download, CheckCircle2, Info, TrendingUp, Compass } from 'lucide-react';

export default function NavigasiData({
  id, projectId, project, isEditMode, editFormData, handleMainChange, 
  toggleEditMode, cancelEditMode, isSavingMain, confirmDeleteProject, 
  handleExportExcel, handleExportPDF, newFotoPreview, removeFoto, 
  setRemoveFoto, handleFotoChange, setFotoSampul, setNewFotoPreview, getImageUrl
}) {
  const navigate = useNavigate();

  // --- CEK HAK AKSES MANDIRI ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const canExportData = ['Administrator', 'Direktur'].includes(userRole);
  // -----------------------------

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

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
      <div className="flex items-start lg:items-center gap-4 shrink-0">
        <button onClick={() => navigate('/projects')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* AVATAR / BANNER */}
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

          {isEditMode && (
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 backdrop-blur-sm">
              <button type="button" onClick={(e) => { e.preventDefault(); document.getElementById('headerFotoInput').click(); }} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors" title="Ganti Foto"><UploadCloud className="w-4 h-4" /></button>
              {((project.foto_sampul && !removeFoto) || newFotoPreview) && (
                <button type="button" onClick={(e) => { e.preventDefault(); setRemoveFoto(true); setFotoSampul(null); setNewFotoPreview(null); }} className="p-1.5 bg-rose-500/80 hover:bg-rose-500 rounded-full text-white transition-colors" title="Hapus Foto"><Trash2 className="w-4 h-4" /></button>
              )}
            </div>
          )}
          <input type="file" id="headerFotoInput" className="hidden" accept="image/*" onChange={handleFotoChange} />
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-start lg:items-center gap-1.5 flex-wrap">
            <span>Executive Summary Proyek</span>
          </h1>
          <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <span className="truncate font-medium">{project.nama_proyek}</span>
            <span className="text-slate-400 mx-0.5">•</span>              
            {isEditMode ? (
              <select name="kategori" value={editFormData.kategori || ''} onChange={handleMainChange} className="bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer animate-fade-in shadow-sm">
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
        <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar transition-all duration-300">
          {canCreateData && isEditMode && (
             <button onClick={cancelEditMode} disabled={isSavingMain} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap"><X className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> Batal</button>
          )}
          {canCreateData && (
            <button onClick={toggleEditMode} disabled={isSavingMain} className={`flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm ${isEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-200'}`}>
              {isSavingMain ? <Loader2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" /> : (isEditMode ? <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> : <Edit3 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />)} 
              <span className="hidden lg:inline">{isSavingMain ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Mode Edit Data')}</span>
            </button>
          )}
          {!isEditMode && (
            <>
              {canCreateData && (
                <button onClick={confirmDeleteProject} title="Hapus Proyek" className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Hapus</span></button>
              )}
              {canExportData && (
                <>
                  <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                  <button onClick={handleExportExcel} title="Export Excel" className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export Excel</span></button>
                  <button onClick={handleExportPDF} title="Export PDF" className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><Download className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export PDF</span></button>
                </>
              )}
            </>
          )}
        </div>

        {/* --- NAVIGASI MODUL (AKSES TERBUKA UNTUK SEMUA ROLE) --- */}
        <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar z-0">
          <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap">
            <Info className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Data Utama</span>
          </button>
          
          <button onClick={() => navigate(`/projects/${projectId}/rab`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span>
          </button>
          
          <button onClick={() => navigate(`/projects/${projectId}/kurva-s`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
            <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Kurva S</span>
          </button>
          
          <button onClick={() => navigate(`/projects/${projectId}/peta-gis`, { state: project })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
            <Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span>
          </button>
        </div>
      </div>
    </div>
  );
}