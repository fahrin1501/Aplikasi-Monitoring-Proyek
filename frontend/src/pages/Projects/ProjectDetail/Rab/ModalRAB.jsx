import React, { useState, useEffect } from 'react';
import { Download, Loader2, UploadCloud, FileSpreadsheet, Trash2, X, Type, ListPlus, AlertTriangle } from 'lucide-react';

export default function ModalRAB({
  showCatModal, setShowCatModal, catForm, setCatForm, saveCategory,
  showItemModal, setShowItemModal, itemForm, setItemForm, saveItem, formatRupiah,
  deleteConfig, setDeleteConfig, executeDelete, isSaving,
  exportModal, setExportModal, isExporting, executeExport,
  showImportModal, setShowImportModal, importFile, setImportFile, isImporting, handleImportRAB
}) {

  // --- CEK HAK AKSES MANDIRI ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) setUserRole(JSON.parse(userDataStr).role || 'Tamu');
  }, []);

  const canViewPrices = ['Administrator', 'Direktur'].includes(userRole);
  // -----------------------------

  return (
    <>
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500"/> {catForm.id ? 'Edit Divisi' : 'Tambah Divisi'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={saveCategory}>
              <div className="p-5 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl text-[10px] text-amber-700 dark:text-amber-500 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p><strong>Perhatian:</strong> Perubahan yang Anda simpan di sini akan <b>langsung diperbarui</b> ke dalam database secara permanen.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kode Divisi <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <input type="text" value={catForm.kode_divisi} onChange={(e) => setCatForm({...catForm, kode_divisi: e.target.value})} placeholder="Contoh: I atau A" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Divisi / Kategori <span className="text-rose-500">*</span></label>
                  <input type="text" required value={catForm.nama_kategori} onChange={(e) => setCatForm({...catForm, nama_kategori: e.target.value})} placeholder="Contoh: UMUM" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" disabled={isSaving} onClick={() => setShowCatModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {isSaving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {itemForm.is_subheader ? (
                  <><Type className="w-4 h-4 text-emerald-500"/> {itemForm.id ? 'Edit Sub-Header' : 'Tambah Sub-Header'}</>
                ) : (
                  <><ListPlus className="w-4 h-4 text-emerald-500"/> {itemForm.id ? 'Edit Item' : 'Tambah Item'}</>
                )}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={saveItem}>
              <div className="p-5 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-xl text-[10px] text-amber-700 dark:text-amber-500 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p><strong>Perhatian:</strong> Perubahan yang Anda simpan di sini akan <b>langsung diperbarui</b> ke dalam database secara permanen.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-1 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kode <span className="text-slate-400 font-normal">(Ops)</span></label>
                    <input type="text" value={itemForm.kode_pekerjaan} onChange={(e) => setItemForm({...itemForm, kode_pekerjaan: e.target.value})} placeholder="Contoh: 1.2" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 font-mono" />
                  </div>
                  <div className="sm:col-span-3 space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{itemForm.is_subheader ? 'Nama Sub-Header / Kelompok Pekerjaan' : 'Uraian Pekerjaan'} <span className="text-rose-500">*</span></label>
                    <textarea required rows="2" value={itemForm.uraian_pekerjaan} onChange={(e) => setItemForm({...itemForm, uraian_pekerjaan: e.target.value})} placeholder={itemForm.is_subheader ? "Contoh: Mobilisasi & Peralatan" : "Contoh: Sewa Excavator 80-140 HP"} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 resize-none" />
                  </div>
                </div>
                {!itemForm.is_subheader && (
                  <div className={`grid grid-cols-2 ${canViewPrices ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 animate-fade-in`}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Satuan <span className="text-rose-500">*</span></label>
                      <input type="text" required value={itemForm.satuan} onChange={(e) => setItemForm({...itemForm, satuan: e.target.value})} placeholder="Ls / m3" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-center" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Volume <span className="text-rose-500">*</span></label>
                      <input type="number" step="any" required min="0" value={itemForm.volume} onChange={(e) => setItemForm({...itemForm, volume: e.target.value})} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-center font-mono" />
                    </div>
                    {canViewPrices && (
                      <div className="col-span-2 sm:col-span-1 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Harga Satuan <span className="text-rose-500">*</span></label>
                        <input type="number" step="any" required min="0" value={itemForm.harga_satuan} onChange={(e) => setItemForm({...itemForm, harga_satuan: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-right font-mono" />
                      </div>
                    )}
                  </div>
                )}
                {(canViewPrices && !itemForm.is_subheader && itemForm.volume && itemForm.harga_satuan) ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl flex items-center justify-between mt-2 animate-fade-in">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Total Harga Otomatis:</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono">{formatRupiah(Number(itemForm.volume) * Number(itemForm.harga_satuan))}</span>
                  </div>
                ) : null}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" disabled={isSaving} onClick={() => setShowItemModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm disabled:opacity-50">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 disabled:opacity-50">
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} {isSaving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Permanen?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Anda yakin ingin menghapus <strong className="text-slate-700 dark:text-slate-300">{deleteConfig.name}</strong>?<br/><br/>
              <span className="italic text-rose-500 font-medium">Tindakan ini tidak dapat dibatalkan dan akan langsung terhapus dari Database.</span>
            </p>
            <div className="flex gap-3">
              <button disabled={isSaving} onClick={() => setDeleteConfig({ show: false, type: '', id: null, name: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50">Batal</button>
              <button disabled={isSaving} onClick={executeDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-2 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>} {isSaving ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EXPORT */}
      {exportModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${exportModal.type === 'excel' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200'}`}>
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Export</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Sistem akan mengunduh dokumen RAB dan Realisasi dalam format <strong className="uppercase">{exportModal.type}</strong>. Proses ini mungkin memakan waktu beberapa detik.</p>
            <div className="flex gap-3">
              <button disabled={isExporting} onClick={() => setExportModal({ show: false, type: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors">Batal</button>
              <button disabled={isExporting} onClick={executeExport} className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-2 transition-all ${exportModal.type === 'excel' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} {isExporting ? 'Memproses...' : 'Unduh Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORT */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/20"><UploadCloud className="w-6 h-6 text-emerald-500" /></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Import RAB via Excel</h3>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500/50 rounded-xl p-8 mb-4 bg-slate-50 dark:bg-slate-900/50 relative transition-all group overflow-hidden">
              <input type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 truncate px-4">{importFile ? importFile.name : "Seret file excel disini atau Klik"}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Format yang didukung: .xlsx, .xls</p>
            </div>
            <div className="flex gap-3">
              <button disabled={isImporting} onClick={() => { setShowImportModal(false); setImportFile(null); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50">Batal</button>
              <button disabled={isImporting || !importFile} onClick={handleImportRAB} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-2 shadow-md transition-colors disabled:opacity-50">
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4"/>} {isImporting ? 'Mengimpor...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}