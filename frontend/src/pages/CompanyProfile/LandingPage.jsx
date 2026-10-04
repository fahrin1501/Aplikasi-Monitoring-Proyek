import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function LandingPage({ profile }) {
  // Nilai default (fallback) jika database kosong
  const title = profile?.hero_title || 'Pantau Progres & Pengawasan Lapangan Secara Real-Time';
  const subtitle = profile?.hero_subtitle || 'Kami menyediakan layanan manajemen konstruksi dan pengawasan teknis dengan platform digital cerdas. Kelola laporan, Kurva S, hingga GIS dalam satu sistem.';
  const btnText = profile?.btn_text || 'Sistem Manajemen Proyek Terpadu';

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/20 dark:bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest shadow-sm mb-6">
          <ShieldCheck className="w-4 h-4" /> {btnText}
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight max-w-5xl mx-auto mb-6">
          {title}
        </h1>
        
        <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium mb-10">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => document.getElementById('layanan').scrollIntoView({ behavior: 'smooth' })} 
            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-white font-bold rounded-full transition-all shadow-sm active:scale-95 text-sm"
          >
            Lihat Layanan Kami
          </button>
        </div>
      </div>
    </section>
  );
}