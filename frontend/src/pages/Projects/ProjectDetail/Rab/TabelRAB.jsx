import React from 'react';
import { Plus, Search, FileSpreadsheet, ListPlus, Type, Edit3, Trash2 } from 'lucide-react';

export default function TabelRAB({ 
  rabsWithRealization, filteredRabsView, isEditMode, formatRupiah,
  openCatModal, openItemModal, confirmDelete, setSearchQuery, setActiveDivisi,
  canViewPrices
}) {

  if (rabsWithRealization.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
        <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">RAB Belum Dibuat</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Mulai bangun struktur RAB proyek dengan menambahkan Divisi/Kategori pekerjaan pertama atau Import via Excel.</p>
        {isEditMode ? (
          <button onClick={() => openCatModal()} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-600">
            <Plus className="w-4 h-4 inline mr-1" /> Buat Divisi Baru
          </button>
        ) : (
          <p className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium border border-blue-200 dark:border-blue-500/20">
            Aktifkan "Mode Edit" di atas untuk mulai memasukkan data.
          </p>
        )}
      </div>
    );
  }

  if (filteredRabsView.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
        <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">Item Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Coba ubah kata kunci pencarian atau ganti filter divisi.</p>
        <button onClick={() => { setSearchQuery(''); setActiveDivisi('Semua'); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
          Reset Filter
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredRabsView.map((divisi) => (
        <div key={divisi.id} className={`bg-white dark:bg-slate-800/60 border rounded-2xl overflow-hidden shadow-sm transition-colors ${isEditMode ? 'border-blue-300/60 dark:border-blue-700/40 shadow-blue-900/5' : 'border-slate-200 dark:border-slate-700/60'}`}>
          
          <div className="bg-slate-50 dark:bg-slate-900/80 px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tracking-wide uppercase flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full shrink-0"></div> 
              <span>
                {divisi.kode_divisi && (
                  <span className="mr-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-500 rounded font-mono text-[11px] border border-amber-200 dark:border-amber-500/30">
                    {divisi.kode_divisi}
                  </span>
                )}
                {divisi.nama_kategori}
              </span>
            </h3>
            
            {isEditMode && (
              <div className="flex flex-wrap items-center gap-2 animate-fade-in w-full xl:w-auto shrink-0">
                <button onClick={() => openItemModal(divisi.id, false)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-slate-700/80 transition-all">
                  <ListPlus className="w-3.5 h-3.5" /> Tambah Item
                </button>
                <button onClick={() => openItemModal(divisi.id, true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-slate-700/80 transition-all">
                  <Type className="w-3.5 h-3.5" /> Tambah Sub-Header
                </button>
                <button onClick={() => openCatModal(divisi)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700/80 transition-all">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Divisi
                </button>
                <button onClick={() => confirmDelete('category', divisi.id, divisi.nama_kategori)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-500/20 transition-all">
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            )}
          </div>

          <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
            {divisi.items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">Belum ada item di divisi ini.</div>
            ) : (
              divisi.items.map((item) => (
                <div key={item.id} className={`p-4 ${item.is_subheader ? 'bg-slate-50 dark:bg-slate-800/40' : 'bg-white dark:bg-transparent'}`}>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 leading-snug">
                    {item.kode_pekerjaan && (
                      <span className="text-amber-600 dark:text-amber-500 mr-2 font-mono text-xs">[{item.kode_pekerjaan}]</span>
                    )}
                    <span className={item.is_subheader ? 'uppercase tracking-wide' : ''}>{item.uraian_pekerjaan}</span>
                  </h4>
                  
                  {!item.is_subheader && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                        <span className="block text-[9px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 tracking-wider uppercase">Rencana</span>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Vol</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{Number(item.volume)} {item.satuan}</span></p>
                          {canViewPrices && <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Harga</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRupiah(item.harga_satuan)}</span></p>}
                          {canViewPrices && <div className="border-t border-blue-200 dark:border-blue-800/30 my-1.5 pt-1.5"><p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">{formatRupiah(item.total_harga)}</p></div>}
                        </div>
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                        <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 tracking-wider uppercase">Realisasi</span>
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Vol</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{item.actualVol} {item.satuan}</span></p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Progres</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{item.volume > 0 ? ((item.actualVol / item.volume) * 100).toFixed(1) : 0}%</span></p>
                          {canViewPrices && <div className="border-t border-emerald-200 dark:border-emerald-800/30 my-1.5 pt-1.5"><p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{formatRupiah(item.actualTotal)}</p></div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {isEditMode && (
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => openItemModal(divisi.id, item.is_subheader, item)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700/80 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-700 dark:text-blue-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                      <button onClick={() => confirmDelete('item', item.id, item.uraian_pekerjaan)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700/80 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-700 dark:text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full table-fixed text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-100 dark:bg-slate-900/40 text-[10px] uppercase text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                <tr>
                  <th className={`px-4 py-2.5 ${canViewPrices ? 'w-[10%]' : 'w-[15%]'} border-r border-slate-200 dark:border-slate-700/40 font-semibold`}>Kode</th>
                  <th className={`px-3 py-2.5 ${canViewPrices ? 'w-[25%]' : 'w-[40%]'} border-r border-slate-200 dark:border-slate-700/40 font-semibold`}>Uraian Pekerjaan</th>
                  <th className={`px-2 py-2.5 ${canViewPrices ? 'w-[6%]' : 'w-[15%]'} border-r border-slate-200 dark:border-slate-700/40 text-center font-semibold`}>SAT</th>
                  <th className={`px-2 py-2.5 ${canViewPrices ? 'w-[7%]' : 'w-[15%]'} border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-blue-600 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/10`}>Vol (R)</th>
                  {canViewPrices && <th className="px-3 py-2.5 w-[14%] border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-blue-600 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/10">Harga Sat (R)</th>}
                  {canViewPrices && <th className="px-3 py-2.5 w-[14%] border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-blue-600 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/10">Jumlah (R)</th>}
                  <th className={`px-2 py-2.5 ${canViewPrices ? 'w-[7%]' : 'w-[15%]'} border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-emerald-600 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/10`}>Vol (A)</th>
                  {canViewPrices && <th className="px-3 py-2.5 w-[17%] text-right font-semibold text-emerald-600 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/10">Jumlah Realisasi (A)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-[11px] text-slate-700 dark:text-slate-300">
                {divisi.items.length === 0 ? (
                  <tr><td colSpan={canViewPrices ? 8 : 5} className="text-center py-6 text-slate-500 italic">Tidak ada item pekerjaan</td></tr>
                ) : (
                  divisi.items.map((item) => {
                    if (item.is_subheader) {
                      return (
                        <tr key={item.id} className="bg-slate-100 dark:bg-slate-800/40 group">
                          <td className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/40 font-mono text-amber-600 dark:text-amber-500 font-bold">
                            {item.kode_pekerjaan}
                          </td>
                          <td colSpan={canViewPrices ? 7 : 4} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700/40">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                {item.uraian_pekerjaan}
                              </span>
                              {isEditMode && (
                                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 animate-fade-in shrink-0">
                                  <button onClick={() => openItemModal(divisi.id, true, item)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400"><Edit3 className="w-3.5 h-3.5"/></button>
                                  <button onClick={() => confirmDelete('item', item.id, item.uraian_pekerjaan)} className="text-rose-500 hover:text-rose-600 dark:text-rose-400"><Trash2 className="w-3.5 h-3.5"/></button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                        <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700/40 font-mono text-slate-500 dark:text-slate-400">
                          {item.kode_pekerjaan}
                        </td>
                        <td className="px-3 py-3 border-r border-slate-200 dark:border-slate-700/40 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={item.uraian_pekerjaan}>
                          <div className="flex items-center justify-between">
                            <span className="truncate pr-2 font-medium">
                              {item.uraian_pekerjaan}
                            </span>
                            {isEditMode && (
                              <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 animate-fade-in shrink-0">
                                <button onClick={() => openItemModal(divisi.id, false, item)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400"><Edit3 className="w-3.5 h-3.5"/></button>
                                <button onClick={() => confirmDelete('item', item.id, item.uraian_pekerjaan)} className="text-rose-500 hover:text-rose-600 dark:text-rose-400"><Trash2 className="w-3.5 h-3.5"/></button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center border-r border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{item.satuan}</td>
                        <td className="px-2 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/5">{Number(item.volume)}</td>
                        {canViewPrices && <td className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/5">{formatRupiah(item.harga_satuan)}</td>}
                        {canViewPrices && <td className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/5 text-blue-600 dark:text-blue-300 font-bold">{formatRupiah(item.total_harga)}</td>}
                        <td className="px-2 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-emerald-50/50 dark:bg-emerald-950/5 text-emerald-600 dark:text-emerald-400 font-bold">{item.actualVol}</td>
                        {canViewPrices && <td className="px-3 py-3 text-right font-mono text-[10px] bg-emerald-50/50 dark:bg-emerald-950/5 text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(item.actualTotal)}</td>}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {canViewPrices && (
            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-end gap-3 md:gap-4 text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-400 uppercase text-[10px]">Subtotal {divisi.nama_kategori}</span>
              <div className="flex items-center justify-between md:justify-end gap-6 font-mono font-bold w-full md:w-auto">
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[9px] text-slate-500 uppercase">Rencana (Plan)</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm">{formatRupiah(divisi.totalRencanaDivisi)}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 uppercase">Realisasi (Actual)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm">{formatRupiah(divisi.totalRealisasiDivisi)}</span>
                </div>
              </div>
            </div>
          )}

        </div>
      ))}
    </div>
  );
}