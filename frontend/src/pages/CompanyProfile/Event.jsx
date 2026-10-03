import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';

export default function Event() {
  // Data Dummy Berita diperbanyak menjadi 5 item
  const news = [
    { id: 1, title: "Prisma Group Sukses Mengawal Proyek Stadion Tenis Nasional", date: "28 Sep 2026", category: "Berita Proyek" },
    { id: 2, title: "Penerapan Sistem Pengawasan Digital Berbasis Cloud Terintegrasi", date: "15 Okt 2026", category: "Inovasi" },
    { id: 3, title: "Pelatihan K3 Konstruksi Mutakhir untuk Pengawas Lapangan", date: "02 Nov 2026", category: "Internal" },
    { id: 4, title: "Kunjungan Kerja Dinas PUPR ke Lokasi Proyek Jembatan", date: "18 Nov 2026", category: "Kunjungan" },
    { id: 5, title: "Prisma Group Meraih Penghargaan Konsultan Pengawas Terbaik 2026", date: "05 Des 2026", category: "Penghargaan" },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            {/* Teks Header disesuaikan ke Hitam & Amber */}
            <h2 className="text-3xl font-extrabold text-black dark:text-amber-500 mb-4">Event Terkini</h2>
            <p className="text-black/80 dark:text-slate-300 font-medium">Ikuti perkembangan terbaru mengenai proyek yang kami tangani dan inovasi teknologi konstruksi kami.</p>
          </div>
          <button className="text-amber-600 dark:text-amber-500 font-bold hover:underline flex items-center gap-2 transition-all hover:gap-3">
            Lihat Semua Berita <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {news.map((item, index) => (
            <div 
              key={item.id} 
              // Jika ini adalah item ke-5 (ganjil di akhir grid 2 kolom), kita bisa membuatnya membentang penuh atau dibiarkan natural.
              // Di sini kita biarkan natural agar susunannya tetap rapi.
              className="group cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-xl hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all"
            >
              
              {/* Gambar Placeholder disesuaikan ke tema Amber */}
              <div className="w-full sm:w-40 h-40 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-colors">
                <span className="text-amber-500 dark:text-amber-400 font-extrabold text-xs tracking-widest">NO IMAGE</span>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md">
                    {item.category}
                  </span>
                  <span className="text-xs text-black/60 dark:text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5"/> {item.date}
                  </span>
                </div>
                {/* Judul dengan kombinasi Hitam & Amber */}
                <h3 className="text-lg font-bold text-black dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}