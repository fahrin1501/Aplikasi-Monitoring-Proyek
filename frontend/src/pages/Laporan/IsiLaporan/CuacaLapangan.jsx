import React from 'react';
import { Sun, Plus, Trash2, ChevronDown } from 'lucide-react';

export default function CuacaLapangan({ isEditMode, reportData, editForm, setEditForm }) {
  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl p-4 md:p-5 flex flex-col transition-all relative backdrop-blur-sm`}>
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
          <Sun className="w-4 h-4"/> Kondisi Cuaca Lapangan
        </h3>
        {isEditMode && (
          <button 
            type="button" 
            onClick={() => {
              if (editForm.cuacaItems.length < 4) {
                setEditForm({ ...editForm, cuacaItems: [...editForm.cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }] });
              } else {
                alert("Maksimal 4 entri cuaca per hari.");
              }
            }} 
            className="text-[10px] bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-amber-200 dark:border-amber-500/20 z-20 relative shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        )}
      </div>
      
      <div className="pt-2 flex-1 flex flex-col">
         {isEditMode ? (
           <div className="space-y-4 mt-2">
             {editForm.cuacaItems.map((item, index) => (
               <div key={item.id} className="flex flex-col bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start transition-all shadow-sm gap-3 relative">
                 <div className="w-full flex justify-between items-center mb-1">
                   <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1.5">
                     <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Sesi Cuaca {index + 1}
                   </span>
                   {editForm.cuacaItems.length > 1 && (
                     <button type="button" onClick={() => { const newC = editForm.cuacaItems.filter(c => c.id !== item.id); setEditForm({ ...editForm, cuacaItems: newC }); }} className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 rounded-md transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                   )}
                 </div>
                 
                 <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Kondisi Cuaca <span className="text-rose-500">*</span></label>
                     <div className="relative">
                       <select value={item.kondisi} onChange={(e) => { const newC = [...editForm.cuacaItems]; newC[index].kondisi = e.target.value; setEditForm({ ...editForm, cuacaItems: newC }); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner transition-all">
                         <option value="Cerah">Cerah</option><option value="Berawan">Berawan</option><option value="Hujan Gerimis">Hujan Gerimis</option><option value="Hujan Lebat">Hujan Lebat</option>
                       </select>
                       <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                   </div>
                   
                   <div className="sm:col-span-2 space-y-1.5">
                     <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Waktu / Durasi / Keterangan</label>
                     <input type="text" value={item.keterangan} onChange={(e) => { const newC = [...editForm.cuacaItems]; newC[index].keterangan = e.target.value; setEditForm({ ...editForm, cuacaItems: newC }); }} placeholder="Contoh: 08:00 - 12:00..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-inner" />
                   </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
             <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 mt-3 shadow-sm">
                 {reportData.cuaca || 'Tidak ada catatan cuaca harian.'}
             </div>
         )}
      </div>
    </div>
  );
}