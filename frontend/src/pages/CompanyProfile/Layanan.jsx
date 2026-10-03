import React from 'react';
import { HardHat, FileSpreadsheet, Map } from 'lucide-react';

export default function Layanan() {
  const services = [
    {
      icon: HardHat,
      title: "Manajemen Konstruksi",
      desc: "Layanan pengawasan komprehensif mulai dari tahap perencanaan, pelaksanaan, hingga serah terima proyek secara profesional dan terukur."
    },
    {
      icon: FileSpreadsheet,
      title: "Pengawasan Teknis",
      desc: "Monitoring ketat terhadap kualitas material, metode kerja, dan pencapaian bobot Kurva S sesuai dengan spesifikasi teknis kontrak."
    },
    {
      icon: Map,
      title: "Pemetaan GIS",
      desc: "Integrasi data spasial dan geografis untuk memetakan progres infrastruktur, memudahkan pemantauan lokasi proyek secara visual."
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-slate-800/40 border-y border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-4">Layanan Unggulan Kami</h2>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Dedikasi kami adalah memastikan setiap infrastruktur dibangun dengan presisi, aman, dan tepat waktu.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/60 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/5 transition-all group">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{srv.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{srv.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}