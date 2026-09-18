import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../../api'; 
import { 
  DollarSign, ArrowLeft, Info, FileSpreadsheet, 
  TrendingUp, Compass, Plus, Edit3, Trash2, ListPlus, 
  Download, Loader2, AlertTriangle, X, Type, Activity, TrendingDown, CheckCircle2,
  UploadCloud, ShieldAlert, Clock
} from 'lucide-react';

export default function ProjectRAB() {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserRole(user.role || 'Tamu');
      } catch (error) {
        console.error("Gagal membaca data user:", error);
      }
    }
  }, []);

  // Definisi Hak Akses
  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const isGuest = userRole === 'Tamu';

  // --- STATE UTAMA ---
  const [projectData, setProjectData] = useState(null);
  const [rabs, setRabs] = useState([]);
  const [realisasiKegiatan, setRealisasiKegiatan] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE DRAFT MODE (IN-MEMORY UPDATE) ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [localRabs, setLocalRabs] = useState([]);
  const [deletedCatIds, setDeletedCatIds] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // --- STATE MODAL & FORM ---
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, nama_kategori: '' });

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null, rab_category_id: null, uraian_pekerjaan: '', satuan: '', volume: '', harga_satuan: '', is_subheader: false
  });

  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });
  
  const [exportModal, setExportModal] = useState({ show: false, type: '' });
  const [isExporting, setIsExporting] = useState(false);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (isGuest) {
      setIsLoading(false);
      return;
    }

    try {
      const [projRes, rabRes, reportRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/rabs`),
        api.get(`/daily-reports`).catch(() => ({ data: { data: [] } }))
      ]);
      
      setProjectData(projRes.data);
      setRabs(rabRes.data.data);

      const allReports = reportRes.data?.data || [];
      const approvedReports = allReports.filter(
        r => r.project_id.toString() === id.toString() && r.status === 'approved'
      );

      const realisasiMap = {};
      approvedReports.forEach(report => {
        if (report.activities && report.activities.length > 0) {
          report.activities.forEach(act => {
            if (act.rab_item_id) {
              if (!realisasiMap[act.rab_item_id]) realisasiMap[act.rab_item_id] = 0;
              realisasiMap[act.rab_item_id] += parseFloat(act.volume || 0);
            }
          });
        }
      });
      setRealisasiKegiatan(realisasiMap);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, isGuest]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka || 0);
  };

  const getCategoryStyle = (kat) => {
    switch (kat) {
      case 'Infrastruktur Jalan & Jembatan': return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600';
      case 'Gedung & Bangunan Sipil': return 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
      case 'Sumber Daya Air & Irigasi': return 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800/50';
      case 'Tata Lingkungan & Sanitasi': return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'Preservasi Jalan': return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50';
      default: return 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50';
    }
  };

  // ======================================================================
  // LOGIKA DRAFT MODE (EDIT TANPA BERSENTUHAN DENGAN BACKEND SAMPAI DISIMPAN)
  // ======================================================================
  const handleToggleEdit = () => {
    setLocalRabs(JSON.parse(JSON.stringify(rabs))); 
    setDeletedCatIds([]);
    setDeletedItemIds([]);
    setIsEditMode(true);
  };

  const handleBatalEdit = () => {
    setLocalRabs([]);
    setDeletedCatIds([]);
    setDeletedItemIds([]);
    setIsEditMode(false);
  };

  const openCatModal = (cat = null) => {
    if (cat) setCatForm({ id: cat.id, nama_kategori: cat.nama_kategori });
    else setCatForm({ id: null, nama_kategori: '' });
    setShowCatModal(true);
  };

  const saveCategory = (e) => {
    e.preventDefault();
    let updated = [...localRabs];
    if (catForm.id) {
      const idx = updated.findIndex(c => c.id === catForm.id);
      if (idx > -1) updated[idx] = { ...updated[idx], nama_kategori: catForm.nama_kategori };
    } else {
      updated.push({
        id: `temp-cat-${Date.now()}`,
        nama_kategori: catForm.nama_kategori,
        items: []
      });
    }
    setLocalRabs(updated);
    setShowCatModal(false);
  };

  const openItemModal = (categoryId, isSubheader = false, item = null) => {
    if (item) setItemForm({ id: item.id, rab_category_id: categoryId, uraian_pekerjaan: item.uraian_pekerjaan, satuan: item.satuan || '', volume: item.volume || '', harga_satuan: item.harga_satuan || '', is_subheader: item.is_subheader });
    else setItemForm({ id: null, rab_category_id: categoryId, uraian_pekerjaan: '', satuan: '', volume: '', harga_satuan: '', is_subheader: isSubheader });
    setShowItemModal(true);
  };

  const saveItem = (e) => {
    e.preventDefault();
    let updated = [...localRabs];
    const catIdx = updated.findIndex(c => c.id === itemForm.rab_category_id);
    if (catIdx === -1) return;

    const vol = parseFloat(itemForm.volume) || 0;
    const hrg = parseFloat(itemForm.harga_satuan) || 0;

    const newItem = {
      id: itemForm.id || `temp-item-${Date.now()}`,
      rab_category_id: itemForm.rab_category_id,
      uraian_pekerjaan: itemForm.uraian_pekerjaan,
      satuan: itemForm.satuan,
      volume: vol,
      harga_satuan: hrg,
      total_harga: vol * hrg,
      is_subheader: itemForm.is_subheader
    };

    if (itemForm.id) {
      const itemIdx = updated[catIdx].items.findIndex(i => i.id === itemForm.id);
      if (itemIdx > -1) {
        updated[catIdx] = { ...updated[catIdx], items: updated[catIdx].items.map(i => i.id === itemForm.id ? newItem : i) };
      }
    } else {
      updated[catIdx] = { ...updated[catIdx], items: [...updated[catIdx].items, newItem] };
    }
    setLocalRabs(updated);
    setShowItemModal(false);
  };

  const confirmDelete = (type, deleteId, name) => setDeleteConfig({ show: true, type, id: deleteId, name });

  const executeDeleteDraft = () => {
    let updated = [...localRabs];
    
    if (deleteConfig.type === 'category') {
      if (!String(deleteConfig.id).startsWith('temp-')) setDeletedCatIds(prev => [...prev, deleteConfig.id]);
      updated = updated.filter(c => c.id !== deleteConfig.id);
    } else if (deleteConfig.type === 'item') {
      if (!String(deleteConfig.id).startsWith('temp-')) setDeletedItemIds(prev => [...prev, deleteConfig.id]);
      updated = updated.map(c => ({ ...c, items: c.items.filter(item => item.id !== deleteConfig.id) }));
    }
    
    setLocalRabs(updated);
    setDeleteConfig({ show: false, type: '', id: null, name: '' });
  };

  // ======================================================================
  // MENGIRIM SELURUH PERUBAHAN DRAF KE DATABASE SECARA PARALEL
  // ======================================================================
  const handleSelesaiEdit = async () => {
    setIsSavingEdit(true);
    try {
      await Promise.all([
        ...deletedItemIds.map(id => api.delete(`/rab-items/${id}`)),
        ...deletedCatIds.map(id => api.delete(`/rabs/categories/${id}`))
      ]);

      for (const cat of localRabs) {
        let realCatId = cat.id;

        if (String(cat.id).startsWith('temp-')) {
          const res = await api.post(`/projects/${id}/rabs/categories`, { nama_kategori: cat.nama_kategori });
          const newCat = res.data?.data || res.data;
          realCatId = newCat.id;
        } else {
          await api.put(`/rabs/categories/${cat.id}`, { nama_kategori: cat.nama_kategori });
        }

        const itemPromises = cat.items.map(item => {
          const itemPayload = {
            rab_category_id: realCatId,
            uraian_pekerjaan: item.uraian_pekerjaan,
            satuan: item.satuan,
            volume: item.volume,
            harga_satuan: item.harga_satuan,
            is_subheader: item.is_subheader
          };

          if (String(item.id).startsWith('temp-')) return api.post(`/rabs/categories/${realCatId}/items`, itemPayload);
          else return api.put(`/rab-items/${item.id}`, itemPayload);
        });

        await Promise.all(itemPromises);
      }

      await fetchData();
      setDeletedCatIds([]);
      setDeletedItemIds([]);
      setIsEditMode(false);
      alert("Seluruh draf perubahan RAB berhasil disimpan secara permanen!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan beberapa perubahan. Pastikan koneksi server Anda stabil.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- HANDLER IMPORT & EXPORT EXCEL ---
  const executeExport = async () => {
    setIsExporting(true);
    try {
      const ext = exportModal.type === 'excel' ? 'xlsx' : 'pdf';
      const endpoint = `/projects/${id}/export-rab/${exportModal.type}`;
      
      const response = await api.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeName = projectData.nama_proyek ? projectData.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_') : 'Proyek';
      link.setAttribute('download', `RAB_${safeName}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setExportModal({ show: false, type: '' });
    } catch (error) { alert(`Gagal mengunduh file. Pastikan Backend sudah siap.`); } 
    finally { setIsExporting(false); }
  };

  const handleImportRAB = async () => {
    if (!importFile) return;
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      await api.post(`/projects/${id}/import-rab`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Data RAB berhasil di-import!');
      setShowImportModal(false);
      setImportFile(null);
      fetchData(); 
    } catch (error) { alert(`Gagal Import: Pastikan format sesuai.`); } 
    finally { setIsImporting(false); }
  };

  // --- CEGAH AKSES TAMU ---
  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center p-20 w-full h-[60vh] bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Akses Ditolak</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
          Akun Tamu tidak diizinkan melihat Rencana Anggaran Biaya (RAB) dan rincian keuangan proyek. Silakan kembali ke menu sebelumnya.
        </p>
        <button onClick={() => navigate(`/projects/${id}/data`)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold transition-all shadow-sm">
          Kembali ke Data Proyek
        </button>
      </div>
    );
  }

  if (isLoading || !projectData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Memuat Rincian RAB & Realisasi...</p>
    </div>
  );

  // --- KALKULASI OTOMATIS BERDASARKAN MODE AKTIF ---
  let grandTotalRencana = 0;
  let grandTotalRealisasi = 0;
  const paguKontrak = Number(projectData.nilai_kontrak) || 1; 
  
  const currentRabs = isEditMode ? localRabs : rabs;

  const rabsWithRealization = currentRabs.map(divisi => {
    let totalRencanaDivisi = 0;
    let totalRealisasiDivisi = 0;

    const items = divisi.items.map(item => {
      let actualVol = 0;
      let actualTotal = 0;

      if (!item.is_subheader) {
        actualVol = realisasiKegiatan[item.id] || 0; 
        actualTotal = actualVol * Number(item.harga_satuan || 0);
        
        totalRencanaDivisi += Number(item.total_harga || 0);
        totalRealisasiDivisi += actualTotal;
      }
      return { ...item, actualVol, actualTotal };
    });

    grandTotalRencana += totalRencanaDivisi;
    grandTotalRealisasi += totalRealisasiDivisi;

    return { ...divisi, items, totalRencanaDivisi, totalRealisasiDivisi };
  });

  const pctRencanaRaw = (grandTotalRencana / paguKontrak) * 100;
  const pctRealisasiRaw = (grandTotalRealisasi / paguKontrak) * 100;
  const pctRencanaCSS = Math.min(pctRencanaRaw, 100);
  const pctRealisasiCSS = Math.min(pctRealisasiRaw, 100);
  const isRencanaBigger = pctRencanaCSS > pctRealisasiCSS;

  // ==============================================
  // LOGIKA TIMESTAMP PEMBUATAN & PEMBARUAN RAB
  // ==============================================
  let createdTimestamp = null;
  let updatedTimestamp = null;

  if (rabs.length > 0) {
    let maxUpdated = 0;
    let minCreated = Infinity;

    rabs.forEach(cat => {
      if (cat.updated_at) maxUpdated = Math.max(maxUpdated, new Date(cat.updated_at).getTime());
      if (cat.created_at) minCreated = Math.min(minCreated, new Date(cat.created_at).getTime());

      if (cat.items && cat.items.length > 0) {
        cat.items.forEach(item => {
          if (item.updated_at) maxUpdated = Math.max(maxUpdated, new Date(item.updated_at).getTime());
          if (item.created_at) minCreated = Math.min(minCreated, new Date(item.created_at).getTime());
        });
      }
    });

    if (minCreated !== Infinity) createdTimestamp = minCreated;
    if (maxUpdated !== 0) updatedTimestamp = maxUpdated;
  }

  const formatTimestamp = (timeMs) => {
    if (!timeMs) return '-';
    return new Date(timeMs).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WITA';
  };
  // ==============================================

  return (
    <div className="w-full space-y-5 relative pb-20">
      
      {/* --- TOP BAR NAVIGATION --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <Link to={`/projects/${id}/data`} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-start lg:items-center gap-1.5 flex-wrap">
              <span>Rencana Anggaran Biaya (RAB)</span>
              {isEditMode && <span className="px-2 py-0.5 ml-2 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200">DRAFT MODE</span>}
            </h1>
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{projectData.nama_proyek}</span>
              <span className="text-slate-400 mx-0.5"> • </span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData.kategori)}`}>
                {projectData.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          
          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar transition-all duration-300">
            {isEditMode ? (
              <>
                <button onClick={handleBatalEdit} disabled={isSavingEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap border border-slate-300 dark:border-slate-600">
                  <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> Batal
                </button>
                <button onClick={() => openCatModal()} disabled={isSavingEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                  <Plus className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Divisi Baru</span>
                </button>
                <button onClick={handleSelesaiEdit} disabled={isSavingEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm">
                  {isSavingEdit ? <Loader2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />} 
                  <span className="hidden lg:inline">{isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </>
            ) : (
              <>
                {canCreateData && (
                  <>
                    <button onClick={handleToggleEdit} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                      <Edit3 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Mode Edit Draf</span>
                    </button>
                    <div className="hidden lg:block w-px h-5 bg-slate-200 dark:bg-slate-700/80 mx-0.5 shrink-0"></div>
                    <button onClick={() => setShowImportModal(true)} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                      <UploadCloud className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Import RAB</span>
                    </button>
                  </>
                )}

                <button onClick={() => setExportModal({ show: true, type: 'excel' })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                  <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export Excel</span>
                </button>
                <button onClick={() => setExportModal({ show: true, type: 'pdf' })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
                  <Download className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Export PDF</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto hide-scrollbar z-0">
            <button onClick={() => navigate(`/projects/${id}/data`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Info className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span>
            </button>
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap">
              <FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">RAB</span>
            </button>
            <button onClick={() => navigate(`/projects/${id}/kurva-s`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Kurva S</span>
            </button>
            <button onClick={() => navigate(`/projects/${id}/peta-gis`, { state: projectData })} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap">
              <Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Peta GIS</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- DASHBOARD SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><DollarSign className="w-4 h-4 text-amber-500" /> Total Pagu Kontrak</span>
          <p className="text-lg md:text-xl font-bold text-slate-800 dark:text-white truncate font-mono" title={formatRupiah(paguKontrak)}>{formatRupiah(paguKontrak)}</p>
        </div>
        <div className={`bg-white dark:bg-slate-800/60 border ${isEditMode ? 'border-blue-400/50 bg-blue-50/20 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-700/60'} rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center transition-colors`}>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><FileSpreadsheet className="w-4 h-4 text-blue-500" /> Total Rencana {isEditMode && '(Draft)'}</span>
          <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 truncate font-mono" title={formatRupiah(grandTotalRencana)}>{formatRupiah(grandTotalRencana)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 mb-1.5 uppercase tracking-wider"><Activity className="w-4 h-4 text-emerald-500" /> Total Realisasi (Actual)</span>
          <p className="text-lg md:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate font-mono" title={formatRupiah(grandTotalRealisasi)}>{formatRupiah(grandTotalRealisasi)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-5 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center mb-5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex items-center gap-1.5 uppercase tracking-wider"><TrendingDown className="w-4 h-4 text-amber-500" /> Serapan Biaya Aktual</span>
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{pctRealisasiRaw.toFixed(2)}%</span>
          </div>
          <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-visible mt-1">
            {isRencanaBigger ? (
               <>
                 <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pctRencanaCSS}%`, zIndex: 10 }}></div>
                 <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pctRealisasiCSS}%`, zIndex: 20 }}></div>
               </>
            ) : (
               <>
                 <div className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${pctRealisasiCSS}%`, zIndex: 10 }}></div>
                 <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${pctRencanaCSS}%`, zIndex: 20 }}></div>
               </>
            )}
            <div className="absolute flex flex-col items-center group cursor-pointer z-30 transition-all duration-700" style={{ left: `${pctRealisasiCSS}%`, bottom: 'calc(100% + 2px)', transform: 'translateX(-50%)' }}>
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-950 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap border border-slate-700 pointer-events-none">Realisasi: {pctRealisasiRaw.toFixed(2)}%</div>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-emerald-500 transition-transform group-hover:scale-110"></div>
            </div>
            <div className="absolute flex flex-col items-center group cursor-pointer z-30 transition-all duration-700" style={{ left: `${pctRencanaCSS}%`, top: 'calc(100% + 2px)', transform: 'translateX(-50%)' }}>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[5px] border-b-blue-500 transition-transform group-hover:scale-110"></div>
              <div className="absolute top-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-950 text-white text-[9px] px-2 py-1 rounded shadow-md whitespace-nowrap border border-slate-700 pointer-events-none">Rencana: {pctRencanaRaw.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RENDER DATA RAB PER DIVISI --- */}
      {rabsWithRealization.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-slate-700 dark:text-slate-300 font-bold mb-1">RAB Belum Dibuat</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Mulai bangun struktur RAB proyek dengan menambahkan Divisi/Kategori pekerjaan pertama atau Import via Excel.</p>
          {isEditMode ? (
            <button onClick={() => openCatModal()} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md hover:bg-emerald-600">
              <Plus className="w-4 h-4 inline mr-1" /> Buat Divisi Baru
            </button>
          ) : (
            <p className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg font-medium border border-blue-200 dark:border-blue-500/20">
              Aktifkan "Mode Edit Draf" di atas untuk mulai memasukkan data.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">

          {/* --- INFO TIMESTAMP DITAMBAHKAN DI SINI --- */}
          <div className="flex flex-wrap items-center justify-end gap-4 px-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> Dibuat: <span className="font-bold text-slate-700 dark:text-slate-300">{formatTimestamp(createdTimestamp)}</span></span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Diupdate: <span className="font-bold text-slate-700 dark:text-slate-300">{formatTimestamp(updatedTimestamp)}</span></span>
          </div>
          {/* ------------------------------------------ */}

          {rabsWithRealization.map((divisi) => (
            <div key={divisi.id} className={`bg-white dark:bg-slate-800/60 border rounded-2xl overflow-hidden shadow-sm transition-colors ${isEditMode ? 'border-blue-300/60 dark:border-blue-700/40 shadow-blue-900/5' : 'border-slate-200 dark:border-slate-700/60'}`}>
              
              {/* Card Header Divisi */}
              <div className="bg-slate-50 dark:bg-slate-900/80 px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <h3 className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tracking-wide uppercase flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div> {divisi.nama_kategori}
                  {isEditMode && String(divisi.id).startsWith('temp-') && <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] rounded border border-emerald-200">BARU (Draf)</span>}
                </h3>
                
                {isEditMode && (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in w-full xl:w-auto">
                    <button onClick={() => openItemModal(divisi.id, false)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-lg border border-blue-200 dark:border-slate-700/80 transition-all">
                      <ListPlus className="w-3.5 h-3.5" /> Tambah Item
                    </button>
                    <button onClick={() => openItemModal(divisi.id, true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-slate-700/80 transition-all">
                      <Type className="w-3.5 h-3.5" /> Tambah Sub-Header
                    </button>
                    <button onClick={() => openCatModal(divisi)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700/80 transition-all">
                      <Edit3 className="w-3.5 h-3.5" /> Edit Divisi
                    </button>
                    <button onClick={() => confirmDelete('category', divisi.id, divisi.nama_kategori)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg border border-rose-200 dark:border-rose-500/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* TAMPILAN MOBILE: KARTU PER ITEM */}
              <div className="block lg:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
                {divisi.items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">Belum ada item di divisi ini.</div>
                ) : (
                  divisi.items.map((item) => (
                    <div key={item.id} className="p-4 bg-white dark:bg-transparent">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 leading-snug">
                        {item.uraian_pekerjaan}
                        {isEditMode && String(item.id).startsWith('temp-') && <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] rounded border border-emerald-200 inline-block align-middle">BARU</span>}
                      </h4>
                      
                      {!item.is_subheader && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                            <span className="block text-[9px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 tracking-wider uppercase">Rencana</span>
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Vol</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{Number(item.volume)} {item.satuan}</span></p>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Harga</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{formatRupiah(item.harga_satuan)}</span></p>
                              <div className="border-t border-blue-200 dark:border-blue-800/30 my-1.5 pt-1.5"><p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">{formatRupiah(item.total_harga)}</p></div>
                            </div>
                          </div>
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-3 border border-emerald-100 dark:border-emerald-900/30">
                            <span className="block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 tracking-wider uppercase">Realisasi</span>
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Vol</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{item.actualVol} {item.satuan}</span></p>
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between"><span>Progres</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{item.volume > 0 ? ((item.actualVol / item.volume) * 100).toFixed(1) : 0}%</span></p>
                              <div className="border-t border-emerald-200 dark:border-emerald-800/30 my-1.5 pt-1.5"><p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{formatRupiah(item.actualTotal)}</p></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {isEditMode && (
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => openItemModal(divisi.id, item.is_subheader, item)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700/80 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-700 dark:text-blue-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
                          <button onClick={() => confirmDelete('item', item.id, item.uraian_pekerjaan)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-700/80 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-700 dark:text-rose-400 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600"><Trash2 className="w-3.5 h-3.5" /> Hapus</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* TAMPILAN DESKTOP: TABEL */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full table-fixed text-left border-collapse min-w-[800px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/40 text-[10px] uppercase text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                    <tr>
                      <th className="px-4 py-2.5 w-[35%] border-r border-slate-200 dark:border-slate-700/40 font-semibold">Uraian Pekerjaan</th>
                      <th className="px-2 py-2.5 w-[6%] border-r border-slate-200 dark:border-slate-700/40 text-center font-semibold">SAT</th>
                      <th className="px-2 py-2.5 w-[7%] border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-blue-600 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/10">Vol (R)</th>
                      <th className="px-3 py-2.5 w-[14%] border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-blue-600 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/10">Harga Sat (R)</th>
                      <th className="px-3 py-2.5 w-[14%] border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-blue-600 dark:text-blue-400/80 bg-blue-50 dark:bg-blue-950/10">Jumlah (R)</th>
                      <th className="px-2 py-2.5 w-[7%] border-r border-slate-200 dark:border-slate-700/40 text-right font-semibold text-emerald-600 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/10">Vol (A)</th>
                      <th className="px-3 py-2.5 w-[17%] text-right font-semibold text-emerald-600 dark:text-emerald-400/80 bg-emerald-50 dark:bg-emerald-950/10">Jumlah Realisasi (A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-[11px] text-slate-700 dark:text-slate-300">
                    {divisi.items.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-6 text-slate-500 italic">Tidak ada item pekerjaan</td></tr>
                    ) : (
                      divisi.items.map((item) => {
                        // Jika Sub-Header
                        if (item.is_subheader) {
                          return (
                            <tr key={item.id} className="bg-slate-100 dark:bg-slate-800/40 group">
                              <td colSpan={7} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700/40">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                                    {item.uraian_pekerjaan}
                                    {isEditMode && String(item.id).startsWith('temp-') && <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] rounded border border-emerald-200 font-bold inline-block align-middle">BARU (Draf)</span>}
                                  </span>
                                  {isEditMode && (
                                    <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 animate-fade-in shrink-0">
                                      <button onClick={() => openItemModal(divisi.id, true, item)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400"><Edit3 className="w-3.5 h-3.5"/></button>
                                      <button onClick={() => confirmDelete('item', item.id, item.uraian_pekerjaan)} className="text-rose-500 hover:text-rose-600 dark:text-rose-400"><Trash2 className="w-3.5 h-3.5"/></button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        // Jika Item Biasa
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors group">
                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-700/40 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" title={item.uraian_pekerjaan}>
                              <div className="flex items-center justify-between">
                                <span className="truncate pr-2 font-medium">
                                  {item.uraian_pekerjaan}
                                  {isEditMode && String(item.id).startsWith('temp-') && <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] rounded border border-emerald-200 font-bold inline-block align-middle">BARU (Draf)</span>}
                                </span>
                                {isEditMode && (
                                  <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 animate-fade-in shrink-0">
                                    <button onClick={() => openItemModal(divisi.id, false, item)} className="text-blue-500 hover:text-blue-600 dark:text-blue-400"><Edit3 className="w-3.5 h-3.5"/></button>
                                    <button onClick={() => confirmDelete('item', item.id, item.uraian_pekerjaan)} className="text-rose-500 hover:text-rose-600 dark:text-rose-400"><Trash2 className="w-3.5 h-3.5"/></button>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center border-r border-slate-200 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 font-mono text-[10px]">{item.satuan}</td>
                            <td className="px-2 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/5">{Number(item.volume)}</td>
                            <td className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/5">{formatRupiah(item.harga_satuan)}</td>
                            <td className="px-3 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/5 text-blue-600 dark:text-blue-300 font-bold">{formatRupiah(item.total_harga)}</td>
                            <td className="px-2 py-3 text-right border-r border-slate-200 dark:border-slate-700/40 font-mono text-[10px] bg-emerald-50/50 dark:bg-emerald-950/5 text-emerald-600 dark:text-emerald-400 font-bold">{item.actualVol}</td>
                            <td className="px-3 py-3 text-right font-mono text-[10px] bg-emerald-50/50 dark:bg-emerald-950/5 text-emerald-600 dark:text-emerald-400 font-bold">{formatRupiah(item.actualTotal)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Card Footer Total per Divisi */}
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-end gap-3 md:gap-4 text-xs">
                <span className="font-extrabold text-slate-700 dark:text-slate-400 uppercase text-[10px]">Subtotal {divisi.nama_kategori}</span>
                <div className="flex items-center justify-between md:justify-end gap-6 font-mono font-bold w-full md:w-auto">
                  <div className="flex flex-col items-start md:items-end">
                    <span className="text-[9px] text-slate-500 uppercase">Rencana (Plan)</span>
                    <span className="text-blue-600 dark:text-blue-400 text-sm">{formatRupiah(divisi.totalRencanaDivisi)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] text-slate-500 uppercase">Realisasi (Actual)</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">{formatRupiah(divisi.totalRealisasiDivisi)}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: KATEGORI / DIVISI                     */}
      {/* ========================================== */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500"/> {catForm.id ? 'Edit Divisi Draf' : 'Tambah Divisi Draf'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={saveCategory}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Divisi / Kategori <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required
                    value={catForm.nama_kategori}
                    onChange={(e) => setCatForm({...catForm, nama_kategori: e.target.value})}
                    placeholder="Contoh: DIVISI 1. UMUM" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">Simpan Draf</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ITEM PEKERJAAN ATAU SUB-HEADER        */}
      {/* ========================================== */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {itemForm.is_subheader ? (
                  <><Type className="w-4 h-4 text-emerald-500"/> {itemForm.id ? 'Edit Sub-Header Draf' : 'Tambah Sub-Header Draf'}</>
                ) : (
                  <><ListPlus className="w-4 h-4 text-emerald-500"/> {itemForm.id ? 'Edit Item Draf' : 'Tambah Item Draf'}</>
                )}
              </h3>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={saveItem}>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {itemForm.is_subheader ? 'Nama Sub-Header / Kelompok Pekerjaan' : 'Uraian Pekerjaan'} <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    required rows="2"
                    value={itemForm.uraian_pekerjaan}
                    onChange={(e) => setItemForm({...itemForm, uraian_pekerjaan: e.target.value})}
                    placeholder={itemForm.is_subheader ? "Contoh: Mobilisasi & Peralatan" : "Contoh: Sewa Excavator 80-140 HP"} 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 resize-none" 
                  />
                </div>
                
                {!itemForm.is_subheader && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Satuan <span className="text-rose-500">*</span></label>
                      <input type="text" required value={itemForm.satuan} onChange={(e) => setItemForm({...itemForm, satuan: e.target.value})} placeholder="Ls / m3" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-center" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Volume <span className="text-rose-500">*</span></label>
                      <input type="number" step="any" required min="0" value={itemForm.volume} onChange={(e) => setItemForm({...itemForm, volume: e.target.value})} placeholder="0.00" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-center font-mono" />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Harga Satuan <span className="text-rose-500">*</span></label>
                      <input type="number" step="any" required min="0" value={itemForm.harga_satuan} onChange={(e) => setItemForm({...itemForm, harga_satuan: e.target.value})} placeholder="0" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 text-right font-mono" />
                    </div>
                  </div>
                )}
                
                {(!itemForm.is_subheader && itemForm.volume && itemForm.harga_satuan) ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl flex items-center justify-between mt-2 animate-fade-in">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Total Harga Otomatis:</span>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400 font-mono">
                      {formatRupiah(Number(itemForm.volume) * Number(itemForm.harga_satuan))}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl shadow-sm">Batal</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md">Simpan Draf</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: KONFIRMASI HAPUS DARI DRAFT           */}
      {/* ========================================== */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus dari Draf?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              <strong className="text-slate-700 dark:text-slate-300">{deleteConfig.name}</strong> akan dihilangkan sementara dari layar edit ini.
              <br/><br/>
              <span className="italic text-rose-500 font-medium">Data baru akan terhapus permanen dari Database saat Anda menekan tombol "Simpan Perubahan".</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, type: '', id: null, name: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
              <button onClick={executeDeleteDraft} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-2">
                <Trash2 className="w-4 h-4"/> Sembunyikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LAINNYA TETAP SAMA (Export & Import) */}
      {exportModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${exportModal.type === 'excel' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200'}`}>
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Export</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">Sistem akan mengunduh dokumen RAB dan Realisasi dalam format <strong className="uppercase">{exportModal.type}</strong>. Proses ini mungkin memakan waktu beberapa detik.</p>
            <div className="flex gap-3">
              <button disabled={isExporting} onClick={() => setExportModal({ show: false, type: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
              <button disabled={isExporting} onClick={executeExport} className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl shadow-md flex justify-center items-center gap-2 transition-all ${exportModal.type === 'excel' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>} {isExporting ? 'Memproses...' : 'Unduh Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-500/20"><UploadCloud className="w-6 h-6 text-emerald-500" /></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Import RAB via Excel</h3>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500/50 rounded-xl p-8 mb-4 bg-slate-50 dark:bg-slate-900/50 relative transition-all group overflow-hidden">
              <input type="file" accept=".xlsx, .xls" onChange={(e) => setImportFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-400 group-hover:text-emerald-500 transition-colors mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 truncate px-4">{importFile ? importFile.name : "Seret file excel disini atau Klik"}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Format yang didukung: .xlsx, .xls</p>
            </div>
            <div className="flex gap-3">
              <button disabled={isImporting} onClick={() => { setShowImportModal(false); setImportFile(null); }} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors disabled:opacity-50">Batal</button>
              <button disabled={isImporting || !importFile} onClick={handleImportRAB} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-2 shadow-md transition-colors disabled:opacity-50">
                {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4"/>} {isImporting ? 'Mengimpor...' : 'Import Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}