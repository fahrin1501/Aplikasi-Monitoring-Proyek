import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Download, Edit3, Copy, Clock, Wrench, Users,
  CheckCircle2, Save, X, Loader2, Trash2, FileSpreadsheet, FileText 
} from 'lucide-react';

import InfoPengawasan from './IsiLaporan/InfoPengawasan';
import CuacaLapangan from './IsiLaporan/CuacaLapangan';
import KegiatanGeografis from './IsiLaporan/KegiatanGeografis';
import { PersonilCard, PeralatanCard } from './IsiLaporan/PersonilAlatLaporan';
import { FotoCard, DokumenCard } from './IsiLaporan/LampiranDokumentasi';

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
    tanggal: '', minggu_ke: '', pengawas: '', lokasi: '', catatan: '',
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
               flattenedItems.push({ 
                 id: item.id, 
                 uraian: item.uraian_pekerjaan, 
                 satuan: item.satuan, 
                 volume: item.volume,
                 total_harga: item.total_harga,
                 kategori_nama: kategori.nama_kategori 
               });
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
        catatan: reportData.catatan || '',
        cuacaItems: parsedCuaca,
        activities: JSON.parse(JSON.stringify(reportData.activities || [])).map(act => ({
          ...act, 
          sta_awal: act.sta_awal || '',
          sta_akhir: act.sta_akhir || '',
          persentase: act.persentase || ''
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
      
      const payloadKegiatan = editForm.activities.map(k => ({
        rab_item_id: k.rab_item_id,
        uraian: k.uraian,
        sta_awal: k.sta_awal,   
        sta_akhir: k.sta_akhir, 
        volume: k.volume,
        satuan: k.satuan,
        persentase: k.persentase 
      }));

      const payload = {
        tanggal: editForm.tanggal,
        minggu_ke: editForm.minggu_ke,
        pengawas: editForm.pengawas,
        lokasi: editForm.lokasi,
        catatan: editForm.catatan, 
        cuaca: cuacaGabungan, 
        kondisi_cuaca: JSON.stringify(editForm.cuacaItems), 
        kegiatan: JSON.stringify(payloadKegiatan),
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

  const handleRejectLaporan = async () => {
    const confirmReject = window.confirm("Apakah Anda yakin ingin menolak laporan ini? \n\nLaporan akan dikembalikan ke pengawas untuk direvisi.");
    if (!confirmReject) return;
    try {
      await api.put(`/daily-reports/${reportId}/reject`);
      alert("Laporan berhasil ditolak dan dikembalikan!");
      fetchReport(); 
    } catch (error) {
      alert("Terjadi kesalahan saat menolak laporan.");
    }
  };

  const currentMingguKe = isEditMode ? editForm.minggu_ke : reportData?.minggu_ke;

  const availableWeeks = scheduleData?.schedules
    ? [...new Set(scheduleData.schedules.map(s => parseInt(s.minggu_ke)))].sort((a, b) => a - b)
    : [];

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

  // Bersihkan format angka nol berlebih (.0000)
  const formatCleanNumber = (val) => {
    if (val === null || val === undefined || val === '') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? val : num;
  };

  const handleCopyText = () => {
    if (!reportData) return;
    const dateObj = new Date(reportData.tanggal);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('id-ID', options);

    let pekerjaanText = reportData.activities?.length 
      ? reportData.activities.map((act, idx) => {
          const cleanVolume = formatCleanNumber(act.volume);
          const satuan = act.satuan ? ` ${act.satuan}` : '';
          const staPart = (act.sta_awal || act.sta_akhir)
            ? ` [STA: ${act.sta_awal || '-'} s/d ${act.sta_akhir || '-'}]`
            : '';
          return `${idx + 1}. ${act.uraian} (${cleanVolume}${satuan})${staPart}`;
        }).join('\n') 
      : "1. Tidak Ada Pekerjaan";

    let manpowerText = reportData.personnels?.length ? reportData.personnels.map((p, idx) => `${idx + 1}. ${p.peran} = ${p.jumlah} org`).join('\n') : "1. Tidak Ada Pekerja = -";
    let alatText = reportData.equipments?.length ? reportData.equipments.map((e, idx) => `${idx + 1}. ${e.nama_alat} = ${e.jumlah} Unit`).join('\n') : "1. Tidak Ada Alat = -";

    const textToCopy = `*Daily Report ${formattedDate}*\n\n*PENGAWASAN TEKNIS ${(reportData.project?.nama_proyek || 'NAMA PROYEK').toUpperCase()}*\n\nPekerjaan :\n${pekerjaanText}\n\nMANPOWER :\n${manpowerText}\n\nAlat : \n${alatText}\n\nCuaca Harian : \n${reportData.cuaca || '-'}\n           \nJam Kerja : -\n \nCatatan : \n* ${reportData.catatan || '-'}`;
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
    <div className="w-full space-y-3.5 pb-2 relative animate-fade-in">

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* HEADER UTAMA & DUA BOKS KONTROL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 mb-2">
        
        {/* INFORMASI & JUDUL LAPORAN */}
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate('/laporan')} 
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0 cursor-pointer"
            title="Kembali ke Daftar Laporan"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm lg:text-base font-bold text-slate-800 dark:text-white leading-snug flex items-center gap-1.5 flex-wrap">
              <span>Detail Laporan Harian</span>
              {isEditMode && (
                <span className="px-2 py-0.5 ml-1 text-[9px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 dark:border-blue-500/30 font-extrabold tracking-wider shadow-sm">
                  DRAFT MODE
                </span>
              )}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold">LAP/{reportData.tanggal.replace(/-/g, '/')}/00{reportData.id}</span>
              <span className="text-slate-400">•</span>
              <span className="truncate font-medium">{reportData.project?.nama_proyek || 'Proyek'}</span>
              {!isEditMode && (
                <>
                  <span className="text-slate-400">•</span>
                  {displayStatus === 'approved' ? (
                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shadow-sm">
                      Disetujui
                    </span>
                  ) : displayStatus === 'rejected' ? (
                    <span className="text-[9px] bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shadow-sm">
                      Ditolak
                    </span>
                  ) : (
                    <span className="text-[9px] bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider shadow-sm">
                      Pending
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* CONTAINER KONTROL: BERTUMPUK DI MOBILE & TABLET, SEJAJAR DI DESKTOP */}
        {!isGuest && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
            
            {/* BOKS AKSI: KETINGGIAN h-10 DENGAN TOMBOL h-7 */}
            <div className="flex items-center justify-between sm:justify-start gap-1 bg-white dark:bg-slate-800/80 px-1.5 h-10 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-30 transition-all shrink-0">
              
              {isEditMode ? (
                <>
                  <button 
                    onClick={toggleEditMode} 
                    className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[10px] sm:text-[11px] font-bold rounded-lg border border-slate-300 dark:border-slate-600 whitespace-nowrap shrink-0 shadow-sm"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" /> 
                    <span>Batal</span>
                  </button>

                  <button 
                    onClick={handleSaveChanges} 
                    disabled={isSaving} 
                    className="flex items-center justify-center gap-1.5 px-2 sm:px-2.5 h-7 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm bg-blue-600 hover:bg-blue-700 text-white shrink-0 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-white" /> : <Save className="w-3.5 h-3.5 shrink-0 text-white" />} 
                    <span>Simpan Perubahan</span>
                  </button>
                </>
              ) : (
                <>
                  {/* TOMBOL VERIFIKASI / STATUS */}
                  {canVerify && displayStatus === 'pending' ? (
                    <>
                      <button 
                        onClick={handleRejectLaporan} 
                        className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] sm:text-[11px] font-bold rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0"
                      >
                        <X className="w-3.5 h-3.5 shrink-0" /> 
                        <span>Tolak</span>
                      </button>
                      <button 
                        onClick={handleVerifyLaporan} 
                        className="flex items-center justify-center gap-1 h-7 px-2 sm:px-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-[11px] font-bold rounded-lg transition-all shadow-sm whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 
                        <span>Verifikasi</span>
                      </button>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                    </>
                  ) : displayStatus === 'approved' ? (
                    <div className="flex items-center justify-center gap-1 h-7 px-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[10px] sm:text-[11px] font-bold rounded-lg cursor-default whitespace-nowrap shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> 
                      <span>Disetujui</span>
                    </div>
                  ) : displayStatus === 'rejected' ? (
                    <div className="flex items-center justify-center gap-1 h-7 px-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-[10px] sm:text-[11px] font-bold rounded-lg cursor-default whitespace-nowrap shrink-0">
                      <X className="w-3.5 h-3.5 shrink-0" /> 
                      <span>Ditolak</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1 h-7 px-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 text-[10px] sm:text-[11px] font-bold rounded-lg cursor-default whitespace-nowrap shrink-0">
                      <Clock className="w-3.5 h-3.5 shrink-0" /> 
                      <span>Pending</span>
                    </div>
                  )}

                  {/* TOMBOL EDIT & HAPUS (KHUSUS PEMBUAT DATA) */}
                  {canCreateData && (
                    <>
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                      <button 
                        onClick={toggleEditMode} 
                        className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" /> 
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(true)} 
                        className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" /> 
                        <span>Hapus</span>
                      </button>
                    </>
                  )}

                  {/* TOMBOL COPY (UNGU) */}
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                  <button 
                    onClick={handleCopyText} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-purple-50 dark:hover:bg-purple-500/10 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all whitespace-nowrap shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" /> 
                    <span>Copy</span>
                  </button>

                  {/* TOMBOL EXCEL (HIJAU) */}
                  <button 
                    onClick={handleExportExcel} 
                    disabled={isExportingExcel} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {isExportingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500 shrink-0" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />} 
                    <span>Excel</span>
                  </button>

                  {/* TOMBOL PDF (MERAH) */}
                  <button 
                    onClick={handleExportPdf} 
                    disabled={isExportingPdf} 
                    className="flex items-center justify-center gap-1.5 h-7 px-2 sm:px-2.5 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 text-[10px] sm:text-[11px] font-medium rounded-lg transition-all disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500 shrink-0" /> : <Download className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />} 
                    <span>PDF</span>
                  </button>
                </>
              )}

            </div>
          </div>
        )}
      </div>

      <InfoPengawasan 
        isEditMode={isEditMode} 
        reportData={reportData} 
        editForm={editForm} 
        setEditForm={setEditForm} 
        availableWeeks={availableWeeks} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
        <CuacaLapangan isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm} />
        
        <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} p-4 md:p-5 rounded-2xl flex flex-col transition-all relative backdrop-blur-sm h-full`}>
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 mb-3 shrink-0">
             <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
               <FileText className="w-4 h-4" /> Catatan Tambahan Laporan
             </h3>
           </div>
           {isEditMode ? (
             <textarea
               name="catatan"
               value={editForm.catatan}
               onChange={(e) => setEditForm({...editForm, catatan: e.target.value})}
               placeholder="Tuliskan catatan khusus, kendala lapangan, atau instruksi pengawas di sini..."
               className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none shadow-inner custom-scrollbar transition-colors"
             />
           ) : (
             <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-sm flex-1 custom-scrollbar overflow-y-auto">
               {reportData.catatan || 'Tidak ada catatan tambahan.'}
             </div>
           )}
        </div>
      </div>

      <div className="w-full">
        <KegiatanGeografis 
          isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm}
          rabOptions={rabOptions} isLoadingRab={isLoadingRab} mingguKe={currentMingguKe}
          optionsMingguIni={optionsMingguIni} optionsMingguLain={optionsMingguLain} unscheduledRabOptions={unscheduledRabOptions}
          grandTotalRab={scheduleData?.grand_total_rab} 
          cumulativeActuals={scheduleData?.cumulative_actual}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
        <PersonilCard 
          isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm} 
          openPersonilModal={openPersonilModal} 
        />
        <PeralatanCard 
          isEditMode={isEditMode} reportData={reportData} editForm={editForm} setEditForm={setEditForm} 
          openPeralatanModal={openPeralatanModal} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
        <FotoCard 
          isEditMode={isEditMode} reportData={reportData} handleUploadFile={handleUploadFile} 
          handleDeleteFile={handleDeleteFile} getDocUrl={getDocUrl}
        />
        <DokumenCard 
          isEditMode={isEditMode} reportData={reportData} handleUploadFile={handleUploadFile} 
          handleDeleteFile={handleDeleteFile} getDocUrl={getDocUrl}
        />
      </div>

      {isEditMode && (
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
          <button type="button" onClick={toggleEditMode} className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-slate-600 shadow-sm"><X className="w-4 h-4" /> Batal</button>
          <button type="button" onClick={handleSaveChanges} disabled={isSaving || editForm.activities.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50 transition-colors">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Draf'}
          </button>
        </div>
      )}

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