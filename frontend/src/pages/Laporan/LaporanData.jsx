import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Download, Edit3, Copy, Clock, 
  CheckCircle2, Save, X, Loader2, Trash2, FileSpreadsheet 
} from 'lucide-react';

// IMPORT KOMPONEN TERPISAH
import InfoPengawasan from './IsiLaporan/InfoPengawasan';
import CuacaLapangan from './IsiLaporan/CuacaLapangan';
import KegiatanGeografis from './IsiLaporan/KegiatanGeografis';
import PersonilAlatLaporan from './IsiLaporan/PersonilAlatLaporan';
import LampiranDokumentasi from './IsiLaporan/LampiranDokumentasi';

export default function LaporanData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 

  const initialData = location.state?.laporan;
  const reportId = id || initialData?.id || initialData?.originalData?.id;

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rabOptions, setRabOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoadingRab, setIsLoadingRab] = useState(false);
  
  const [editForm, setEditForm] = useState({
    tanggal: '', minggu_ke: '', pengawas: '', lokasi: '',
    cuacaItems: [], activities: [], personnels: [], equipments: []
  });
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [showPersonilModal, setShowPersonilModal] = useState(false);
  const [personilForm, setPersonilForm] = useState({ id: null, peran: '', jumlah: '', index: null });
  const [showPeralatanModal, setShowPeralatanModal] = useState(false);
  const [peralatanForm, setPeralatanForm] = useState({ id: null, namaAlat: '', jumlah: '', index: null });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    document.title = "Prisma Group - Data Laporan";
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try { setUserRole(JSON.parse(userDataStr).role || 'Tamu'); } catch (error) {}
    }
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const canVerify = ['Administrator', 'Direktur', 'Team Leader', 'Owner / PPK'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  const fetchReport = async () => {
    try {
      const res = await api.get(`/daily-reports/${reportId}`);
      const data = res.data.data;
      setReportData(data);

      if (data.project_id) {
         setIsLoadingRab(true);
         const schedRes = await api.get(`/projects/${data.project_id}/schedules`);
         setScheduleData(schedRes.data.data);

         const flattenedItems = [];
         schedRes.data.data.rab_data.forEach(kategori => {
           kategori.items.forEach(item => {
             if (!item.is_subheader) {
               flattenedItems.push({ id: item.id, uraian: item.uraian_pekerjaan, satuan: item.satuan, kategori_nama: kategori.nama_kategori });
             }
           });
         });
         setRabOptions(flattenedItems);
         setIsLoadingRab(false);
      }
    } catch (error) {
      console.error("Gagal memuat laporan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) fetchReport();
  }, [reportId]);

  const toggleEditMode = () => {
    if (!isEditMode) {
      let parsedCuaca = [{ id: Date.now(), kondisi: 'Cerah', keterangan: reportData.cuaca || '' }];
      try {
        if (reportData.kondisi_cuaca && reportData.kondisi_cuaca.startsWith('[')) {
          parsedCuaca = JSON.parse(reportData.kondisi_cuaca);
        } else if (reportData.cuaca) {
          if (reportData.cuaca.includes(' | ')) {
             const parts = reportData.cuaca.split(' | ');
             parsedCuaca = parts.map((part, i) => {
               const cuacaOpts = ['Cerah', 'Berawan', 'Hujan Gerimis', 'Hujan Lebat'];
               let kondisi = 'Cerah'; let ket = part;
               for (const opt of cuacaOpts) {
                 if (part.startsWith(opt)) {
                   kondisi = opt; ket = part.replace(opt, '').trim();
                   if (ket.startsWith('(') && ket.endsWith(')')) ket = ket.substring(1, ket.length - 1);
                   break;
                 }
               }
               return { id: Date.now() + i, kondisi, keterangan: ket };
             });
          } else {
            const cuacaOpts = ['Cerah', 'Berawan', 'Hujan Gerimis', 'Hujan Lebat'];
            for (const opt of cuacaOpts) {
              if (reportData.cuaca.startsWith(opt)) {
                parsedCuaca[0].kondisi = opt;
                let ket = reportData.cuaca.replace(opt, '').trim();
                if (ket.startsWith('(') && ket.endsWith(')')) ket = ket.substring(1, ket.length - 1);
                else if (ket.startsWith('- ')) ket = ket.replace('- ', '');
                parsedCuaca[0].keterangan = ket;
                break;
              }
            }
          }
        }
      } catch(e) {}

      setEditForm({
        tanggal: reportData.tanggal,
        minggu_ke: reportData.minggu_ke || '',
        pengawas: reportData.pengawas,
        lokasi: reportData.lokasi,
        cuacaItems: parsedCuaca,
        activities: JSON.parse(JSON.stringify(reportData.activities || [])).map(act => ({
          ...act, persentase: act.persentase || ''
        })),
        personnels: JSON.parse(JSON.stringify(reportData.personnels || [])),
        equipments: JSON.parse(JSON.stringify(reportData.equipments || [])),
      });
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const cuacaGabungan = editForm.cuacaItems.map(c => c.keterangan ? `${c.kondisi} (${c.keterangan})` : c.kondisi).join(' | ');
      const payload = {
        tanggal: editForm.tanggal,
        minggu_ke: editForm.minggu_ke,
        pengawas: editForm.pengawas,
        lokasi: editForm.lokasi,
        cuaca: cuacaGabungan, 
        kondisi_cuaca: JSON.stringify(editForm.cuacaItems), 
        kegiatan: JSON.stringify(editForm.activities),
        personil: JSON.stringify(editForm.personnels),
        peralatan: JSON.stringify(editForm.equipments),
      };

      await api.put(`/daily-reports/${reportId}`, payload);
      setIsEditMode(false);
      fetchReport(); 
      alert("Draf Perubahan berhasil disimpan! (Status laporan kembali menjadi Pending)");
    } catch (error) {
      alert("Gagal menyimpan perubahan. Periksa koneksi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyLaporan = async () => {
    const confirmVerif = window.confirm("Apakah Anda yakin ingin menyetujui laporan ini? \n\nData volume yang disetujui akan permanen dan langsung masuk ke hitungan realisasi Kurva S.");
    if (!confirmVerif) return;
    try {
      await api.put(`/daily-reports/${reportId}/verify`);
      alert("Laporan berhasil disetujui!");
      fetchReport(); 
    } catch (error) {
      alert("Terjadi kesalahan saat memverifikasi laporan.");
    }
  };

  // --- FIX: MENGAMBIL NILAI MINGGU KE- BERDASARKAN MODE ---
  const currentMingguKe = isEditMode ? editForm.minggu_ke : reportData?.minggu_ke;

  // LOGIKA PENGELOMPOKAN URAIAN PEKERJAAN
  let optionsMingguIni = [];
  let optionsMingguLain = [];
  let scheduledItemsMap = new Map();

  if (scheduleData && scheduleData.schedules) {
    scheduleData.schedules.forEach(sched => {
      let detailItem = null;
      let namaKategori = '';
      scheduleData.rab_data.forEach(cat => {
        const itemMatch = cat.items.find(i => i.id === sched.rab_item_id);
        if (itemMatch) { detailItem = itemMatch; namaKategori = cat.nama_kategori; }
      });

      if (detailItem) {
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(currentMingguKe);
        if (!scheduledItemsMap.has(sched.rab_item_id)) {
          scheduledItemsMap.set(sched.rab_item_id, { ...detailItem, kategori: namaKategori, is_this_week: isThisWeek });
        } else if (isThisWeek) {
          scheduledItemsMap.get(sched.rab_item_id).is_this_week = true;
        }
      }
    });

    scheduledItemsMap.forEach(value => {
      if (value.is_this_week) optionsMingguIni.push(value);
      else optionsMingguLain.push(value);
    });
  }

  const unscheduledRabOptions = rabOptions.filter(opt => !scheduledItemsMap.has(opt.id));

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
    setEditForm({...editForm, personnels: newArr});
    setShowPersonilModal(false);
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
    setEditForm({...editForm, equipments: newArr});
    setShowPeralatanModal(false);
  };

  const handleUploadFile = async (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(f => {
      if (type === 'foto') formData.append('foto[]', f);
      else formData.append('lampiran[]', f);
    });
    e.target.value = null;
    try {
      await api.post(`/daily-reports/${reportId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchReport();
    } catch (error) { alert("Gagal mengunggah file."); }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Yakin ingin menghapus file ini?")) return;
    try { await api.delete(`/daily-report-attachments/${fileId}`); fetchReport(); } catch (error) { alert("Gagal menghapus file."); }
  };

  const handleDeleteReport = async () => {
    try { await api.delete(`/daily-reports/${reportId}`); alert("Laporan berhasil dihapus permanen."); navigate('/laporan'); } catch (error) { alert("Gagal menghapus laporan."); }
  };

  const handleCopyText = () => {
    if (!reportData) return;
    const dateObj = new Date(reportData.tanggal);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('id-ID', options);

    let pekerjaanText = reportData.activities?.length ? reportData.activities.map((act, idx) => `${idx + 1}. ${act.uraian} (${act.volume} ${act.satuan}) ${act.persentase ? `[${Number(act.persentase)}%]` : ''}`).join('\n') : "1. Tidak Ada Pekerjaan";
    let manpowerText = reportData.personnels?.length ? reportData.personnels.map((p, idx) => `${idx + 1}. ${p.peran} = ${p.jumlah} org`).join('\n') : "1. Tidak Ada Pekerja = -";
    let alatText = reportData.equipments?.length ? reportData.equipments.map((e, idx) => `${idx + 1}. ${e.nama_alat} = ${e.jumlah} Unit`).join('\n') : "1. Tidak Ada Alat = -";

    const textToCopy = `*Daily Report ${formattedDate}*\n\n*PENGAWASAN TEKNIS ${(reportData.project?.nama_proyek || 'NAMA PROYEK').toUpperCase()}*\n\nPekerjaan :\n${pekerjaanText}\n\nMANPOWER :\n${manpowerText}\n\nAlat : \n${alatText}\n\nCuaca Harian : \n${reportData.cuaca || '-'}\n           \nJam Kerja : -\n \nCatatan : \n* -`;
    navigator.clipboard.writeText(textToCopy).then(() => alert("Teks Laporan berhasil disalin ke Clipboard! Silakan paste di WhatsApp.")).catch(() => alert("Gagal menyalin text."));
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const response = await api.get(`/daily-reports/${reportId}/export/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Laporan_Harian_${reportData.tanggal}.xlsx`); document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert("Gagal mengunduh file Excel."); } finally { setIsExportingExcel(false); }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const response = await api.get(`/daily-reports/${reportId}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Laporan_Harian_${reportData.tanggal}.pdf`); document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert("Gagal mengunduh file PDF."); } finally { setIsExportingPdf(false); }
  };

  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';
  const getDocUrl = (path) => {
    if (!path) return '#';
    return path.startsWith('http') ? path : `${BASE_URL}/${path.replace(/^\//, '')}`;
  };

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>;
  if (!reportData) return <div className="p-10 text-center dark:text-white">Data Tidak Ditemukan.</div>;

  const displayStatus = (isGuest && reportData.status === 'rejected') ? 'pending' : (reportData.status || 'pending');

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">

      {/* --- TOP HEADER / ACTION BAR --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button onClick={() => navigate('/laporan')} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-tight flex items-center gap-2">
                Detail Laporan Harian
                {isEditMode && <span className="px-2 py-0.5 ml-1 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 font-extrabold tracking-wider">DRAFT MODE</span>}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-mono font-bold">LAP/{reportData.tanggal.replace(/-/g, '/')}/00{reportData.id}</p>
              
              {!isEditMode && (
                displayStatus === 'approved' ? <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm">Disetujui</span>
                : displayStatus === 'rejected' ? <span className="text-[9px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm">Ditolak</span>
                : <span className="text-[9px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider shadow-sm">Pending</span>
              )}
            </div>
          </div>
        </div>

        {!isGuest && (
          <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto">
            <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar transition-all duration-300">
              
              {isEditMode ? (
                <>
                  <button onClick={toggleEditMode} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all border border-slate-300 dark:border-slate-600">
                    <X className="w-3.5 h-3.5" /> Batal
                  </button>
                  <button onClick={handleSaveChanges} disabled={isSaving} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan Perubahan
                  </button>
                </>
              ) : (
                <>
                  {canVerify && displayStatus === 'pending' ? (
                    <button onClick={handleVerifyLaporan} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Verifikasi Laporan</span>
                    </button>
                  ) : displayStatus === 'approved' ? (
                    <div className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-bold rounded-lg cursor-default">
                      <CheckCircle2 className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Telah Disetujui</span>
                    </div>
                  ) : displayStatus === 'rejected' ? (
                    <div className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-[11px] font-bold rounded-lg cursor-default">
                      <X className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Telah Ditolak</span>
                    </div>
                  ) : (
                    <div className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 text-[11px] font-bold rounded-lg cursor-default">
                      <Clock className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Menunggu Verifikasi</span>
                    </div>
                  )}

                  <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>

                  {canCreateData && (
                    <>
                      <button onClick={toggleEditMode} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                        <Edit3 className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Mode Edit Draf</span>
                      </button>
                      <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[11px] font-bold rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Hapus</span>
                      </button>
                      <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                    </>
                  )}
                  
                  <button onClick={handleCopyText} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-bold rounded-lg transition-all">
                    <Copy className="w-3.5 h-3.5 text-blue-500" /> <span className="hidden lg:inline">Copy Text</span>
                  </button>

                  <button onClick={handleExportExcel} disabled={isExportingExcel} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                    {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} 
                    <span className="hidden lg:inline">{isExportingExcel ? 'Memproses...' : 'Export Excel'}</span>
                  </button>
                  <button onClick={handleExportPdf} disabled={isExportingPdf} className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-bold rounded-lg transition-all disabled:opacity-50">
                    {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} 
                    <span className="hidden lg:inline">{isExportingPdf ? 'Memproses...' : 'Export PDF'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* COMPONENT 1: INFO PENGAWASAN */}
        <InfoPengawasan isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm} />
        {/* COMPONENT 2: CUACA LAPANGAN */}
        <CuacaLapangan isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm} />
      </div>

      {/* COMPONENT 3: KEGIATAN & GEOGRAFIS */}
      <KegiatanGeografis 
        isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm}
        rabOptions={rabOptions} isLoadingRab={isLoadingRab} mingguKe={currentMingguKe}
        optionsMingguIni={optionsMingguIni} optionsMingguLain={optionsMingguLain} unscheduledRabOptions={unscheduledRabOptions}
      />

      {/* COMPONENT 4: PERSONIL & PERALATAN */}
      <PersonilAlatLaporan 
        isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm}
        openPersonilModal={openPersonilModal} openPeralatanModal={openPeralatanModal}
      />

      {/* COMPONENT 5: DOKUMENTASI & LAMPIRAN */}
      <LampiranDokumentasi 
        isEditMode={isEditMode} reportData={reportData} handleUploadFile={handleUploadFile} 
        handleDeleteFile={handleDeleteFile} getDocUrl={getDocUrl}
      />

      {/* Action Submit */}
      {isEditMode && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
          <button type="button" onClick={toggleEditMode} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-slate-600 shadow-sm"><X className="w-4 h-4" /> Batal</button>
          <button type="button" onClick={handleSaveChanges} disabled={isSaving || editForm.activities.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50 transition-colors">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Draf'}
          </button>
        </div>
      )}

      {/* MODALS DARI COMPONENT LAIN TETAP DI RENDER DI SINI */}
      {showPersonilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-emerald-500"/> Form Personil Draf</h3>
              <button onClick={() => setShowPersonilModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={savePersonil}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posisi / Nama Jabatan <span className="text-rose-500">*</span></label>
                  <input type="text" required list="peran-options" value={personilForm.peran} onChange={(e) => setPersonilForm({...personilForm, peran: e.target.value})} placeholder="Contoh: Pekerja, Tukang..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Orang <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={personilForm.jumlah} onChange={(e) => setPersonilForm({...personilForm, jumlah: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPersonilModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-colors">Simpan Personil</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPeralatanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-500"/> Form Peralatan Draf</h3>
              <button onClick={() => setShowPeralatanModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={savePeralatan}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Peralatan <span className="text-rose-500">*</span></label>
                  <input type="text" required list="alat-options" value={peralatanForm.namaAlat} onChange={(e) => setPeralatanForm({...peralatanForm, namaAlat: e.target.value})} placeholder="Contoh: Excavator..." className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Jumlah Unit <span className="text-rose-500">*</span></label>
                  <input type="number" required min="1" value={peralatanForm.jumlah} onChange={(e) => setPeralatanForm({...peralatanForm, jumlah: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowPeralatanModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors">Simpan Alat</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL KONFIRMASI HAPUS LAPORAN FULL --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/20 animate-pulse">
              <Trash2 size={28} className="text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Laporan Harian?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Tindakan ini permanen. Semua data, foto, dan lampiran di dalam laporan ini akan hilang dan tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs shadow-sm">Batal</button>
              <button onClick={handleDeleteReport} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-rose-500/20 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/> Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}