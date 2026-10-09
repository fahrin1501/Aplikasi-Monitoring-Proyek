import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Info, FileSpreadsheet, TrendingUp, Compass, 
  Plus, Edit3, Download, CheckCircle2, UploadCloud 
} from 'lucide-react';

export default function NavigasiRAB({ 
  id, projectData, isEditMode, setIsEditMode, 
  openCatModal, setShowImportModal, setExportModal, isLoading 
}) {
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canEditData = userRole === 'Administrator';
  const canExportData = ['Administrator', 'Direktur'].includes(userRole);

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
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-2">
      {/* HEADER JUDUL & INFO PROYEK */}
      <div className="flex items-start lg:items-center gap-3 shrink-0">
        <Link 
          to={`/projects/${id}/data`} 
          className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
            <span>Rencana Anggaran Biaya (RAB)</span>
            {isEditMode && (
              <span className="px-2 py-0.5 ml-1 text-[9px] bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-md animate-pulse border border-amber-200 dark:border-amber-500/30 font-extrabold tracking-wider shadow-sm">
                DRAFT MODE
              </span>
            )}
          </h1>
          <div className="flex items-center flex-wrap gap-1 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
            <span className="truncate font-medium">{projectData?.nama_proyek}</span>
            <span className="text-slate-400">•</span>
            <span className={`px-1.5 py-0.2 rounded border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
              {projectData?.kategori || 'Belum Ditentukan'}
            </span>
          </div>
        </div>
      </div>

      {/* DUA CARD BOX KONTROL (AKSI & NAVIGASI TAB) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
        
        {/* CARD BOX KIRI: AKSI, EDIT & EXPORT */}
        <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-30 transition-all shrink-0">
          {isEditMode ? (
            <>
              {/* TOMBOL TAMBAH DIVISI */}
              <button 
                disabled={isLoading} 
                onClick={() => openCatModal()} 
                className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" /> 
                <span>Divisi Baru</span>
              </button>

              {/* TOMBOL SELESAI EDIT */}
              <button 
                disabled={isLoading} 
                onClick={() => setIsEditMode(false)} 
                className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 
                <span>Selesai Edit</span>
              </button>
            </>
          ) : (
            <>
              {canEditData && (
                <>
                  {/* TOMBOL EDIT (BIRU) */}
                  <button 
                    disabled={isLoading} 
                    onClick={() => setIsEditMode(true)} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" /> 
                    <span>Edit</span>
                  </button>

                  {/* TOMBOL IMPORT (UNGU) */}
                  <button 
                    disabled={isLoading} 
                    onClick={() => setShowImportModal(true)} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-500/10 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" /> 
                    <span>Import</span>
                  </button>
                </>
              )}

              {canExportData && (
                <>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>

                  {/* TOMBOL EXCEL (HIJAU) */}
                  <button 
                    disabled={isLoading} 
                    onClick={() => setExportModal({ show: true, type: 'excel' })} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" /> 
                    <span>Excel</span>
                  </button>

                  {/* TOMBOL PDF (MERAH) */}
                  <button 
                    disabled={isLoading} 
                    onClick={() => setExportModal({ show: true, type: 'pdf' })} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" /> 
                    <span>PDF</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* CARD BOX KANAN: NAVIGASI TAB MENU */}
        <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0 shrink-0">
          <button 
            onClick={() => navigate(`/projects/${id}/data`)} 
            className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap"
          >
            <Info className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
            <span>Data</span>
          </button>
          <button 
            className="flex items-center justify-center gap-1.5 h-7 px-2.5 bg-amber-500 text-white dark:text-slate-950 text-[10px] sm:text-[11px] font-bold rounded-lg shadow-sm whitespace-nowrap cursor-default"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" /> 
            <span>RAB</span>
          </button>
          <button 
            onClick={() => navigate(`/projects/${id}/kurva-s`, { state: projectData })} 
            className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
            <span>Kurva Schedule</span>
          </button>
          <button 
            onClick={() => navigate(`/projects/${id}/peta-gis`, { state: projectData })} 
            className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-medium rounded-lg whitespace-nowrap"
          >
            <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" /> 
            <span>Peta GIS</span>
          </button>
        </div>

      </div>
    </div>
  );
}