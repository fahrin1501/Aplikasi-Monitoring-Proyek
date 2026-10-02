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

  const addPersonil = (e) => { e.preventDefault(); setPersonilItems([...personilItems, { id: Date.now(), ...formP }]); setFormP({ peran: '', jumlah: '' }); setModalPersonil(false); };
  const addAlat = (e) => { e.preventDefault(); setPeralatanItems([...peralatanItems, { id: Date.now(), ...formA }]); setFormA({ namaAlat: '', jumlah: '' }); setModalAlat(false); };

  const handleUpload = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'foto') setFotoLampiran([...fotoLampiran, ...files]);
    else setDokumenLampiran([...dokumenLampiran, ...files]);
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
        {/* PERSONIL */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex justify-between border-b pb-3 mb-3"><h2 className="text-xs font-bold text-emerald-600 flex gap-2 uppercase"><Users className="w-4 h-4" /> Personil</h2><button onClick={() => setModalPersonil(true)} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-200"><Plus className="w-3 h-3 inline"/> Tambah</button></div>
          <div className="space-y-2 flex-1">
            {personilItems.map(p => <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl"><span className="text-xs font-bold">{p.peran}</span><div className="flex gap-3 items-center"><span className="bg-emerald-100 text-emerald-700 px-2 rounded font-mono text-xs">{p.jumlah} Org</span><Trash2 onClick={() => setPersonilItems(personilItems.filter(i => i.id !== p.id))} className="w-4 h-4 text-rose-500 cursor-pointer"/></div></div>)}
          </div>
        </div>
        {/* ALAT */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex justify-between border-b pb-3 mb-3"><h2 className="text-xs font-bold text-blue-600 flex gap-2 uppercase"><Wrench className="w-4 h-4" /> Peralatan</h2><button onClick={() => setModalAlat(true)} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200"><Plus className="w-3 h-3 inline"/> Tambah</button></div>
          <div className="space-y-2 flex-1">
            {peralatanItems.map(a => <div key={a.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl"><span className="text-xs font-bold">{a.namaAlat}</span><div className="flex gap-3 items-center"><span className="bg-blue-100 text-blue-700 px-2 rounded font-mono text-xs">{a.jumlah} Unit</span><Trash2 onClick={() => setPeralatanItems(peralatanItems.filter(i => i.id !== a.id))} className="w-4 h-4 text-rose-500 cursor-pointer"/></div></div>)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-start">
        {/* FOTO */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between border-b pb-3 mb-3"><h2 className="text-xs font-bold text-amber-600 flex gap-2 uppercase"><ImageIcon className="w-4 h-4"/> Foto</h2><input type="file" id="fUpload" hidden multiple accept="image/*" onChange={(e) => handleUpload(e, 'foto')}/><button onClick={() => document.getElementById('fUpload').click()} className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded border"><UploadCloud className="w-3 h-3 inline"/> Upload</button></div>
          <div className="space-y-2">{fotoLampiran.map((f, i) => <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl"><span className="text-xs font-bold truncate">{f.name}</span><Trash2 onClick={() => setFotoLampiran(fotoLampiran.filter((_, idx) => idx !== i))} className="w-4 h-4 text-rose-500 cursor-pointer"/></div>)}</div>
        </div>
        {/* DOKUMEN */}
        <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between border-b pb-3 mb-3"><h2 className="text-xs font-bold text-emerald-600 flex gap-2 uppercase"><Paperclip className="w-4 h-4"/> Dokumen</h2><input type="file" id="dUpload" hidden multiple accept=".pdf,.xls,.doc" onChange={(e) => handleUpload(e, 'doc')}/><button onClick={() => document.getElementById('dUpload').click()} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded border"><UploadCloud className="w-3 h-3 inline"/> Upload</button></div>
          <div className="space-y-2">{dokumenLampiran.map((d, i) => <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border rounded-xl"><span className="text-xs font-bold truncate">{d.name}</span><Trash2 onClick={() => setDokumenLampiran(dokumenLampiran.filter((_, idx) => idx !== i))} className="w-4 h-4 text-rose-500 cursor-pointer"/></div>)}</div>
        </div>
      </div>

      {modalPersonil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60"><div className="bg-white p-5 rounded-2xl w-full max-w-sm"><h3 className="font-bold mb-4">Tambah Personil</h3><form onSubmit={addPersonil} className="space-y-3"><input required placeholder="Jabatan" value={formP.peran} onChange={e=>setFormP({...formP, peran:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/><input type="number" required placeholder="Jumlah" value={formP.jumlah} onChange={e=>setFormP({...formP, jumlah:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/><div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setModalPersonil(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold">Batal</button><button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold">Simpan</button></div></form></div></div>
      )}
      {modalAlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60"><div className="bg-white p-5 rounded-2xl w-full max-w-sm"><h3 className="font-bold mb-4">Tambah Alat</h3><form onSubmit={addAlat} className="space-y-3"><input required placeholder="Nama Alat" value={formA.namaAlat} onChange={e=>setFormA({...formA, namaAlat:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/><input type="number" required placeholder="Jumlah Unit" value={formA.jumlah} onChange={e=>setFormA({...formA, jumlah:e.target.value})} className="w-full border rounded-lg px-3 py-2 text-xs"/><div className="flex justify-end gap-2 mt-4"><button type="button" onClick={()=>setModalAlat(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-xs font-bold">Batal</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Simpan</button></div></form></div></div>
      )}
    </div>
  );
}