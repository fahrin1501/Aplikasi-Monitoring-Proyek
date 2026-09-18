import React from 'react';
import { Users, AlertTriangle, CheckCircle2, Trash2, X, Loader2 } from 'lucide-react';

export default function ModalData({
  showPersonnelModal, setShowPersonnelModal, personnelForm, setPersonnelForm, handleSavePersonnel, isSavingPersonnel,
  deleteConfig, setDeleteConfig, executeDelete
}) {

  return (
    <>
      {showPersonnelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500"/> {personnelForm.id ? 'Edit Personel' : 'Tambah Personel'}
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
    </>
  );
}