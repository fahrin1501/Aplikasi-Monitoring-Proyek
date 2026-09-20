import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../../api'; 
import { 
  Compass, ArrowLeft, Info, FileSpreadsheet, TrendingUp, 
  Navigation, Globe, Map as MapIcon, 
  CheckCircle2, FileText, Download, Edit3, Save, X, Loader2, AlertTriangle, Trash2, UploadCloud, MapPin, Eye, EyeOff, Crosshair
} from 'lucide-react';

import { MapContainer, TileLayer, Rectangle, Polygon, Polyline, Tooltip, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Kustomisasi Icon Marker
const createCustomIcon = (color) => {
  return new L.DivIcon({
    className: 'custom-leaflet-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7] 
  });
};

const projectIcon = createCustomIcon('#f59e0b'); 
const reportIcon = createCustomIcon('#10b981');  

const INDONESIA_BOUNDS = [[-11.00, 94.00], [6.00, 141.00]];

// Helper Efek Kamera Peta
function MapEffectController({ bounds, focusBounds }) {
  const map = useMap();
  useEffect(() => {
    if (!focusBounds && bounds && bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
  }, [JSON.stringify(bounds), map]);
  useEffect(() => {
    if (focusBounds && focusBounds.length > 0) map.flyToBounds(focusBounds, { duration: 1.5, maxZoom: 18, padding: [60, 60] });
  }, [focusBounds, map]);
  return null;
}

// Helper untuk membaca format "-3.300230, 114.595202" menjadi array [lat, long]
const parseCoord = (coordString) => {
  if (!coordString || typeof coordString !== 'string') return null;
  const parts = coordString.split(',').map(n => parseFloat(n.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts;
  }
  return null;
};

export default function PetaGIS() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });

  const [projectZones, setProjectZones] = useState([]);
  const [reportZones, setReportZones] = useState([]);
  
  const [hiddenReports, setHiddenReports] = useState(new Set());
  const [focusBounds, setFocusBounds] = useState(null);
  const [hideMainProject, setHideMainProject] = useState(false);

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [userRole, setUserRole] = useState('Tamu');

  useEffect(() => {
    document.title = "PrismaGroup - Peta GIS";
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

  // --- FETCH DATA ---
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/projects/${id}`);
      setProjectData(response.data);
      
      const resGis = await api.get(`/projects/${id}/gis`);
      const zones = resGis.data?.data || [];
      setProjectZones(zones);

      const mainZone = zones.length > 0 ? zones[0] : {};
      
      setEditForm({
        status_lahan: mainZone.status_lahan || '',
        geojson_data: mainZone.geojson_data || '',
        koordinat_awal: mainZone.koordinat_awal || '',
        koordinat_akhir: mainZone.koordinat_akhir || '',
      });

      const resReports = await api.get(`/daily-reports`);
      const allReports = resReports.data?.data || [];
      const projectReports = allReports.filter(rep => rep.project_id == id);
      
      const extractedReportZones = [];
      projectReports.forEach(rep => {
        rep.activities?.forEach(act => {
          if (act.sta_awal && act.sta_akhir && act.sta_awal.includes(',') && act.sta_akhir.includes(',')) {
            const [latA, lonA] = act.sta_awal.split(',').map(n => parseFloat(n.trim()));
            const [latB, lonB] = act.sta_akhir.split(',').map(n => parseFloat(n.trim()));
            if (!isNaN(latA) && !isNaN(lonA) && !isNaN(latB) && !isNaN(lonB)) {
              extractedReportZones.push({
                report_id: rep.id, tanggal: rep.tanggal, uraian: act.uraian,
                volume: act.volume, satuan: act.satuan, latA, lonA, latB, lonB
              });
            }
          }
        });
      });
      setReportZones(extractedReportZones);
    } catch (error) {
      setErrorMsg('Gagal memuat data spasial proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [id]);

  // --- ROUTING URL FILE ---
  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : '';
  const getDocUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    return `${BASE_URL}/${path.replace(/^\//, '')}`;
  };

  const handleChange = (e) => { setEditForm({ ...editForm, [e.target.name]: e.target.value }); };

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

  const handleSaveGIS = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const zonePayload = {
        koordinat_awal: editForm.koordinat_awal, 
        koordinat_akhir: editForm.koordinat_akhir,
        status_lahan: editForm.status_lahan,     
        geojson_data: editForm.geojson_data      
      };

      if (projectZones.length > 0) {
        await api.put(`/projects/${id}/gis/${projectZones[0].id}`, zonePayload);
      } else {
        await api.post(`/projects/${id}/gis`, zonePayload);
      }
      await fetchAllData();
      setIsEditMode(false);
    } catch (error) {
      alert("Gagal menyimpan data spasial. Periksa format koordinat.");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    const mainZone = projectZones.length > 0 ? projectZones[0] : {};
    setEditForm({
      status_lahan: mainZone.status_lahan || '',
      geojson_data: mainZone.geojson_data || '',
      koordinat_awal: mainZone.koordinat_awal || '',
      koordinat_akhir: mainZone.koordinat_akhir || '',
    });
    setIsEditMode(false);
  };

  const handleUploadDocument = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('dokumen_gis[]', file));
    e.target.value = null; 
    try {
      await api.post(`/projects/${id}/gis-documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchAllData();
    } catch (err) { alert("Gagal mengunggah dokumen GIS."); }
  };

  const confirmDeleteDocument = (docId, docName) => { setDeleteConfig({ show: true, type: 'document', id: docId, name: docName }); };

  const executeDelete = async () => {
    try {
      if (deleteConfig.type === 'document') await api.delete(`/gis-documents/${deleteConfig.id}`);
      setDeleteConfig({ show: false, type: '', id: null, name: '' });
      fetchAllData(); 
    } catch (error) { alert(`Gagal menghapus data.`); }
  };

  // --- LOGIKA POLYGON & ROTASI KOTAK AREA ---
  const toggleReportVisibility = (index) => {
    const newHidden = new Set(hiddenReports);
    if (newHidden.has(index)) newHidden.delete(index);
    else newHidden.add(index);
    setHiddenReports(newHidden);
  };

  const PADDING = 0.0003; 
  const getBoundsWithPadding = (lat1, lon1, lat2, lon2) => {
    const l1 = parseFloat(lat1), ln1 = parseFloat(lon1), l2 = parseFloat(lat2), ln2 = parseFloat(lon2);
    return [
      [Math.min(l1, l2) - PADDING, Math.min(ln1, ln2) - PADDING], 
      [Math.max(l1, l2) + PADDING, Math.max(ln1, ln2) + PADDING]
    ];
  };

  const createRotatedBox = (lat1, lon1, lat2, lon2) => {
    const l1 = parseFloat(lat1), ln1 = parseFloat(lon1), l2 = parseFloat(lat2), ln2 = parseFloat(lon2);
    const dLat = l2 - l1, dLng = ln2 - ln1;
    const length = Math.sqrt(dLat * dLat + dLng * dLng);

    if (length === 0) return [[l1 - 0.0001, ln1 - 0.0001], [l1 + 0.0001, ln1 - 0.0001], [l1 + 0.0001, ln1 + 0.0001], [l1 - 0.0001, ln1 + 0.0001]];

    const offsetLat = 0.0001 * (-dLng / length);
    const offsetLng = 0.0001 * (dLat / length);

    return [
      [l1 + offsetLat, ln1 + offsetLng], 
      [l1 - offsetLat, ln1 - offsetLng], 
      [l2 - offsetLat, ln2 - offsetLng], 
      [l2 + offsetLat, ln2 + offsetLng]  
    ];
  };

  const getBoundsFromPolygon = (polygonCoords) => {
    const lats = polygonCoords.map(c => c[0]), lngs = polygonCoords.map(c => c[1]);
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]];
  };

  const triggerFocusMain = (coordAwalStr, coordAkhirStr) => {
    const coordAwal = parseCoord(coordAwalStr), coordAkhir = parseCoord(coordAkhirStr);
    if (coordAwal && coordAkhir) setFocusBounds(getBoundsWithPadding(coordAwal[0], coordAwal[1], coordAkhir[0], coordAkhir[1]));
  };

  const triggerFocusReport = (latA, lonA, latB, lonB) => {
    if (latA && lonA && latB && lonB) setFocusBounds(getBoundsFromPolygon(createRotatedBox(latA, lonA, latB, lonB)));
  };

  const mainZone = projectZones.length > 0 ? projectZones[0] : null;
  const coordAwal = parseCoord(mainZone?.koordinat_awal);
  const coordAkhir = parseCoord(mainZone?.koordinat_akhir);
  const hasProjectBounds = coordAwal && coordAkhir;
  const isGisEmpty = projectZones.length === 0; 

  let allBounds = [];
  if (hasProjectBounds && !hideMainProject) {
    allBounds.push([coordAwal[0], coordAwal[1]]);
    allBounds.push([coordAkhir[0], coordAkhir[1]]);
  }

  reportZones.forEach((z, idx) => {
    if (!hiddenReports.has(idx)) allBounds.push(...getBoundsFromPolygon(createRotatedBox(z.latA, z.lonA, z.latB, z.lonB)));
  });

  const kalimantanCenter = [-1.5, 115.0];
  const initialZoom = allBounds.length > 0 ? 17 : 5;
  const mapCenter = allBounds.length > 0 ? allBounds[0] : kalimantanCenter;
  const gisDocuments = projectData?.gis_documents || [];
  const wilayahAdministrasi = projectData?.lokasi_wilayah || projectData?.lokasi || projectData?.lokasi_proyek || '-';

  return (
    <div className="w-full space-y-5 pb-20 relative">

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #f59e0b; cursor: pointer;}
      `}</style>

      {/* ========================================== */}
      {/* 1. HEADER NAVIGASI (Selalu Tampil)           */}
      {/* ========================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0 mb-2">
        <div className="flex items-start lg:items-center gap-3 shrink-0">
          <Link to={`/projects/${id}/data`} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 rounded-xl transition-all shadow-sm mt-0.5 lg:mt-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-800 dark:text-white leading-snug flex items-start lg:items-center gap-1.5 flex-wrap">
              <span>Peta & Informasi Spasial (GIS)</span>
              {isEditMode && <span className="px-2 py-0.5 ml-2 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-md animate-pulse border border-blue-200 font-extrabold tracking-wider">DRAFT MODE</span>}
            </h1>
            
            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              <span className="truncate font-medium">{projectData?.nama_proyek || 'Memuat Data...'}</span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className="truncate" title={`Kns: ${projectData?.kode_kontrak || '-'} | Knt: ${projectData?.nomor_kontrak_kontraktor || '-'}`}>
                SPK: {projectData?.kode_kontrak || projectData?.nomor_kontrak_kontraktor || '-'}
              </span>
              <span className="text-slate-400 mx-0.5">•</span>
              <span className={`px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider shadow-sm truncate ${getCategoryStyle(projectData?.kategori)}`}>
                {projectData?.kategori || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-2 w-full lg:w-auto mt-2 lg:mt-0">
          
          {canCreateData && !isGisEmpty && !isLoading && (
            <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm transition-all duration-300">
              {isEditMode && (
                <button onClick={cancelEdit} disabled={isSaving} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap">
                  <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> Batal
                </button>
              )}
              <button onClick={isEditMode ? handleSaveGIS : () => setIsEditMode(true)} disabled={isSaving} className={`flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap shadow-sm ${isEditMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-slate-300'}`}>
                {isSaving ? <Loader2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 animate-spin" /> : (isEditMode ? <CheckCircle2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> : <Edit3 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />)} 
                <span className="hidden lg:inline">{isSaving ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Mode Edit Draf')}</span>
              </button>
            </div>
          )}

          <div className="flex items-center w-full lg:w-auto justify-between lg:justify-start gap-1 bg-white dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-x-auto custom-scrollbar z-0">
            <button onClick={() => navigate(`/projects/${id}/data`)} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><Info className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Data Utama</span></button>
            {!isGuest && (
              <>
                <button onClick={() => navigate(`/projects/${id}/rab`)} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><FileSpreadsheet className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">RAB</span></button>
                <button onClick={() => navigate(`/projects/${id}/kurva-s`)} className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium rounded-lg transition-all whitespace-nowrap"><TrendingUp className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-amber-500" /> <span className="hidden lg:inline">Kurva S</span></button>
              </>
            )}
            <button className="flex-1 lg:flex-none flex justify-center items-center gap-1.5 py-2 lg:py-1.5 lg:px-3 bg-amber-500 text-white dark:text-slate-950 text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-default whitespace-nowrap"><Compass className="w-4 h-4 lg:w-3.5 lg:h-3.5" /> <span className="hidden lg:inline">Peta GIS</span></button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. LOADING STATE VS MAIN CONTENT             */}
      {/* ========================================== */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Memuat Peta & Data Spasial...
          </p>
        </div>
      ) : errorMsg || !projectData ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm text-center animate-fade-in">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Proyek Tidak Ditemukan</h2>
          <button onClick={() => navigate('/projects')} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold mt-4">Kembali ke Daftar</button>
        </div>
      ) : isGisEmpty ? (
        <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-8 md:p-12 shadow-sm text-center min-h-[50vh] animate-fade-in">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner"><Compass className="w-10 h-10 text-amber-500" /></div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-2">Peta Spasial Belum Diatur</h2>
          
          {canCreateData ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-lg leading-relaxed mx-auto">Silakan tentukan titik koordinat awal dan akhir proyek untuk mengaktifkan pemantauan visual. Data ini akan menjadi batas acuan area kerja proyek Anda.</p>
              <form onSubmit={handleSaveGIS} className="w-full max-w-2xl bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-center shadow-sm mx-auto flex flex-col items-center">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 inline-block min-w-[250px]">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-1 block">Wilayah Administrasi</span>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">{wilayahAdministrasi}</p>
                </div>
                <h4 className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-5 flex items-center justify-center gap-1.5"><MapPin className="w-4 h-4" /> Masukkan Koordinat Proyek Utama</h4>
                <div className="flex flex-col sm:flex-row gap-5 mb-8 w-full">
                  <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-3 block border-b border-slate-100 dark:border-slate-700 pb-2">Titik Awal Proyek</span>
                    <div className="text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium text-center">Titik Koordinat (Lat, Long)</label>
                      <input type="text" required name="koordinat_awal" value={editForm.koordinat_awal || ''} onChange={handleChange} placeholder="-3.3191, 114.5911" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono text-xs text-center" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs mb-3 block border-b border-slate-100 dark:border-slate-700 pb-2">Titik Akhir Proyek</span>
                    <div className="text-left">
                      <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1.5 font-medium text-center">Titik Koordinat (Lat, Long)</label>
                      <input type="text" required name="koordinat_akhir" value={editForm.koordinat_akhir || ''} onChange={handleChange} placeholder="-3.3215, 114.6102" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 font-mono text-xs text-center" />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isSaving} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors shadow-md flex items-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <MapIcon className="w-4 h-4"/>} Aktifkan Peta GIS
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mx-auto">
              Peta spasial untuk proyek ini belum dikonfigurasi. Silakan hubungi tim lapangan atau administrator untuk mengatur koordinat lokasi.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
          
          {/* --- LEFT SECTION: MAP CONTAINER --- */}
          <div className={`lg:col-span-8 bg-slate-100 dark:bg-slate-900 border rounded-2xl overflow-hidden flex flex-col shadow-sm relative min-h-[500px] lg:min-h-[700px] transition-all z-0 ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
            <div className="px-4 py-3 bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between shrink-0 z-10 absolute top-0 w-full shadow-sm backdrop-blur-sm">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><MapIcon className="w-4 h-4 text-amber-500" /> PETA LOKASI SATELIT</span>
            </div>

            <div className="flex-1 w-full h-full relative z-0 pt-[45px]">
              <MapContainer 
                center={mapCenter} 
                zoom={initialZoom} 
                minZoom={5} 
                maxBounds={INDONESIA_BOUNDS} 
                maxBoundsViscosity={1.0}
                className="w-full h-full z-0"
              >
                <TileLayer attribution='&copy; <a href="https://www.esri.com/">Esri</a>' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                <MapEffectController bounds={allBounds} focusBounds={focusBounds} />

                {!hideMainProject && hasProjectBounds && (
                  <>
                    <Rectangle bounds={getBoundsWithPadding(coordAwal[0], coordAwal[1], coordAkhir[0], coordAkhir[1])} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '5, 5', fillColor: '#fcd34d', fillOpacity: 0.15 }}>
                      <Tooltip sticky className="font-sans font-bold text-xs"><span className="text-amber-600 block uppercase border-b pb-1 mb-1">Zona Proyek Induk</span>{projectData.nama_proyek}</Tooltip>
                    </Rectangle>
                    <Polyline positions={[[coordAwal[0], coordAwal[1]], [coordAkhir[0], coordAkhir[1]]]} pathOptions={{ color: '#f59e0b', weight: 2.5, dashArray: '4, 6' }} />
                    <Marker position={[coordAwal[0], coordAwal[1]]} icon={projectIcon}><Tooltip direction="top" className="font-sans font-bold text-xs">Titik Awal Proyek</Tooltip></Marker>
                    <Marker position={[coordAkhir[0], coordAkhir[1]]} icon={projectIcon}><Tooltip direction="top" className="font-sans font-bold text-xs">Titik Akhir Proyek</Tooltip></Marker>
                  </>
                )}

                {reportZones.map((rep, idx) => {
                  if (hiddenReports.has(idx)) return null; 
                  return (
                    <React.Fragment key={`rep-${idx}`}>
                      <Polygon positions={createRotatedBox(rep.latA, rep.lonA, rep.latB, rep.lonB)} pathOptions={{ color: '#10b981', weight: 2, fillColor: '#34d399', fillOpacity: 0.5 }}>
                        <Tooltip sticky className="font-sans font-bold text-xs"><span className="text-emerald-600 block uppercase border-b pb-1 mb-1">Realisasi Harian</span>{rep.uraian}<br/>Vol: {rep.volume} {rep.satuan}<br/>Tanggal: {rep.tanggal}</Tooltip>
                      </Polygon>
                      <Marker position={[rep.latA, rep.lonA]} icon={reportIcon}><Tooltip direction="top" className="font-sans font-bold text-xs">Titik Awal Laporan: <br/>{rep.uraian}</Tooltip></Marker>
                      <Marker position={[rep.latB, rep.lonB]} icon={reportIcon}><Tooltip direction="top" className="font-sans font-bold text-xs">Titik Akhir Laporan: <br/>{rep.uraian}</Tooltip></Marker>
                    </React.Fragment>
                  )
                })}
              </MapContainer>

              <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg z-20 text-[10px] font-bold">
                 <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow-sm"></div><span className="text-slate-700 dark:text-slate-200">Area Cakupan Proyek Utama</span></div>
                 <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div><span className="text-slate-700 dark:text-slate-200">Area Progres Laporan Harian</span></div>
              </div>
            </div>
          </div>

          {/* --- RIGHT SECTION: INFO & CRUD --- */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            <div className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-4 md:p-5 space-y-4 shadow-sm transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-3"><Globe className="w-4 h-4 text-amber-500" /> Data Peta Utama</h3>
              
              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium block mb-1">Wilayah Administrasi</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold leading-relaxed">{wilayahAdministrasi}</span>
                </div>

                <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-4"></div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-1.5"><MapIcon className="w-3.5 h-3.5"/> Koordinat Batas Area</h4>
                  {!isEditMode && hasProjectBounds && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => triggerFocusMain(mainZone.koordinat_awal, mainZone.koordinat_akhir)} className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors" title="Highlight Area Ini" disabled={hideMainProject}><Crosshair className="w-4 h-4" /></button>
                      <button onClick={() => setHideMainProject(!hideMainProject)} className={`p-1.5 rounded-md transition-colors ${hideMainProject ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800' : 'text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`} title={hideMainProject ? "Tampilkan di Peta" : "Sembunyikan dari Peta"}>{hideMainProject ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3.5 rounded-xl border border-amber-200 dark:border-amber-500/30">
                    <span className="text-amber-700 dark:text-amber-500/80 text-[10px] font-medium block mb-1">Koordinat Awal</span>
                    {isEditMode ? (<input type="text" name="koordinat_awal" value={editForm.koordinat_awal || ''} onChange={handleChange} placeholder="-3.300, 114.595" className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500" />) : (<span className="text-slate-700 dark:text-slate-300 font-mono font-bold text-xs block">{mainZone?.koordinat_awal || '-'}</span>)}
                  </div>
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3.5 rounded-xl border border-amber-200 dark:border-amber-500/30">
                    <span className="text-amber-700 dark:text-amber-500/80 text-[10px] font-medium block mb-1">Koordinat Akhir</span>
                    {isEditMode ? (<input type="text" name="koordinat_akhir" value={editForm.koordinat_akhir || ''} onChange={handleChange} placeholder="-3.301, 114.598" className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white font-mono text-xs focus:ring-2 focus:ring-amber-500" />) : (<span className="text-slate-700 dark:text-slate-300 font-mono font-bold text-xs block">{mainZone?.koordinat_akhir || '-'}</span>)}
                  </div>
                </div>

                {isEditMode && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 space-y-2 mt-4">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase block">Data Poligon (GeoJSON)</span>
                    <textarea name="geojson_data" rows="3" value={editForm.geojson_data || ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-500/50 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                )}
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-800/60 border rounded-2xl p-4 md:p-5 space-y-3 shadow-sm flex flex-col transition-all ${isEditMode ? 'border-blue-400/60 dark:border-blue-500/50 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700/60'}`}>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" /> Status Lahan & Dokumen</h3>
                {isEditMode && canCreateData && (
                  <>
                    <input type="file" id="docUploadGIS" className="hidden" multiple accept=".pdf,.xlsx,.xls,.dwg,.kml,.kmz,.rar,.zip" onChange={handleUploadDocument} />
                    <button onClick={() => document.getElementById('docUploadGIS').click()} className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 shadow-sm"><UploadCloud className="w-3.5 h-3.5" /> Upload File</button>
                  </>
                )}
              </div>
              <div className="flex-1 space-y-3 text-xs flex flex-col">
                <div className="flex items-start gap-3 p-3.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Status Pembebasan Lahan</p>
                    {isEditMode ? (<textarea name="status_lahan" rows="2" value={editForm.status_lahan || ''} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-white resize-none mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500" />) : (<p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{mainZone?.status_lahan || 'Belum ada catatan status lahan.'}</p>)}
                  </div>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[150px] custom-scrollbar pr-1">
                  {gisDocuments.length === 0 ? (
                     <div className="text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl"><p className="text-slate-500 font-medium">Belum ada berkas terlampir</p></div>
                  ) : (
                    gisDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/50 rounded-xl group transition-all">
                        <div className="min-w-0 flex-1 pr-2"><p className="font-medium text-slate-800 dark:text-white truncate">{doc.nama_file}</p><p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{doc.ukuran || 'N/A'}</p></div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => window.open(getDocUrl(doc.path_file), '_blank')} className="p-1.5 bg-white dark:bg-slate-800 text-amber-500 rounded border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors" title="Download Document"><Download className="w-3.5 h-3.5"/></button>
                          {isEditMode && canCreateData && (<button type="button" onClick={() => confirmDeleteDocument(doc.id, doc.nama_file)} className="p-1.5 bg-white dark:bg-slate-800 text-rose-500 rounded border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors" title="Hapus Dokumen"><Trash2 className="w-3.5 h-3.5"/></button>)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex flex-col overflow-hidden shadow-sm flex-1 min-h-[250px] max-h-[300px]">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-emerald-50/50 dark:bg-emerald-900/10 flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Progres Harian Laporan</h3>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-bold font-mono border border-emerald-200 dark:border-emerald-800">{reportZones.length} Titik</span>
              </div>
              
              <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {reportZones.length === 0 ? (
                  <div className="text-center py-8"><FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" /><p className="text-xs text-slate-500 italic">Belum ada laporan harian berkoordinat.</p></div>
                ) : (
                  reportZones.map((rep, idx) => {
                    const isHidden = hiddenReports.has(idx);
                    return (
                      <div key={idx} className={`p-3 rounded-xl border-l-2 transition-all ${isHidden ? 'bg-slate-50/50 dark:bg-slate-900/30 border-l-slate-300 dark:border-l-slate-600 opacity-60' : 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 border-l-emerald-500 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className={`text-[9px] font-bold ${isHidden ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{rep.tanggal}</p>
                          <div className="flex items-center gap-1">
                            <button onClick={() => triggerFocusReport(rep.latA, rep.lonA, rep.latB, rep.lonB)} className={`p-1.5 rounded-md transition-colors border border-transparent ${isHidden ? 'text-slate-300' : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-200 dark:hover:border-blue-800'}`} disabled={isHidden} title="Highlight Area Laporan"><Crosshair className="w-3.5 h-3.5" /></button>
                            <button onClick={() => toggleReportVisibility(idx)} className={`p-1.5 rounded-md transition-colors border border-transparent ${isHidden ? 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600' : 'text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:border-emerald-200 dark:hover:border-emerald-800'}`} title={isHidden ? "Tampilkan di Peta" : "Sembunyikan dari Peta"}>{isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                          </div>
                        </div>
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-[11px] leading-relaxed line-clamp-2 mb-2 pr-6">{rep.uraian}</h4>
                        <div className={`flex gap-4 text-[9px] font-mono ${isHidden ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          <span><MapPin className="w-3 h-3 inline mr-0.5 opacity-70"/> {rep.latA.toFixed(4)}, {rep.lonA.toFixed(4)}</span>
                          <span>Vol: <span className={`font-bold ${isHidden ? 'text-slate-400' : 'text-emerald-500'}`}>{rep.volume} {rep.satuan}</span></span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <a href={`https://www.google.com/maps/search/?api=1&query=${mainZone?.koordinat_awal || '-1.5,115.0'}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors mt-auto"><Navigation className="w-4 h-4" /> Buka Navigasi di Google Maps</a>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. MODAL (Di luar conditional rendering)     */}
      {/* ========================================== */}
      {deleteConfig.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in z-50">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-500/20"><AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" /></div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Konfirmasi Hapus</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Yakin ingin menghapus dokumen <span className="font-bold">{deleteConfig.name}</span> secara permanen?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfig({ show: false, type: '', id: null, name: '' })} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm">Batal</button>
              <button onClick={executeDelete} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex justify-center gap-2 shadow-md transition-colors"><Trash2 className="w-4 h-4"/> Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}