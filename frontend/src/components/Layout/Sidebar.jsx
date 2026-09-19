import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api';
import { 
  Map, FolderKanban, ClipboardList, LogOut, Menu, X, 
  Users, Sun, Moon, CalendarDays
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // --- SETTING TAB BROWSER OTOMATIS ---
  useEffect(() => {
    document.title = "prismagroup";
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = '/PRISMA.PNG';
  }, []);

  // --- STATE TEMA (DARK/LIGHT MODE) ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') !== 'light';
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- STATE DATA USER LOGIN & RBAC ---
  const [userData, setUserData] = useState(() => {
    const stored = localStorage.getItem('user_data');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Gagal parsing data user lokal');
      }
    }
    return { name: 'Memuat...', role: 'Tamu' };
  });

  useEffect(() => {
    api.get('/user')
      .then(res => {
        if (res.data) {
          setUserData(res.data);
          localStorage.setItem('user_data', JSON.stringify(res.data));
        }
      })
      .catch(err => console.error("Gagal memuat data user:", err));
  }, []);

  const getInitials = (name) => {
    if (!name || name === 'Memuat...' || name === 'Guest / Tidak Login') return '?';
    return name.charAt(0).toUpperCase();
  };

  // DEFINISI HAK AKSES
  const userRole = userData?.role || 'Tamu';
  const isAdmin = userRole === 'Administrator';

  // --- MENU ITEMS ---
  const menuItems = [
    { path: '/', label: 'Dashboard Utama', icon: Map },
    { path: '/projects', label: 'Daftar Project', icon: FolderKanban },
    { path: '/schedules', label: 'Time Schedule', icon: CalendarDays }, 
    { path: '/laporan', label: 'Daftar Laporan', icon: ClipboardList },
    ...(isAdmin ? [{ path: '/accounts', label: 'Manajemen Akun', icon: Users }] : []),
  ];

  const handleItemClick = () => {
    if (isCollapsed) setIsCollapsed(false);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    handleItemClick();
  };

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 right-4 z-50 p-2.5 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xl backdrop-blur-md transition-all"
      >
        {isMobileOpen ? <X className="w-5 h-5 text-amber-500" /> : <Menu className="w-5 h-5" />}
      </button>

      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      <aside 
        className={`
          fixed md:static inset-y-0 left-0 z-40 flex flex-col justify-between transition-all duration-300 ease-in-out
          bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/60 
          text-slate-700 dark:text-slate-300 p-4 overflow-y-auto hide-scrollbar
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="space-y-4">
          
          <div className="flex flex-col gap-5 pb-5 border-b border-slate-200 dark:border-slate-700/60">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
              {!isCollapsed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider bg-slate-200 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/60 shadow-inner">
                  v1.0.0
                </span>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg transition-colors cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60"
                title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : 'px-1'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-extrabold text-lg shadow-sm transition-all ${isCollapsed ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}>
                {getInitials(userData.name)}
              </div>
              {!isCollapsed && (
                <div className="whitespace-nowrap transition-opacity duration-200 flex-1 min-w-0">
                  <h1 className="text-sm font-bold tracking-wide truncate text-slate-800 dark:text-white">
                    {userData.name}
                  </h1>
                  <p className="text-[10px] truncate text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                    {userData.role}
                  </p>
                </div>
              )}
            </div>
          </div>

          <nav className="space-y-1.5 pt-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleItemClick}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isCollapsed ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-amber-500 text-white dark:text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col mt-8">
          
          {/* IDENTITAS PERUSAHAAN (STATIS / HARDCODED) */}
          <div className={`relative ${isCollapsed ? 'flex justify-center' : 'px-1'} mb-5`}>
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
              <div 
                onClick={handleItemClick}
                className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden transition-all bg-transparent drop-shadow-md"
                title="PRISMA JASA KONSULINDO"
              >
                <img src="/PRISMA.PNG" alt="Logo Prisma" className="w-full h-full object-contain" />
              </div>

              {!isCollapsed && (
                <div className="whitespace-nowrap transition-opacity duration-200 flex-1 min-w-0">
                  <h1 className="text-sm font-bold tracking-wide truncate text-slate-800 dark:text-white">
                    PRISMA JASA
                  </h1>
                  <p className="text-[10px] truncate text-amber-600 dark:text-amber-500/90 font-bold tracking-widest mt-0.5">
                    KONSULINDO
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/60 pt-4 flex flex-col gap-2">
            {isCollapsed ? (
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
                className="flex items-center justify-center py-2.5 rounded-xl transition-all cursor-pointer w-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-amber-500 shrink-0" /> : <Moon className="w-5 h-5 text-indigo-400 shrink-0" />}
              </button>
            ) : (
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {isDarkMode ? 'Mode Gelap' : 'Mode Terang'}
                </span>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    isDarkMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ease-in-out ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

            <Link
              to="/login"
              onClick={handleLogout}
              title={isCollapsed ? "Keluar Akun" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isCollapsed ? 'justify-center px-0' : ''
              } text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 mt-1`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Keluar Akun</span>}
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}