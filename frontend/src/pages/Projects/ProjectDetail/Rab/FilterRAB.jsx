import React from 'react';
import { Search, X } from 'lucide-react';

export default function FilterRAB({ currentRabs, activeDivisi, setActiveDivisi, searchQuery, setSearchQuery }) {
  if (currentRabs.length === 0) return null;

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all">
      <div className="flex-1 w-full overflow-x-auto hide-scrollbar flex gap-2 items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-2 shrink-0">Filter Divisi:</span>
        <button
            onClick={() => setActiveDivisi('Semua')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 border ${activeDivisi === 'Semua' ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            Semua
        </button>
        {currentRabs.map(d => d.nama_kategori).map(opt => (
          <button
            key={opt}
            onClick={() => setActiveDivisi(opt)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shrink-0 border ${activeDivisi === opt ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="relative w-full md:w-64 shrink-0">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari uraian / kode..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}