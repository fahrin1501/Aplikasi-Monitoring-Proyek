import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api'; 
import { ArrowLeft, CheckCircle2, Save, Loader2, AlertCircle, X } from 'lucide-react';

// IMPORT KOMPONEN MODULAR YANG SAMA DENGAN LAPORAN DATA
import InfoPengawasan from './IsiLaporan/InfoPengawasan';
import CuacaLapangan from './IsiLaporan/CuacaLapangan';
import KegiatanGeografis from './IsiLaporan/KegiatanGeografis';
import { PersonilCard, PeralatanCard } from './IsiLaporan/PersonilAlatLaporan';
import { FotoCard, DokumenCard } from './IsiLaporan/LampiranDokumentasi';

export default function AddLaporan() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData || null;

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(editData?.project_id || '');
  
  const [rabOptions, setRabOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingRab, setIsLoadingRab] = useState(false);

  // MENGGUNAKAN STANDAR STATE "editForm" AGAR KOMPATIBEL DENGAN SEMUA KOMPONEN
  const [editForm, setEditForm] = useState({
    tanggal: editData?.tanggalPengawasan || new Date().toISOString().split('T')[0],
    minggu_ke: editData?.minggu_ke || '',
    pengawas: editData?.namaPengawas || '',
    lokasi: editData?.lokasi || '',
    catatan: editData?.catatan || '',
    cuacaItems: [{ id: Date.now(), kondisi: 'Cerah', keterangan: '' }],
    activities: [{ id: Date.now(), rab_item_id: null, uraian: '', sta_awal: '', sta_akhir: '', volume: '', satuan: '', persentase: '' }],
    personnels: [],
    equipments: []
  });

  const [fotoLampiran, setFotoLampiran] = useState([]);
  const [dokumenLampiran, setDokumenLampiran] = useState([]);

  // State Modal (Untuk Personil & Alat)
  const [showPersonilModal, setShowPersonilModal] = useState(false);
  const [personilForm, setPersonilForm] = useState({ id: null, peran: '', jumlah: '', index: null });
  const [showPeralatanModal, setShowPeralatanModal] = useState(false);
  const [peralatanForm, setPeralatanForm] = useState({ id: null, namaAlat: '', jumlah: '', index: null });

  useEffect(() => {
    document.title = "Prisma Group - Input Laporan Harian";
    api.get('/projects-active-report').then(res => setProjects(res.data?.data || []));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) { setRabOptions([]); setScheduleData(null); return; }
    const fetchScheduleAndRAB = async () => {
      setIsLoadingRab(true);
      try {
        const res = await api.get(`/projects/${selectedProjectId}/schedules`);
        setScheduleData(res.data.data);
        setEditForm(prev => ({ ...prev, minggu_ke: '' }));

        const flattenedItems = [];
        res.data.data.rab_data.forEach(kat => {
          kat.items.forEach(item => {
            if (!item.is_subheader) flattenedItems.push({ id: item.id, uraian: item.uraian_pekerjaan, satuan: item.satuan, kategori_nama: kat.nama_kategori });
          });
        });
        setRabOptions(flattenedItems);
      } catch (error) {} finally { setIsLoadingRab(false); }
    };
    fetchScheduleAndRAB();
  }, [selectedProjectId]);

  const availableWeeks = scheduleData?.schedules ? [...new Set(scheduleData.schedules.map(s => parseInt(s.minggu_ke)))].sort((a, b) => a - b) : [];

  let optionsMingguIni = []; let optionsMingguLain = []; let scheduledItemsMap = new Map();
  if (scheduleData && scheduleData.schedules) {
    scheduleData.schedules.forEach(sched => {
      let detailItem = null; let namaKategori = '';
      scheduleData.rab_data.forEach(cat => {
        const itemMatch = cat.items.find(i => i.id === sched.rab_item_id);
        if (itemMatch) { detailItem = itemMatch; namaKategori = cat.nama_kategori; }
      });
      if (detailItem) {
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(editForm.minggu_ke);
        if (!scheduledItemsMap.has(sched.rab_item_id)) scheduledItemsMap.set(sched.rab_item_id, { ...detailItem, kategori: namaKategori, is_this_week: isThisWeek });
        else if (isThisWeek) scheduledItemsMap.get(sched.rab_item_id).is_this_week = true;
      }
    });
    scheduledItemsMap.forEach(value => value.is_this_week ? optionsMingguIni.push(value) : optionsMingguLain.push(value));
  }
  const unscheduledRabOptions = rabOptions.filter(opt => !scheduledItemsMap.has(opt.id));

  // Fungsi Upload Lokal (Hanya menyimpan di state array)
  const handleUploadFile = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'foto') setFotoLampiran([...fotoLampiran, ...files]);
    else setDokumenLampiran([...dokumenLampiran, ...files]);
  };
  const handleDeleteFile = (idx, type) => {
    if (type === 'foto') setFotoLampiran(fotoLampiran.filter((_, i) => i !== idx));
    else setDokumenLampiran(dokumenLampiran.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProjectId) return alert("Pilih Proyek terlebih dahulu.");
    if (!editForm.minggu_ke) return alert("Pilih Minggu Ke- laporan ini.");
    setSubmitting(true); setErrorMsg('');
    
    try {
      const payload = new FormData();
      payload.append('tanggal', editForm.tanggal);
      payload.append('minggu_ke', editForm.minggu_ke); 
      payload.append('pengawas', editForm.pengawas);
      payload.append('lokasi', editForm.lokasi);
      payload.append('catatan', editForm.catatan); 
      
      const cuacaGabungan = editForm.cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | ');
      payload.append('cuaca', cuacaGabungan);
      payload.append('kondisi_cuaca', JSON.stringify(editForm.cuacaItems));
      payload.append('kegiatan', JSON.stringify(editForm.activities));
      payload.append('personil', JSON.stringify(editForm.personnels));
      payload.append('peralatan', JSON.stringify(editForm.equipments));

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

  // --- Modal Helpers ---
  const openPersonilModal = (item = null, index = null) => {
    if (item) setPersonilForm({ id: item.id || Date.now(), peran: item.peran, jumlah: item.jumlah, index: index });
    else setPersonilForm({ id: Date.now(), peran: '', jumlah: '', index: null });
    setShowPersonilModal(true);
  };
  const savePersonil = (e) => {
    e.preventDefault();
    const newArr = [...editForm.personnels];
    if (personilForm.index !== null) newArr[personilForm.index] = { id: personilForm.id, peran: personilForm.peran, jumlah: personilForm.jumlah };
    else newArr.push({ id: personilForm.id, peran: personilForm.peran, jumlah: personilForm.jumlah });
    setEditForm({...editForm, personnels: newArr}); setShowPersonilModal(false);
  };

  const openPeralatanModal = (item = null, index = null) => {
    if (item) setPeralatanForm({ id: item.id || Date.now(), namaAlat: item.nama_alat || item.namaAlat, jumlah: item.jumlah, index: index });
    else setPeralatanForm({ id: Date.now(), namaAlat: '', jumlah: '', index: null });
    setShowPeralatanModal(true);
  };
  const savePeralatan = (e) => {
    e.preventDefault();
    const newArr = [...editForm.equipments];
    if (peralatanForm.index !== null) newArr[peralatanForm.index] = { id: peralatanForm.id, nama_alat: peralatanForm.namaAlat, jumlah: peralatanForm.jumlah };
    else newArr.push({ id: peralatanForm.id, nama_alat: peralatanForm.namaAlat, jumlah: peralatanForm.jumlah });
    setEditForm({...editForm, equipments: newArr}); setShowPeralatanModal(false);
  };

  // Dummy report data untuk memalsukan struktur agar LampiranCard & InfoPengawasan bisa berjalan di mode Edit Form
  const dummyReportData = { 
    project: projects.find(p => p.id === selectedProjectId), 
    attachments: [
      ...fotoLampiran.map(f => ({ tipe: 'foto', nama_file: f.name })),
      ...dokumenLampiran.map(d => ({ tipe: 'dokumen', nama_file: d.name }))
    ]
  };

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">
      <datalist id="peran-options"><option value="Pekerja"/><option value="Tukang"/><option value="Mandor"/><option value="Operator"/><option value="Surveyor"/></datalist>
      <datalist id="alat-options"><option value="Excavator"/><option value="Dump Truck"/><option value="Concrete Mixer"/><option value="Theodolith"/></datalist>

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

      {/* CUSTOM PROJECT SELECTOR KHUSUS ADD LAPORAN */}
      <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1.5">
        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Pilih Proyek yang Diawasi <span className="text-rose-500">*</span></label>
        <select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-xs font-semibold focus:ring-2 focus:ring-amber-500">
           <option value="" disabled>-- Klik di sini untuk memilih Proyek --</option>
           {projects.map(p => <option key={p.id} value={p.id}>{p.nama_proyek} (SPK: {p.kode_kontrak || '-'})</option>)}
        </select>
      </div>

      {selectedProjectId && (
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          <InfoPengawasan isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} availableWeeks={availableWeeks} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
            <CuacaLapangan isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} />
            <div className="bg-white dark:bg-slate-800/60 border border-blue-400/60 ring-2 ring-blue-500/10 p-4 md:p-5 rounded-2xl flex flex-col h-full shadow-sm">
               <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3">Catatan Tambahan</h3>
               <textarea name="catatan" value={editForm.catatan} onChange={(e) => setEditForm({...editForm, catatan: e.target.value})} placeholder="Tuliskan catatan khusus..." className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-xs focus:ring-2 focus:ring-amber-500 resize-none shadow-inner" />
            </div>
          </div>

          <KegiatanGeografis 
            isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm}
            rabOptions={rabOptions} isLoadingRab={isLoadingRab} mingguKe={editForm.minggu_ke}
            optionsMingguIni={optionsMingguIni} optionsMingguLain={optionsMingguLain} unscheduledRabOptions={unscheduledRabOptions}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
            <PersonilCard isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} openPersonilModal={openPersonilModal} />
            <PeralatanCard isEditMode={true} reportData={dummyReportData} editForm={editForm} setEditForm={setEditForm} openPeralatanModal={openPeralatanModal} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
            <FotoCard isEditMode={true} reportData={dummyReportData} handleUploadFile={handleUploadFile} handleDeleteFile={(id) => handleDeleteFile(id, 'foto')} />
            <DokumenCard isEditMode={true} reportData={dummyReportData} handleUploadFile={handleUploadFile} handleDeleteFile={(id) => handleDeleteFile(id, 'dokumen')} />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
            <button type="button" onClick={() => navigate('/laporan')} className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm text-xs"><X className="w-4 h-4 inline mr-2" /> Batal</button>
            <button type="submit" disabled={submitting} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-md text-xs disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <CheckCircle2 className="w-4 h-4 inline mr-2" />} Simpan Laporan Harian
            </button>
          </div>
        </form>
      )}

      {/* MODALS */}
      {showPersonilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50"><h3 className="font-bold">Form Personil</h3><button onClick={() => setShowPersonilModal(false)}><X className="w-5 h-5"/></button></div>
            <form onSubmit={savePersonil}>
              <div className="p-5 space-y-4">
                <input type="text" required list="peran-options" value={personilForm.peran} onChange={(e) => setPersonilForm({...personilForm, peran: e.target.value})} placeholder="Jabatan" className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs" />
                <input type="number" required min="1" value={personilForm.jumlah} onChange={(e) => setPersonilForm({...personilForm, jumlah: e.target.value})} placeholder="Jumlah Orang" className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs" />
              </div>
              <div className="p-4 border-t flex justify-end gap-3"><button type="submit" className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl">Simpan Personil</button></div>
            </form>
          </div>
        </div>
      )}

      {showPeralatanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50"><h3 className="font-bold">Form Peralatan</h3><button onClick={() => setShowPeralatanModal(false)}><X className="w-5 h-5"/></button></div>
            <form onSubmit={savePeralatan}>
              <div className="p-5 space-y-4">
                <input type="text" required list="alat-options" value={peralatanForm.namaAlat} onChange={(e) => setPeralatanForm({...peralatanForm, namaAlat: e.target.value})} placeholder="Nama Alat" className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs" />
                <input type="number" required min="1" value={peralatanForm.jumlah} onChange={(e) => setPeralatanForm({...peralatanForm, jumlah: e.target.value})} placeholder="Jumlah Unit" className="w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs" />
              </div>
              <div className="p-4 border-t flex justify-end gap-3"><button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">Simpan Alat</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}