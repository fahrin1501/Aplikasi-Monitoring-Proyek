import React from 'react';
import { Image as ImageIcon, UploadCloud, ExternalLink, Trash2, Paperclip, FileSpreadsheet, Download } from 'lucide-react';

export default function LampiranDokumentasi({ isEditMode, reportData, handleUploadFile, handleDeleteFile, getDocUrl }) {
  const fotoDokumentasi = (reportData.attachments || []).filter(a => a.tipe === 'foto');
  const lampiranFiles = (reportData.attachments || []).filter(a => a.tipe === 'dokumen');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
          <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Dokumentasi (Foto)
          </h2>
          {isEditMode && (
            <>
              <input type="file" id="fotoUploadAdd" className="hidden" multiple accept="image/*" onChange={(e) => handleUploadFile(e, 'foto')} />
              <button type="button" onClick={() => document.getElementById('fotoUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/30 transition-all shadow-sm">
                <UploadCloud className="w-3.5 h-3.5" /> Upload Foto
              </button>
            </>
          )}
        </div>
        
        <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {fotoDokumentasi.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
               <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
               <p className="text-slate-500 font-medium">Belum ada foto terlampir</p>
             </div>
          ) : (
            fotoDokumentasi.map((foto, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-all">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-slate-800 dark:text-white truncate">{foto.nama_file}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Telah Diunggah</p>
                </div>
                
                <div className="flex gap-2">
                  {!isEditMode && (
                    <button onClick={() => window.open(getDocUrl(foto.path_file), '_blank')} title="Lihat Foto" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 shadow-sm transition-colors">
                      <ExternalLink className="w-3.5 h-3.5"/>
                    </button>
                  )}
                  {isEditMode && (
                    <button onClick={() => handleDeleteFile(foto.id)} title="Hapus Foto" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 shadow-sm transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
          <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <Paperclip className="w-4 h-4" /> File Lampiran
          </h2>
          {isEditMode && (
            <>
              <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => handleUploadFile(e, 'dokumen')} />
              <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-all shadow-sm">
                <UploadCloud className="w-3.5 h-3.5" /> Upload File
              </button>
            </>
          )}
        </div>
        
        <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {lampiranFiles.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
               <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
               <p className="text-slate-500 font-medium">Belum ada berkas terlampir</p>
             </div>
          ) : (
            lampiranFiles.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-all">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-bold text-slate-800 dark:text-white truncate">{file.nama_file}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Telah Diunggah</p>
                </div>
                
                <div className="flex gap-2">
                  {!isEditMode && (
                    <button onClick={() => window.open(getDocUrl(file.path_file), '_blank')} title="Download / Buka File" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 shadow-sm transition-colors">
                      <Download className="w-3.5 h-3.5"/>
                    </button>
                  )}
                  {isEditMode && (
                    <button onClick={() => handleDeleteFile(file.id)} title="Hapus File" className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 shadow-sm transition-colors">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}