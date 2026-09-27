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
  
  // --- STATE MODAL RINCIAN HARIAN (DRILL-DOWN) ---
  const [detailModal, setDetailModal] = useState({
    show: false,
    item: null,
    weekNum: null,
    targetPlan: 0,
    realizations: []
  });

  const getCellVal = (itemId, weekNum) => {
    const s = localSchedules.find(s => s.rab_item_id === itemId && parseInt(s.minggu_ke) === weekNum);
    return s ? parseFloat(s.bobot_rencana || 0) : null;
  };

  const getItemCumulative = (itemId) => {
    return localSchedules.filter(s => s.rab_item_id === itemId).reduce((sum, s) => sum + parseFloat(s.bobot_rencana || 0), 0);
  };

  const handleOpenCellDetail = (item, weekNum, planVal) => {
    const dailyRealizations = scheduleData?.realizations?.filter(r => r.rab_item_id === item.id && parseInt(r.minggu_ke) === weekNum) || [];
    setDetailModal({
      show: true,
      item: item,
      weekNum: weekNum,
      targetPlan: planVal,
      realizations: dailyRealizations
    });
  };

  return (
    <>
      {/* 
        TABEL MATRIX CONTAINER 
        PERBAIKAN: Menambahkan h-[calc(100vh-220px)] dan overflow-hidden pada pembungkus luar
        agar tabel memiliki batas tinggi dan scrollbar custom bisa muncul.
      */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm flex flex-col relative z-0 backdrop-blur-sm transition-all animate-fade-in w-full h-[calc(100vh-220px)] min-h-[400px] overflow-hidden">
        
        {/* Inner Scrollable Container */}
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
                        <button onClick={() => openAddItemModalFromMatrix(w)} className="p-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 rounded transition-colors shadow-sm" title={`Tambah ke M-${w}`}>
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-3 w-[100px] text-right font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">Kumulatif</th>
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

                    const bobotStandar = grandTotalRAB > 0 ? ((Number(item.total_harga || 0) / grandTotalRAB) * 100).toFixed(2) : '0.00';
                    const itemCumulative = getItemCumulative(item.id);
                    
                    // Cek apakah item ini dijadwalkan di manapun
                    const isScheduled = localSchedules.some(s => s.rab_item_id === item.id);
                    if (!isEditMode && !isScheduled) return null;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                        <td className="p-2.5 font-mono text-[10px] text-slate-500 text-center border-r border-slate-200 dark:border-slate-700/60 sticky left-0 z-20 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          {item.kode_pekerjaan || '-'}
                        </td>
                        <td className="p-2.5 text-[11px] font-medium border-r border-slate-200 dark:border-slate-700/60 sticky left-[80px] z-20 bg-white dark:bg-slate-800 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:group-hover:bg-slate-700">
                          <div className="line-clamp-2" title={item.uraian_pekerjaan}>{item.uraian_pekerjaan}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono text-[10px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-900/20">
                          {bobotStandar}%
                        </td>

                        {/* SEL MINGGU (MATRIX DATA) - CLICKABLE */}
                        {weeksArray.map(w => {
                          const val = getCellVal(item.id, w);
                          return (
                            <td key={w} className="p-2 text-center border-r border-slate-200 dark:border-slate-700/60 relative group/cell">
                              {val !== null ? (
                                <>
                                  <button 
                                    onClick={() => handleOpenCellDetail({ ...item, kategori_nama: cat.nama_kategori }, w, val)}
                                    title="Klik untuk lihat rincian harian"
                                    className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/30 transition-colors cursor-pointer shadow-sm active:scale-95"
                                  >
                                    {val.toFixed(2)}
                                  </button>
                                  {isEditMode && (
                                    <button 
                                      onClick={() => setDeleteConfig({ show: true, rabItemId: item.id, weekNum: w, itemName: item.uraian_pekerjaan })} 
                                      className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 text-rose-500 hover:text-white hover:bg-rose-500 p-0.5 rounded transition-all shadow-sm"
                                      title="Hapus dari minggu ini"
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

                        {/* KUMULATIF BARIS */}
                        <td className="p-2.5 text-right font-mono text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10">
                          {itemCumulative > 0 ? `${itemCumulative.toFixed(2)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>

            {/* FOOTER TOTAL (KUMULATIF MINGGUAN) */}
            <tfoot className="sticky bottom-0 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              {/* BARIS: TOTAL DISTRIBUSI MINGGUAN */}
              <tr className="bg-slate-100 dark:bg-slate-900/95 border-t-2 border-slate-300 dark:border-slate-600">
                <td colSpan="3" className="p-3 text-right font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] sticky left-0 z-40 bg-slate-100 dark:bg-slate-900/95 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-300 dark:border-slate-600">
                  Total Distribusi Rencana (Mingguan)
                </td>
                {weeksArray.map(w => {
                  const weekSum = localSchedules.filter(s => parseInt(s.minggu_ke) === w).reduce((sum, s) => sum + parseFloat(s.bobot_rencana || 0), 0);
                  return (
                    <td key={w} className="p-3 text-center border-r border-slate-300 dark:border-slate-600 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/95">
                      {weekSum > 0 ? weekSum.toFixed(2) : '-'}
                    </td>
                  );
                })}
                <td className="p-3 text-right font-mono text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40">
                  {localSchedules.reduce((sum, s) => sum + parseFloat(s.bobot_rencana || 0), 0).toFixed(2)}%
                </td>
              </tr>

              {/* BARIS: TARGET KUMULATIF MINGGUAN (INPUT MODE) */}
              <tr className="bg-blue-50 dark:bg-blue-950/20 border-t border-blue-200 dark:border-blue-800/50">
                <td colSpan="3" className="p-3 text-right font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider text-[10px] sticky left-0 z-40 bg-blue-50 dark:bg-[#172554] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-blue-200 dark:border-blue-800/50">
                  Target Kumulatif (Plan)
                </td>
                {weeksArray.map(w => {
                  const weekItems = localSchedules.filter(s => parseInt(s.minggu_ke) === w);
                  const weekSum = weekItems.reduce((sum, s) => sum + parseFloat(s.bobot_rencana || 0), 0);
                  const displayCumulative = weekCumulativeInputs[w] !== undefined ? weekCumulativeInputs[w] : weekSum.toFixed(2);

                  return (
                    <td key={w} className="p-2 text-center border-r border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-[#172554]">
                      {isEditMode && weekItems.length > 0 ? (
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
                          {weekSum > 0 ? weekSum.toFixed(2) : '-'}
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
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm shrink-0">
        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5"><Info className="w-4 h-4 text-amber-500" /> Keterangan Matriks:</span>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/30 shadow-sm cursor-pointer hover:bg-emerald-100 transition-colors">0.00</span> 
            Bobot Terjadwal (Bisa di-Klik)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/30">0.00</span> 
            Target Kumulatif (Plan)
          </span>
          {canCreateData && (
            <span className="flex items-center gap-1.5 text-blue-500 font-medium">
              <Plus className="w-3.5 h-3.5" /> Klik (+) di Mode Edit untuk menyusun draf mingguan
            </span>
          )}
        </div>
      </div>

      {/* --- MODAL RINCIAN HARIAN (DRILL-DOWN) --- */}
      {detailModal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4" /> RINCIAN REALISASI HARIAN (M-{detailModal.weekNum})
                </h3>
              </div>
              <button onClick={() => setDetailModal({ ...detailModal, show: false })} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 absolute top-4 right-4 transition-colors"><X className="w-5 h-5"/></button>
            </div>

            <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 shadow-inner">
               <div className="flex flex-col mb-4">
                 <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">{detailModal.item?.kategori_nama || '-'}</span>
                 <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{detailModal.item?.uraian_pekerjaan || '-'}</h4>
               </div>

               {/* Indikator Target vs Aktual */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5 text-blue-500"/> Target (Plan)</span>
                    <span className="font-mono text-lg font-extrabold text-blue-600 dark:text-blue-400">{detailModal.targetPlan.toFixed(2)}%</span>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col justify-center shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1"><BarChart className="w-3.5 h-3.5 text-emerald-500"/> Total Aktual</span>
                    <span className="font-mono text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {detailModal.realizations.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi || 0), 0).toFixed(2)}%
                    </span>
                  </div>
                  
                  {(() => {
                    const deviasi = detailModal.realizations.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi || 0), 0) - detailModal.targetPlan;
                    const isMinus = deviasi < 0;
                    return (
                      <div className={`p-3 rounded-xl border flex flex-col justify-center shadow-sm ${isMinus ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'}`}>
                        <span className={`text-[10px] font-bold uppercase flex items-center gap-1.5 mb-1 ${isMinus ? 'text-rose-600 dark:text-rose-500' : 'text-emerald-600 dark:text-emerald-500'}`}><TrendingUp className="w-3.5 h-3.5"/> Deviasi</span>
                        <span className={`font-mono text-lg font-extrabold ${isMinus ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {deviasi > 0 ? `+${deviasi.toFixed(2)}` : deviasi.toFixed(2)}%
                        </span>
                      </div>
                    );
                  })()}
               </div>
            </div>
            
            {/* Tabel Realisasi Harian */}
            <div className="overflow-y-auto custom-scrollbar flex-1 min-h-[200px] bg-slate-50 dark:bg-slate-900/20 p-5">
               <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Histori Laporan Harian Terkait</h5>
               
               {detailModal.realizations.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl">
                   <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-medium text-center">Belum ada laporan harian yang masuk untuk pekerjaan ini di Minggu Ke-{detailModal.weekNum}.</p>
                 </div>
               ) : (
                 <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden bg-white dark:bg-slate-800/80 shadow-sm">
                   <table className="w-full text-left border-collapse">
                     <thead className="bg-slate-100 dark:bg-slate-900/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/60">
                       <tr>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 w-12">No</th>
                         <th className="p-3 border-r border-slate-200 dark:border-slate-700/60">Tanggal Laporan</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">Volume Tercapai</th>
                         <th className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60">Persentase Aktual</th>
                         <th className="p-3 text-center">Status Laporan</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-800 dark:text-slate-200">
                       {detailModal.realizations.map((r, index) => (
                         <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                           <td className="p-3 text-center align-middle font-mono text-slate-500">{index + 1}</td>
                           <td className="p-3 border-r border-slate-200 dark:border-slate-700/60 font-medium">
                             {new Date(r.tgl_input).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                           </td>
                           <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-bold text-slate-700 dark:text-slate-300">
                             {r.volume_laporan} {detailModal.item?.satuan || ''}
                           </td>
                           <td className="p-3 text-center border-r border-slate-200 dark:border-slate-700/60 font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                             {parseFloat(r.bobot_realisasi || 0).toFixed(2)}%
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