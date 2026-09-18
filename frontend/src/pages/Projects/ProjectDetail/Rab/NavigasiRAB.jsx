import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Info, FileSpreadsheet, TrendingUp, Compass, Plus, Edit3, Download, Loader2, CheckCircle2, UploadCloud, X } from 'lucide-react';

export default function NavigasiRAB({ 
  id, projectData, isEditMode, canCreateData, isGuest, isSavingEdit, 
  handleBatalEdit, handleToggleEdit, handleSelesaiEdit, 
  openCatModal, setShowImportModal, setExportModal 
}) {
  const navigate = useNavigate();

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
      <div className="flex items-start lg:items-center gap-3 shrink-0">
        <Link to={`/projects/${id}/data`} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-start lg:items-center gap-1.5 flex-wrap">
            <span>Rencana Anggaran Biaya (RAB)</span>
            {isEditMode && <span className="px-2 py-0.5 ml-2 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200">DRAFT MODE</span>}
          </h1>
          <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <span className="truncate font-medium">{projectData?.nama_proyek}</span>
            <span className="text-slate-400 mx-0.5"> • </span>
            <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
              {projectData?.kategori || 'Belum Ditentukan'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
        <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar transition-all duration-300">
          {isEditMode ? (
            <>
              <button onClick={handleBatalEdit} disabled={isSavingEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap border border-slate-300 dark:border-slate-600">
                <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> Batal
              </button>
              <button onClick={() => openCatModal()} disabled={isSavingEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                <Plus className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Divisi Baru</span>
              </button>
              <button onClick={handleSelesaiEdit} disabled={isSavingEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm">
                {isSavingEdit ? <Loader2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />} 
                <span className="hidden lg:inline">{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </>
          ) : (
            <>
              {canCreateData && (
                <>
                  <button onClick={handleToggleEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                    <Edit3 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Mode Edit Draf</span>
                  </button>
                  <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                  <button onClick={() => setShowImportModal(true)} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                    <UploadCloud className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Import RAB</span>
                  </button>
                </>
              )}
              <button onClick={() => setExportModal({ show: true, type: 'excel' })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export Excel</span>
              </button>
              <button onClick={() => setExportModal({ show: true, type: 'pdf' })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                <Download className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export PDF</span>
              </button>
            </>
          )}
        </div>

        <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar z-0">
          <button onClick={() => navigate(`/projects/${id}/data`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
            <Info className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span>
          </button>
          <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">RAB</span>
          </button>
          <button onClick={() => navigate(`/projects/${id}/kurva-s`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
            <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Kurva S</span>
          </button>
          <button onClick={() => navigate(`/projects/${id}/peta-gis`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
            <Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span>
          </button>
        </div>
      </div>
    </div>
  );
}