import React, { useState, useEffect } from 'react';
import { DollarSign, FileSpreadsheet, Activity, TrendingDown } from 'lucide-react';

export default function SummaryRAB({ 
  paguKontrak, grandTotalRencana, grandTotalRealisasi, 
  pctRencanaRaw, pctRealisasiRaw, pctRencanaCSS, pctRealisasiCSS, isRencanaBigger, isEditMode, formatRupiah, isLoading 
}) {
  
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canViewPrices = ['Administrator', 'Direktur'].includes(userRole);
  if (!canViewPrices) return null; 

  // PERBAIKAN: Memaksa konversi tipe data ke Number agar tidak terjadi penggabungan string
  const grandTotalRencanaNum = Number(grandTotalRencana) || 0;
  const grandTotalRealisasiNum = Number(grandTotalRealisasi) || 0;

  // Hitung Nilai PPN (11%)
  const grandTotalRencanaPPN = grandTotalRencanaNum + (grandTotalRencanaNum * 0.11);
  const grandTotalRealisasiPPN = grandTotalRealisasiNum + (grandTotalRealisasiNum * 0.11);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      
      {/* CARD 1: Pagu Kontrak */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><DollarSign className="w-4 h-4 text-amber-500" /> Total Pagu Kontrak</span>
        <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white truncate font-mono" title={formatRupiah(paguKontrak)}>
          {isLoading ? <span className="inline-block w-32 h-6 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"></span> : formatRupiah(paguKontrak)}
        </p>
      </div>

      {/* CARD 2: Total Rencana (Split View) */}
      <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/50 bg-blue-50/20 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center transition-colors`}>
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-2.5 uppercase tracking-wider"><FileSpreadsheet className="w-4 h-4 text-blue-500" /> Total Rencana (RAB)</span>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Nilai Dasar</span>
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate font-mono" title={formatRupiah(grandTotalRencanaNum)}>
              {isLoading ? <span className="inline-block w-20 h-5 bg-blue-100 dark:bg-slate-700 animate-pulse rounded"></span> : formatRupiah(grandTotalRencanaNum)}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700/60 mx-1"></div>
          <div className="flex-1 text-right">
            <span className="text-[9px] text-blue-500 dark:text-blue-400/80 uppercase tracking-wide block font-semibold">+ PPN 11%</span>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 truncate font-mono" title={formatRupiah(grandTotalRencanaPPN)}>
              {isLoading ? <span className="inline-block w-20 h-5 bg-blue-200 dark:bg-slate-600 animate-pulse rounded"></span> : formatRupiah(grandTotalRencanaPPN)}
            </p>
          </div>
        </div>
      </div>

      {/* CARD 3: Total Realisasi (Split View) */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-2.5 uppercase tracking-wider"><Activity className="w-4 h-4 text-emerald-500" /> Total Realisasi (Aktual)</span>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide block">Nilai Dasar</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate font-mono" title={formatRupiah(grandTotalRealisasiNum)}>
              {isLoading ? <span className="inline-block w-20 h-5 bg-emerald-100 dark:bg-slate-700 animate-pulse rounded"></span> : formatRupiah(grandTotalRealisasiNum)}
            </p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700/60 mx-1"></div>
          <div className="flex-1 text-right">
            <span className="text-[9px] text-emerald-500 dark:text-emerald-400/80 uppercase tracking-wide block font-semibold">+ PPN 11%</span>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 truncate font-mono" title={formatRupiah(grandTotalRealisasiPPN)}>
              {isLoading ? <span className="inline-block w-20 h-5 bg-emerald-200 dark:bg-slate-600 animate-pulse rounded"></span> : formatRupiah(grandTotalRealisasiPPN)}
            </p>
          </div>
        </div>
      </div>

      {/* CARD 4: Serapan Progres */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
        <div className="flex justify-between items-center mb-5">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider"><TrendingDown className="w-4 h-4 text-amber-500" /> Serapan Aktual</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
            {isLoading ? <span className="inline-block w-10 h-5 bg-amber-100 dark:bg-slate-700 animate-pulse rounded"></span> : `${pctRealisasiRaw.toFixed(2)}%`}
          </span>
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