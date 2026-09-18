import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../../../api'; 
import { Loader2, ShieldAlert } from 'lucide-react';

import NavigasiRAB from './Rab/NavigasiRAB';
import SummaryRAB from './Rab/SummaryRAB';
import FilterRAB from './Rab/FilterRAB';
import TabelRAB from './Rab/TabelRAB';
import ModalRAB from './Rab/ModalRAB';

export default function ProjectRAB() {
  const { id } = useParams();

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

  const [projectData, setProjectData] = useState(null);
  const [rabs, setRabs] = useState([]);
  const [realisasiKegiatan, setRealisasiKegiatan] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDivisi, setActiveDivisi] = useState('Semua');

  const [isEditMode, setIsEditMode] = useState(false);
  const [localRabs, setLocalRabs] = useState([]);
  const [deletedCatIds, setDeletedCatIds] = useState([]);
  const [deletedItemIds, setDeletedItemIds] = useState([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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

  const handleToggleEdit = () => {
    setLocalRabs(JSON.parse(JSON.stringify(rabs))); 
    setDeletedCatIds([]); setDeletedItemIds([]); setIsEditMode(true);
  };

  const handleBatalEdit = () => {
    setLocalRabs([]); setDeletedCatIds([]); setDeletedItemIds([]); setIsEditMode(false);
  };

  const saveCategory = (e) => {
    e.preventDefault();
    let updated = [...localRabs];
    if (catForm.id) {
      const idx = updated.findIndex(c => c.id === catForm.id);
      if (idx > -1) {
        // TANDAI BAHWA DIVISI INI DIEDIT
        updated[idx] = { ...updated[idx], kode_divisi: catForm.kode_divisi, nama_kategori: catForm.nama_kategori, is_modified: true };
      }
    } else {
      updated.push({ id: `temp-cat-${Date.now()}`, kode_divisi: catForm.kode_divisi, nama_kategori: catForm.nama_kategori, items: [], is_modified: true });
    }
    setLocalRabs(updated);
    setShowCatModal(false);
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
      kode_pekerjaan: itemForm.kode_pekerjaan, 
      uraian_pekerjaan: itemForm.uraian_pekerjaan,
      satuan: itemForm.satuan, 
      volume: vol, 
      harga_satuan: hrg, 
      total_harga: vol * hrg, 
      is_subheader: itemForm.is_subheader,
      is_modified: true // TANDAI BAHWA ITEM INI DIEDIT
    };

    if (itemForm.id) {
      const itemIdx = updated[catIdx].items.findIndex(i => i.id === itemForm.id);
      if (itemIdx > -1) {
        updated[catIdx].items[itemIdx] = newItem;
      }
    } else {
      updated[catIdx].items.push(newItem);
    }
    setLocalRabs(updated); 
    setShowItemModal(false);
  };

  const executeDeleteDraft = () => {
    let updated = [...localRabs];
    if (deleteConfig.type === 'category') {
      if (!String(deleteConfig.id).startsWith('temp-')) setDeletedCatIds(prev => [...prev, deleteConfig.id]);
      updated = updated.filter(c => c.id !== deleteConfig.id);
    } else if (deleteConfig.type === 'item') {
      if (!String(deleteConfig.id).startsWith('temp-')) setDeletedItemIds(prev => [...prev, deleteConfig.id]);
      updated = updated.map(c => ({ ...c, items: c.items.filter(item => item.id !== deleteConfig.id) }));
    }
    setLocalRabs(updated); setDeleteConfig({ show: false, type: '', id: null, name: '' });
  };

  // ======================================================================
  // SISTEM SAVE SUPER CEPAT (HANYA UPDATE YANG DIEDIT SAJA)
  // ======================================================================
  const handleSelesaiEdit = async () => {
    setIsSavingEdit(true);
    try {
      // 1. Eksekusi data yang dihapus (Secara Paralel)
      if (deletedItemIds.length > 0 || deletedCatIds.length > 0) {
        await Promise.all([
          ...deletedItemIds.map(dId => api.delete(`/rab-items/${dId}`)),
          ...deletedCatIds.map(cId => api.delete(`/rabs/categories/${cId}`))
        ]);
      }

      // 2. Loop kategori dan item satu per satu (Sekuensial agar aman)
      for (const cat of localRabs) {
        let realCatId = cat.id;

        // Jika kategori baru
        if (String(cat.id).startsWith('temp-')) {
          const res = await api.post(`/projects/${id}/rabs/categories`, { kode_divisi: cat.kode_divisi, nama_kategori: cat.nama_kategori });
          realCatId = res.data?.data?.id || res.data?.id;
        } 
        // Jika kategori diedit
        else if (cat.is_modified) {
          await api.put(`/rabs/categories/${cat.id}`, { kode_divisi: cat.kode_divisi, nama_kategori: cat.nama_kategori });
        }

        // Loop item di dalamnya
        for (const item of cat.items) {
          // JIKA BUKAN ITEM BARU DAN BUKAN ITEM YANG DIEDIT, LEWATI (Ini kunci agar tidak ngelag!)
          if (!String(item.id).startsWith('temp-') && !item.is_modified) {
            continue;
          }

          const itemPayload = { 
            rab_category_id: realCatId, 
            kode_pekerjaan: item.kode_pekerjaan, 
            uraian_pekerjaan: item.uraian_pekerjaan, 
            satuan: item.satuan, 
            volume: item.volume, 
            harga_satuan: item.harga_satuan, 
            is_subheader: item.is_subheader 
          };

          if (String(item.id).startsWith('temp-')) {
            await api.post(`/rabs/categories/${realCatId}/items`, itemPayload);
          } else {
            await api.put(`/rab-items/${item.id}`, itemPayload);
          }
        }
      }

      // Refresh Data Baru
      await fetchData(); 
      setDeletedCatIds([]); 
      setDeletedItemIds([]); 
      setIsEditMode(false);
      alert("Perubahan draf RAB berhasil disimpan dengan cepat!");
    } catch (error) { 
      console.error(error);
      alert("Gagal menyimpan perubahan. Pastikan koneksi stabil."); 
    } finally { 
      setIsSavingEdit(false); 
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

  const { rabsWithRealization, filteredRabsView, grandTotalRencana, grandTotalRealisasi } = useMemo(() => {
    if (!projectData) return { rabsWithRealization: [], filteredRabsView: [], grandTotalRencana: 0, grandTotalRealisasi: 0 };
    let gRencana = 0, gRealisasi = 0;
    const currentRabs = isEditMode ? localRabs : rabs;

    const rabsWithRealization = currentRabs.map(divisi => {
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
  }, [rabs, localRabs, isEditMode, realisasiKegiatan, searchQuery, activeDivisi, projectData]);

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

  let createdTimestamp = null;
  let updatedTimestamp = null;

  if (rabs.length > 0) {
    let maxUpdated = 0; let minCreated = Infinity;
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

  return (
    <div className="w-full space-y-5 relative pb-20">
      <NavigasiRAB 
        id={id} projectData={projectData} isEditMode={isEditMode} canCreateData={canCreateData} isGuest={isGuest} 
        isSavingEdit={isSavingEdit} handleBatalEdit={handleBatalEdit} handleToggleEdit={handleToggleEdit} 
        handleSelesaiEdit={handleSelesaiEdit} openCatModal={() => { setCatForm({ id: null, kode_divisi: '', nama_kategori: '' }); setShowCatModal(true); }} 
        setShowImportModal={setShowImportModal} setExportModal={setExportModal}
      />
      <SummaryRAB 
        paguKontrak={paguKontrak} grandTotalRencana={grandTotalRencana} grandTotalRealisasi={grandTotalRealisasi} 
        pctRencanaRaw={pctRencanaRaw} pctRealisasiRaw={pctRealisasiRaw} pctRencanaCSS={pctRencanaCSS} 
        pctRealisasiCSS={pctRealisasiCSS} isRencanaBigger={pctRencanaCSS > pctRealisasiCSS} isEditMode={isEditMode} formatRupiah={formatRupiah} 
      />
      <FilterRAB 
        currentRabs={isEditMode ? localRabs : rabs} activeDivisi={activeDivisi} setActiveDivisi={setActiveDivisi} 
        searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
      />
      
      {/* TAMPILAN TIMESTAMP */}
      {rabsWithRealization.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-4 px-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-500" /> Dibuat: <span className="font-bold text-slate-700 dark:text-slate-300">{formatTimestamp(createdTimestamp)}</span></span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> Diupdate: <span className="font-bold text-slate-700 dark:text-slate-300">{formatTimestamp(updatedTimestamp)}</span></span>
        </div>
      )}

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
      />
      <ModalRAB 
        showCatModal={showCatModal} setShowCatModal={setShowCatModal} catForm={catForm} setCatForm={setCatForm} saveCategory={saveCategory}
        showItemModal={showItemModal} setShowItemModal={setShowItemModal} itemForm={itemForm} setItemForm={setItemForm} saveItem={saveItem} formatRupiah={formatRupiah}
        deleteConfig={deleteConfig} setDeleteConfig={setDeleteConfig} executeDeleteDraft={executeDeleteDraft}
        exportModal={exportModal} setExportModal={setExportModal} isExporting={isExporting} executeExport={executeExport}
        showImportModal={showImportModal} setShowImportModal={setShowImportModal} importFile={importFile} setImportFile={setImportFile} isImporting={isImporting} handleImportRAB={handleImportRAB}
      />
    </div>
  );
}