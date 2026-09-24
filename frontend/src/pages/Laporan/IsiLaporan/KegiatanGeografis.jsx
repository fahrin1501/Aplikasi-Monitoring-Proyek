import React from 'react';
import { ListTodo, Plus, Trash2, MapPin, CheckCircle2, Target, Loader2, ChevronDown } from 'lucide-react';

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

  const handleKegiatanSelectEdit = (index, selectedRabId) => {
    const newK = [...editForm.activities];
    if (selectedRabId === "manual") {
      newK[index].rab_item_id = null;
      newK[index].uraian = '';
      newK[index].satuan = '';
    } else {
      const selectedRab = rabOptions.find(r => r.id.toString() === selectedRabId);
      if (selectedRab) {
        newK[index].rab_item_id = selectedRab.id;
        newK[index].uraian = selectedRab.uraian;
        newK[index].satuan = selectedRab.satuan || '';
      }
    }
    setEditForm({...editForm, activities: newK});
  };

  const activeActivities = isEditMode ? editForm.activities : reportData.activities;

  return (
    <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl p-4 md:p-5 space-y-4 transition-all relative backdrop-blur-sm`}>
      
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2 uppercase tracking-wider">
          <ListTodo className="w-4 h-4 text-amber-500" /> 3. Kegiatan & Posisi Geografis
        </h3>
        {isEditMode && (
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

      {isEditMode ? (
        <div className="space-y-4 mt-2">
           {editForm.activities.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start shadow-sm transition-all">
                <div className="md:col-span-12 flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Uraian Pekerjaan {index + 1}
                  </span>
                  {editForm.activities.length > 1 && (
                    <button type="button" onClick={() => { const newA = [...editForm.activities]; newA.splice(index,1); setEditForm({...editForm, activities: newA}); }} className="text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-md border border-rose-200 dark:border-rose-500/30 transition-colors hover:bg-rose-500 hover:text-white shadow-sm"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                
                <div className="md:col-span-12">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Pilih dari Jadwal / RAB <span className="text-rose-500">*</span></span>
                    {isLoadingRab && <span className="text-[9px] text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Memuat RAB...</span>}
                  </label>
                  
                  {rabOptions.length > 0 ? (
                    <div className="relative mb-2">
                      <select
                        value={item.rab_item_id || (item.rab_item_id === null ? "manual" : "")}
                        onChange={(e) => handleKegiatanSelectEdit(index, e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner truncate pr-10"
                      >
                        <option value="" disabled>-- Pilih Pekerjaan Terjadwal --</option>
                        {optionsMingguIni.length > 0 && <optgroup label={`>>> TARGET MINGGU INI`}>{optionsMingguIni.map(opt => <option key={opt.id} value={opt.id}>{opt.uraian_pekerjaan} ({opt.kategori})</option>)}</optgroup>}
                        {optionsMingguLain.length > 0 && <optgroup label=">>> TARGET MINGGU LAINNYA">{optionsMingguLain.map(opt => <option key={opt.id} value={opt.id}>{opt.uraian_pekerjaan} ({opt.kategori})</option>)}</optgroup>}
                        {unscheduledRabOptions.length > 0 && <optgroup label=">>> PEKERJAAN DI LUAR JADWAL (RAB TERDAFTAR)">{unscheduledRabOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.kategori_nama} - {opt.uraian}</option>)}</optgroup>}
                        <option value="manual">+ Pekerjaan Tambah/Kurang (Input Manual)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="text-[10px] text-rose-500 bg-rose-50 dark:bg-rose-500/10 p-2 rounded-lg mb-2 border border-rose-200 dark:border-rose-500/20 shadow-sm">Time Schedule belum dibuat.</div>
                  )}

                  {(item.rab_item_id === null || rabOptions.length === 0) && (
                    <textarea rows="2" placeholder="Ketik manual uraian pekerjaan..." value={item.uraian} onChange={(e) => { const newK = [...editForm.activities]; newK[index].uraian = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner transition-colors" />
                  )}
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> Titik Awal (STA Awal)</label>
                  <input type="text" placeholder="-3.3191, 114.5911" value={item.sta_awal} onChange={(e) => { const newK = [...editForm.activities]; newK[index].sta_awal = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 shadow-sm">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-indigo-500"/> Titik Akhir (STA Akhir)</label>
                  <input type="text" placeholder="-3.3215, 114.6102" value={item.sta_akhir} onChange={(e) => { const newK = [...editForm.activities]; newK[index].sta_akhir = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-[11px] font-mono font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
                </div>
                
                <div className="md:col-span-12 lg:col-span-4 border border-slate-200 dark:border-slate-700/60 p-3.5 rounded-xl bg-white dark:bg-slate-800/80 flex flex-col justify-center shadow-sm">
                  <div className="grid grid-cols-12 gap-2 w-full">
                    <div className="col-span-5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">Volume <span className="text-rose-500">*</span></label>
                      <input type="number" step="any" required placeholder="0" value={item.volume} onChange={(e) => { const newK = [...editForm.activities]; newK[index].volume = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2 py-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner text-center" />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">Sat</label>
                      <input type="text" placeholder="M3" value={item.satuan} onChange={(e) => { const newK = [...editForm.activities]; newK[index].satuan = e.target.value; setEditForm({...editForm, activities: newK}); }} className={`w-full border rounded-lg px-1 py-2 text-[11px] font-bold text-slate-800 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner ${item.rab_item_id ? 'bg-slate-200 dark:bg-slate-700 cursor-not-allowed border-transparent' : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600'}`} readOnly={!!item.rab_item_id} />
                    </div>
                    <div className="col-span-4">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block text-center">Persen (%)</label>
                      <input type="number" step="any" placeholder="0.0" value={item.persentase} onChange={(e) => { const newK = [...editForm.activities]; newK[index].persentase = e.target.value; setEditForm({...editForm, activities: newK}); }} className="w-full bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-600 rounded-lg px-2 py-2 text-xs text-blue-700 dark:text-blue-400 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner text-center" />
                    </div>
                  </div>
                </div>
              </div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 text-xs pt-1">
          {activeActivities.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center col-span-1 py-4 italic">Tidak ada kegiatan harian yang terdaftar.</p>
          ) : (
            activeActivities.map((keg, idx) => (
              <div key={idx} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/60 rounded-xl group transition-colors hover:border-slate-300 dark:hover:border-slate-600 relative shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 pr-16">
                    <span className="flex-shrink-0 w-6 h-6 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shadow-sm">
                      {idx + 1}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed font-bold text-[13px]">{keg.uraian}</p>
                  </div>
                </div>
                
                <div className="ml-9 mt-3 flex flex-wrap items-center gap-3">
                  {(keg.sta_awal || keg.sta_akhir) && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700/80 shadow-sm text-[10px] w-full sm:w-auto">
                      {keg.sta_awal && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> 
                          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Awal:</span> 
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatKoordTampil(keg.sta_awal)}</span>
                        </div>
                      )}
                      {keg.sta_awal && keg.sta_akhir && <div className="hidden sm:block w-px h-3 bg-slate-300 dark:bg-slate-600"></div>}
                      {keg.sta_akhir && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> 
                          <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">Akhir:</span> 
                          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{formatKoordTampil(keg.sta_akhir)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {keg.volume && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 px-3 py-2 rounded-lg text-[10px] shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">Tercapai:</span> 
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{Number(keg.volume)} {keg.satuan}</span>
                    </div>
                  )}
                  {(keg.persentase !== null && keg.persentase !== undefined && keg.persentase !== '') && (
                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 px-3 py-2 rounded-lg text-[10px] shadow-sm">
                      <Target className="w-3.5 h-3.5 text-blue-500" /> 
                      <span className="text-blue-700 dark:text-blue-400 font-bold uppercase">Persentase:</span> 
                      <span className="font-bold text-blue-600 dark:text-blue-400">{Number(keg.persentase)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}