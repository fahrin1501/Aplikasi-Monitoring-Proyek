import React, { useState } from 'react';
import { LayoutTemplate, Save, Image as ImageIcon, UploadCloud } from 'lucide-react';

export default function LandingPage() {
  const [formData, setFormData] = useState({
    heroTitle: 'Pantau Progres & Pengawasan Lapangan Secara Real-Time',
    heroSubtitle: 'Kelola volume progres, laporan harian, matriks Kurva S, hingga pemetaan GIS lokasi proyek dalam satu sistem pengawasan terpadu yang presisi.',
    btnText: 'Sistem Manajemen Proyek'
  });

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 md:p-7 shadow-sm backdrop-blur-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <LayoutTemplate className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-wide">Pengaturan Teks Landing Page</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom Kiri: Form Input */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Label / Badge (Kecil)</label>
            <input 
              type="text" 
              value={formData.btnText}
              onChange={(e) => setFormData({...formData, btnText: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Judul Utama (Hero Title)</label>
            <input 
              type="text" 
              value={formData.heroTitle}
              onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deskripsi Singkat (Subtitle)</label>
            <textarea 
              rows="4" 
              value={formData.heroSubtitle}
              onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan Gambar Cover */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Gambar Cover (Opsional)</label>
          <div className="w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer group">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
              <ImageIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Klik untuk unggah gambar</p>
            <p className="text-[10px] text-slate-500 mt-1">Format: JPG/PNG, Maks: 2MB</p>
          </div>
        </div>
      </div>
      
      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95">
          <Save className="w-4 h-4" /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
}