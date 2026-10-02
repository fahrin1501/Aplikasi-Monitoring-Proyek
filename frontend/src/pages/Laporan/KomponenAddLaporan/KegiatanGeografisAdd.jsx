import React from 'react';
import Select from 'react-select';
import { ListTodo, Plus, Trash2, MapPin, Loader2 } from 'lucide-react';

export default function KegiatanGeografisAdd({ 
  kegiatanItems, setKegiatanItems, rabOptions, isLoadingRab, 
  optionsMingguIni, optionsMingguLain, unscheduledRabOptions 
}) {

  const formatGroup = (label, options) => ({
    label,
    options: options.map(opt => ({
      value: opt.id.toString(),
      label: `${opt.uraian_pekerjaan || opt.uraian} (${opt.kategori || opt.kategori_nama})`
    }))
  });

  const selectOptions = [];
  if (optionsMingguIni?.length > 0) selectOptions.push(formatGroup('TARGET MINGGU INI', optionsMingguIni));
  if (optionsMingguLain?.length > 0) selectOptions.push(formatGroup('TARGET MINGGU LAINNYA', optionsMingguLain));
  if (unscheduledRabOptions?.length > 0) selectOptions.push(formatGroup('PEKERJAAN DI LUAR JADWAL', unscheduledRabOptions));
  selectOptions.push({ label: 'LAINNYA', options: [{ value: 'manual', label: '+ Pekerjaan Manual / Baru' }] });

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: state.isFocused ? '#f59e0b' : '#cbd5e1',
      borderRadius: '0.75rem',
      padding: '2px',
      boxShadow: state.isFocused ? '0 0 0 1px #f59e0b' : 'none',
      '&:hover': { borderColor: '#f59e0b' }
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      fontSize: '12px',
      backgroundColor: isSelected ? '#f59e0b' : isFocused ? '#fef3c7' : 'transparent',
      color: isSelected ? 'white' : '#1e293b',
      cursor: 'pointer'
    }),
    groupHeading: base => ({ ...base, fontSize: '10px', color: '#d97706', fontWeight: 'bold' }),
    singleValue: base => ({ ...base, fontSize: '12px', fontWeight: '600' })
  };

  const handleSelect = (index, option) => {
    const newK = [...kegiatanItems];
    const val = option ? option.value : null;
    if (val === "manual" || !val) {
      newK[index].rab_item_id = null; newK[index].uraian = ''; newK[index].satuan = '';
    } else {
      const selectedRab = rabOptions.find(r => r.id.toString() === val.toString());
      if (selectedRab) {
        newK[index].rab_item_id = selectedRab.id;
        newK[index].uraian = selectedRab.uraian;
        newK[index].satuan = selectedRab.satuan || '';
      }
    }
    setKegiatanItems(newK);
  };

  return (
    <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2"><ListTodo className="w-4 h-4" /> Uraian Kegiatan Lapangan</label>
        <button type="button" onClick={() => setKegiatanItems([...kegiatanItems, { id: Date.now(), rab_item_id: null, uraian: '', sta_awal: '', sta_akhir: '', volume: '', satuan: '', persentase: '' }])} className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 border border-amber-200 dark:border-amber-500/30 transition-colors shadow-sm"><Plus className="w-3.5 h-3.5" /> Tambah</button>
      </div>

      <div className="space-y-4">
        {kegiatanItems.map((item, index) => {
          let currentVal = null;
          if (item.rab_item_id) {
            const foundRab = rabOptions.find(r => r.id.toString() === item.rab_item_id.toString());
            if (foundRab) currentVal = { value: item.rab_item_id.toString(), label: `${foundRab.uraian_pekerjaan || foundRab.uraian} (${foundRab.kategori || foundRab.kategori_nama})` };
          } else if (item.rab_item_id === null && item.uraian) {
            currentVal = { value: 'manual', label: '+ Pekerjaan Manual / Baru' };
          }

          return (
            <div key={item.id} className="grid grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start shadow-sm transition-all">
              <div className="col-span-12 flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1.5"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Pekerjaan {index + 1}</span>
                {kegiatanItems.length > 1 && <button type="button" onClick={() => setKegiatanItems(kegiatanItems.filter(k => k.id !== item.id))} className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md border border-rose-200 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>

              <div className="col-span-12">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 flex justify-between">
                  <span>Pilih dari Jadwal / RAB <span className="text-rose-500">*</span></span>
                  {isLoadingRab && <span className="text-[9px] text-amber-500 flex gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat RAB...</span>}
                </label>
                {rabOptions.length > 0 ? (
                  <Select 
                    options={selectOptions} 
                    value={currentVal} 
                    onChange={(val) => handleSelect(index, val)} 
                    styles={customStyles} 
                    placeholder="Ketik untuk mencari pekerjaan..." 
                    isSearchable 
                    menuPortalTarget={document.body} 
                  />
                ) : (
                  <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-200 dark:border-rose-500/20">Pilih proyek & tunggu RAB dimuat.</div>
                )}
                {(!item.rab_item_id) && <textarea rows="2" placeholder="Ketik uraian..." value={item.uraian} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].uraian = e.target.value; setKegiatanItems(newK); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mt-2 shadow-inner text-slate-800 dark:text-white transition-colors" />}
              </div>

              <div className="col-span-12 sm:col-span-6 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> STA Awal</label>
                <input type="text" placeholder="STA 0+000" value={item.sta_awal} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].sta_awal = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white transition-colors" />
              </div>
              <div className="col-span-12 sm:col-span-6 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> STA Akhir</label>
                <input type="text" placeholder="STA 1+200" value={item.sta_akhir} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].sta_akhir = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-white transition-colors" />
              </div>

              <div className="col-span-12 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 block">Volume <span className="text-rose-500">*</span></label>
                    <input type="number" step="any" placeholder="0" value={item.volume} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].volume = e.target.value; setKegiatanItems(newK); }} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center transition-colors" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 text-center block">Sat</label>
                    <input type="text" placeholder="M3" value={item.satuan} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].satuan = e.target.value; setKegiatanItems(newK); }} className={`w-full border rounded-lg px-1 py-1.5 text-[11px] text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-center transition-colors ${item.rab_item_id ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed border-transparent' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} readOnly={!!item.rab_item_id} />
                  </div>
                  <div className="col-span-4">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1.5 text-center block">Persen (%)</label>
                    <input type="number" step="any" placeholder="0.0" value={item.persentase} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].persentase = e.target.value; setKegiatanItems(newK); }} className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-1.5 text-xs text-blue-700 dark:text-blue-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-center transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}