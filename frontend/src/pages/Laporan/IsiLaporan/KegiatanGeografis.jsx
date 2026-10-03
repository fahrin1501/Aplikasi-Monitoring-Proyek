import React from 'react';
import Select from 'react-select';
import { ListTodo, Plus, Trash2, MapPin, CheckCircle2, Target, Loader2 } from 'lucide-react';

const formatKoordTampil = (staString) => {
  if (!staString) return null;
  if (staString.includes(',')) {
    const [lat, long] = staString.split(',');
    return `Lat: ${lat.trim()} | Long: ${long.trim()}`;
  }
  return staString;
};

export default function KegiatanGeografis({ 
  isEditMode, reportData, editForm, setEditForm, 
  rabOptions, isLoadingRab, mingguKe, 
  optionsMingguIni, optionsMingguLain, unscheduledRabOptions 
}) {

  const handleKegiatanSelectEdit = (index, selectedOption) => {
    const newK = [...editForm.activities];
    const selectedRabId = selectedOption ? selectedOption.value : null;

    if (selectedRabId === "manual" || !selectedRabId) {
      newK[index].rab_item_id = null;
      newK[index].uraian = '';
      newK[index].satuan = '';
    } else {
      const selectedRab = rabOptions.find(r => r.id.toString() === selectedRabId.toString());
      if (selectedRab) {
        newK[index].rab_item_id = selectedRab.id;
        newK[index].uraian = selectedRab.uraian;
        newK[index].satuan = selectedRab.satuan || '';
      }
    }
    setEditForm({...editForm, activities: newK});
  };

  const formatGroup = (label, options) => ({
    label,
    options: options.map(opt => ({
      value: opt.id.toString(),
      label: `${opt.uraian_pekerjaan || opt.uraian} (${opt.kategori || opt.kategori_nama})`
    }))
  });

  const selectOptions = [];
  if (optionsMingguIni?.length > 0) selectOptions.push(formatGroup('>>> TARGET MINGGU INI', optionsMingguIni));
  if (optionsMingguLain?.length > 0) selectOptions.push(formatGroup('>>> TARGET MINGGU LAINNYA', optionsMingguLain));
  if (unscheduledRabOptions?.length > 0) selectOptions.push(formatGroup('>>> PEKERJAAN DI LUAR JADWAL (RAB)', unscheduledRabOptions));
  selectOptions.push({ label: 'LAINNYA', options: [{ value: 'manual', label: '+ Pekerjaan Tambah/Kurang (Input Manual)' }] });

  const isFormActive = isEditMode !== false; 
  const activeActivities = isFormActive ? editForm.activities : reportData?.activities || [];

  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${isFormActive ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl p-4 md:p-5 space-y-4 transition-all relative backdrop-blur-sm`}>
      
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2 uppercase tracking-wider">
          <ListTodo className="w-4 h-4 text-amber-500" /> 3. Kegiatan & Posisi Geografis
        </h3>
        {isFormActive && (
          <button 
            type="button" 
            onClick={() => {
              if (editForm.activities.length < 6) {
                setEditForm({...editForm, activities: [...editForm.activities, { id: Date.now(), rab_item_id: null, uraian: '', sta_awal: '', sta_akhir: '', volume: '', satuan: '', persentase: '' }]});
              } else {
                alert("Maksimal 6 Kegiatan.");
              }
            }} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/30 transition-all animate-fade-in shrink-0 z-20 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Kegiatan
          </button>
        )}
      </div>

      {isFormActive ? (
        <div className="space-y-4 mt-2">
           {editForm.activities.map((item, index) => {
              let currentVal = null;
              if (item.rab_item_id) {
                const foundRab = rabOptions.find(r => r.id.toString() === item.rab_item_id.toString());
                if (foundRab) currentVal = { value: item.rab_item_id.toString(), label: `${foundRab.uraian_pekerjaan || foundRab.uraian} (${foundRab.kategori || foundRab.kategori_nama})` };
              } else if (item.rab_item_id === null && item.uraian) {
                currentVal = { value: 'manual', label: '+ Pekerjaan Tambah/Kurang (Input Manual)' };
              }

              return (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start shadow-sm transition-all relative">
                <div className="md:col-span-12 flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Uraian Pekerjaan {index + 1}
                  </span>
                  {editForm.activities.length > 1 && (
                    <button type="button" onClick={() => { const newA = [...editForm.activities]; newA.splice(index,1); setEditForm({...editForm, activities: newA}); }} className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md border border-rose-200 dark:border-rose-500/30 transition-colors hover:bg-rose-500 hover:text-white shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                
                <div className="md:col-span-12 relative z-50">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Pilih dari Jadwal / RAB <span className="text-rose-500">*</span></span>
                    {isLoadingRab && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat RAB...</span>}
                  </label>
                  
                  {rabOptions.length > 0 ? (
                    <div className="relative mb-2 w-full text-slate-800 dark:text-white">
                      <Select
                        options={selectOptions}
                        value={currentVal}
                        onChange={(val) => handleKegiatanSelectEdit(index, val)}
                        placeholder="Ketik untuk mencari pekerjaan..."
                        isSearchable={true}
                        menuPortalTarget={document.body}
                        styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                        noOptionsMessage={() => "Pekerjaan tidak ditemukan"}
                        unstyled
                        classNamePrefix="react-select"
                        classNames={{
                          control: ({ isFocused }) =>
                            `bg-white dark:bg-slate-900 border ${isFocused ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-slate-300 dark:border-slate-600'} rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white shadow-inner transition-colors cursor-pointer w-full flex items-center justify-between`,
                          menu: () =>
                            `absolute w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl mt-1.5 overflow-hidden`,
                          menuList: () =>
                            `max-h-[250px] overflow-y-auto custom-scrollbar p-1`,
                          option: ({ isFocused, isSelected }) =>
                            `px-3 py-2.5 text-xs rounded-lg cursor-pointer transition-colors mb-0.5 ${isSelected ? 'bg-amber-500 text-white font-bold' : isFocused ? 'bg-amber-50 dark:bg-slate-700 text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`,
                          singleValue: () =>
                            `text-slate-800 dark:text-white font-semibold truncate`,
                          input: () =>
                            `text-slate-800 dark:text-white outline-none ring-0 focus:ring-0 m-0 p-0 border-0 bg-transparent`,
                          placeholder: () =>
                            `text-slate-400 font-medium`,
                          groupHeading: () =>
                            `px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-500/10 rounded-md mb-1 mt-2 mx-1`,
                          indicatorSeparator: () => 'hidden',
                          dropdownIndicator: () => 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer',
                          clearIndicator: () => 'text-slate-400 hover:text-rose-500 cursor-pointer'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg mb-2 border border-rose-200 dark:border-rose-500/20 shadow-sm">Pilih proyek terlebih dahulu.</div>
                  )}

                  {(!item.rab_item_id) && (
                    <textarea rows="2" placeholder="Ketik manual uraian pekerjaan..." value={item.uraian} onChange={(e) => { const newK = [...editForm.activities]; newK[index].uraian = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner transition-colors mt-2" />
                  )}
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm relative z-0">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> STA Awal</label>
                  <input type="text" placeholder="-3.3191, 114.5911" value={item.sta_awal} onChange={(e) => { const newK = [...editForm.activities]; newK[index].sta_awal = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm relative z-0">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> STA Akhir</label>
                  <input type="text" placeholder="-3.3215, 114.6102" value={item.sta_akhir} onChange={(e) => { const newK = [...editForm.activities]; newK[index].sta_akhir = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 flex flex-col justify-center shadow-sm relative z-0">
                  <div className="grid grid-cols-12 gap-2 w-full">
                    <div className="col-span-5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Volume <span className="text-rose-500">*</span></label>
                      <input type="number" step="any" required placeholder="0" value={item.volume} onChange={(e) => { const newK = [...editForm.activities]; newK[index].volume = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-center transition-colors" />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">Sat</label>
                      <input type="text" placeholder="M3" value={item.satuan} onChange={(e) => { const newK = [...editForm.activities]; newK[index].satuan = e.target.value; setEditForm({...editForm, activities: newK}); }} className={`w-full border rounded-lg px-1 py-2 text-[11px] font-bold text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors ${item.rab_item_id ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed border-transparent' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} readOnly={!!item.rab_item_id} />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">Persen (%)</label>
                      <input type="number" step="any" placeholder="0.0" value={item.persentase} onChange={(e) => { const newK = [...editForm.activities]; newK[index].persentase = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-xs text-blue-700 dark:text-blue-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-center transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
           );
           })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 text-xs pt-1">
          {activeActivities.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center col-span-1 py-4 italic">Tidak ada kegiatan harian yang terdaftar.</p>
          ) : (
             activeActivities.map((keg, idx) => (
                <div key={idx} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm">
                  <p className="font-bold text-slate-800 dark:text-white text-[13px]">{idx + 1}. {keg.uraian}</p>
                  {(keg.sta_awal || keg.sta_akhir) && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1.5 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 self-start px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      STA: {formatKoordTampil(keg.sta_awal) || '-'} s/d {formatKoordTampil(keg.sta_akhir) || '-'}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center gap-2">
                    <p className="text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800/30">Vol: {keg.volume} {keg.satuan}</p>
                    <p className="text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold px-2 py-1 rounded border border-blue-200 dark:border-blue-800/30">Bobot: {keg.persentase}%</p>
                  </div>
                </div>
             ))
          )}
        </div>
      )}
    </div>
  );
}