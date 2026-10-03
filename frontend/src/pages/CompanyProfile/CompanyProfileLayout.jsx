import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutTemplate, Briefcase, CalendarDays, Contact2 } from 'lucide-react';

export default function CompanyProfileLayout() {
  const location = useLocation();

  useEffect(() => {
    document.title = "Prisma Group - Profil Perusahaan";
  }, [location]);

  // Definisi Rute Tab (Akan merujuk ke URL terpisah)
  const tabs = [
    { path: '/company-profile/landing', label: 'Landing Page', icon: LayoutTemplate },
    { path: '/company-profile/layanan', label: 'Layanan Kami', icon: Briefcase },
    { path: '/company-profile/event', label: 'Event & Berita', icon: CalendarDays },
    { path: '/company-profile/kontak', label: 'Informasi Kontak', icon: Contact2 },
  ];

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* HEADER IDENTITAS PERUSAHAAN */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-5 shadow-sm backdrop-blur-sm transition-colors">
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-inner shrink-0">
          <img src="/PRISMA.PNG" alt="Logo Prisma Group" className="h-16 w-auto object-contain drop-shadow-sm" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-wide">Pengaturan Profil Perusahaan</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Kelola konten antarmuka publik, layanan, berita, dan informasi kontak <span className="font-bold text-amber-600 dark:text-amber-500">PRISMA GROUP</span>.
          </p>
        </div>
      </div>

      {/* COMPONENT NAVBAR (Menu Navigasi URL) */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-2 flex flex-wrap gap-2 shadow-sm backdrop-blur-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `
                flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all
                ${isActive 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </NavLink>
          );
        })}
      </div>

      {/* AREA RENDER KONTEN DINAMIS (Berdasarkan URL yang Aktif) */}
      <div className="transition-all duration-300">
        <Outlet />
      </div>

    </div>
  );
}