import React, { useState } from 'react';
import { Contact2, Save, MapPin, Mail, Phone, Globe } from 'lucide-react';

export default function ContactInfo() {
  const [kontak, setKontak] = useState({
    email: 'admin@prisma-group.com',
    phone: '+62 811-2345-6789',
    website: 'www.prisma-group.com',
    address: 'Jl. Ahmad Yani KM 5, Banjarmasin, Kalimantan Selatan'
  });

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 md:p-7 shadow-sm backdrop-blur-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <Contact2 className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-wide">Informasi Kontak & Lokasi Kantor</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-500"/> Email Resmi</label>
          <input 
            type="email" value={kontak.email} onChange={(e) => setKontak({...kontak, email: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" 
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-500"/> Nomor Telepon / WA</label>
          <input 
            type="text" value={kontak.phone} onChange={(e) => setKontak({...kontak, phone: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" 
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-sky-500"/> Website Perusahaan (Opsional)</label>
          <input 
            type="text" value={kontak.website} onChange={(e) => setKontak({...kontak, website: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors" 
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-rose-500"/> Alamat Kantor / Headquarter</label>
          <textarea 
            rows="3" value={kontak.address} onChange={(e) => setKontak({...kontak, address: e.target.value})}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors resize-none"
          ></textarea>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/60 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95">
          <Save className="w-4 h-4" /> Simpan Info Kontak
        </button>
      </div>
    </div>
  );
}