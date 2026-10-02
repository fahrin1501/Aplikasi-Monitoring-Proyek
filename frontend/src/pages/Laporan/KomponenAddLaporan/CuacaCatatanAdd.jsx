import React from 'react';
import { Sun, Plus, Trash2, ChevronDown, FileText } from 'lucide-react';

export default function CuacaCatatanAdd({ cuacaItems, setCuacaItems, formData, handleInputChange }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
      {/* CUACA */}
      <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
          <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><Sun className="w-4 h-4" /> Cuaca Lapangan</label>
          <button type="button" onClick={() => { if (cuacaItems.length < 4) setCuacaItems([...cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }]); }} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Tambah</button>
        </div>
        <div className="space-y-4 mt-4 flex-1">
          {cuacaItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/40 p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 relative shadow-sm">
              {cuacaItems.length > 1 && (
                <button type="button" onClick={() => setCuacaItems(cuacaItems.filter(c => c.id !== item.id))} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-md"><Trash2 className="w-3 h-3" /></button>
              )}
              <div className="relative sm:col-span-1 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kondisi <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select value={item.kondisi} onChange={(e) => { const newC = [...cuacaItems]; newC[index].kondisi = e.target.value; setCuacaItems(newC); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-inner transition-colors">
                    <option value="Cerah">Cerah</option><option value="Berawan">Berawan</option><option value="Hujan Gerimis">Gerimis</option><option value="Hujan Lebat">Hujan Lebat</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Waktu / Durasi</label>
                 <input type="text" value={item.keterangan} onChange={(e) => { const newC = [...cuacaItems]; newC[index].keterangan = e.target.value; setCuacaItems(newC); }} placeholder="Contoh: 08:00 - 12:00..." className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATATAN */}
      <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
        <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4"><FileText className="w-4 h-4" /> Catatan Tambahan</label>
        <textarea name="catatan" value={formData.catatan} onChange={handleInputChange} placeholder="Tuliskan kendala atau instruksi khusus di sini..." className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner custom-scrollbar transition-colors" />
      </div>
    </div>
  );
}