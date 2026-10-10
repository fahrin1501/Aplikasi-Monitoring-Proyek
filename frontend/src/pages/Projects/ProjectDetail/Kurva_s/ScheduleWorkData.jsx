import React, { useState } from 'react';
import { Target, Info, Activity, CheckCircle2, Clock, X, CalendarDays, Inbox, Plus, Trash2, Edit3, Check, Loader2 } from 'lucide-react';
import api from '../../../../api';

export default function ScheduleWorkData({
  scheduleData, localWeeks, isEditMode, canCreateData, grandTotalRAB,
  handleWeekCumulativeChange, openWeekModal, handleRemoveWeek, onRefresh
}) {
  const [detailModal, setDetailModal] = useState({ show: false, item: null, weekNum: null, targetPlan: 0, realizations: [] });
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({ volume: '', persentase: '' });
  const [isSavingInline, setIsSavingInline] = useState(false);

  const getSafeFloat = (val) => {
    if (val === null || val === undefined) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeLocalWeeks = Array.isArray(localWeeks) ? localWeeks : (localWeeks ? Object.values(localWeeks) : []);
  const weeksArray = safeLocalWeeks.map(w => parseInt(w.minggu_ke) || 0);

  const rawRabData = scheduleData?.rab_data;
  let safeRabData = Array.isArray(rawRabData) ? rawRabData : (rawRabData ? Object.values(rawRabData) : []);
  const cumulativeActualMap = scheduleData?.cumulative_actual || {};

  safeRabData = safeRabData.map(cat => {
    const items = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
    const filteredItems = items.filter(item => cumulativeActualMap[item.id] !== undefined);
    return { ...cat, items: filteredItems };
  }).filter(cat => cat.items.length > 0);

  const handleOpenCellDetail = (item, weekNum) => {
    const targetVal = getSafeFloat(safeLocalWeeks.find(w => parseInt(w.minggu_ke) === weekNum)?.target_kumulatif);
    const safeRealizations = Array.isArray(scheduleData?.realizations) ? scheduleData.realizations : (scheduleData?.realizations ? Object.values(scheduleData.realizations) : []);
    
    const dailyRealizations = safeRealizations.filter(r => r.rab_item_id === item.id && parseInt(r.minggu_ke) === weekNum);

    setDetailModal({ show: true, item, weekNum, targetPlan: targetVal, realizations: dailyRealizations });
    setInlineEditId(null);
  };

  const startInlineEdit = (r) => {
    setInlineEditId(r.activity_id);
    setInlineEditData({ volume: r.volume_laporan || '', persentase: r.bobot_realisasi || '' });
  };

  const saveInlineEdit = async (activityId) => {
    setIsSavingInline(true);
    try {
      await api.put(`/daily-report-activities/${activityId}`, { volume: inlineEditData.volume, persentase: inlineEditData.persentase });
      if (onRefresh) onRefresh();
    } catch(e) {
      alert("Gagal mengupdate data realisasi.");
    } finally {
      setIsSavingInline(false);
    }
  };

  const extraCols = isEditMode && canCreateData ? 4 : 3;

  return (
    <>
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}`}</style>
      
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col relative z-0 backdrop-blur-sm transition-all animate-fade-in w-full max-h-[calc(100vh-250px)] overflow-hidden">
        <div className="overflow-auto custom-scrollbar flex-1 w-full relative">
          <table className="w-full text-left border-collapse min-w-max text-xs">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-2.5 w-[75px] text-center border-r border-slate-200 dark:border-slate-700/60">Kode</th>
                <th className="p-2.5 w-[280px] border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan (Realisasi Aktual)</th>
                <th className="p-2.5 w-[65px] text-center border-r border-slate-200 dark:border-slate-700/60 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-900/10">Bobot</th>

                {weeksArray.map(w => (
                  <th key={w} className="p-2 w-[75px] text-center border-r border-slate-200 dark:border-slate-700/60 align-middle">
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      <span>M-{w}</span>
                      {isEditMode && canCreateData && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => openWeekModal(w)} className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-blue-500 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm transition-colors" title="Atur Tanggal"><CalendarDays className="w-3 h-3" /></button>
                          <button onClick={() => handleRemoveWeek(w)} className="p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 dark:text-rose-400 rounded hover:bg-rose-50 dark:hover:bg-slate-700 shadow-sm transition-colors" title="Hapus Minggu Ini"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  </th>
                ))}

                {isEditMode && canCreateData && (
                  <th className="p-2 w-[75px] text-center border-r border-slate-200 dark:border-slate-700/60 align-middle">
                     <button onClick={() => openWeekModal()} className="w-full py-1.5 flex flex-col items-center justify-center gap-1 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-dashed border-emerald-300 dark:border-emerald-500/50 shadow-sm">
                       <Plus className="w-3.5 h-3.5" /> <span className="text-[9px] font-bold">Baru</span>
                     </button>
                  </th>
                )}
                <th className="p-2.5 w-[90px] text-right">Kumulatif</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-slate-700 dark:text-slate-300">
              {safeRabData.length === 0 ? (
                <tr>
                  <td colSpan={weeksArray.length + (isEditMode && canCreateData ? 6 : 5)} className="p-10 text-center bg-white dark:bg-slate-800/40">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6">
                      <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">Belum Ada Realisasi Pekerjaan</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Daftar uraian pekerjaan otomatis muncul di tabel matriks ini bila <strong>Laporan Harian</strong> telah disetujui (*Approved*).
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                safeRabData.map(cat => {
                  const safeItems = Array.isArray(cat?.items) ? cat.items : (cat?.items ? Object.values(cat.items) : []);
                  return (
                    <React.Fragment key={cat.id || Math.random()}>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700/50">
                        <td className="p-2 font-bold text-[10px] text-slate-700 dark:text-slate-300 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-slate-50 dark:bg-slate-900/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{cat.kode_divisi || '-'}</td>
                        <td colSpan={weeksArray.length + extraCols} className="p-2 font-extrabold text-[11px] text-slate-800 dark:text-white uppercase sticky left-[75px] z-20 bg-slate-50 dark:bg-slate-900/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-200 dark:border-slate-700/60">{cat.nama_kategori || 'Kategori'}</td>
                      </tr>
                      
                      {safeItems.map(item => {
                        const bobotStandar = grandTotalRAB > 0 ? getSafeFloat((Number(item.total_harga || 0) / grandTotalRAB) * 100) : 0;
                        const itemCumulative = getSafeFloat(scheduleData?.cumulative_actual?.[item.id]);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                            <td className="p-2 font-mono text-[10px] text-slate-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{item.kode_pekerjaan || '-'}</td>
                            <td className="p-2 text-[11px] font-medium border-r border-slate-200 dark:border-slate-700/60 sticky left-[75px] z-20 bg-white dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:group-hover:bg-slate-700">
                              <div className="line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                            </td>
                            <td className="p-2 text-center font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700/60 bg-blue-50/30 dark:bg-blue-900/10">
                              {`${bobotStandar.toFixed(2)}%`}
                            </td>

                            {weeksArray.map(w => {
                              const totalActual = getSafeFloat(scheduleData?.matrix_actual?.[item.id]?.[w]);
                              const isExist = scheduleData?.matrix_actual?.[item.id]?.[w] !== undefined;
                              
                              return (
                                <td key={w} className="p-1.5 text-center border-r border-slate-200 dark:border-slate-700/60 relative">
                                  {isExist ? (
                                    <button 
                                      onClick={() => handleOpenCellDetail({ ...item, kategori_nama: cat.nama_kategori }, w)}
                                      title="Klik untuk lihat rincian laporan & Edit"
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

                            {isEditMode && canCreateData && <td className="p-1.5 border-r border-slate-200 dark:border-slate-700/60 bg-emerald-50/5 dark:bg-emerald-900/5"></td>}

                            <td className="p-2 text-right font-mono text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                              {itemCumulative > 0 ? `${itemCumulative.toFixed(2)}%` : '0.00%'}
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
              <tr className="bg-emerald-50 dark:bg-emerald-500/5 border-t-2 border-emerald-200 dark:border-emerald-500/20">
                <td colSpan="3" className="p-2.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] border-r border-emerald-200 dark:border-emerald-500/20 sticky left-0 z-40 bg-emerald-50 dark:bg-emerald-900/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Total Aktual / Realisasi
                </td>
                {weeksArray.map(w => {
                  const weekActualSum = getSafeFloat(scheduleData?.weekly_actual?.[w]);
                  return <td key={w} className="p-2 text-center border-r border-emerald-200 dark:border-emerald-500/20 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{weekActualSum > 0 ? weekActualSum.toFixed(2) : '-'}</td>;
                })}
                {isEditMode && canCreateData && <td className="border-r border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/10"></td>}
                <td className="p-2.5 text-right font-mono text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                  {getSafeFloat(Object.values(scheduleData?.weekly_actual || {}).reduce((sum, val) => sum + getSafeFloat(val), 0)).toFixed(2)}%
                </td>
              </tr>
              <tr className="bg-blue-50 dark:bg-blue-500/5 border-t border-blue-200 dark:border-blue-500/20">
                <td colSpan="3" className="p-2 text-right font-extrabold text-blue-600 dark:text-blue-400 uppercase text-[10px] border-r border-blue-200 dark:border-blue-500/20 sticky left-0 z-40 bg-blue-50 dark:bg-blue-900/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Target Kumulatif Mingguan
                </td>
                {weeksArray.map(w => {
                  const existingTarget = getSafeFloat(safeLocalWeeks.find(week => parseInt(week.minggu_ke) === w)?.target_kumulatif);
                  const displayCumulative = isEditMode ? existingTarget : existingTarget.toFixed(2);
                  return (
                    <td key={w} className="p-1.5 text-center border-r border-blue-200 dark:border-blue-500/20">
                      {isEditMode ? (
                        <div className="flex items-center justify-center">
                          <input type="text" value={displayCumulative} onChange={(e) => handleWeekCumulativeChange(w, e.target.value)} className="w-12 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-md px-1 py-0.5 text-center font-mono font-extrabold text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-[10px]"/>
                        </div>
                      ) : <span className="font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400">{existingTarget > 0 ? existingTarget.toFixed(2) : '-'}</span>}
                    </td>
                  );
                })}
                {isEditMode && canCreateData && <td className="border-r border-blue-200 dark:border-blue-500/20 bg-blue-50/20 dark:bg-blue-900/10"></td>}
                <td className="p-2 text-right font-mono text-[10px] font-extrabold text-blue-700 dark:text-blue-400">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-2.5 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl py-2 px-3 text-xs flex flex-wrap items-center gap-3 shadow-sm shrink-0">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px]"><Info className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Keterangan Matriks:</span>
        <div className="flex gap-x-4 gap-y-1.5 flex-wrap text-slate-500 dark:text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/30 font-bold">0.00</span> Aktual Laporan Harian (Bisa di-klik)</span>
          <span className="flex items-center gap-1.5"><span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/30 font-bold">0.00</span> Target Kumulatif Rencana</span>
        </div>
      </div>

      {detailModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase flex gap-2"><Activity className="w-4 h-4 text-emerald-500" /> SUMBER REALISASI HARIAN (M-{detailModal.weekNum})</h3>
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-slate-800/80 p-5">
               {(detailModal.realizations || []).length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                   <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 dark:text-slate-400 text-xs text-center">Belum ada progres harian yang diinput oleh pengawas untuk pekerjaan ini.</p>
                 </div>
               ) : (
                 <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50 shadow-sm">
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-100 dark:bg-slate-900/80 text-[10px] text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700/60">
                       <tr>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-12">Hari</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60 w-32">Tanggal Laporan</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60">Uraian Pekerjaan</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-24">Volume</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-24">Aktual (%)</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-24">Status</th>
                         {/* PERBAIKAN: Tombol Aksi hanya muncul saat mode Edit Aktif */}
                         {isEditMode && canCreateData && <th className="p-3 text-center w-28">Aksi</th>}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                       {(detailModal.realizations || []).map((r, index) => {
                         const isEditing = inlineEditId === r.activity_id;
                         return (
                           <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                             <td className="p-3 text-center font-mono font-bold text-slate-500">H{index + 1}</td>
                             <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 font-medium">{new Date(r.tgl_input).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                             <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 leading-relaxed font-semibold">
                               {r.uraian_laporan || detailModal.item?.uraian_pekerjaan || '-'}
                             </td>
                             <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                               {isEditing ? <input type="number" step="any" className="w-full text-center border border-blue-400 rounded p-1 text-xs dark:bg-slate-800 focus:outline-none" value={inlineEditData.volume} onChange={(e)=>setInlineEditData({...inlineEditData, volume: e.target.value})} /> : <span className="font-mono font-bold">{getSafeFloat(r.volume_laporan)} {detailModal.item?.satuan || ''}</span>}
                             </td>
                             <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                               {isEditing ? <input type="number" step="any" className="w-full text-center border border-emerald-400 rounded p-1 text-xs dark:bg-slate-800 focus:outline-none text-emerald-600 font-bold" value={inlineEditData.persentase} onChange={(e)=>setInlineEditData({...inlineEditData, persentase: e.target.value})} /> : <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{getSafeFloat(r.bobot_realisasi).toFixed(2)}%</span>}
                             </td>
                             <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">
                               {r.status_laporan === 'approved' ? <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/30 shadow-sm"><CheckCircle2 className="w-3 h-3"/> Disetujui</span> : <span className="text-slate-400 text-[10px]">Pending</span>}
                             </td>
                             {/* PERBAIKAN: Tombol Aksi hanya muncul saat mode Edit Aktif */}
                             {isEditMode && canCreateData && (
                               <td className="p-2 text-center">
                                 {isEditing ? (
                                   <div className="flex gap-1.5 justify-center">
                                     {isSavingInline ? <Loader2 className="w-5 h-5 text-emerald-500 animate-spin"/> : (
                                       <><button onClick={() => saveInlineEdit(r.activity_id)} className="p-1.5 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 shadow-sm"><Check className="w-3.5 h-3.5"/></button><button onClick={() => setInlineEditId(null)} className="p-1.5 bg-rose-500 text-white rounded-md hover:bg-rose-600 shadow-sm"><X className="w-3.5 h-3.5"/></button></>
                                     )}
                                   </div>
                                 ) : <button onClick={() => startInlineEdit(r)} className="flex items-center justify-center gap-1.5 w-full bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors shadow-sm"><Edit3 className="w-3 h-3" /> Edit</button>}
                               </td>
                             )}
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               )}
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-xs shadow-sm transition-colors">Tutup Rincian</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}