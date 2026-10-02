import React from 'react';
import { Building2, MapPin, Calendar, UserCheck, ChevronDown, Loader2 } from 'lucide-react';

export default function InfoPengawasanAdd({ 
  projects, selectedProjectId, setSelectedProjectId, isLoadingProjects, 
  formData, handleInputChange, availableWeeks 
}) {
  return (
    <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-5 backdrop-blur-sm">
      <label className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <Building2 className="w-4 h-4" /> Informasi Pengawasan
      </label>
      
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          Pilih Proyek yang Diawasi <span className="text-rose-500">*</span>
        </label>
        {isLoadingProjects ? (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-800/30">
            <Loader2 className="w-4 h-4 animate-spin" /> Sedang memuat daftar proyek...
          </div>
        ) : (
          <div className="relative">
            <select required value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer shadow-inner transition-colors">
              <option value="" disabled>-- Klik di sini untuk memilih Proyek --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.nama_proyek} (SPK: {p.kode_kontrak || '-'})</option>)}
            </select>
            <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tgl Pengawasan <span className="text-rose-500">*</span></label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="date" name="tanggalPengawasan" required value={formData.tanggalPengawasan} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner [color-scheme:light_dark] transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Minggu Ke- <span className="text-rose-500">*</span></label>
          <div className="relative">
            <select name="minggu_ke" required value={formData.minggu_ke} onChange={handleInputChange} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none shadow-inner cursor-pointer transition-colors">
              <option value="" disabled>-- Pilih Minggu --</option>
              {availableWeeks.length > 0 ? (
                availableWeeks.map(w => <option key={w} value={w}>Minggu Ke-{w}</option>)
              ) : (
                <option value="" disabled>{selectedProjectId ? "Kosong (Buat di Kurva S)" : "Pilih proyek dahulu"}</option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Nama Pengawas <span className="text-rose-500">*</span></label>
          <div className="relative">
            <UserCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" name="namaPengawas" required value={formData.namaPengawas} onChange={handleInputChange} placeholder="Ketik nama pengawas" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Lokasi Proyek <span className="text-rose-500">*</span></label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" name="lokasi" required value={formData.lokasi} onChange={handleInputChange} placeholder="Contoh: Banjarmasin" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}