import React, { useState } from 'react';
import { 
  X, Plus, Target, Info, Activity, 
  TrendingUp, BarChart, CheckCircle2, Clock 
} from 'lucide-react';

export default function ScheduleWorkData({
  scheduleData,
  localSchedules,
  isEditMode,
  canCreateData,
  weeksArray,
  grandTotalRAB,
  weekCumulativeInputs,
  handleWeekCumulativeChange,
  openAddItemModalFromMatrix,
  setDeleteConfig
}) {
  
  // --- STATE MODAL RINCIAN HARIAN (DRILL-DOWN H1-H7) ---
  const [detailModal, setDetailModal] = useState({
    show: false,
    item: null,
    weekNum: null,
    targetPlan: 0,
    realizations: []
  });

  // FUNGSI MEMANGGIL MODAL
  const handleOpenCellDetail = (item, weekNum) => {
    const existingSchedule = localSchedules.find(s => parseInt(s.minggu_ke) === weekNum);
    const targetVal = weekCumulativeInputs[weekNum] !== undefined 
        ? parseFloat(weekCumulativeInputs[weekNum]) || 0 
        : parseFloat(existingSchedule?.target_kumulatif) || 0;

    const dailyRealizations = scheduleData?.realizations?.filter(r => r.rab_item_id === item.id && parseInt(r.minggu_ke) === weekNum) || [];

    setDetailModal({
      show: true,
      item: item,
      weekNum: weekNum,
      targetPlan: targetVal,
      realizations: dailyRealizations
    });
  };

  // Helper fungsi untuk memaksa konversi ke Float agar .toFixed() tidak crash
  const getSafeFloat = (val) => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>
      
      {/* TABEL MATRIX CONTAINER */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col relative z-0 backdrop-blur-sm transition-all animate-fade-in w-full max-h-[calc(100vh-190px)] overflow-hidden">
        
        <div className="overflow-auto custom-scrollbar flex-1 w-full relative">
          <table className="w-full text-left border-collapse min-w-max text-xs">
            
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-slate-100 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3 w-[80px] text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-40 bg-slate-100 dark:bg-slate-900/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Kode</th>
                <th className="p-3 w-[300px] border-r border-slate-200 dark:border-slate-700/60 sticky left-[80px] z-40 bg-slate-100 dark:bg-slate-900/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Uraian Pekerjaan</th>
                <th className="p-3 w-[60px] text-center border-r border-slate-200 dark:border-slate-700/60">Bobot</th>
                
                {/* KOLOM MINGGU (Sumbu X) */}
                {weeksArray.map(w => (
                  <th key={w} className="p-2 w-[80px] text-center border-r border-slate-200 dark:border-slate-700/60 min-w-[80px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>M-{w}</span>
                      {isEditMode && canCreateData && (
                        <button onClick={() => openAddItemModalFromMatrix(w)} className="p-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 rounded transition-colors shadow-sm" title={`Jadwalkan Pekerjaan ke M-${w}`}>
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-3 w-[100px] text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">Kumulatif Aktual</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-slate-700 dark:text-slate-300">
              {(scheduleData?.rab_data || []).map(cat => (
                <React.Fragment key={cat.id}>
                  {/* BARIS HEADER DIVISI */}
                  <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                    <td className="p-2.5 font-bold text-[10px] text-amber-700 dark:text-amber-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-amber-50 dark:bg-[#2c2415] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      {cat.kode_divisi || '-'}
                    </td>
                    <td colSpan={weeksArray.length + 2} className="p-2.5 font-extrabold text-[11px] text-amber-700 dark:text-amber-500 uppercase sticky left-[80px] z-20 bg-amber-50 dark:bg-[#2c2415] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-700/60">
                      {cat.nama_kategori}
                    </td>
                  </tr>
                  
                  {/* BARIS ITEM PEKERJAAN */}
                  {cat.items.map(item => {
                    if (item.is_subheader) {
                      return (
                        <tr key={item.id} className="bg-slate-50/50 dark:bg-slate-800/40">
                          <td className="p-2 font-mono text-[10px] text-slate-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{item.kode_pekerjaan || '-'}</td>
                          <td colSpan={weeksArray.length + 2} className="p-2 font-bold text-[10px] uppercase text-slate-700 dark:text-slate-300 sticky left-[80px] z-20 bg-slate-50 dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-700/60">{item.uraian_pekerjaan}</td>
                        </tr>
                      );
                    }

                    const bobotStandar = grandTotalRAB > 0 ? getSafeFloat((Number(item.total_harga || 0) / grandTotalRAB) * 100) : 0;
                    
                    // Tarik O(1) dari backend payload
                    const itemCumulative = getSafeFloat(scheduleData?.cumulative_actual?.[item.id]);
                    
                    const isScheduledAnywhere = localSchedules.some(s => s.rab_item_id === item.id);
                    if (!isEditMode && !isScheduledAnywhere && itemCumulative === 0) return null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                        <td className="p-2.5 font-mono text-[10px] text-slate-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          {item.kode_pekerjaan || '-'}
                        </td>
                        <td className="p-2.5 text-[11px] font-medium border-r border-slate-200 dark:border-slate-700/60 sticky left-[80px] z-20 bg-white dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:group-hover:bg-slate-700">
                          <div className="line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono text-[10px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/20">
                          {bobotStandar.toFixed(2)}%
                        </td>

                        {/* SEL MINGGU (MATRIX DATA) */}
                        {weeksArray.map(w => {
                          const isScheduledThisWeek = localSchedules.some(s => s.rab_item_id === item.id && parseInt(s.minggu_ke) === w);
                          const totalActual = getSafeFloat(scheduleData?.matrix_actual?.[item.id]?.[w]);

                          return (
                            <td key={w} className="p-2 text-center border-r border-slate-200 dark:border-slate-700/60 relative group/cell">
                              {(isScheduledThisWeek || totalActual > 0) ? (
                                <>
                                  <button 
                                    onClick={() => handleOpenCellDetail({ ...item, kategori_nama: cat.nama_kategori }, w)}
                                    title="Klik untuk lihat rincian laporan (H1-H7)"
                                    className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer shadow-sm active:scale-95 ${totalActual > 0 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30' : 'text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}
                                  >
                                    {totalActual.toFixed(2)}
                                  </button>
                                  {isEditMode && isScheduledThisWeek && (
                                    <button 
                                      onClick={() => setDeleteConfig({ show: true, rabItemId: item.id, weekNum: w, itemName: item.uraian_pekerjaan })} 
                                      className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 text-rose-500 hover:text-white hover:bg-rose-500 p-0.5 rounded transition-all shadow-sm"
                                      title="Hapus dari jadwal minggu ini"
                                    >
                                      <X className="w-3 h-3"/>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                              )}
                            </td>
                          );
                        })}

                        {/* KUMULATIF BARIS (AKTUAL) */}
                        <td className="p-2.5 text-right font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                          {itemCumulative > 0 ? `${itemCumulative.toFixed(2)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>

            {/* FOOTER TOTAL (TARGET & AKTUAL MINGGUAN) */}
            <tfoot className="sticky bottom-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              {/* BARIS 1: TOTAL AKTUAL MINGGUAN (O(1) DARI BACKEND) */}
              <tr className="bg-emerald-50/80 dark:bg-emerald-900/20 border-t-2 border-emerald-200 dark:border-emerald-800/50">
                <td colSpan="3" className="p-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[10px] sticky left-0 z-40 bg-emerald-50/90 dark:bg-[#064e3b] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-emerald-200 dark:border-emerald-800/50">
                  Total Aktual / Realisasi (Mingguan)
                </td>
                {weeksArray.map(w => {
                  const weekActualSum = getSafeFloat(scheduleData?.weekly_actual?.[w]);
                  return (
                    <td key={w} className="p-3 text-center border-r border-emerald-200 dark:border-emerald-800/50 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      {weekActualSum > 0 ? weekActualSum.toFixed(2) : '-'}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-mono text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/40">
                  {getSafeFloat(Object.values(scheduleData?.weekly_actual || {}).reduce((sum, val) => sum + getSafeFloat(val), 0)).toFixed(2)}%
                </td>
              </tr>

              {/* BARIS 2: TARGET KUMULATIF MINGGUAN (INPUT USER) */}
              <tr className="bg-blue-50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-800/50">
                <td colSpan="3" className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-[10px] sticky left-0 z-40 bg-blue-50 dark:bg-[#172554] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-blue-200 dark:border-blue-800/50">
                  Target Kumulatif Mingguan (Plan)
                </td>
                {weeksArray.map(w => {
                  const existingTarget = getSafeFloat(localSchedules.find(s => parseInt(s.minggu_ke) === w)?.target_kumulatif);
                  
                  // Validasi Strict: Jika weekCumulativeInputs berisi string yang bisa diparse, parse. Jika tidak, pakai 0.
                  const currentInput = weekCumulativeInputs[w];
                  const displayCumulative = currentInput !== undefined ? currentInput : existingTarget.toFixed(2);

                  return (
                    <td key={w} className="p-2 text-center border-r border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-[#172554]">
                      {isEditMode ? (
                        <div className="flex items-center justify-center">
                          <input 
                            type="text" 
                            value={displayCumulative}
                            onChange={(e) => handleWeekCumulativeChange(w, e.target.value)}
                            className="w-14 bg-white dark:bg-slate-900 text-center font-mono font-extrabold text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded border border-blue-300 dark:border-blue-600 py-1 text-[10px] shadow-inner"
                          />
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] font-extrabold text-blue-700 dark:text-blue-400">
                          {existingTarget > 0 ? existingTarget.toFixed(2) : '-'}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-mono text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/40">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* --- INFO LEGEND (FOOTER) --- */}
      <div className="mt-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm shrink-0">
        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5"><Info className="w-4 h-4 text-amber-500" /> Keterangan Matriks:</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">0.00</span> 
            Item Terjadwal (Belum ada Laporan Harian)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/30 cursor-pointer">0.00</span> 
            Total Aktual Laporan Harian (Klik untuk Rincian)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/30">0.00</span> 
            Target Kumulatif (Plan)
          </span>
        </div>
      </div>

      {/* --- MODAL RINCIAN HARIAN (DRILL-DOWN H1-H7) --- */}
      {detailModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> BUKTI REALISASI HARIAN (Minggu Ke-{detailModal.weekNum})
                </h3>
              </div>
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute top-4 right-4 transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-inner">
               <div className="flex flex-col mb-4">
                 <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">{detailModal.item?.kategori_nama || '-'}</span>
                 <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{detailModal.item?.uraian_pekerjaan || '-'}</h4>
               </div>

               {/* Indikator Total Aktual Pengerjaan Item Ini */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5 text-blue-500"/> Target Mingguan (Plan)</span>
                    <span className="font-mono text-lg font-extrabold text-slate-700 dark:text-slate-300">
                      {getSafeFloat(detailModal.targetPlan).toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/30 flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-500 font-bold uppercase flex items-center gap-1.5 mb-1"><BarChart className="w-3.5 h-3.5 text-emerald-500"/> Total Aktual Tercapai (Minggu Ini)</span>
                    <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {getSafeFloat(detailModal.realizations.reduce((sum, r) => sum + getSafeFloat(r.bobot_realisasi), 0)).toFixed(2)}%
                    </span>
                  </div>
               </div>
            </div>
            
            {/* Tabel Realisasi Harian (H1-H7) */}
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-900/20 p-5">
               <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Rincian Laporan Harian Terkait (H1 - H7)</h5>
               
               {detailModal.realizations.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                   <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-medium text-center">Belum ada progres harian yang diinput oleh pengawas untuk pekerjaan ini di M-{detailModal.weekNum}.</p>
                 </div>
               ) : (
                 <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white dark:bg-slate-800/80 shadow-sm">
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-100 dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                       <tr>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-12">Hari</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60">Tanggal Laporan</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">Volume Harian</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">Aktual Harian</th>
                         <th className="p-3 text-center">Status Verifikasi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                       {detailModal.realizations.map((r, index) => (
                         <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                           <td className="p-3 text-center align-middle font-mono font-bold text-slate-500">H{index + 1}</td>
                           <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 font-medium">
                             {new Date(r.tgl_input).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                           </td>
                           <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-slate-700 dark:text-slate-300">
                             {r.volume_laporan} {detailModal.item?.satuan || ''}
                           </td>
                           <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                             {getSafeFloat(r.bobot_realisasi).toFixed(2)}%
                           </td>
                           <td className="p-3 text-center">
                             {r.status_laporan === 'approved' ? (
                               <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded"><CheckCircle2 className="w-3.5 h-3.5"/> Disetujui</span>
                             ) : r.status_laporan === 'rejected' ? (
                               <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-900/40 px-2 py-1 rounded"><X className="w-3.5 h-3.5"/> Ditolak</span>
                             ) : (
                               <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/40 px-2 py-1 rounded"><Clock className="w-3.5 h-3.5"/> Pending</span>
                             )}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>

            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Tutup Rincian</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}