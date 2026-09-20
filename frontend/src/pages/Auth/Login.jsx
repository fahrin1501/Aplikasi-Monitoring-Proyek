import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, HardHat, ShieldCheck, UserCheck, AlertCircle, User } from 'lucide-react';
import api from '../../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 
  const navigate = useNavigate();

  useEffect(() => {
      document.title = "Prisma Group - Login";
    }, []);

  // --- HANDLER LOGIN UTAMA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 

    try {
      const response = await api.post('/login', { 
        email, 
        password 
      });

      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      navigate('/dashboard'); 

    } catch (err) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal terhubung ke server. Pastikan API backend berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER LOGIN TAMU (AUTO-LOGIN / AUTO-REGISTER) ---
  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    
    const guestEmail = 'tamu@cons-monitoring.com';
    const guestPassword = 'passwordtamu123';

    try {
      // 1. Coba login langsung dengan akun tamu default
      const response = await api.post('/login', { email: guestEmail, password: guestPassword });
      
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      
      if (onLoginSuccess) onLoginSuccess();
      navigate('/dashboard');

    } catch (err) {
      // 2. Jika gagal (kemungkinan akun belum pernah dibuat), buat akun tamu secara otomatis
      try {
        const regResponse = await api.post('/register', {
          name: 'Pengunjung (Tamu)',
          email: guestEmail,
          password: guestPassword
        });

        localStorage.setItem('auth_token', regResponse.data.token);
        localStorage.setItem('user_data', JSON.stringify(regResponse.data.user));
        
        if (onLoginSuccess) onLoginSuccess();
        navigate('/dashboard');

      } catch (regErr) {
        setError('Gagal memproses akses Tamu. Pastikan database dan backend berjalan.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Side Visual Section - Branding Konsultan Konstruksi */}
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
            <h2 className="text-2xl font-bold text-white">Selamat Datang</h2>
            <p className="text-xs text-slate-400">Silakan masuk menggunakan kredensial akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Notifikasi Error */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email Akun</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'admin' ? 'inspector@consultant.com' : 'client@dinas.go.id'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-amber-500 hover:underline">Lupa password?</Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading && email !== 'tamu@cons-monitoring.com' ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Masuk Dashboard'
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute border-t border-slate-700 w-full"></div>
              <span className="bg-slate-800 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider relative z-10">
                Atau
              </span>
            </div>

            {/* Login Tamu Button */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer border border-slate-600"
            >
              {loading && email === '' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><User className="w-4 h-4" /> Akses Sebagai Tamu</>
              )}
            </button>

            {/* Link ke Halaman Register */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Belum punya akun?{' '}
                <Link to="/register" className="font-bold text-amber-500 hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}