import React, { useState } from 'react';
import { Users, Wrench, Trash2, Plus, UploadCloud, Image as ImageIcon, Paperclip, X } from 'lucide-react';

export default function PersonilAlatLampiranAdd({
  personilItems, setPersonilItems, peralatanItems, setPeralatanItems,
  fotoLampiran, setFotoLampiran, dokumenLampiran, setDokumenLampiran
}) {
  const [modalPersonil, setModalPersonil] = useState(false);
  const [formP, setFormP] = useState({ peran: '', jumlah: '' });
  const [modalAlat, setModalAlat] = useState(false);
  const [formA, setFormA] = useState({ namaAlat: '', jumlah: '' });

  const addPersonil = (e) => { 
    e.preventDefault(); 
    setPersonilItems([...personilItems, { id: Date.now(), ...formP }]); 
    setFormP({ peran: '', jumlah: '' }); 
    setModalPersonil(false); 
  };
  
  const addAlat = (e) => { 
    e.preventDefault(); 
    setPeralatanItems([...peralatanItems, { id: Date.now(), ...formA }]); 
    setFormA({ namaAlat: '', jumlah: '' }); 
    setModalAlat(false); 
  };

  const handleUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'foto') setFotoLampiran([...fotoLampiran, ...files]);
    else setDokumenLampiran([...dokumenLampiran, ...files]);
    e.target.value = null;
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      
      {/* BARIS PERSONIL & ALAT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
        <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex gap-2 uppercase tracking-wider"><Users className="w-4 h-4" /> Personil Lapangan</h2>
            <button type="button" onClick={() => setModalPersonil(true)} className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 font-bold transition-colors shadow-sm"><Plus className="w-3.5 h-3.5 inline"/> Tambah</button>
          </div>
          <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {personilItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada personil diinput</p></div>
            ) : (
              personilItems.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.peran}</span>
                  <div className="flex gap-3 items-center">
                    <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md font-mono text-xs font-bold">{p.jumlah} Org</span>
                    <button type="button" onClick={() => setPersonilItems(personilItems.filter(i => i.id !== p.id))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col h-full backdrop-blur-sm">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-500 flex gap-2 uppercase tracking-wider"><Wrench className="w-4 h-4" /> Pemakaian Alat</h2>
            <button type="button" onClick={() => setModalAlat(true)} className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-500/30 font-bold transition-colors shadow-sm"><Plus className="w-3.5 h-3.5 inline"/> Tambah</button>
          </div>
          <div className="space-y-2 flex-1 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {peralatanItems.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada alat diinput</p></div>
            ) : (
              peralatanItems.map(a => (
                <div key={a.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{a.namaAlat}</span>
                  <div className="flex gap-3 items-center">
                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md font-mono text-xs font-bold">{a.jumlah} Unit</span>
                    <button type="button" onClick={() => setPeralatanItems(peralatanItems.filter(i => i.id !== a.id))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BARIS LAMPIRAN FOTO & DOKUMEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
        <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-xs font-bold text-amber-600 dark:text-amber-500 flex gap-2 uppercase tracking-wider"><ImageIcon className="w-4 h-4"/> Dokumentasi (Foto)</h2>
            <input type="file" id="fUploadAdd" hidden multiple accept="image/*" onChange={(e) => handleUpload(e, 'foto')}/>
            <button type="button" onClick={() => document.getElementById('fUploadAdd').click()} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><UploadCloud className="w-3.5 h-3.5 inline"/> Upload</button>
          </div>
          <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {fotoLampiran.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada foto terlampir</p></div>
            ) : (
               fotoLampiran.map((f, i) => (
                 <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                   <span className="text-xs font-bold text-slate-800 dark:text-white truncate pr-2">{f.name}</span>
                   <button type="button" onClick={() => setFotoLampiran(fotoLampiran.filter((_, idx) => idx !== i))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                 </div>
               ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm backdrop-blur-sm">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-4">
            <h2 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 flex gap-2 uppercase tracking-wider"><Paperclip className="w-4 h-4"/> File Dokumen (Ops)</h2>
            <input type="file" id="dUploadAdd" hidden multiple accept=".pdf,.xls,.xlsx,.doc,.docx" onChange={(e) => handleUpload(e, 'doc')}/>
            <button type="button" onClick={() => document.getElementById('dUploadAdd').click()} className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-colors shadow-sm"><UploadCloud className="w-3.5 h-3.5 inline"/> Upload</button>
          </div>
          <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {dokumenLampiran.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40"><Paperclip className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2"/><p className="text-xs text-slate-500 font-medium">Belum ada berkas terlampir</p></div>
            ) : (
               dokumenLampiran.map((d, i) => (
                 <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-colors">
                   <span className="text-xs font-bold text-slate-800 dark:text-white truncate pr-2">{d.name}</span>
                   <button type="button" onClick={() => setDokumenLampiran(dokumenLampiran.filter((_, idx) => idx !== i))} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5"/></button>
                 </div>
               ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL PERSONIL & ALAT (MENGGUNAKAN TYPE BUTTON) */}
      {modalPersonil && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500"/> Tambah Personil</h3>
              <button type="button" onClick={() => setModalPersonil(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={addPersonil}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Nama Jabatan <span className="text-rose-500">*</span></label>
                  <input required list="peran-options" placeholder="Contoh: Pekerja..." value={formP.peran} onChange={e=>setFormP({...formP, peran:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Orang <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" placeholder="0" value={formP.jumlah} onChange={e=>setFormP({...formP, jumlah:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button type="button" onClick={()=>setModalPersonil(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors">Simpan Personil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAlat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-500"/> Tambah Alat</h3>
              <button type="button" onClick={() => setModalAlat(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={addAlat}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Peralatan <span className="text-rose-500">*</span></label>
                  <input required list="alat-options" placeholder="Contoh: Excavator..." value={formA.namaAlat} onChange={e=>setFormA({...formA, namaAlat:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Unit <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" placeholder="0" value={formA.jumlah} onChange={e=>setFormA({...formA, jumlah:e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                <button type="button" onClick={()=>setModalAlat(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors">Simpan Alat</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}