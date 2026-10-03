import React, { useState } from 'react';
import { Briefcase, Plus, Trash2, Edit3 } from 'lucide-react';

export default function Layanan() {
  const [layanan, setLayanan] = useState([
    { id: 1, judul: 'Manajemen Konstruksi', deskripsi: 'Layanan pengawasan komprehensif mulai dari tahap perencanaan hingga serah terima proyek secara profesional.' },
    { id: 2, judul: 'Pengawasan Teknis Lapangan', deskripsi: 'Monitoring kualitas material, metode kerja, dan spesifikasi teknis sesuai standar kontrak.' },
    { id: 3, judul: 'Studi Kelayakan (Feasibility)', deskripsi: 'Analisa kelayakan finansial, lingkungan, dan teknis sebelum proyek berjalan.' },
  ]);

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 md:p-7 shadow-sm backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-wide">Daftar Layanan & Keahlian</h2>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Tambah Layanan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {layanan.map((item) => (
          <div key={item.id} className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-sm relative group hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-2 pr-10 leading-snug">{item.judul}</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{item.deskripsi}</p>
            
            <div className="absolute top-4 right-4 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 text-slate-400 hover:bg-blue-500 hover:text-white rounded-md transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Edit3 className="w-3 h-3" />
              </button>
              <button className="p-1.5 text-slate-400 hover:bg-rose-500 hover:text-white rounded-md transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}