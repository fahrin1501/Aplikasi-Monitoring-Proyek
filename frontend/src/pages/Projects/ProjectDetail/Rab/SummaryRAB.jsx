import React, { useState, useEffect } from 'react';
import { DollarSign, FileSpreadsheet, Activity, TrendingDown } from 'lucide-react';

export default function SummaryRAB({ 
  paguKontrak, grandTotalRencana, grandTotalRealisasi, 
  pctRencanaRaw, pctRealisasiRaw, pctRencanaCSS, pctRealisasiCSS, isRencanaBigger, isEditMode, formatRupiah 
}) {
  
  // --- CEK HAK AKSES MANDIRI ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canViewPrices = ['Administrator', 'Direktur'].includes(userRole);
  // -----------------------------

  if (!canViewPrices) return null; // Sembunyikan seluruh summary jika bukan Admin/Direktur

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
        </div>
      </div>
    </div>
  );
}