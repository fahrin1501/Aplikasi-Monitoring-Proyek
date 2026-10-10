import React from 'react';
import Select from 'react-select';
import { ListTodo, Plus, Trash2, MapPin, Loader2 } from 'lucide-react';

const formatCleanNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  return parseFloat(val);
};

export default function KegiatanGeografisAdd({ 
  kegiatanItems, setKegiatanItems, rabOptions, isLoadingRab, 
  optionsMingguIni, optionsMingguLain, unscheduledRabOptions,
  grandTotalRab, cumulativeActuals
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
  if (unscheduledRabOptions?.length > 0) selectOptions.push(formatGroup('PEKERJAAN DI LUAR JADWAL (RAB)', unscheduledRabOptions));
  selectOptions.push({ label: 'LAINNYA', options: [{ value: 'manual', label: '+ Pekerjaan Manual / Baru' }] });

  const calculatePercentage = (volume, rabItem) => {
    if (!rabItem || !volume || !grandTotalRab || grandTotalRab <= 0) return '';
    const volNum = parseFloat(volume);
    if (isNaN(volNum) || volNum <= 0) return '';
    
    // Jika ini adalah pekerjaan Addendum/Manual yang otomatis terdaftar tapi belum ada harga kontraknya
    if (parseFloat(rabItem.total_harga) === 0 || !rabItem.total_harga) return '0.00';

    const targetVolume = parseFloat(rabItem.volume);
    if (isNaN(targetVolume) || targetVolume <= 0) return '';

    const bobotItem = (parseFloat(rabItem.total_harga) / grandTotalRab) * 100;
    const progress = (volNum / targetVolume) * bobotItem;
    return progress.toFixed(4);
  };

  const handleSelect = (index, option) => {
    const newK = [...kegiatanItems];
    const val = option ? option.value : null;
    
    if (val === "manual" || !val) {
      newK[index].rab_item_id = null; 
      newK[index].uraian = ''; 
      newK[index].satuan = '';
      newK[index].persentase = ''; 
    } else {
      const selectedRab = rabOptions.find(r => r.id.toString() === val.toString());
      if (selectedRab) {
        newK[index].rab_item_id = selectedRab.id;
        newK[index].uraian = selectedRab.uraian_pekerjaan || selectedRab.uraian;
        newK[index].satuan = selectedRab.satuan || '';
        if (newK[index].volume) {
            newK[index].persentase = calculatePercentage(newK[index].volume, selectedRab);
        }
      }
    }
    setKegiatanItems(newK);
  };

  const handleVolumeChange = (index, value) => {
      const newK = [...kegiatanItems];
      newK[index].volume = value;
      if (newK[index].rab_item_id) {
          const selectedRab = rabOptions.find(r => r.id.toString() === newK[index].rab_item_id.toString());
          newK[index].persentase = calculatePercentage(value, selectedRab);
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
          let sisaVolInfo = null;
          let sisaBobotInfo = null;

          if (item.rab_item_id) {
            const foundRab = rabOptions.find(r => r.id.toString() === item.rab_item_id.toString());
            if (foundRab) {
                currentVal = { value: item.rab_item_id.toString(), label: `${foundRab.uraian_pekerjaan || foundRab.uraian} (${foundRab.kategori || foundRab.kategori_nama})` };
                
                if (grandTotalRab > 0 && parseFloat(foundRab.total_harga) > 0) {
                    const targetVol = parseFloat(foundRab.volume || 0);
                    const targetBobot = (parseFloat(foundRab.total_harga || 0) / grandTotalRab) * 100;
                    const accumBobot = parseFloat(cumulativeActuals?.[item.rab_item_id] || 0);
                    const accumVol = targetBobot > 0 ? (accumBobot / targetBobot) * targetVol : 0;
                    
                    const sisaVol = Math.max(0, targetVol - accumVol);
                    const sisaBobot = Math.max(0, targetBobot - accumBobot);

                    sisaVolInfo = `${formatCleanNumber(sisaVol.toFixed(4))} ${foundRab.satuan}`;
                    sisaBobotInfo = `${sisaBobot.toFixed(2)}%`;
                }
            }
          } else if (item.rab_item_id === null && item.uraian !== undefined) {
            currentVal = { value: 'manual', label: '+ Pekerjaan Manual / Baru' };
          }

          return (
            <div key={item.id} className="grid grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start shadow-sm transition-all relative">
              <div className="col-span-12 flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5"><div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Pekerjaan {index + 1}</span>
                {kegiatanItems.length > 1 && <button type="button" onClick={() => setKegiatanItems(kegiatanItems.filter(k => k.id !== item.id))} className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md border border-rose-200 dark:border-rose-500/30 hover:bg-rose-500 hover:text-white transition-colors shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>

              <div className="col-span-12">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Pilih dari Jadwal / RAB <span className="text-rose-500">*</span></span>
                  {isLoadingRab && <span className="text-[9px] text-amber-500 flex gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat RAB...</span>}
                </label>
                
                {rabOptions.length > 0 ? (
                  <div className="relative mb-2 w-full">
                    <Select 
                      options={selectOptions} 
                      value={currentVal} 
                      onChange={(val) => handleSelect(index, val)} 
                      placeholder="Ketik untuk mencari pekerjaan..." 
                      isSearchable 
                      menuPortalTarget={document.body}
                      unstyled
                      classNamePrefix="react-select"
                      classNames={{
                        control: ({ isFocused }) =>
                          `w-full bg-white dark:bg-slate-900 border ${isFocused ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-slate-300 dark:border-slate-600'} rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white shadow-inner transition-colors flex justify-between items-center cursor-pointer`,
                        menu: () =>
                          `absolute bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl mt-1 z-[9999] overflow-hidden w-full`,
                        menuList: () =>
                          `max-h-[250px] overflow-y-auto custom-scrollbar p-1 z-[9999]`,
                        option: ({ isFocused, isSelected }) =>
                          `px-3 py-2.5 text-xs rounded-lg cursor-pointer transition-colors mb-0.5 ${isSelected ? 'bg-amber-500 text-white font-bold' : isFocused ? 'bg-amber-50 dark:bg-slate-700 text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`,
                        singleValue: () =>
                          `text-slate-800 dark:text-white font-semibold truncate`,
                        input: () =>
                          `text-slate-800 dark:text-white outline-none ring-0 focus:ring-0 m-0 p-0`,
                        placeholder: () =>
                          `text-slate-400 font-medium`,
                        groupHeading: () =>
                          `px-2 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-500/10 rounded-md mb-1 mt-2 mx-1`,
                        dropdownIndicator: () => 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer',
                        clearIndicator: () => 'text-slate-400 hover:text-rose-500 cursor-pointer',
                        indicatorSeparator: () => 'hidden'
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg border border-rose-200 dark:border-rose-500/20 mb-2">Pilih proyek & tunggu RAB dimuat.</div>
                )}
                
                {/* Input manual uraian muncul saat pilih "Pekerjaan Manual / Baru" */}
                {(!item.rab_item_id) && (
                  <textarea 
                    rows="2" 
                    placeholder="Ketik manual uraian pekerjaan tambahan..." 
                    value={item.uraian} 
                    onChange={(e) => { const newK = [...kegiatanItems]; newK[index].uraian = e.target.value; setKegiatanItems(newK); }} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none mt-2 shadow-inner transition-colors" 
                  />
                )}
              </div>

              <div className="col-span-12 sm:col-span-6 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative z-0">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> STA Awal</label>
                <input type="text" placeholder="STA 0+000" value={item.sta_awal} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].sta_awal = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>
              <div className="col-span-12 sm:col-span-6 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm relative z-0">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> STA Akhir</label>
                <input type="text" placeholder="STA 1+200" value={item.sta_akhir} onChange={(e) => { const newK = [...kegiatanItems]; newK[index].sta_akhir = e.target.value; setKegiatanItems(newK); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
              </div>

              <div className="col-span-12 bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col justify-center shadow-sm relative z-0">
                <div className="grid grid-cols-12 gap-3 w-full items-end">
                  <div className="col-span-12 sm:col-span-5">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Volume <span className="text-rose-500">*</span></label>
                      {sisaVolInfo && (
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                          Sisa: {sisaVolInfo}
                        </span>
                      )}
                    </div>
                    <input 
                      type="number" 
                      step="any" 
                      placeholder="0" 
                      value={item.volume} 
                      onChange={(e) => handleVolumeChange(index, e.target.value)} 
                      className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-center transition-colors" 
                    />
                  </div>
                  
                  <div className="col-span-12 sm:col-span-3">
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Satuan</label>
                    </div>
                    {/* Jika manual, Satuan bisa diinput. Jika RAB, Satuan dibaca dari DB */}
                    <input 
                      type="text" 
                      placeholder="Contoh: Ls, m3..." 
                      value={item.satuan} 
                      onChange={(e) => { const newK = [...kegiatanItems]; newK[index].satuan = e.target.value; setKegiatanItems(newK); }} 
                      className={`w-full border rounded-lg px-1 py-2 text-[11px] font-bold text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors ${item.rab_item_id ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed border-transparent' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} 
                      readOnly={!!item.rab_item_id} 
                    />
                  </div>

                  <div className="col-span-12 sm:col-span-4 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Persen %</label>
                      {sisaBobotInfo && (
                        <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                          Sisa: {sisaBobotInfo}
                        </span>
                      )}
                    </div>
                    {/* Persentase selalu dibekukan (Read Only) untuk menghindari pengisian persentase palsu */}
                    <input 
                      type="number" 
                      step="any" 
                      placeholder="0.00" 
                      value={item.persentase} 
                      readOnly
                      className="w-full border rounded-lg px-2 py-2 text-xs font-bold text-center focus:outline-none shadow-inner transition-colors bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed border-transparent" 
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Otomatis terhitung dari RAB
                    </div>
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