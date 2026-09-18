import React, { useState, useEffect } from 'react';
import { UserCheck, Users, HardHat, Plus, Edit3, Trash2, FileText, UploadCloud, Download } from 'lucide-react';

export default function PersonelDocData({
  project, isEditMode, editFormData, handleMainChange, 
  openPersonnelModal, confirmDeletePersonnel, 
  handleUploadDocument, confirmDeleteDocument, getDocUrl
}) {

  // --- CEK HAK AKSES MANDIRI ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  // -----------------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Stakeholders & Personel Lapangan */}
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

        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2 mt-4 pt-4">
          <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Personel Lapangan
          </h2>
          {isEditMode && canCreateData && (
            <button onClick={() => openPersonnelModal()} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 transition-all shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          )}
        </div>
        
        <div className="space-y-3 text-xs">
          {(project.personnels || []).length === 0 ? (
             <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
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

      {/* Dokumen Administrasi & Deskripsi */}
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
                  <button type="button" onClick={() => window.open(getDocUrl(doc.path_file), '_blank')} title="Download" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-50 dark:hover:bg-slate-700 shadow-sm"><Download className="w-3.5 h-3.5"/></button>
                  {isEditMode && canCreateData && (
                    <button type="button" onClick={() => confirmDeleteDocument(doc.id, doc.nama_file)} title="Hapus File" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm"><Trash2 className="w-3.5 h-3.5"/></button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60">
          <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" /> Deskripsi & Lingkup Pekerjaan
          </h2>
          {isEditMode ? (
            <textarea name="deskripsi" rows={5} value={editFormData.deskripsi || ''} onChange={handleMainChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
          ) : (
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 max-h-40 overflow-y-auto">
              {project.deskripsi || 'Tidak ada deskripsi.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}