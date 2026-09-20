import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, User, HardHat, ShieldCheck, UserPlus } from 'lucide-react';
import api from '../../api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
      document.title = "Prisma Group - Register";
    }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/register', formData);
      
      setSuccess(true);
      
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 1500);

    } catch (err) {
      if (err.response && err.response.data.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        setError(firstError);
      } else if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal terhubung ke server. Pastikan API backend berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Side Visual Section - SAMA PERSIS DENGAN LOGIN */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-800 flex-col justify-between p-12 overflow-hidden border-r border-slate-700/50">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
            <HardHat className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">CONS-MONITORING</h1>
            <p className="text-xs text-slate-400">Construction Supervision System</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" /> Portal Monitoring Konsultan
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Transparansi Progress & Pengawasan Lapangan Real-Time
          </h2>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Kelola volume progress, foto lapangan, Kurva S, hingga pemetaan GIS lokasi proyek dalam satu sistem terintegrasi.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 border-t border-slate-800 pt-4 flex justify-between">
          <span>&copy; {new Date().getFullYear()} Construction Consultant Portal</span>
          <span>Protected System</span>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 bg-slate-800/60 p-8 sm:p-10 rounded-2xl border border-slate-700/60 backdrop-blur-sm shadow-2xl">
          
          <div className="text-center space-y-2">
            <div className="lg:hidden flex justify-center mb-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500">
                <HardHat className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Buat Akun Baru</h2>
            <p className="text-xs text-slate-400">Daftar sebagai pengguna Tamu / Klien</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Notifikasi Error */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Notifikasi Sukses */}
            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-medium animate-fade-in">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Pendaftaran berhasil! Mengarahkan ke Dashboard...</span>
              </div>
            )}

            {/* Input Nama */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Nama Lengkap</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Alamat Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@perusahaan.com" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || success}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4" /> Daftar Sekarang</>
              )}
            </button>

            {/* Link ke Halaman Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Sudah punya akun?{' '}
                <Link to="/login" className="font-bold text-amber-500 hover:underline">
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