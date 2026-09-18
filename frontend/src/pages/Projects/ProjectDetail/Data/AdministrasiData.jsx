import React, { useState, useEffect } from 'react';
import { FileSignature, DollarSign, Clock, Calendar, MapPin } from 'lucide-react';

export default function AdministrasiData({
  project, isEditMode, editFormData, handleMainChange, 
  formatRupiah, formatDateForInput, displayStatus, isActuallyDelayed
}) {

  // --- CEK HAK AKSES MANDIRI ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canViewFinance = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  // -----------------------------

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* KOLOM KIRI: Kontrak & Keuangan */}
      <div className={`bg-white dark:bg-slate-800/60 border p-4 md:p-5 rounded-2xl space-y-4 relative shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3 gap-2">
          <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Kontrak & Keuangan
          </h2>
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
  );
}