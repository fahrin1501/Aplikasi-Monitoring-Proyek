import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, HardHat, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import api from '../../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // Memanggil API Laravel untuk mengirim email reset
      const response = await api.post('/forgot-password', { email });
      setSuccessMsg(response.data.message || 'Link reset password telah dikirim ke email Anda!');
      setEmail(''); // Kosongkan input setelah berhasil
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

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100">
      {/* Side Visual Section - SAMA PERSIS DENGAN LOGIN & REGISTER */}
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
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500">
                <KeyRound className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Lupa Kata Sandi?</h2>
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              Masukkan alamat email Anda yang terdaftar, dan kami akan mengirimkan tautan untuk menyetel ulang kata sandi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Notifikasi Error */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {/* Notifikasi Sukses */}
            {successMsg && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-emerald-400 text-xs font-medium animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
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
                  placeholder="email@perusahaan.com" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Kirim Tautan Reset'
              )}
            </button>

            {/* Link Kembali ke Login */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Ingat kata sandi Anda?{' '}
                <Link to="/login" className="font-bold text-amber-500 hover:underline">
                  Kembali ke Login
                </Link>
              </p>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}