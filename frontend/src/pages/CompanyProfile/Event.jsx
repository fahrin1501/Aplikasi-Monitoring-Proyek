import React from 'react';
import { Calendar, CalendarDays } from 'lucide-react';

export default function Event({ events = [] }) {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold text-black dark:text-amber-500 mb-4">Event Terkini</h2>
            <p className="text-black/80 dark:text-slate-300 font-medium">Ikuti perkembangan terbaru mengenai proyek yang kami tangani dan inovasi teknologi konstruksi kami.</p>
          </div>
        </div>

        {events && events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((item) => (
              <div key={item.id} className="group cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-xl hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all">
                
                <div className="w-full sm:w-40 h-40 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden transition-colors">
                  {item.image ? (
                    <img 
                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/${item.image}`} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-amber-500 dark:text-amber-400 font-extrabold text-xs tracking-widest">NO IMAGE</span>
                  )}
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
                  <h3 className="text-lg font-bold text-black dark:text-white leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 opacity-50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
            <CalendarDays className="w-10 h-10 mb-3 text-slate-400" />
            <p className="text-slate-500 font-bold">Belum ada berita atau event terbaru.</p>
          </div>
        )}
      </div>
    </section>
  );
}