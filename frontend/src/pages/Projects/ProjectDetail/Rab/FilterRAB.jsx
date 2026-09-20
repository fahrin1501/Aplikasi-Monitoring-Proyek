import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';

export default function FilterRAB({ rabs, activeDivisi, setActiveDivisi, searchQuery, setSearchQuery, isLoading }) {
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoading && rabs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center w-full transition-all">
        <div className="relative w-full md:flex-1 shadow-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari uraian pekerjaan atau kode..." 
            value={searchQuery}
            disabled={isLoading}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {searchQuery && !isLoading && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative w-full md:w-auto" ref={filterRef}>
          <button 
            disabled={isLoading}
            onClick={() => setShowFilter(!showFilter)} 
            className={`w-full md:w-auto flex items-center justify-center gap-2 p-2.5 md:px-4 md:py-2.5 rounded-xl text-xs font-bold border transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              showFilter || activeDivisi !== 'Semua' 
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-600 dark:text-amber-500' 
              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80'
            }`}
          >
            <Filter className="w-4 h-4" /> <span>Filter Divisi</span>
          </button>

          {showFilter && (
            <div className="absolute right-0 top-full mt-2 w-full md:w-[350px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 z-50 animate-fade-in">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-700/60 pb-2">Filter Divisi Pekerjaan</h4>
              {/* Custom Scrollbar Injection */}
              <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                <button
                    onClick={() => { setActiveDivisi('Semua'); setShowFilter(false); }}
                    className={`px-3 py-2.5 rounded-lg text-xs font-bold transition-all border shadow-sm text-left ${
                      activeDivisi === 'Semua' 
                      ? 'bg-amber-500 text-white border-amber-600' 
                      : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Tampilkan Semua Divisi
                </button>
                {rabs.map(d => d.nama_kategori).map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setActiveDivisi(opt); setShowFilter(false); }}
                    className={`px-3 py-2.5 rounded-lg text-[11px] font-bold transition-all border shadow-sm text-left ${
                      activeDivisi === opt 
                      ? 'bg-amber-500 text-white border-amber-600' 
                      : 'bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
                <button onClick={() => { setActiveDivisi('Semua'); setShowFilter(false); }} className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors">Reset Filter</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeDivisi !== 'Semua' && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/20 shadow-sm">
            Divisi: {activeDivisi}
            <button onClick={() => setActiveDivisi('Semua')} className="hover:bg-amber-200 dark:hover:bg-amber-500/30 p-0.5 rounded-full transition-colors"><X className="w-3 h-3"/></button>
          </span>
        </div>
      )}
    </div>
  );
}