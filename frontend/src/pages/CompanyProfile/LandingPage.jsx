import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-40 dark:opacity-10 pointer-events-none" />
      
      {/* Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/20 dark:bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest shadow-sm mb-6">
          <ShieldCheck className="w-4 h-4" /> Sistem Manajemen Proyek Terpadu
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight max-w-5xl mx-auto mb-6">
          Pantau Progres & Pengawasan Lapangan <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Secara Real-Time</span>
        </h1>
        
        <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium mb-10">
          Kami menyediakan layanan manajemen konstruksi dan pengawasan teknis dengan platform digital cerdas. Kelola laporan, Kurva S, hingga GIS dalam satu sistem.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={() => document.getElementById('layanan').scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto px-8 py-4 bg-slate-800 dark:bg-white hover:bg-slate-700 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-full transition-all shadow-lg active:scale-95 text-sm">
            Lihat Layanan Kami
          </button>
          <Link to="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold rounded-full transition-all shadow-xl shadow-amber-500/20 active:scale-95 text-sm">
            Masuk Portal Klien <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}