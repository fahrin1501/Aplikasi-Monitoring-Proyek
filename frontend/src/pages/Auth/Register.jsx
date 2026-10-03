import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, User, ShieldCheck, UserPlus, ShieldAlert, ArrowLeft } from 'lucide-react';
import api from '../../api';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // =========================================================================
  // KODE RAHASIA UNDANGAN (Silakan ubah sesuai keinginan Anda)
  // =========================================================================
  const SECRET_TOKEN = 'PRISMA-INVITE-2026';
  const currentToken = searchParams.get('token');

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { document.title = "Prisma Group - Register"; }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    
    if (formData.password.length < 6) {
      setError('Password minimal harus 6 karakter.'); setLoading(false); return;
    }

    try {
      const response = await api.post('/register', formData);
      setSuccess(true);
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      if (err.response && err.response.data.errors) setError(Object.values(err.response.data.errors)[0][0]);
      else if (err.response && err.response.data.message) setError(err.response.data.message);
      else setError('Gagal terhubung ke server. Pastikan API backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // TAMPILAN JIKA TOKEN SALAH / TIDAK ADA (AKSES DITOLAK)
  // =========================================================================
  if (currentToken !== SECRET_TOKEN) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-700/60 shadow-2xl text-center backdrop-blur-sm animate-fade-in">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-500/20 shadow-inner">
            <ShieldAlert className="w-10 h-10 text-rose-500 dark:text-rose-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-wide">Akses Ditolak</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Halaman pendaftaran ini bersifat tertutup. Anda memerlukan tautan undangan resmi dari Administrator PRISMA GROUP untuk dapat membuat akun.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Portal Login
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TAMPILAN FORM REGISTER JIKA TOKEN BENAR
  // =========================================================================
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Side Visual Section - Branding PRISMA GROUP */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white dark:bg-slate-800 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:opacity-20 transition-colors" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/PRISMA.PNG" alt="Prisma Group Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide">PRISMA GROUP</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Konsultan Teknik Konstruksi</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Undangan Akses Valid
          </div>
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
            Selamat Datang di Portal Manajemen Proyek Terpadu
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed font-medium">
            Tautan undangan Anda valid. Silakan lengkapi data diri Anda untuk mendapatkan akses ke dalam sistem pengawasan dan pelaporan proyek.
          </p>
        </div>

        <div className="relative z-10 text-xs font-bold text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between">
          <span>&copy; {new Date().getFullYear()} Prisma Jasa Konsulindo</span>
          <span>Protected Enterprise System</span>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800/60 p-8 sm:p-10 rounded-2xl border border-slate-200 dark:border-slate-700/60 backdrop-blur-sm shadow-xl dark:shadow-2xl transition-colors">
          
          <div className="text-center space-y-2">
            <div className="lg:hidden flex justify-center mb-4">
              <img src="/PRISMA.PNG" alt="Prisma Group Logo" className="h-14 w-auto object-contain drop-shadow-sm" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Buat Akun Baru</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lengkapi data diri Anda di bawah ini</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold shadow-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-sm animate-fade-in">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Pendaftaran berhasil! Mengalihkan ke Dashboard...</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Contoh: Budi Santoso" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="email@perusahaan.com" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'} name="password" required value={formData.password} onChange={handleChange} placeholder="Minimal 6 karakter" 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-11 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || success} className="w-full bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-xs transition-colors mt-4">
              {loading ? <div className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" /> Daftar Sekarang</>}
            </button>

            <div className="text-center pt-2">
              <p className="text-[11px] font-semibold text-slate-500">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-extrabold text-amber-600 dark:text-amber-500 hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}