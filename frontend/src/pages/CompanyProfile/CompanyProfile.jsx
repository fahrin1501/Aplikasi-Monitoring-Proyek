import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Menu, X, Sun, Moon } from 'lucide-react';
import LandingPage from './LandingPage';
import Layanan from './Layanan';
import Event from './Event';
import ContactInfo from './ContactInfo';

export default function CompanyProfile() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- STATE TEMA (DARK/LIGHT MODE) ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') !== 'light';
    }
    return true;
  });

  useEffect(() => {
    document.title = "Prisma Group - Konsultan Teknik Konstruksi";
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans selection:bg-amber-500 selection:text-white">
      
      {/* PUBLIC NAVBAR */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200 dark:border-slate-800 py-3 shadow-sm' 
          : 'bg-transparent border-transparent py-5'
      }`}>
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img src="/PRISMA.PNG" alt="Prisma Group" className="h-10 w-auto drop-shadow-sm" />
            <div>
              <h1 className="text-lg font-extrabold text-slate-800 dark:text-white leading-none tracking-wide">PRISMA GROUP</h1>
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-0.5">Konsultan Teknik</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('layanan')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Layanan</button>
            <button onClick={() => scrollToSection('event')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Event</button>
            <button onClick={() => scrollToSection('kontak')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">Kontak</button>
            
            <div className="flex items-center gap-4 pl-4 border-l border-slate-300 dark:border-slate-700">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              </button>
              <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-full transition-all shadow-md active:scale-95">
                Portal Login <LogIn className="w-4 h-4" />
              </Link>
            </div>
          </nav>

          {/* Mobile Toggle */}
          <button className="md:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl flex flex-col px-6 py-4 gap-4 animate-fade-in">
            <button onClick={() => scrollToSection('layanan')} className="text-left font-bold text-slate-700 dark:text-slate-300 py-2">Layanan Kami</button>
            <button onClick={() => scrollToSection('event')} className="text-left font-bold text-slate-700 dark:text-slate-300 py-2">Berita & Event</button>
            <button onClick={() => scrollToSection('kontak')} className="text-left font-bold text-slate-700 dark:text-slate-300 py-2">Kontak</button>
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                {isDarkMode ? <><Sun className="w-5 h-5 text-amber-500" /> Mode Terang</> : <><Moon className="w-5 h-5 text-indigo-500" /> Mode Gelap</>}
              </button>
              <Link to="/login" className="px-5 py-2 bg-amber-500 text-white dark:text-slate-950 text-xs font-bold rounded-full shadow-md">Portal Login</Link>
            </div>
          </div>
        )}
      </header>

      {/* COMPONENT SECTIONS (Disusun ke bawah) */}
      <main>
        <LandingPage />
        <div id="layanan"><Layanan /></div>
        <div id="event"><Event /></div>
        <div id="kontak"><ContactInfo /></div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 text-center text-slate-400 text-sm">
        <div className="container mx-auto px-6">
          <img src="/PRISMA.PNG" alt="Prisma Group" className="h-10 w-auto mx-auto mb-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
          <p className="font-medium">&copy; {new Date().getFullYear()} Prisma Jasa Konsulindo. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}