import React from 'react';
import { Briefcase } from 'lucide-react';

export default function Layanan({ services = [] }) {
  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-black dark:text-amber-500 mb-4">Layanan Unggulan Kami</h2>
          <p className="text-black/80 dark:text-slate-300 font-medium">
            Dedikasi kami adalah memastikan setiap infrastruktur dibangun dengan presisi, aman, dan tepat waktu.
          </p>
        </div>

        {services && services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((srv) => (
              <div key={srv.id} className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/60 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/10 transition-all group flex flex-col">
                <div className="w-full h-48 mb-6 overflow-hidden rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center">
                  <img 
                    src={srv.image ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${srv.image}` : "/PRISMA.PNG"} 
                    alt={srv.title} 
                    className={`w-full h-full group-hover:scale-110 transition-transform duration-500 ${srv.image ? 'object-cover' : 'object-contain h-16 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/PRISMA.PNG";
                      e.target.className = "h-16 w-auto object-contain opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500";
                    }}
                  />
                </div>
                
                <h3 className="text-xl font-bold text-black dark:text-amber-400 mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-500 transition-colors">
                  {srv.title}
                </h3>
                <p className="text-black/70 dark:text-slate-300 text-sm leading-relaxed">
                  {srv.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <Briefcase className="w-10 h-10 mb-3 text-slate-400" />
            <p className="text-slate-500 font-bold">Belum ada layanan yang dipublikasikan.</p>
          </div>
        )}
      </div>
    </section>
  );
}