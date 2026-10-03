import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

export default function Event() {
  const news = [
    { id: 1, title: "Prisma Group Sukses Mengawal Proyek Stadion Tenis Nasional", date: "28 Sep 2026", category: "Berita Proyek" },
    { id: 2, title: "Penerapan Sistem Pengawasan Digital Berbasis Cloud", date: "15 Okt 2026", category: "Inovasi" },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">Event Terkini</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Ikuti perkembangan terbaru mengenai proyek yang kami tangani dan inovasi teknologi konstruksi kami.</p>
          </div>
          <button className="text-amber-600 dark:text-amber-500 font-bold hover:underline flex items-center gap-2">
            Lihat Semua Berita <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((item) => (
            <div key={item.id} className="group cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-xl hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all">
              
              {/* Gambar Diperbaiki: Tema Amber */}
              <div className="w-full sm:w-40 h-40 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-colors">
                <span className="text-amber-500 dark:text-amber-400 font-extrabold text-xs tracking-widest">NO IMAGE</span>
              </div>

              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">{item.category}</span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {item.date}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-snug group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}