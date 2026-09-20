import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; // Sesuaikan path API Anda
import { 
  HardHat, Map as MapIcon, TrendingUp, PenTool, 
  LogIn, MapPin, ShieldCheck, Cpu, Award, 
  ArrowRight, CheckCircle2, Mail, Phone, Building
} from 'lucide-react';

export default function CompanyProfile() {
  const navigate = useNavigate();
  
  // State untuk menampung identitas perusahaan dari database
  const [companyInfo, setCompanyInfo] = useState({
    name: 'PRISMA GROUP',
    subtitle: 'Konsultan Konstruksi',
    logoUrl: ''
  });

  // Fetch data profil perusahaan saat halaman dimuat
  useEffect(() => {
    api.get('/company-profile')
      .then(res => {
        if (res.data && res.data.data) {
          const profile = res.data.data;
          const logoUrl = profile.logo_path 
            ? (profile.logo_path.startsWith('http') ? profile.logo_path : `http://127.0.0.1:8000/${profile.logo_path}`) 
            : '';
          
          setCompanyInfo({
            name: profile.name || 'CONS-MONITORING',
            subtitle: profile.subtitle || 'Consultant System',
            logoUrl: logoUrl
          });
        }
      })
      .catch(err => console.error("Gagal memuat profil perusahaan", err));
  }, []);

  // --- KUMPULAN DATA STATIS ---
  const stats = [
    { value: '50+', label: 'Proyek Selesai', prefix: '' },
    { value: '15', label: 'Tahun Pengalaman', prefix: '' },
    { value: '100', label: 'Sesuai Standar Mutu', prefix: '%' },
    { value: '24/7', label: 'Monitoring Digital', prefix: '' }
  ];

  const services = [
    {
      title: 'Manajemen & Supervisi Konstruksi',
      desc: 'Pengawasan ketat di lapangan untuk menjamin kualitas material, ketepatan waktu, keselamatan kerja (K3), dan kesesuaian spesifikasi teknis dari awal hingga serah terima.',
      icon: <HardHat className="w-7 h-7 text-emerald-400" />
    },
    {
      title: 'Perencanaan & Desain Teknis (DED)',
      desc: 'Penyusunan Detail Engineering Design, perhitungan struktur tingkat lanjut, estimasi Rencana Anggaran Biaya (RAB), dan analisis kelayakan proyek.',
      icon: <PenTool className="w-7 h-7 text-blue-400" />
    },
    {
      title: 'Pemetaan Spasial & Topografi (GIS)',
      desc: 'Analisis geospasial presisi tinggi, pemetaan wilayah proyek interaktif berbasis GIS, dan survei topografi untuk perencanaan tata ruang yang akurat.',
      icon: <MapIcon className="w-7 h-7 text-amber-400" />
    },
    {
      title: 'Pengendalian Biaya & Kurva S',
      desc: 'Sistem monitoring progres fisik dan keuangan *real-time* terintegrasi. Analisis deviasi jadwal proaktif untuk mencegah keterlambatan (delay) dan pembengkakan biaya.',
      icon: <TrendingUp className="w-7 h-7 text-rose-400" />
    }
  ];

  const reasons = [
    { title: 'Integrasi Teknologi Digital', desc: 'Sistem pelaporan harian dan monitoring Kurva S kami telah terdigitalisasi, memberikan transparansi data 100% kepada owner/klien.', icon: <Cpu className="w-5 h-5 text-emerald-500" /> },
    { title: 'Tim Ahli Tersertifikasi', desc: 'Didukung oleh tenaga ahli sipil, arsitek, dan surveyor pemetaan yang memiliki sertifikasi keahlian resmi (SKA/SKK).', icon: <Award className="w-5 h-5 text-emerald-500" /> },
    { title: 'Integritas & Akuntabilitas', desc: 'Berkomitmen penuh terhadap mutu tanpa kompromi, memastikan setiap volume pekerjaan di lapangan sesuai dengan dokumen kontrak.', icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> }
  ];

  const portfolio = [
    {
      title: 'Pembangunan Infrastruktur Jalan & Jembatan Lintas Kabupaten',
      location: 'Kabupaten Tabalong, Kalimantan Selatan',
      category: 'Infrastruktur Jalan',
      status: 'Selesai 100%',
      color: 'from-amber-500/20 to-amber-900/20 border-amber-500/30 text-amber-500'
    },
    {
      title: 'Supervisi Gedung Fasilitas Publik Terpadu Tahap II',
      location: 'Banjarmasin, Kalimantan Selatan',
      category: 'Gedung & Arsitektur',
      status: 'Selesai 100%',
      color: 'from-blue-500/20 to-blue-900/20 border-blue-500/30 text-blue-500'
    },
    {
      title: 'Penataan Drainase & Kawasan Permukiman Perkotaan',
      location: 'Banjarbaru, Kalimantan Selatan',
      category: 'Tata Lingkungan',
      status: 'Progres Berjalan (On Track)',
      color: 'from-emerald-500/20 to-emerald-900/20 border-emerald-500/30 text-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden">
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      {/* --- NAVIGATION BAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/70 backdrop-blur-xl border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            {companyInfo.logoUrl ? (
              <img src={companyInfo.logoUrl} alt="Logo" className="w-10 h-10 md:w-11 md:h-11 object-contain drop-shadow-lg" />
            ) : (
              <div className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center border border-slate-700 shadow-lg">
                <HardHat className="w-6 h-6 text-emerald-400" />
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-base font-extrabold text-white tracking-wide uppercase leading-tight">{companyInfo.name}</h1>
              <p className="text-[10px] md:text-xs text-emerald-400 font-bold uppercase tracking-widest">{companyInfo.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <a href="#about" className="hover:text-white transition-colors">Tentang Kami</a>
              <a href="#services" className="hover:text-white transition-colors">Layanan</a>
              <a href="#portfolio" className="hover:text-white transition-colors">Portofolio</a>
            </div>
            
            <div className="w-px h-6 bg-slate-800 hidden md:block"></div>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-5 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5"
            >
              Masuk Sistem <LogIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        
        {/* --- 1. HERO SECTION --- */}
        <section className="pt-40 pb-20 lg:pt-48 lg:pb-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/50 rounded-full mb-8 backdrop-blur-sm animate-fade-in shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs md:text-sm font-semibold text-slate-300">Sistem Pengawasan Konstruksi Cerdas</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.15]">
              Membangun Infrastruktur <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                Presisi & Terintegrasi
              </span>
            </h1>
            
            <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Kami adalah mitra strategis Anda dalam perencanaan teknik sipil dan pengawasan konstruksi. Menggabungkan keahlian lapangan dengan teknologi pemantauan digital berbasis GIS.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <a
                href="https://wa.me/6281234567890?text=Halo%20admin,%20saya%20ingin%20konsultasi%20mengenai%20layanan%20konstruksi"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base"
              >
                Konsultasi Proyek <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#services"
                className="w-full sm:w-auto px-8 py-3.5 md:py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-500 flex items-center justify-center text-sm md:text-base"
              >
                Pelajari Layanan
              </a>
            </div>
          </div>
        </section>

        {/* --- 2. STATS BAR --- */}
        <section className="border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-800/80">
              {stats.map((stat, idx) => (
                <div key={idx} className="text-center px-4">
                  <div className="text-3xl md:text-4xl font-extrabold text-white flex items-center justify-center gap-0.5 mb-1.5">
                    {stat.value}<span className="text-emerald-400">{stat.prefix}</span>
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 3. TENTANG KAMI & WHY US --- */}
        <section id="about" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Transformasi Digital dalam <br className="hidden lg:block"/>
                <span className="text-emerald-400">Manajemen Konstruksi</span>
              </h2>
              <p className="text-slate-400 leading-relaxed text-base">
                Sebagai pionir konsultan konstruksi modern, kami tidak hanya mengandalkan insting lapangan. Kami memadukan keahlian teknik sipil konvensional dengan instrumen digital—mulai dari Peta GIS, laporan harian otomatis, hingga evaluasi Kurva S secara *real-time*.
              </p>
              <p className="text-slate-400 leading-relaxed text-base">
                Misi kami adalah memberikan rasa aman kepada pemilik proyek (Owner/PPK) melalui transparansi data yang akurat, mencegah pembengkakan anggaran, dan menjamin mutu material sesuai kontrak kerja.
              </p>
            </div>
            
            <div className="grid gap-4">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-4 p-5 bg-slate-900/50 border border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-colors">
                  <div className="p-3 bg-slate-800/80 rounded-xl shrink-0 border border-slate-700">
                    {reason.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">{reason.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{reason.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 4. LAYANAN KAMI --- */}
        <section id="services" className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-3 block">Spesialisasi Kami</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Layanan Konsultansi Profesional</h2>
              <p className="text-slate-400 text-base">
                Mendukung seluruh siklus hidup proyek infrastruktur Anda mulai dari studi kelayakan, desain awal, hingga pengawasan masa pemeliharaan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {services.map((item, idx) => (
                <div key={idx} className="p-8 bg-slate-900/80 border border-slate-800 rounded-3xl hover:border-emerald-500/40 hover:bg-slate-800/50 transition-all duration-300 group shadow-lg">
                  <div className="mb-6 p-4 bg-slate-950 rounded-2xl inline-block border border-slate-800 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{item.desc}</p>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Analisis Terukur</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dokumentasi Lengkap</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 5. PORTOFOLIO PROYEK --- */}
        <section id="portfolio" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <span className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-3 block">Rekam Jejak</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Portofolio Pekerjaan</h2>
              <p className="text-slate-400 text-base">
                Bukti nyata dedikasi kami dalam mengawasi dan merencanakan berbagai proyek infrastruktur strategis di wilayah Kalimantan dan sekitarnya.
              </p>
            </div>
            <button className="px-6 py-2.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-semibold rounded-xl text-sm transition-all whitespace-nowrap">
              Lihat Semua Proyek
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolio.map((item, idx) => (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300 hover:shadow-2xl hover:shadow-black/50">
                <div className={`h-2 w-full bg-gradient-to-r ${item.color}`}></div>
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <div className="mb-4">
                    <span className={`text-[10px] font-bold tracking-wider uppercase border px-2.5 py-1 rounded-md bg-gradient-to-r ${item.color}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 leading-snug group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-slate-400 flex items-start gap-2 mb-8">
                    <MapPin className="w-4 h-4 shrink-0 text-slate-500 mt-0.5" /> {item.location}
                  </p>
                  
                  <div className="mt-auto pt-5 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Status Pengawasan</span>
                    <span className={`font-bold ${item.status.includes('100%') ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 6. FOOTER & CTA --- */}
        <footer className="border-t border-slate-800 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
          
          <div className="max-w-7xl mx-auto px-6 pt-20 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
              
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  {companyInfo.logoUrl ? (
                    <img src={companyInfo.logoUrl} alt="Logo" className="w-8 h-8 object-contain grayscale opacity-70" />
                  ) : (
                    <HardHat className="w-8 h-8 text-slate-500" />
                  )}
                  <div>
                    <h1 className="text-base font-extrabold text-white tracking-wide uppercase">{companyInfo.name}</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{companyInfo.subtitle}</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-8">
                  Solusi pengawasan konstruksi pintar. Kami memastikan proyek Anda selesai tepat waktu, tepat anggaran, dan tepat mutu melalui integrasi data lapangan yang presisi.
                </p>
                <div className="flex gap-4">
                  {/* Social links placeholder */}
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-400 transition-colors cursor-pointer">In</div>
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-400 transition-colors cursor-pointer">Fb</div>
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-400 transition-colors cursor-pointer">Ig</div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Navigasi</h4>
                <ul className="space-y-3 text-sm text-slate-400 font-medium">
                  <li><a href="#about" className="hover:text-emerald-400 transition-colors">Tentang Kami</a></li>
                  <li><a href="#services" className="hover:text-emerald-400 transition-colors">Layanan Unggulan</a></li>
                  <li><a href="#portfolio" className="hover:text-emerald-400 transition-colors">Portofolio Proyek</a></li>
                  <li><button onClick={() => navigate('/login')} className="hover:text-emerald-400 transition-colors text-left">Masuk Portal Klien</button></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Hubungi Kami</h4>
                <ul className="space-y-4 text-sm text-slate-400 font-medium">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>Jl. Ahmad Yani Km 30, Banjarbaru, Kalimantan Selatan, 70711</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>+62 812 3456 7890</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                    <span>info@{companyInfo.name.toLowerCase().replace(/\s/g, '')}.com</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
              <p>&copy; {new Date().getFullYear()} {companyInfo.name}. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <span className="hover:text-slate-300 cursor-pointer">Syarat & Ketentuan</span>
                <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
              </div>
            </div>
          </div>
        </footer>
      </div>

    </div>
  );
}