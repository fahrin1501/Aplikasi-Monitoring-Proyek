import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../api'; 
import { Loader2, AlertTriangle } from 'lucide-react';

// Import Modul Komponen yang sudah dipecah
import NavigasiData from './Data/NavigasiData';
import ProgressData from './Data/ProgressData';
import AdministrasiData from './Data/AdministrasiData';
import PersonelDocData from './Data/PersonelDocData';
import ModalData from './Data/ModalData';

export default function ProjectData() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [project, setProject] = useState(null);
  const projectId = project?.id || id;

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [progressData, setProgressData] = useState({ plan: 0, actual: 0, deviasi: 0 });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingMain, setIsSavingMain] = useState(false);

  const [fotoSampul, setFotoSampul] = useState(null);
  const [newFotoPreview, setNewFotoPreview] = useState(null);
  const [removeFoto, setRemoveFoto] = useState(false); 

  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({ id: null, nama: '', peran: '' });
  const [isSavingPersonnel, setIsSavingPersonnel] = useState(false);

  const [deleteConfig, setDeleteConfig] = useState({ show: false, type: '', id: null, name: '' });

  const fetchProjectDetail = async () => {
    try {
      const [projRes, schedRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/schedules`).catch(() => null)
      ]);

      setProject(projRes.data);
      setEditFormData(projRes.data);

      if (schedRes && schedRes.data?.data) {
        const sData = schedRes.data.data;
        const plan = sData.schedules?.reduce((sum, s) => sum + parseFloat(s.bobot_rencana), 0) || 0;
        const actual = sData.realizations?.reduce((sum, r) => sum + parseFloat(r.bobot_realisasi), 0) || 0;
        setProgressData({ plan, actual, deviasi: actual - plan });
      }
    } catch (error) {
      setErrorMsg('Gagal memuat data proyek.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProjectDetail(); }, [id]);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(angka) || 0);
  
  // --- MENGAMBIL BASE URL OTOMATIS DARI KONFIGURASI API ---
  const BASE_URL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, '') : 'http://127.0.0.1:8000';

  const getImageUrl = (filename) => { 
    if (!filename) return null; 
    return filename.startsWith('http') ? filename : `${BASE_URL}/storage/foto_proyek/${filename}`; 
  };
  
  const getDocUrl = (path) => { 
    if (!path) return '#'; 
    return path.startsWith('http') ? path : `${BASE_URL}/${path.replace(/^\//, '')}`; 
  };

  const formatDateForInput = (val) => val ? String(val).substring(0, 10) : '';

  const handleMainChange = (e) => setEditFormData({ ...editFormData, [e.target.name]: e.target.value });

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) { setFotoSampul(file); setNewFotoPreview(URL.createObjectURL(file)); setRemoveFoto(false); }
  };

  const toggleEditMode = async () => {
    if (isEditMode) {
      setIsSavingMain(true);
      try {
        const payloadData = { ...editFormData };
        delete payloadData.personnels; delete payloadData.documents; delete payloadData.created_at; delete payloadData.updated_at; delete payloadData.foto_sampul; 

        if (fotoSampul || removeFoto) {
          const formData = new FormData();
          Object.keys(payloadData).forEach(key => formData.append(key, payloadData[key] === null ? '' : payloadData[key]));
          if (fotoSampul) formData.append('foto_sampul', fotoSampul);
          if (removeFoto) formData.append('remove_foto', 'true');
          formData.append('_method', 'PUT'); 
          await api.post(`/projects/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); 
        } else {
          await api.put(`/projects/${id}`, payloadData);
        }
        await fetchProjectDetail(); setIsEditMode(false); setFotoSampul(null); setNewFotoPreview(null); setRemoveFoto(false);
      } catch (error) { alert("Gagal update proyek."); } 
      finally { setIsSavingMain(false); }
    } else { setEditFormData(project); setIsEditMode(true); }
  };

  const cancelEditMode = () => { setEditFormData(project); setIsEditMode(false); setFotoSampul(null); setNewFotoPreview(null); setRemoveFoto(false); };

  const openPersonnelModal = (person = null) => {
    if (person) setPersonnelForm({ id: person.id, nama: person.nama, peran: person.peran });
    else setPersonnelForm({ id: null, nama: '', peran: '' });
    setShowPersonnelModal(true);
  };

  const handleSavePersonnel = async (e) => {
    e.preventDefault();
    setIsSavingPersonnel(true);
    try {
      if (personnelForm.id) await api.put(`/personnels/${personnelForm.id}`, personnelForm);
      else await api.post(`/projects/${id}/personnels`, personnelForm);
      setShowPersonnelModal(false); fetchProjectDetail(); 
    } catch (error) { alert("Gagal simpan personel."); } 
    finally { setIsSavingPersonnel(false); }
  };

  const handleUploadDocument = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const formData = new FormData();
    files.forEach(file => formData.append('dokumen_lampiran[]', file));
    e.target.value = null;
    try {
      await api.post(`/projects/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchProjectDetail(); alert("Dokumen berhasil ditambahkan!");
    } catch (error) { alert("Gagal upload dokumen."); }
  };

  const confirmDeleteProject = () => setDeleteConfig({ show: true, type: 'project', id: projectId, name: project.nama_proyek });
  const confirmDeletePersonnel = (personId, personName) => setDeleteConfig({ show: true, type: 'personnel', id: personId, name: personName });
  const confirmDeleteDocument = (docId, docName) => setDeleteConfig({ show: true, type: 'document', id: docId, name: docName });

  const executeDelete = async () => {
    try {
      if (deleteConfig.type === 'project') { await api.delete(`/projects/${deleteConfig.id}`); alert("Proyek terhapus."); navigate('/projects'); return; } 
      else if (deleteConfig.type === 'personnel') await api.delete(`/personnels/${deleteConfig.id}`);
      else if (deleteConfig.type === 'document') await api.delete(`/documents/${deleteConfig.id}`);
      setDeleteConfig({ show: false, type: '', id: null, name: '' }); fetchProjectDetail(); 
    } catch (error) { alert("Gagal menghapus data."); }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/excel`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Data_Proyek_${project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`); 
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert("Gagal export Excel."); }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/export/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a'); link.href = url;
      link.setAttribute('download', `Executive_Summary_${project.nama_proyek.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { alert("Gagal export PDF."); }
  };

  if (isLoading) return <div className="flex justify-center min-h-[60vh] w-full"><Loader2 className="w-10 h-10 text-amber-500 animate-spin mt-20" /></div>;
  if (errorMsg || !project) return <div className="text-center mt-20"><AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" /><h2 className="text-lg font-bold">Proyek Tidak Ditemukan</h2></div>;

  let calculatedStatus = project?.status || 'Persiapan';
  if (calculatedStatus !== 'Selesai' && calculatedStatus !== 'Persiapan') {
    if (progressData.deviasi < -5) calculatedStatus = 'Kritis';
    else if (progressData.deviasi < 0) calculatedStatus = 'Terlambat';
    else calculatedStatus = 'On Track';
  }
  
  const isActuallyDelayed = calculatedStatus === 'Kritis' || calculatedStatus === 'Terlambat';

  return (
    <div className="w-full space-y-5 relative pb-20">
      
      <NavigasiData 
        id={id} projectId={projectId} project={project} isEditMode={isEditMode} editFormData={editFormData} 
        handleMainChange={handleMainChange} toggleEditMode={toggleEditMode} cancelEditMode={cancelEditMode} 
        isSavingMain={isSavingMain} confirmDeleteProject={confirmDeleteProject} 
        handleExportExcel={handleExportExcel} handleExportPDF={handleExportPDF} 
        newFotoPreview={newFotoPreview} removeFoto={removeFoto} setRemoveFoto={setRemoveFoto} 
        handleFotoChange={handleFotoChange} setFotoSampul={setFotoSampul} setNewFotoPreview={setNewFotoPreview} 
        getImageUrl={getImageUrl}
      />

      <div className="space-y-4">
        <ProgressData 
          progressPlan={progressData.plan.toFixed(2)} progressReal={progressData.actual.toFixed(2)} 
          deviasi={progressData.deviasi > 0 ? `+${progressData.deviasi.toFixed(2)}` : progressData.deviasi.toFixed(2)} 
          isActuallyDelayed={isActuallyDelayed}
        />

        <AdministrasiData 
          project={project} isEditMode={isEditMode} editFormData={editFormData} handleMainChange={handleMainChange} 
          formatRupiah={formatRupiah} formatDateForInput={formatDateForInput} 
          displayStatus={calculatedStatus} isActuallyDelayed={isActuallyDelayed}
        />

        <PersonelDocData 
          project={project} isEditMode={isEditMode} editFormData={editFormData} handleMainChange={handleMainChange} 
          openPersonnelModal={openPersonnelModal} confirmDeletePersonnel={confirmDeletePersonnel} 
          handleUploadDocument={handleUploadDocument} confirmDeleteDocument={confirmDeleteDocument} getDocUrl={getDocUrl}
        />
      </div>

      <ModalData 
        showPersonnelModal={showPersonnelModal} setShowPersonnelModal={setShowPersonnelModal} 
        personnelForm={personnelForm} setPersonnelForm={setPersonnelForm} 
        handleSavePersonnel={handleSavePersonnel} isSavingPersonnel={isSavingPersonnel}
        deleteConfig={deleteConfig} setDeleteConfig={setDeleteConfig} executeDelete={executeDelete}
      />
      
    </div>
  );
}