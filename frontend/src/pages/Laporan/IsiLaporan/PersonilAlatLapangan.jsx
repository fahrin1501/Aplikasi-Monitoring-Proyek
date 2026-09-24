import React from 'react';
import { Users, Wrench, Edit3, Trash2, Plus } from 'lucide-react';

export default function PersonilAlatLaporan({ isEditMode, reportData, editForm, setEditForm, openPersonilModal, openPeralatanModal }) {
  const activePersonnels = isEditMode ? editForm.personnels : reportData.personnels;
  const activeEquipments = isEditMode ? editForm.equipments : reportData.equipments;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Personil */}
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm`}>
        <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between pr-12">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" /> Personil Lapangan
          </h3>
          {isEditMode && (
            <button onClick={() => openPersonilModal()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-all animate-fade-in z-20 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          )}
        </div>
        <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
              <tr>
                <th className="pb-2 font-semibold">Kategori Personil</th>
                <th className="pb-2 text-center font-semibold w-24">Jumlah</th>
                {isEditMode && <th className="pb-2 text-right font-semibold w-16 animate-fade-in">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
              {activePersonnels.length === 0 ? (
                <tr><td colSpan="3" className="py-8 text-center text-slate-500 italic">Belum ada personil diinput.</td></tr>
              ) : (
                activePersonnels.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="py-2.5 text-slate-800 dark:text-slate-300 font-bold">{p.peran}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/30 shadow-sm">
                        {p.jumlah} <span className="text-[9px] text-emerald-600/70 dark:text-emerald-500/70 font-sans font-normal ml-0.5">Org</span>
                      </span>
                    </td>
                    {isEditMode && (
                      <td className="py-2.5 text-right animate-fade-in">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openPersonilModal(p, idx)} className="p-1.5 text-blue-500 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button type="button" onClick={() => { const newP = [...editForm.personnels]; newP.splice(idx,1); setEditForm({...editForm, personnels: newP}); }} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Peralatan */}
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm`}>
        <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between pr-12">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Pemakaian Alat
          </h3>
          {isEditMode && (
            <button onClick={() => openPeralatanModal()} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/30 transition-all animate-fade-in z-20 shadow-sm">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          )}
        </div>
        <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
              <tr>
                <th className="pb-2 font-semibold">Nama Alat / Mesin</th>
                <th className="pb-2 text-center font-semibold w-24">Jumlah</th>
                {isEditMode && <th className="pb-2 text-right font-semibold w-16 animate-fade-in">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
              {activeEquipments.length === 0 ? (
                 <tr><td colSpan="3" className="py-8 text-center text-slate-500 italic">Belum ada alat diinput.</td></tr>
              ) : (
                activeEquipments.map((alat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="py-2.5 text-slate-800 dark:text-slate-300 font-bold">{alat.nama_alat}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      <span className="bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/30 shadow-sm">
                        {alat.jumlah} <span className="text-[9px] text-blue-600/70 dark:text-blue-500/70 font-sans font-normal ml-0.5">Unit</span>
                      </span>
                    </td>
                    {isEditMode && (
                      <td className="py-2.5 text-right animate-fade-in">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openPeralatanModal(alat, idx)} className="p-1.5 text-blue-500 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button type="button" onClick={() => { const newE = [...editForm.equipments]; newE.splice(idx,1); setEditForm({...editForm, equipments: newE}); }} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}