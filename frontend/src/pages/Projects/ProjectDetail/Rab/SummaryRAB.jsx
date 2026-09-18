import React from 'react';
import { DollarSign, FileSpreadsheet, Activity, TrendingDown } from 'lucide-react';

export default function SummaryRAB({ 
  paguKontrak, grandTotalRencana, grandTotalRealisasi, 
  pctRencanaRaw, pctRealisasiRaw, pctRencanaCSS, pctRealisasiCSS, isRencanaBigger, isEditMode, formatRupiah 
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><DollarSign className="w-4 h-4 text-amber-500" /> Total Pagu Kontrak</span>
        <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white truncate font-mono" title={formatRupiah(paguKontrak)}>{formatRupiah(paguKontrak)}</p>
      </div>
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/50 bg-blue-50/20 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center transition-colors`}>
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><FileSpreadsheet className="w-4 h-4 text-blue-500" /> Total Rencana</span>
        <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 truncate font-mono" title={formatRupiah(grandTotalRencana)}>{formatRupiah(grandTotalRencana)}</p>
      </div>
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><Activity className="w-4 h-4 text-emerald-500" /> Total Realisasi (Actual)</span>
        <p className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate font-mono" title={formatRupiah(grandTotalRealisasi)}>{formatRupiah(grandTotalRealisasi)}</p>
      </div>
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-center mb-5">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider"><TrendingDown className="w-4 h-4 text-amber-500" /> Serapan Biaya Aktual</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{pctRealisasiRaw.toFixed(2)}%</span>
        </div>
        <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-visible mt-1">
          {isRencanaBigger ? (
             <>
               <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pctRencanaCSS}%`, zIndex: 10 }}></div>
               <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pctRealisasiCSS}%`, zIndex: 20 }}></div>
             </>
          ) : (
             <>
               <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pctRealisasiCSS}%`, zIndex: 10 }}></div>
               <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pctRencanaCSS}%`, zIndex: 20 }}></div>
             </>
          )}
          <div className="absolute flex flex-col items-center group cursor-pointer z-30 transition-all duration-700" style={{ left: `${pctRealisasiCSS}%`, bottom: 'calc(100% + 2px)', transform: 'translateX(-50%)' }}>
            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-950 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap border border-slate-700 pointer-events-none">Realisasi: {pctRealisasiRaw.toFixed(2)}%</div>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-emerald-500 transition-transform group-hover:scale-110"></div>
          </div>
          <div className="absolute flex flex-col items-center group cursor-pointer z-30 transition-all duration-700" style={{ left: `${pctRencanaCSS}%`, top: 'calc(100% + 2px)', transform: 'translateX(-50%)' }}>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-blue-500 transition-transform group-hover:scale-110"></div>
            <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-950 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap border border-slate-700 pointer-events-none">Rencana: {pctRencanaRaw.toFixed(2)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}