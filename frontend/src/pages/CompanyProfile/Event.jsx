import React, { useState } from 'react';
import { CalendarDays, Plus, Trash2, Edit3, Image as ImageIcon } from 'lucide-react';

export default function Event() {
  const [events, setEvents] = useState([
    { id: 1, judul: 'Rapat Koordinasi Proyek Stadion Tenis', tanggal: '28 Sep 2026', status: 'Diterbitkan' },
    { id: 2, judul: 'Tender Pengawasan Jalan Raya Nasional', tanggal: '02 Okt 2026', status: 'Draf' },
  ]);

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 md:p-7 shadow-sm backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-wide">Publikasi Event & Berita</h2>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 transition-all shadow-sm active:scale-95">
          <Plus className="w-4 h-4" /> Tulis Berita
        </button>
      </div>

      <div className="space-y-3">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{event.judul}</h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">{event.tanggal}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    event.status === 'Diterbitkan' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                  }`}>
                    {event.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end border-t sm:border-none border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 mt-3 sm:mt-0">
                <button className="p-2 text-slate-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"><Edit3 className="w-4 h-4"/></button>
                <button className="p-2 text-slate-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"><Trash2 className="w-4 h-4"/></button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
            <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada berita atau event yang dipublikasikan.</p>
          </div>
        )}
      </div>
    </div>
  );
}