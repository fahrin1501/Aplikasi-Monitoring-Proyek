import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Building2, ShieldCheck, UserCheck, AlertCircle, User } from 'lucide-react';
import api from '../../api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); 
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Prisma Group - Login";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 

    try {
      const response = await api.post('/login', { email, password });
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      if (onLoginSuccess) onLoginSuccess();
      navigate('/dashboard'); 
    } catch (err) {
      if (err.response && err.response.data.message) setError(err.response.data.message);
      else setError('Gagal terhubung ke server. Pastikan API backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true); setError('');
    const guestEmail = 'tamu@prisma-group.com';
    const guestPassword = 'passwordtamu123';

    try {
      const response = await api.post('/login', { email: guestEmail, password: guestPassword });
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user_data', JSON.stringify(response.data.user));
      if (onLoginSuccess) onLoginSuccess();
      navigate('/dashboard');
    } catch (err) {
      try {
        const regResponse = await api.post('/register', { name: 'Pengunjung (Tamu)', email: guestEmail, password: guestPassword });
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* Side Visual Section - Branding PRISMA GROUP */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-white dark:bg-slate-800 flex-col justify-between p-12 overflow-hidden border-r border-slate-200 dark:border-slate-700/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:opacity-20 transition-colors" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-500 shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide">PRISMA GROUP</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Konsultan Teknik Konstruksi</p>
          </div>
        </div>

        <div className="relative z-10 space-y-4 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Sistem Manajemen Proyek
          </div>
          <h2 className="text-4xl font-extrabold text-slate-800 dark:text-white leading-tight">
            Pantau Progres & Pengawasan Lapangan Secara Real-Time
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed font-medium">
            Kelola volume progres, laporan harian, matriks Kurva S, hingga pemetaan GIS lokasi proyek dalam satu sistem pengawasan terpadu yang presisi.
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
            <div className="lg:hidden flex justify-center mb-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-amber-500 shadow-sm">
                <Building2 className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Selamat Datang</h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Silakan masuk menggunakan kredensial akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold shadow-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Akun</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@perusahaan.com"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-4 py-3 text-xs font-semibold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-amber-600 dark:text-amber-500 hover:underline">Lupa password?</Link>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-11 pr-11 py-3 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner transition-colors font-mono"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-xs transition-colors mt-2">
              {loading && email !== 'tamu@prisma-group.com' ? <div className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" /> : 'Masuk Dashboard'}
            </button>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute border-t border-slate-200 dark:border-slate-700 w-full"></div>
              <span className="bg-white dark:bg-slate-800 px-3 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider relative z-10 transition-colors">Atau</span>
            </div>

            <button type="button" onClick={handleGuestLogin} disabled={loading} className="w-full bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-3.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 text-xs transition-colors disabled:opacity-50">
              {loading && email === '' ? <div className="w-4 h-4 border-2 border-slate-700 dark:border-white border-t-transparent rounded-full animate-spin" /> : <><UserCheck className="w-4 h-4" /> Akses Sebagai Tamu</>}
            </button>

            <div className="text-center pt-2">
              <p className="text-[11px] font-semibold text-slate-500">
                Belum punya akun?{' '}
                <Link to="/register" className="font-extrabold text-amber-600 dark:text-amber-500 hover:underline">
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