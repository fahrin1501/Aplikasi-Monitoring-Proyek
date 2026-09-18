import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../api'; 
import { Loader2, ShieldAlert } from 'lucide-react';

import NavigasiRAB from './Rab/NavigasiRAB';
import SummaryRAB from './Rab/SummaryRAB';
import FilterRAB from './Rab/FilterRAB';
import TabelRAB from './Rab/TabelRAB';
import ModalRAB from './Rab/ModalRAB';

export default function ProjectRAB() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [userRole, setUserRole] = useState('Tamu');
  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setUserRole(user.role || 'Tamu');
      } catch (error) {}
    }
  }, []);

  const canCreateData = ['Administrator', 'Team Leader', 'Pengawas Lapangan'].includes(userRole);
  const isGuest = userRole === 'Tamu';
  
  // HAK AKSES BARU: Hanya Admin & Direktur yang bisa melihat Harga & Jumlah Uang
  const canViewPrices = ['Administrator', 'Direktur'].includes(userRole);

  // --- STATE UTAMA ---
  const [projectData, setProjectData] = useState(null);
  const [rabs, setRabs] = useState([]);
  const [realisasiKegiatan, setRealisasiKegiatan] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Indikator loading saat simpan API

  // --- STATE FILTER & PENCARIAN ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDivisi, setActiveDivisi] = useState('Semua');

  // --- STATE EDIT MODE (DIRECT EDIT) ---
  const [isEditMode, setIsEditMode] = useState(false);

  // --- STATE MODAL & FORM ---
  const [showCatModal, setShowCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ id: null, kode_divisi: '', nama_kategori: '' });

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    id: null, rab_category_id: null, kode_pekerjaan: '', uraian_pekerjaan: '', satuan: '', volume: '', harga_satuan: '', is_subheader: false
  });

  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });
  const [exportModal, setExportModal] = useState({ show: false, type: '' });
  const [isExporting, setIsExporting] = useState(false);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // --- FETCH DATA ---
  const fetchData = async () => {
    if (isGuest) { setIsLoading(false); return; }
    try {
      const [projRes, rabRes, reportRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/rabs`),
        api.get(`/daily-reports`).catch(() => ({ data: { data: [] } }))
      ]);
      
      setProjectData(projRes.data);
      setRabs(rabRes.data.data);

      const allReports = reportRes.data?.data || [];
      const approvedReports = allReports.filter(r => r.project_id.toString() === id.toString() && r.status === 'approved');

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
    } catch (error) { console.error("Gagal memuat data:", error); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id, isGuest]);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka || 0);

  // ======================================================================
  // DIRECT SAVE LOGIC (LANGSUNG TEMBAK KE DATABASE)
  // ======================================================================
  const saveCategory = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (catForm.id) {
        await api.put(`/rabs/categories/${catForm.id}`, { kode_divisi: catForm.kode_divisi, nama_kategori: catForm.nama_kategori });
      } else {
        await api.post(`/projects/${id}/rabs/categories`, { kode_divisi: catForm.kode_divisi, nama_kategori: catForm.nama_kategori });
      }
      await fetchData();
      setShowCatModal(false);
    } catch (error) {
      alert("Gagal menyimpan kategori. Pastikan koneksi stabil.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        rab_category_id: itemForm.rab_category_id,
        kode_pekerjaan: itemForm.kode_pekerjaan,
        uraian_pekerjaan: itemForm.uraian_pekerjaan,
        satuan: itemForm.satuan,
        volume: parseFloat(itemForm.volume) || 0,
        harga_satuan: parseFloat(itemForm.harga_satuan) || 0,
        is_subheader: itemForm.is_subheader
      };

      if (itemForm.id) {
        await api.put(`/rab-items/${itemForm.id}`, payload);
      } else {
        await api.post(`/rabs/categories/${itemForm.rab_category_id}/items`, payload);
      }
      await fetchData();
      setShowItemModal(false);
    } catch (error) {
      alert("Gagal menyimpan item. Pastikan koneksi stabil.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    setIsSaving(true);
    try {
      if (deleteConfig.type === 'category') {
        await api.delete(`/rabs/categories/${deleteConfig.id}`);
      } else if (deleteConfig.type === 'item') {
        await api.delete(`/rab-items/${deleteConfig.id}`);
      }
      await fetchData();
      setDeleteConfig({ show: false, type: '', id: null, name: '' });
    } catch (error) {
      alert("Gagal menghapus data. Data mungkin terikat dengan laporan harian.");
    } finally {
      setIsSaving(false);
    }
  };

  const executeExport = async () => {
    setIsExporting(true);
    try {
      const ext = exportModal.type === 'excel' ? 'xlsx' : 'pdf';
      const response = await api.get(`/projects/${id}/export-rab/${exportModal.type}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `RAB_${projectData.nama_proyek ? projectData.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_') : 'Proyek'}.${ext}`);
      document.body.appendChild(link); link.click(); link.remove();
      setExportModal({ show: false, type: '' });
    } catch (error) { alert(`Gagal mengunduh file.`); } 
    finally { setIsExporting(false); }
  };

  const handleImportRAB = async () => {
    if (!importFile) return;
    setIsImporting(true);
    const formData = new FormData(); formData.append('file', importFile);
    try {
      await api.post(`/projects/${id}/import-rab`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Data RAB berhasil di-import!');
      setShowImportModal(false); setImportFile(null); fetchData(); 
    } catch (error) { alert(`Gagal Import. Pastikan format sesuai.`); } 
    finally { setIsImporting(false); }
  };

  // --- MEMOIZED CALCULATIONS ---
  const { rabsWithRealization, filteredRabsView, grandTotalRencana, grandTotalRealisasi } = useMemo(() => {
    if (!projectData) return { rabsWithRealization: [], filteredRabsView: [], grandTotalRencana: 0, grandTotalRealisasi: 0 };
    let gRencana = 0, gRealisasi = 0;

    const rabsWithRealization = rabs.map(divisi => {
      let tRencana = 0, tRealisasi = 0;
      const items = divisi.items.map(item => {
        let actualVol = 0, actualTotal = 0;
        if (!item.is_subheader) {
          actualVol = realisasiKegiatan[item.id] || 0; 
          actualTotal = actualVol * Number(item.harga_satuan || 0);
          tRencana += Number(item.total_harga || 0); tRealisasi += actualTotal;
        }
        return { ...item, actualVol, actualTotal };
      });
      gRencana += tRencana; gRealisasi += tRealisasi;
      return { ...divisi, items, totalRencanaDivisi: tRencana, totalRealisasiDivisi: tRealisasi };
    });

    const query = searchQuery.toLowerCase();
    const filteredRabsView = rabsWithRealization.map(divisi => {
      if (activeDivisi !== 'Semua' && divisi.nama_kategori !== activeDivisi) return null;
      const filteredItems = divisi.items.filter(i => (i.uraian_pekerjaan && i.uraian_pekerjaan.toLowerCase().includes(query)) || (i.kode_pekerjaan && i.kode_pekerjaan.toLowerCase().includes(query)));
      if (query && filteredItems.length === 0 && !(divisi.nama_kategori?.toLowerCase().includes(query)) && !(divisi.kode_divisi?.toLowerCase().includes(query))) return null;
      return { ...divisi, items: query ? filteredItems : divisi.items };
    }).filter(Boolean);

    return { rabsWithRealization, filteredRabsView, grandTotalRencana: gRencana, grandTotalRealisasi: gRealisasi };
  }, [rabs, realisasiKegiatan, searchQuery, activeDivisi, projectData]);

  if (isGuest) {
    return (
      <div className="flex flex-col items-center justify-center p-20 w-full h-[60vh] bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Akses Ditolak</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">Akun Tamu tidak diizinkan melihat Rencana Anggaran Biaya (RAB) dan rincian keuangan proyek.</p>
        <button onClick={() => navigate(`/projects/${id}/data`)} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-bold transition-all">Kembali</button>
      </div>
    );
  }

  if (isLoading || !projectData) return <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 text-amber-500 animate-spin" /></div>;

  const paguKontrak = Number(projectData.nilai_kontrak) || 1; 
  const pctRencanaRaw = (grandTotalRencana / paguKontrak) * 100;
  const pctRealisasiRaw = (grandTotalRealisasi / paguKontrak) * 100;
  const pctRencanaCSS = Math.min(pctRencanaRaw, 100);
  const pctRealisasiCSS = Math.min(pctRealisasiRaw, 100);

  return (
    <div className="w-full space-y-5 relative pb-20">
      <NavigasiRAB 
        id={id} projectData={projectData} isEditMode={isEditMode} setIsEditMode={setIsEditMode} canCreateData={canCreateData} 
        openCatModal={() => { setCatForm({ id: null, kode_divisi: '', nama_kategori: '' }); setShowCatModal(true); }} 
        setShowImportModal={setShowImportModal} setExportModal={setExportModal}
      />
      
      {canViewPrices && (
        <SummaryRAB 
          paguKontrak={paguKontrak} grandTotalRencana={grandTotalRencana} grandTotalRealisasi={grandTotalRealisasi} 
          pctRencanaRaw={pctRencanaRaw} pctRealisasiRaw={pctRealisasiRaw} pctRencanaCSS={pctRencanaCSS} 
          pctRealisasiCSS={pctRealisasiCSS} isRencanaBigger={pctRencanaCSS > pctRealisasiCSS} formatRupiah={formatRupiah} isEditMode={isEditMode}
        />
      )}

      <FilterRAB 
        currentRabs={rabs} activeDivisi={activeDivisi} setActiveDivisi={setActiveDivisi} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
      />
      
      <TabelRAB 
        rabsWithRealization={rabsWithRealization} filteredRabsView={filteredRabsView} isEditMode={isEditMode} formatRupiah={formatRupiah}
        openCatModal={(cat) => { setCatForm({ id: cat.id, kode_divisi: cat.kode_divisi || '', nama_kategori: cat.nama_kategori }); setShowCatModal(true); }}
        openItemModal={(catId, isSub, item) => {
          if (item) setItemForm({ id: item.id, rab_category_id: catId, kode_pekerjaan: item.kode_pekerjaan || '', uraian_pekerjaan: item.uraian_pekerjaan, satuan: item.satuan || '', volume: item.volume || '', harga_satuan: item.harga_satuan || '', is_subheader: item.is_subheader });
          else setItemForm({ id: null, rab_category_id: catId, kode_pekerjaan: '', uraian_pekerjaan: '', satuan: '', volume: '', harga_satuan: '', is_subheader: isSub });
          setShowItemModal(true);
        }}
        confirmDelete={(type, id, name) => setDeleteConfig({ show: true, type, id, name })}
        setSearchQuery={setSearchQuery} setActiveDivisi={setActiveDivisi}
        canViewPrices={canViewPrices}
      />
      s
      <ModalRAB 
        showCatModal={showCatModal} setShowCatModal={setShowCatModal} catForm={catForm} setCatForm={setCatForm} saveCategory={saveCategory}
        showItemModal={showItemModal} setShowItemModal={setShowItemModal} itemForm={itemForm} setItemForm={setItemForm} saveItem={saveItem} formatRupiah={formatRupiah}
        deleteConfig={deleteConfig} setDeleteConfig={setDeleteConfig} executeDelete={executeDelete} isSaving={isSaving}
        exportModal={exportModal} setExportModal={setExportModal} isExporting={isExporting} executeExport={executeExport}
        showImportModal={showImportModal} setShowImportModal={setShowImportModal} importFile={importFile} setImportFile={setImportFile} isImporting={isImporting} handleImportRAB={handleImportRAB}
        canViewPrices={canViewPrices}
      />
    </div>
  );
}