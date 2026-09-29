import React, { useState } from 'react';
import { Target, Info, Activity, BarChart, CheckCircle2, Clock, X, CalendarDays, Inbox, Plus, Trash2 } from 'lucide-react';

export default function ScheduleWorkData({
  scheduleData,
  localWeeks,
  isEditMode,
  canCreateData,
  grandTotalRAB,
  handleWeekCumulativeChange,
  openWeekModal,
  handleRemoveWeek
}) {
  
  const [detailModal, setDetailModal] = useState({ show: false, item: null, weekNum: null, targetPlan: 0, realizations: [] });

  const getSafeFloat = (val) => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeLocalWeeks = Array.isArray(localWeeks) ? localWeeks : (localWeeks ? Object.values(localWeeks) : []);
  const weeksArray = safeLocalWeeks.map(w => parseInt(w.minggu_ke) || 0);

  const rawRabData = scheduleData?.rab_data;
  const safeRabData = Array.isArray(rawRabData) ? rawRabData : (rawRabData ? Object.values(rawRabData) : []);

  const handleOpenCellDetail = (item, weekNum) => {
    const targetVal = getSafeFloat(safeLocalWeeks.find(w => parseInt(w.minggu_ke) === weekNum)?.target_kumulatif);
    const safeRealizations = Array.isArray(scheduleData?.realizations) ? scheduleData.realizations : (scheduleData?.realizations ? Object.values(scheduleData.realizations) : []);
    const dailyRealizations = safeRealizations.filter(r => r.rab_item_id === item.id && parseInt(r.minggu_ke) === weekNum);
    setDetailModal({ show: true, item, weekNum, targetPlan: targetVal, realizations: dailyRealizations });
  };

  // Dinamis colSpan menyesuaikan Mode Edit
  const extraCols = isEditMode && canCreateData ? 3 : 2; 

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>
      
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col relative z-0 backdrop-blur-sm transition-all animate-fade-in w-full max-h-[calc(100vh-190px)] overflow-hidden">
        <div className="overflow-auto custom-scrollbar flex-1 w-full relative">
          <table className="w-full text-left border-collapse min-w-max text-xs">
            
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-slate-100 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="p-3 w-[80px] text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-40 bg-slate-100 dark:bg-slate-900/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Kode</th>
                <th className="p-3 w-[300px] border-r border-slate-200 dark:border-slate-700/60 sticky left-[80px] z-40 bg-slate-100 dark:bg-slate-900/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Uraian Pekerjaan (Realisasi Aktual)</th>
                <th className="p-3 w-[60px] text-center border-r border-slate-200 dark:border-slate-700/60">Bobot</th>
                
                {weeksArray.map(w => (
                  <th key={w} className="p-2 w-[80px] text-center border-r border-slate-200 dark:border-slate-700/60 min-w-[80px]">
                    <div className="flex flex-col items-center justify-center h-full gap-1.5">
                      <span>M-{w}</span>
                      {isEditMode && canCreateData && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openWeekModal(w)} className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-600 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 dark:text-blue-400 rounded transition-colors shadow-sm" title="Atur Tanggal">
                            <CalendarDays className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleRemoveWeek(w)} className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-500/20 dark:hover:bg-rose-500/40 dark:text-rose-400 rounded transition-colors shadow-sm" title="Hapus Minggu Ini">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                ))}

                {/* KOLOM BARU KHUSUS TAMBAH MINGGU (HANYA MUNCUL DI EDIT MODE) */}
                {isEditMode && canCreateData && (
                  <th className="p-2 w-[80px] text-center border-r border-slate-200 dark:border-slate-700/60 min-w-[80px] bg-blue-50/50 dark:bg-blue-900/20 align-middle">
                     <button onClick={() => openWeekModal()} className="w-full py-2 flex flex-col items-center justify-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors border border-dashed border-blue-300 dark:border-blue-600/50 shadow-sm">
                       <Plus className="w-4 h-4" />
                       <span className="text-[9px] font-bold">Baru</span>
                     </button>
                  </th>
                )}

                <th className="p-3 w-[100px] text-right font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">Kumulatif Aktual</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-slate-700 dark:text-slate-300">
              {safeRabData.length === 0 ? (
                <tr>
                  <td colSpan={weeksArray.length + (isEditMode && canCreateData ? 5 : 4)} className="p-12 text-center bg-slate-50/50 dark:bg-slate-800/40">
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                      <h4 className="font-bold text-slate-600 dark:text-slate-300 text-sm mb-1">Belum Ada Realisasi Pekerjaan</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                        Daftar uraian pekerjaan akan muncul di sini secara otomatis apabila ada <strong>Laporan Harian</strong> yang sudah disetujui.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                safeRabData.map(cat => {
                  const safeItems = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
                  return (
                    <React.Fragment key={cat.id || Math.random()}>
                      <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                        <td className="p-2.5 font-bold text-[10px] text-amber-700 dark:text-amber-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-amber-50 dark:bg-[#2c2415] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{cat.kode_divisi || '-'}</td>
                        <td colSpan={weeksArray.length + extraCols} className="p-2.5 font-extrabold text-[11px] text-amber-700 dark:text-amber-500 uppercase sticky left-[80px] z-20 bg-amber-50 dark:bg-[#2c2415] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-700/60">{cat.nama_kategori || 'Kategori'}</td>
                      </tr>
                      
                      {safeItems.map(item => {
                        const bobotStandar = grandTotalRAB > 0 ? getSafeFloat((Number(item.total_harga || 0) / grandTotalRAB) * 100) : 0;
                        const itemCumulative = getSafeFloat(scheduleData?.cumulative_actual?.[item.id]);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                            <td className="p-2.5 font-mono text-[10px] text-slate-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{item.kode_pekerjaan || '-'}</td>
                            <td className="p-2.5 text-[11px] font-medium border-r border-slate-200 dark:border-slate-700/60 sticky left-[80px] z-20 bg-white dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:group-hover:bg-slate-700">
                              <div className="line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                            </td>
                            <td className="p-2.5 text-center font-mono text-[10px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/20">
                              {bobotStandar.toFixed(2)}%
                            </td>

                            {weeksArray.map(w => {
                              const totalActual = getSafeFloat(scheduleData?.matrix_actual?.[item.id]?.[w]);
                              return (
                                <td key={w} className="p-2 text-center border-r border-slate-200 dark:border-slate-700/60 relative">
                                  {totalActual > 0 ? (
                                    <button 
                                      onClick={() => handleOpenCellDetail({ ...item, kategori_nama: cat.nama_kategori }, w)}
                                      title="Klik untuk lihat rincian laporan"
                                      className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer shadow-sm active:scale-95 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 border-emerald-200 dark:border-emerald-800/30"
                                    >
                                      {totalActual.toFixed(2)}
                                    </button>
                                  ) : (
                                    <span className="text-slate-300 dark:text-slate-600 text-[10px]">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* PLACEHOLDER KOSONG UNTUK KOLOM TAMBAH SAAT EDIT MODE */}
                            {isEditMode && canCreateData && (
                              <td className="p-2 border-r border-slate-200 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/10"></td>
                            )}

                            <td className="p-2.5 text-right font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                              {itemCumulative > 0 ? `${itemCumulative.toFixed(2)}%` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            <tfoot className="sticky bottom-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              <tr className="bg-emerald-50/80 dark:bg-emerald-900/20 border-t-2 border-emerald-200 dark:border-emerald-800/50">
                <td colSpan="3" className="p-3 text-right font-extrabold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] sticky left-0 z-40 bg-emerald-50/90 dark:bg-[#064e3b] border-r border-emerald-200 dark:border-emerald-800/50">
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

                {/* PLACEHOLDER KOSONG BAWAH UNTUK KOLOM TAMBAH */}
                {isEditMode && canCreateData && (
                  <td className="border-r border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/10 dark:bg-emerald-900/10"></td>
                )}

                <td className="p-3 text-right font-mono text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/40">
                  {getSafeFloat(Object.values(scheduleData?.weekly_actual || {}).reduce((sum, val) => sum + getSafeFloat(val), 0)).toFixed(2)}%
                </td>
              </tr>

              <tr className="bg-blue-50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-800/50">
                <td colSpan="3" className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-400 uppercase text-[10px] sticky left-0 z-40 bg-blue-50 dark:bg-[#172554] border-r border-blue-200 dark:border-blue-800/50">
                  Target Kumulatif Mingguan (Plan)
                </td>
                {weeksArray.map(w => {
                  const existingTarget = getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === w)?.target_kumulatif);
                  const displayCumulative = isEditMode ? existingTarget : existingTarget.toFixed(2);

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

                {/* PLACEHOLDER KOSONG BAWAH UNTUK KOLOM TAMBAH */}
                {isEditMode && canCreateData && (
                  <td className="border-r border-blue-200 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-950/20"></td>
                )}

                <td className="p-3 text-right font-mono text-[11px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/40">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl p-4 text-xs flex gap-4 shadow-sm shrink-0">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex gap-1.5"><Info className="w-4 h-4 text-amber-500" /> Keterangan Matriks:</span>
        <div className="flex gap-x-5 flex-wrap text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/30 cursor-pointer font-bold">0.00</span> Aktual Laporan Harian</span>
          <span className="flex items-center gap-1.5"><span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/30 font-bold">0.00</span> Target Kumulatif Rencana</span>
        </div>
      </div>

      {detailModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 uppercase flex gap-2"><Activity className="w-4 h-4" /> BUKTI REALISASI HARIAN (Minggu Ke-{detailModal.weekNum})</h3>
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-900/20 p-5">
               {(detailModal.realizations || []).length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                   <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 dark:text-slate-400 text-xs text-center">Belum ada progres harian yang diinput oleh pengawas untuk pekerjaan ini.</p>
                 </div>
               ) : (
                 <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white dark:bg-slate-800/80 shadow-sm">
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-100 dark:bg-slate-900/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700/60">
                       <tr>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-12">Hari</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60">Tanggal Laporan</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">Volume Harian</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">Aktual Harian</th>
                         <th className="p-3 text-center">Status Verifikasi</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                       {(detailModal.realizations || []).map((r, index) => (
                         <tr key={index}>
                           <td className="p-3 text-center font-mono font-bold text-slate-500">H{index + 1}</td>
                           <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 font-medium">{new Date(r.tgl_input).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                           <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold">{r.volume_laporan} {detailModal.item?.satuan || ''}</td>
                           <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{getSafeFloat(r.bobot_realisasi).toFixed(2)}%</td>
                           <td className="p-3 text-center">
                             {r.status_laporan === 'approved' ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3"/> Disetujui</span> : <span className="text-slate-400 text-[10px]">Pending</span>}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 text-xs shadow-sm">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}