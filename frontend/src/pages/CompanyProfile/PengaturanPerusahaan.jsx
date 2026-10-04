import React, { useState, useEffect } from 'react';
import { 
  LayoutTemplate, Briefcase, CalendarDays, Contact2, 
  Save, Plus, Trash2, Loader2, CheckCircle2, X, AlertCircle 
} from 'lucide-react';
import api from '../../api';

export default function PengaturanProfile() {
  const [activeTab, setActiveTab] = useState('landing');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // STATE UNTUK DATA
  const [landingData, setLandingData] = useState({ hero_title: '', hero_subtitle: '', btn_text: '' });
  const [contactData, setContactData] = useState({ email: '', phone: '', website: '', address: '' });
  const [services, setServices] = useState([]);
  const [events, setEvents] = useState([]);

  // STATE UNTUK MODAL (TAMBAH DATA)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORM DATA UNTUK MODAL
  const [serviceForm, setServiceForm] = useState({ title: '', description: '' });
  const [eventForm, setEventForm] = useState({ title: '', category: 'Berita Proyek', date: '' });

  // 1. FETCH SEMUA DATA SAAT HALAMAN DIBUKA
  useEffect(() => {
    document.title = "Prisma Group - Pengaturan Profil";
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Ambil data Landing & Contact (Dari endpoint public)
      const resPublic = await api.get('/public/company-profile');
      if (resPublic.data?.profile) {
        setLandingData({
          hero_title: resPublic.data.profile.hero_title || '',
          hero_subtitle: resPublic.data.profile.hero_subtitle || '',
          btn_text: resPublic.data.profile.btn_text || ''
        });
        setContactData({
          email: resPublic.data.profile.email || '',
          phone: resPublic.data.profile.phone || '',
          website: resPublic.data.profile.website || '',
          address: resPublic.data.profile.address || ''
        });
      }
      // Ambil data Services & Events (CMS Admin endpoint agar tampil semua termasuk draft)
      const resServices = await api.get('/cms/services');
      setServices(resServices.data || []);
      
      const resEvents = await api.get('/cms/events');
      setEvents(resEvents.data || []);

    } catch (error) {
      console.error("Gagal memuat data:", error);
      showMessage('error', 'Gagal memuat data dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // 2. FUNGSI CRUD UNTUK MASING-MASING TAB
  const handleSaveLanding = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/cms/landing-page', landingData);
      showMessage('success', 'Landing Page berhasil diperbarui!');
    } catch (err) { showMessage('error', 'Gagal menyimpan Landing Page.'); }
    setIsSubmitting(false);
  };

  const handleSaveContact = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/cms/contact', contactData);
      showMessage('success', 'Informasi Kontak berhasil diperbarui!');
    } catch (err) { showMessage('error', 'Gagal menyimpan Kontak.'); }
    setIsSubmitting(false);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/cms/services', serviceForm);
      setServiceForm({ title: '', description: '' });
      setIsServiceModalOpen(false);
      fetchAllData();
      showMessage('success', 'Layanan berhasil ditambahkan!');
    } catch (err) { showMessage('error', 'Gagal menambah layanan.'); }
    setIsSubmitting(false);
  };

  const handleDeleteService = async (id) => {
    if(!window.confirm('Hapus layanan ini?')) return;
    try {
      await api.delete(`/cms/services/${id}`);
      fetchAllData();
      showMessage('success', 'Layanan dihapus.');
    } catch (err) { showMessage('error', 'Gagal menghapus layanan.'); }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/cms/events', eventForm);
      setEventForm({ title: '', category: 'Berita Proyek', date: '' });
      setIsEventModalOpen(false);
      fetchAllData();
      showMessage('success', 'Event berhasil dipublikasikan!');
    } catch (err) { showMessage('error', 'Gagal menambah event.'); }
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (id) => {
    if(!window.confirm('Hapus berita/event ini?')) return;
    try {
      await api.delete(`/cms/events/${id}`);
      fetchAllData();
      showMessage('success', 'Event dihapus.');
    } catch (err) { showMessage('error', 'Gagal menghapus event.'); }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-40"><Loader2 className="w-10 h-10 text-amber-500 animate-spin" /></div>;
  }

  // --- RENDER TAB KONTEN ---
  return (
    <div className="w-full space-y-6 animate-fade-in pb-10">
      
      {/* HEADER CMS */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 shadow-sm backdrop-blur-sm">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-inner shrink-0">
          <img src="/PRISMA.PNG" alt="Logo Prisma" className="h-16 w-auto object-contain drop-shadow-sm" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-wide">Pengaturan Profil Perusahaan</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola konten website publik secara real-time.
          </p>
        </div>
      </div>

      {/* NOTIFIKASI PESAN */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border animate-fade-in ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
            : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* TAB NAVIGASI */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2 flex flex-wrap gap-2 shadow-sm">
        {[
          { id: 'landing', label: 'Landing Page', icon: LayoutTemplate },
          { id: 'layanan', label: 'Layanan', icon: Briefcase },
          { id: 'event', label: 'Event & Berita', icon: CalendarDays },
          { id: 'kontak', label: 'Kontak', icon: Contact2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ========================================================= */}
      {/* KONTEN: LANDING PAGE */}
      {/* ========================================================= */}
      {activeTab === 'landing' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
            <LayoutTemplate className="w-5 h-5 text-amber-500" /> Teks Landing Page
          </h2>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Label / Badge</label>
              <input type="text" value={landingData.btn_text} onChange={e => setLandingData({...landingData, btn_text: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Utama (Hero Title)</label>
              <input type="text" value={landingData.hero_title} onChange={e => setLandingData({...landingData, hero_title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Singkat</label>
              <textarea rows="4" value={landingData.hero_subtitle} onChange={e => setLandingData({...landingData, hero_subtitle: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
            </div>
            <div className="pt-4 flex justify-end">
              <button onClick={handleSaveLanding} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan Landing Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONTEN: LAYANAN */}
      {/* ========================================================= */}
      {activeTab === 'layanan' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" /> Kelola Layanan
            </h2>
            <button onClick={() => setIsServiceModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/30 text-xs shadow-sm hover:scale-95 transition-transform">
              <Plus className="w-4 h-4" /> Tambah Layanan
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map(item => (
              <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl relative group">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-2 pr-8">{item.title}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-3">{item.description}</p>
                <button onClick={() => handleDeleteService(item.id)} className="absolute top-4 right-4 p-1.5 text-rose-400 hover:bg-rose-500 hover:text-white rounded-md shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-slate-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONTEN: EVENT & BERITA */}
      {/* ========================================================= */}
      {activeTab === 'event' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-500" /> Event & Berita
            </h2>
            <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 font-bold rounded-xl border border-amber-200 dark:border-amber-500/30 text-xs shadow-sm hover:scale-95 transition-transform">
              <Plus className="w-4 h-4" /> Tambah Berita
            </button>
          </div>
          
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl group">
                <div className="flex-1 w-full">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-white">{event.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold uppercase bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">{event.category}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{event.date}</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteEvent(event.id)} className="w-full md:w-auto p-2.5 bg-white dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4"/> <span className="md:hidden text-xs font-bold">Hapus Event</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* KONTEN: KONTAK */}
      {/* ========================================================= */}
      {activeTab === 'kontak' && (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4">
            <Contact2 className="w-5 h-5 text-amber-500" /> Pengaturan Kontak
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Resmi</label>
              <input type="email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telepon / WhatsApp</label>
              <input type="text" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
              <textarea rows="3" value={contactData.address} onChange={e => setContactData({...contactData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
            </div>
          </div>
          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button onClick={handleSaveContact} disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Simpan Kontak
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH LAYANAN */}
      {/* ========================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-white">Tambah Layanan</h3>
              <button onClick={() => setIsServiceModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-rose-500" /></button>
            </div>
            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Layanan</label>
                <input required type="text" value={serviceForm.title} onChange={e => setServiceForm({...serviceForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Layanan</label>
                <textarea required rows="4" value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500 resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TAMBAH EVENT */}
      {/* ========================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-extrabold text-slate-800 dark:text-white">Publikasi Event/Berita</h3>
              <button onClick={() => setIsEventModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-rose-500" /></button>
            </div>
            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Berita</label>
                <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori</label>
                  <select value={eventForm.category} onChange={e => setEventForm({...eventForm, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500">
                    <option value="Berita Proyek">Berita Proyek</option>
                    <option value="Inovasi">Inovasi</option>
                    <option value="Internal">Internal</option>
                    <option value="Kunjungan">Kunjungan</option>
                    <option value="Penghargaan">Penghargaan</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal</label>
                  <input required type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Publikasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}