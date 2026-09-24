import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '../../api';
import { 
  ArrowLeft, Calendar, MapPin, Building2, Download, 
  Edit3, Paperclip, Image as ImageIcon, UserCheck, 
  ExternalLink, Sun, Users, Wrench, ListTodo, Trash2, FileSpreadsheet, 
  Plus, UploadCloud, AlertTriangle, CheckCircle2, Save, X, Loader2, Copy, Clock, ChevronDown, Target
} from 'lucide-react';

const defaultPersonilList = [
  'Dinas PUPR', 'Konsultan', 'Kontraktor', 'Kepala Kerja/Mandor', 
  'Pekerja', 'Tukang', 'Supir', 'Operator', 'Surveyor'
];

const defaultPeralatanList = [
  'Excavator', 'Dump Truck', 'Water Past', 'Theodolith', 
  'Concrete Mixer', 'Jack Hammer', 'Mesin Alcon', 'Mesin Las', 'Alat bantu'
];

const formatKoordTampil = (staString) => {
  if (!staString) return null;
  if (staString.includes(',')) {
    const [lat, long] = staString.split(',');
    return `Lat: ${lat.trim()} | Long: ${long.trim()}`;
  }
  return staString;
};

export default function LaporanData() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams(); 

  const initialData = location.state?.laporan;
  const reportId = id || initialData?.id || initialData?.originalData?.id;

  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // STATE DRAFT MODE & RAB SELECTOR
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rabOptions, setRabOptions] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  
  const [editForm, setEditForm] = useState({
    tanggal: '', minggu_ke: '', pengawas: '', lokasi: '',
    cuacaItems: [], activities: [], personnels: [], equipments: []
  });
  
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // STATE MODALS
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

  // --- LOGIKA PENGELOMPOKAN URAIAN PEKERJAAN ---
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
        const isThisWeek = parseInt(sched.minggu_ke) === parseInt(isEditMode ? editForm.minggu_ke : reportData.minggu_ke);
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

    let pekerjaanText = reportData.activities?.length ? reportData.activities.map((act, idx) => `${idx + 1}. ${act.uraian} (${act.volume} ${act.satuan}) ${act.persentase ? `[${act.persentase}%]` : ''}`).join('\n') : "1. Tidak Ada Pekerjaan";
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

  const fotoDokumentasi = (reportData.attachments || []).filter(a => a.tipe === 'foto');
  const lampiranFiles = (reportData.attachments || []).filter(a => a.tipe === 'dokumen');
  const activeActivities = isEditMode ? editForm.activities : reportData.activities;
  const activePersonnels = isEditMode ? editForm.personnels : reportData.personnels;
  const activeEquipments = isEditMode ? editForm.equipments : reportData.equipments;
  const displayStatus = (isGuest && reportData.status === 'rejected') ? 'pending' : (reportData.status || 'pending');

  return (
    <div className="w-full space-y-5 md:space-y-6 relative pb-20 animate-fade-in">
      
      <datalist id="peran-options">{defaultPersonilList.map(p => <option key={p} value={p} />)}</datalist>
      <datalist id="alat-options">{defaultPeralatanList.map(a => <option key={a} value={a} />)}</datalist>

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

      {/* Grid Informasi Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl p-4 md:p-5 flex flex-col justify-between transition-all relative backdrop-blur-sm`}>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-amber-500" /> Nama Projek</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{reportData.project?.nama_proyek}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-amber-500" /> Lokasi Pengawasan</p>
                {isEditMode ? (
                  <input type="text" value={editForm.lokasi} onChange={e => setEditForm({...editForm, lokasi: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner" />
                ) : (
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{reportData.lokasi}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Tanggal Pengawasan</p>
                  {isEditMode ? (
                    <input type="date" value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:light_dark] transition-colors shadow-inner" />
                  ) : (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{reportData.tanggal}</p>
                  )}
                </div>
                <div className="w-24">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Minggu Ke-</p>
                  {isEditMode ? (
                    <div className="relative">
                      <select value={editForm.minggu_ke} onChange={e => setEditForm({...editForm, minggu_ke: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none shadow-inner cursor-pointer">
                        <option value="" disabled>-- Pilih --</option>
                        {[...Array(100)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Ke-{reportData.minggu_ke || '-'}</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Nama Pengawas</p>
                {isEditMode ? (
                  <input type="text" value={editForm.pengawas} onChange={e => setEditForm({...editForm, pengawas: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-blue-300 dark:border-blue-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors shadow-inner" />
                ) : (
                  <p className="text-xs font-semibold text-slate-800 dark:text-white">{reportData.pengawas}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Cuaca */}
        <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl p-4 md:p-5 flex flex-col transition-all relative backdrop-blur-sm`}>
          
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4"/> Kondisi Cuaca Lapangan
            </h3>
            {isEditMode && (
              <button 
                type="button" 
                onClick={() => {
                  if (editForm.cuacaItems.length < 4) {
                    setEditForm({ ...editForm, cuacaItems: [...editForm.cuacaItems, { id: Date.now(), kondisi: 'Cerah', keterangan: '' }] });
                  } else {
                    alert("Maksimal 4 entri cuaca per hari.");
                  }
                }} 
                className="text-[10px] bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all border border-amber-200 dark:border-amber-500/20 z-20 relative shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            )}
          </div>
          
          <div className="pt-2 flex-1 flex flex-col">
             {isEditMode ? (
               <div className="space-y-4 mt-2">
                 {editForm.cuacaItems.map((item, index) => (
                   <div key={item.id} className="flex flex-col bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 items-start transition-all shadow-sm gap-3 relative">
                     <div className="w-full flex justify-between items-center mb-1">
                       <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase flex items-center gap-1.5">
                         <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> Sesi Cuaca {index + 1}
                       </span>
                       {editForm.cuacaItems.length > 1 && (
                         <button 
                           type="button" 
                           onClick={() => {
                             const newC = editForm.cuacaItems.filter(c => c.id !== item.id);
                             setEditForm({ ...editForm, cuacaItems: newC });
                           }} 
                           className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 bg-rose-50 dark:bg-rose-500/10 rounded-md transition-colors shadow-sm"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       )}
                     </div>
                     
                     <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="space-y-1.5">
                         <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Kondisi Cuaca <span className="text-rose-500">*</span></label>
                         <div className="relative">
                           <select 
                             value={item.kondisi}
                             onChange={(e) => { 
                               const newC = [...editForm.cuacaItems]; 
                               newC[index].kondisi = e.target.value; 
                               setEditForm({ ...editForm, cuacaItems: newC }); 
                             }}
                             className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner transition-all"
                           >
                             <option value="Cerah">Cerah</option>
                             <option value="Berawan">Berawan</option>
                             <option value="Hujan Gerimis">Hujan Gerimis</option>
                             <option value="Hujan Lebat">Hujan Lebat</option>
                           </select>
                           <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         </div>
                       </div>
                       
                       <div className="sm:col-span-2 space-y-1.5">
                         <label className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Waktu / Durasi / Keterangan</label>
                         <input 
                           type="text" 
                           value={item.keterangan} 
                           onChange={(e) => { 
                             const newC = [...editForm.cuacaItems]; 
                             newC[index].keterangan = e.target.value; 
                             setEditForm({ ...editForm, cuacaItems: newC }); 
                           }} 
                           placeholder="Contoh: 08:00 - 12:00..." 
                           className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors shadow-inner" 
                         />
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
                 <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed flex-1 mt-3 shadow-sm">
                     {reportData.cuaca || 'Tidak ada catatan cuaca harian.'}
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* Rincian Kegiatan */}
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
                    {/* GRID BARU: VOLUME - SATUAN - PERSENTASE (12 KOLOM) */}
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
            {reportData.activities.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center col-span-1 py-4 italic">Tidak ada kegiatan harian yang terdaftar.</p>
            ) : (
              reportData.activities.map((keg, idx) => (
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
                    {/* BADGE PERSENTASE DI MODE VIEW */}
                    {keg.persentase && (
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 px-3 py-2 rounded-lg text-[10px] shadow-sm">
                        <Target className="w-3.5 h-3.5 text-blue-500" /> 
                        <span className="text-blue-700 dark:text-blue-400 font-bold uppercase">Bobot:</span> 
                        <span className="font-bold text-blue-600 dark:text-blue-400">{keg.persentase}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Personil & Peralatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Personil */}
        <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm`}>
          
          <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between pr-12">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4" /> Personil Lapangan
            </h3>
            {isEditMode && (
              <button onClick={() => openPersonilModal()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-all animate-fade-in z-20 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            )}
          </div>
          <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                <tr>
                  <th className="pb-2 font-semibold">Kategori Personil</th>
                  <th className="pb-2 text-center font-semibold w-24">Jumlah</th>
                  {isEditMode && <th className="pb-2 text-right font-semibold w-16 animate-fade-in">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
                {activePersonnels.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="py-2.5 text-slate-800 dark:text-slate-300 font-bold">{p.peran}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/30 shadow-sm">
                        {p.jumlah} <span className="text-[9px] text-emerald-600/70 dark:text-emerald-500/70 font-sans font-normal ml-0.5">Org</span>
                      </span>
                    </td>
                    {isEditMode && (
                      <td className="py-2.5 text-right animate-fade-in">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openPersonilModal(p, idx)} className="p-1.5 text-blue-500 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button type="button" onClick={() => { const newP = [...editForm.personnels]; newP.splice(idx,1); setEditForm({...editForm, personnels: newP}); }} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Peralatan */}
        <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60 shadow-sm'} rounded-2xl overflow-hidden flex flex-col transition-all relative backdrop-blur-sm`}>

          <div className="px-4 md:px-5 py-4 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between pr-12">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-wider flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Pemakaian Alat
            </h3>
            {isEditMode && (
              <button onClick={() => openPeralatanModal()} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-blue-500/30 transition-all animate-fade-in z-20 shadow-sm">
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            )}
          </div>
          <div className="p-4 overflow-x-auto flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                <tr>
                  <th className="pb-2 font-semibold">Nama Alat / Mesin</th>
                  <th className="pb-2 text-center font-semibold w-24">Jumlah</th>
                  {isEditMode && <th className="pb-2 text-right font-semibold w-16 animate-fade-in">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
                {activeEquipments.map((alat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                    <td className="py-2.5 text-slate-800 dark:text-slate-300 font-bold">{alat.nama_alat}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                      <span className="bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900/30 shadow-sm">
                        {alat.jumlah} <span className="text-[9px] text-blue-600/70 dark:text-blue-500/70 font-sans font-normal ml-0.5">Unit</span>
                      </span>
                    </td>
                    {isEditMode && (
                      <td className="py-2.5 text-right animate-fade-in">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openPeralatanModal(alat, idx)} className="p-1.5 text-blue-500 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Edit3 className="w-3.5 h-3.5"/></button>
                          <button type="button" onClick={() => { const newE = [...editForm.equipments]; newE.splice(idx,1); setEditForm({...editForm, equipments: newE}); }} className="p-1.5 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-900/50 rounded-md transition-colors shadow-sm border border-slate-200 dark:border-slate-700/50"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SECTION 5: Upload Foto & Lampiran */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Dokumentasi (Foto)
            </h2>
            {isEditMode && (
              <>
                <input type="file" id="fotoUploadAdd" className="hidden" multiple accept="image/*" onChange={(e) => handleUploadFile(e, 'foto')} />
                <button type="button" onClick={() => document.getElementById('fotoUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg border border-amber-200 dark:border-amber-500/30 transition-all shadow-sm">
                  <UploadCloud className="w-3.5 h-3.5" /> Upload Foto
                </button>
              </>
            )}
          </div>
          
          <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {fotoDokumentasi.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                 <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                 <p className="text-slate-500 font-medium">Belum ada foto terlampir</p>
               </div>
            ) : (
              fotoDokumentasi.map((foto, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-all">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{foto.nama_file}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Telah Diunggah</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditMode && (
                      <button 
                        type="button"
                        onClick={() => window.open(getDocUrl(foto.path_file), '_blank')} 
                        title="Lihat Foto" 
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 shadow-sm transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5"/>
                      </button>
                    )}
                    {isEditMode && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteFile(foto.id)} 
                        title="Hapus Foto" 
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 shadow-sm transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 md:p-5 rounded-2xl space-y-4 shadow-sm flex flex-col relative backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3 gap-2">
            <h2 className="text-sm font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> File Lampiran
            </h2>
            {isEditMode && (
              <>
                <input type="file" id="docUploadAdd" className="hidden" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => handleUploadFile(e, 'dokumen')} />
                <button type="button" onClick={() => document.getElementById('docUploadAdd').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-all shadow-sm">
                  <UploadCloud className="w-3.5 h-3.5" /> Upload File
                </button>
              </>
            )}
          </div>
          
          <div className="space-y-2 text-xs flex-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
            {lampiranFiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/40">
                 <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                 <p className="text-slate-500 font-medium">Belum ada berkas terlampir</p>
               </div>
            ) : (
              lampiranFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm transition-all">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-slate-800 dark:text-white truncate">{file.nama_file}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Telah Diunggah</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditMode && (
                      <button 
                        type="button"
                        onClick={() => window.open(getDocUrl(file.path_file), '_blank')} 
                        title="Download / Buka File" 
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-amber-500 rounded hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 shadow-sm transition-colors"
                      >
                        <Download className="w-3.5 h-3.5"/>
                      </button>
                    )}
                    {isEditMode && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteFile(file.id)} 
                        title="Hapus File" 
                        className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-rose-500 rounded hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 shadow-sm transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Submit */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-8">
        <button
          type="button"
          onClick={() => navigate('/laporan')}
          className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-slate-200 dark:border-slate-600 shadow-sm"
        >
          <X className="w-4 h-4" /> Batal
        </button>
        <button 
          type="button" 
          onClick={isEditMode ? handleSaveChanges : toggleEditMode}
          disabled={isSaving || (isEditMode && editForm.activities.length === 0)} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Save className="w-4 h-4" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Draf'}
        </button>
      </div>

      {/* MODALS PERSONIL & PERALATAN */}
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