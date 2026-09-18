import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function ProgressData({ progressPlan, progressReal, deviasi, isActuallyDelayed }) {
  // --- CEK HAK AKSES MANDIRI ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);
  const isGuest = userRole === 'Tamu';
  // -----------------------------

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between relative shadow-sm">
      <div className="w-full md:w-1/3 text-center md:text-left">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center md:justify-start gap-2 mb-1">
          <Activity className="w-4 h-4 text-amber-500" /> Indikator Progress Fisik
        </h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 md:mt-0 px-2 md:px-0">Perbandingan target rencana S-Curve dengan realisasi lapangan.</p>
      </div>
      
      <div className={`w-full md:w-2/3 grid ${isGuest ? 'grid-cols-2' : 'grid-cols-3'} gap-2 sm:gap-4`}>
        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-center">
          <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Plan</span>
          <p className="text-sm md:text-lg font-mono font-bold text-sky-600 dark:text-sky-400">{progressPlan}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 md:p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 text-center">
          <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Actual</span>
          <p className="text-sm md:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">{progressReal}%</p>
        </div>
        
        {/* SEMBUNYIKAN DEVIASI DARI TAMU */}
        {!isGuest && (
          <div className={`p-2.5 md:p-3 rounded-xl border text-center flex flex-col justify-center ${isActuallyDelayed ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'}`}>
            <span className={`text-[9px] md:text-[10px] uppercase tracking-wider block mb-1 ${isActuallyDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'}`}>Deviasi</span>
            <p className={`text-sm md:text-lg font-mono font-bold ${isActuallyDelayed ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-500'}`}>
              {deviasi}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}