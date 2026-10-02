import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 
import { ArrowLeft, CheckCircle2, Save, Loader2, AlertCircle, X } from 'lucide-react';

// IMPORT KOMPONEN MODULAR BARU
import InfoPengawasanAdd from './KomponenAddLaporan/InfoPengawasanAdd';
import CuacaCatatanAdd from './KomponenAddLaporan/CuacaCatatanAdd';
import KegiatanGeografisAdd from './KomponenAddLaporan/KegiatanGeografisAdd';
import PersonilAlatLampiranAdd from './KomponenAddLaporan/PersonilAlatLampiranAdd';

export default function AddLaporan() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // STATE API DATA
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [rabOptions, setRabOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingRab, setIsLoadingRab] = useState(false);

  // STATE FORM TERPISAH
  const [formData, setFormData] = useState({ tanggalPengawasan: new Date().toISOString().split('T')[0], minggu_ke: '', namaPengawas: '', lokasi: '', catatan: '' });
  const [cuacaItems, setCuacaItems] = useState([{ id: Date.now(), kondisi: 'Cerah', keterangan: '' }]);
  const [kegiatanItems, setKegiatanItems] = useState([{ id: Date.now(), rab_item_id: null, uraian: '', sta_awal: '', sta_akhir: '', volume: '', satuan: '', persentase: '' }]);
  const [personilItems, setPersonilItems] = useState([]);
  const [peralatanItems, setPeralatanItems] = useState([]);
  const [fotoLampiran, setFotoLampiran] = useState([]);
  const [dokumenLampiran, setDokumenLampiran] = useState([]);

  useEffect(() => {
    document.title = "Prisma Group - Input Laporan Harian";
    api.get('/projects-active-report').then(res => setProjects(res.data?.data || [])).finally(() => setIsLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) { setRabOptions([]); setScheduleData(null); return; }
    setIsLoadingRab(true);
    api.get(`/projects/${selectedProjectId}/schedules`).then(res => {
      setScheduleData(res.data.data);
      setFormData(prev => ({ ...prev, minggu_ke: '' }));
      const flattened = [];
      res.data.data.rab_data.forEach(kat => kat.items.forEach(item => {
        if (!item.is_subheader) flattened.push({ id: item.id, uraian: item.uraian_pekerjaan, satuan: item.satuan, kategori_nama: kat.nama_kategori });
      }));
      setRabOptions(flattened);
    }).finally(() => setIsLoadingRab(false));
  }, [selectedProjectId]);

  const availableWeeks = scheduleData?.schedules ? [...new Set(scheduleData.schedules.map(s => parseInt(s.minggu_ke)))].sort((a, b) => a - b) : [];
  let optionsMingguIni = []; let optionsMingguLain = []; let scheduledItemsMap = new Map();
  
  if (scheduleData && scheduleData.schedules) {
    scheduleData.schedules.forEach(sched => {
      let detailItem = null; let namaKategori = '';
      scheduleData.rab_data.forEach(cat => { const itemMatch = cat.items.find(i => i.id === sched.rab_item_id); if (itemMatch) { detailItem = itemMatch; namaKategori = cat.nama_kategori; } });
      if (detailItem) {
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(formData.minggu_ke);
        if (!scheduledItemsMap.has(sched.rab_item_id)) scheduledItemsMap.set(sched.rab_item_id, { ...detailItem, kategori: namaKategori, is_this_week: isThisWeek });
        else if (isThisWeek) scheduledItemsMap.get(sched.rab_item_id).is_this_week = true;
      }
    });
    scheduledItemsMap.forEach(value => value.is_this_week ? optionsMingguIni.push(value) : optionsMingguLain.push(value));
  }
  const unscheduledRabOptions = rabOptions.filter(opt => !scheduledItemsMap.has(opt.id));

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return alert("Pilih Proyek terlebih dahulu.");
    if (!formData.minggu_ke) return alert("Pilih Minggu Ke- laporan ini.");
    setSubmitting(true); setErrorMsg('');
    
    try {
      const payload = new FormData();
      payload.append('tanggal', formData.tanggalPengawasan);
      payload.append('minggu_ke', formData.minggu_ke); 
      payload.append('pengawas', formData.namaPengawas);
      payload.append('lokasi', formData.lokasi);
      payload.append('catatan', formData.catatan); 
      
      payload.append('cuaca', cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | '));
      payload.append('kondisi_cuaca', JSON.stringify(cuacaItems));
      payload.append('kegiatan', JSON.stringify(kegiatanItems));
      payload.append('personil', JSON.stringify(personilItems));
      payload.append('peralatan', JSON.stringify(peralatanItems));

      fotoLampiran.forEach(file => payload.append('foto[]', file));
      dokumenLampiran.forEach(file => payload.append('lampiran[]', file));

      await api.post(`/projects/${selectedProjectId}/daily-reports`, payload, { headers: { 'Content-Type': 'multipart/form-data' }});
      setSubmittedSuccess(true);
      setTimeout(() => navigate('/laporan'), 1500); 
    } catch (error) {
      setErrorMsg("Gagal menyimpan laporan. Silakan periksa kembali data Anda.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button onClick={() => navigate('/laporan')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white">Input Laporan Harian Baru</h1>
            <p className="text-xs text-slate-500 mt-1">Entri data pengawasan cuaca, personil, peralatan, dan rincian pekerjaan</p>
          </div>
        </div>
      </div>

      {errorMsg && <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-600 text-xs font-medium shadow-sm"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{errorMsg}</span></div>}
      {submittedSuccess && <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-600 text-xs shadow-sm"><CheckCircle2 className="w-5 h-5 shrink-0" /><span>Laporan berhasil dikirim! Mengalihkan...</span></div>}

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        
        <InfoPengawasanAdd 
          projects={projects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} 
          isLoadingProjects={isLoadingProjects} formData={formData} handleInputChange={handleInputChange} availableWeeks={availableWeeks} 
        />

        {selectedProjectId && (
          <>
            <CuacaCatatanAdd cuacaItems={cuacaItems} setCuacaItems={setCuacaItems} formData={formData} handleInputChange={handleInputChange} />
            <KegiatanGeografisAdd 
              kegiatanItems={kegiatanItems} setKegiatanItems={setKegiatanItems} rabOptions={rabOptions} isLoadingRab={isLoadingRab}
              optionsMingguIni={optionsMingguIni} optionsMingguLain={optionsMingguLain} unscheduledRabOptions={unscheduledRabOptions}
            />
            <PersonilAlatLampiranAdd 
              personilItems={personilItems} setPersonilItems={setPersonilItems} peralatanItems={peralatanItems} setPeralatanItems={setPeralatanItems}
              fotoLampiran={fotoLampiran} setFotoLampiran={setFotoLampiran} dokumenLampiran={dokumenLampiran} setDokumenLampiran={setDokumenLampiran}
            />

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
              <button type="button" onClick={() => navigate('/laporan')} className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm text-xs"><X className="w-4 h-4 inline mr-2" /> Batal</button>
              <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-md text-xs disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <CheckCircle2 className="w-4 h-4 inline mr-2" />} Simpan Laporan Harian
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}