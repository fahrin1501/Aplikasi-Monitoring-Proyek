import React from 'react';
import { Building2, MapPin, Calendar, UserCheck, Target, ChevronDown } from 'lucide-react';

export default function InfoPengawasan({ isEditMode, reportData, editForm, setEditForm }) {
  return (
    <div className={`lg:col-span-2 bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl p-4 md:p-5 flex flex-col justify-between transition-all relative backdrop-blur-sm`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-amber-500" /> Nama Projek</p>
            <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{reportData.project?.nama_proyek}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-500" /> Lokasi Pengawasan</p>
            {isEditMode ? (
              <input type="text" value={editForm.lokasi} onChange={e => setEditForm({...editForm, lokasi: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner" />
            ) : (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{reportData.lokasi}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Tanggal Pengawasan</p>
              {isEditMode ? (
                <input type="date" value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:light_dark] transition-colors shadow-inner" />
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{reportData.tanggal}</p>
              )}
            </div>
            <div className="w-24">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Minggu Ke-</p>
              {isEditMode ? (
                <div className="relative">
                  <select value={editForm.minggu_ke} onChange={e => setEditForm({...editForm, minggu_ke: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none shadow-inner cursor-pointer">
                    <option value="" disabled>-- Pilih --</option>
                    {[...Array(100)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Ke-{reportData.minggu_ke || '-'}</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Nama Pengawas</p>
            {isEditMode ? (
              <input type="text" value={editForm.pengawas} onChange={e => setEditForm({...editForm, pengawas: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner" />
            ) : (
              <p className="text-xs font-semibold text-slate-800 dark:text-white">{reportData.pengawas}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}