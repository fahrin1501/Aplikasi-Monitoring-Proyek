import React, { useState, useEffect } from 'react';
import api from '../../api'; 
import { 
  Users, Search, Plus, Shield, Mail, Edit3, Trash2, Key,
  ShieldCheck, HardHat, Building, UserCheck, X,
  AlertTriangle, CheckCircle2, UserPlus, Loader2, RotateCw, Sparkles
} from 'lucide-react';

export default function AccountList() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false); 
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
      document.title = "Prisma Group - Daftar Akun";
    }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');

  // --- MODAL STATES ---
  const [modalType, setModalType] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [addFormData, setAddFormData] = useState({ nama: '', email: '', role: 'Pengawas Lapangan', password: '' });
  const [editFormData, setEditFormData] = useState({ nama: '', email: '', role: 'Pengawas Lapangan', status: 'Aktif' });
  const [newPassword, setNewPassword] = useState('');

  // --- FETCH DATA DARI LARAVEL ---
  useEffect(() => {
    fetchUsers(true);
  }, []);

  const fetchUsers = async (showMainLoader = true) => {
    if (showMainLoader) setIsLoading(true);
    else setIsRefreshing(true);
    
    setErrorMsg('');
    try {
      const response = await api.get('/users');
      const formattedData = response.data.map(user => ({
        id: user.id,
        nama: user.name, 
        email: user.email,
        role: user.role || 'Pengawas Lapangan',
        status: user.status || 'Aktif',
        isNew: user.is_new || false, // <--- Menangkap flag is_new dari Laravel
        lastLogin: user.updated_at 
          ? new Date(user.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WITA'
          : 'Belum pernah login'
      }));
      setAccounts(formattedData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMsg('Gagal memuat data pengguna. Pastikan Anda sudah login dan server berjalan.');
    } finally {
      if (showMainLoader) setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  // Helper Buka Modal
  const openModal = (type, account = null) => {
    setSelectedAccount(account);
    if (type === 'edit' && account) {
      setEditFormData({
        nama: account.nama, email: account.email, role: account.role, status: account.status
      });
    }
    setModalType(type);
  };

  // Helper Tutup Modal
  const closeModal = () => {
    setModalType(null);
    setTimeout(() => {
      setSelectedAccount(null);
      setEditFormData({ nama: '', email: '', role: 'Pengawas Lapangan', status: 'Aktif' });
      setAddFormData({ nama: '', email: '', role: 'Pengawas Lapangan', password: '' });
      setNewPassword('');
      setErrorMsg('');
    }, 200);
  };

  // --- HANDLE TAMBAH AKUN BARU ---
  const handleAddAccount = async () => {
    if (!addFormData.nama || !addFormData.email || !addFormData.password) {
      setErrorMsg('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/register', {
        name: addFormData.nama, email: addFormData.email, password: addFormData.password, role: addFormData.role
      });
      fetchUsers(false); 
      closeModal(); 
    } catch (error) {
      if (error.response && error.response.data.message) setErrorMsg(error.response.data.message);
      else setErrorMsg('Gagal menambahkan akun baru.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLE UPDATE AKUN (EDIT) ---
  const handleUpdateAccount = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.put(`/users/${selectedAccount.id}`, {
        name: editFormData.nama, email: editFormData.email, role: editFormData.role, status: editFormData.status
      });
      fetchUsers(false); 
      closeModal(); 
    } catch (error) {
      if (error.response && error.response.data.message) setErrorMsg(error.response.data.message);
      else setErrorMsg('Gagal memperbarui data akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- HANDLE RESET PASSWORD ---
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password baru harus diisi dan minimal 6 karakter.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.put(`/users/${selectedAccount.id}/reset-password`, {
        password: newPassword
      });
      closeModal(); 
    } catch (error) {
      if (error.response && error.response.data.message) setErrorMsg(error.response.data.message);
      else setErrorMsg('Gagal mereset kata sandi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Data
  const filteredAccounts = accounts.filter(acc => {
    const matchSearch = acc.nama.toLowerCase().includes(searchTerm.toLowerCase()) || acc.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'Semua' || acc.role === filterRole;
    return matchSearch && matchRole;
  });

  // Helper Badge
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Administrator': return { icon: <Shield className="w-3 h-3" />, color: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20' };
      case 'Direktur': return { icon: <Building className="w-3 h-3" />, color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20' };
      case 'Team Leader': return { icon: <ShieldCheck className="w-3 h-3" />, color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' };
      case 'Pengawas Lapangan': return { icon: <HardHat className="w-3 h-3" />, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' };
      case 'Owner / PPK': return { icon: <UserCheck className="w-3 h-3" />, color: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20' };
      default: return { icon: <Users className="w-3 h-3" />, color: 'bg-slate-100 dark:bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-500/20' };
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            Manajemen Akun & Akses
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kelola pengguna sistem, otoritas role, dan status keaktifan akun.</p>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 sm:gap-3 w-full md:w-auto">

          <div className="relative flex-1 md:flex-none min-w-[150px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-56 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-800 dark:text-white pl-9 pr-4 py-2.5 md:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="flex-1 md:flex-none bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 px-3 py-2.5 md:py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer appearance-none"
          >
            <option value="Semua">Semua Role</option>
            <option value="Administrator">Administrator</option>
            <option value="Direktur">Direktur</option>
            <option value="Team Leader">Team Leader</option>
            <option value="Pengawas Lapangan">Pengawas Lapangan</option>
            <option value="Owner / PPK">Owner / PPK</option>
          </select>

          <button 
            onClick={() => openModal('add')}
            className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs px-3.5 py-2.5 md:py-2 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
          >
            <Plus className="w-4 h-4" /> Akun Baru
          </button>
        </div>
      </div>

      {/* PEMBERITAHUAN ERROR LUAR */}
      {errorMsg && !modalType && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Memuat data pengguna...</p>
        </div>
      ) : (
        <>
          {/* TAMPILAN MOBILE */}
          <div className="block md:hidden space-y-4">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc) => {
                const roleStyle = getRoleBadge(acc.role);
                return (
                  <div key={acc.id} className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-4 rounded-2xl shadow-sm flex flex-col gap-4 relative">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 text-sm">
                        {acc.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="font-bold text-slate-800 dark:text-white text-sm truncate flex items-center gap-2">
                          {acc.nama}
                          {/* BADGE NEW MOBILE */}
                          {acc.isNew && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20 animate-pulse">
                              <Sparkles className="w-2.5 h-2.5" /> NEW
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{acc.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${roleStyle.color} text-[10px] font-medium`}>
                        {roleStyle.icon} {acc.role}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        acc.status === 'Aktif' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {acc.status}
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Pembaruan:</span> {acc.lastLogin}
                      </p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openModal('edit', acc)} className="flex-1 py-2 bg-slate-50 dark:bg-slate-700/80 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-amber-400 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600 shadow-sm">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => openModal('reset', acc)} className="flex-1 py-2 bg-slate-50 dark:bg-slate-700/80 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-700 dark:text-blue-400 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-600 shadow-sm">
                          <Key className="w-3.5 h-3.5" /> Akses
                        </button>
                        <button onClick={() => openModal('delete', acc)} className="py-2 px-3 bg-slate-50 dark:bg-slate-700/80 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-700 dark:text-rose-400 rounded-lg transition-all border border-slate-200 dark:border-slate-600 shadow-sm shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <Users className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Akun tidak ditemukan</p>
              </div>
            )}
          </div>

          {/* TAMPILAN DESKTOP */}
          <div className="hidden md:block bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-auto min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-4 w-[35%]">Identitas Pengguna</th>
                    <th className="p-4 w-[25%]">Role & Otoritas</th>
                    <th className="p-4 text-center w-[15%]">Status</th>
                    <th className="p-4 w-[20%]">Pembaruan Sistem</th>
                    <th className="p-4 text-center w-[5%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs text-slate-700 dark:text-slate-300">
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((acc) => {
                      const roleStyle = getRoleBadge(acc.role);
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                {acc.nama.charAt(0).toUpperCase()}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-slate-800 dark:text-white text-[13px] truncate flex items-center gap-2">
                                  {acc.nama}
                                  {/* BADGE NEW DESKTOP */}
                                  {acc.isNew && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20 animate-pulse">
                                      <Sparkles className="w-2.5 h-2.5" /> NEW
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  <Mail className="w-3 h-3" /> <span className="truncate">{acc.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${roleStyle.color} text-[11px] font-medium`}>
                              {roleStyle.icon} {acc.role}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.status === 'Aktif' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'Aktif' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              {acc.status}
                            </span>
                          </td>
                          <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">{acc.lastLogin}</td>
                          <td className="p-4 text-center relative">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openModal('edit', acc)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all" title="Edit Akun">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => openModal('reset', acc)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all" title="Reset Password">
                                <Key className="w-4 h-4" />
                              </button>
                              <button onClick={() => openModal('delete', acc)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-all" title="Hapus/Nonaktifkan">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">
                        <Users className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Akun tidak ditemukan</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- INFO LEGEND --- */}
      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Keterangan Akses:</span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Admin</span>
          <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> Direktur</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> Team Leader</span>
          <span className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> Pengawas</span>
          <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" /> PPK</span>
        </div>
      </div>

      {/* ========================================== */}
      {/* KUMPULAN MODAL (POP-UP)                    */}
      {/* ========================================== */}

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          
          {/* MODAL 0: TAMBAH AKUN BARU */}
          {modalType === 'add' && (
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-amber-500"/> Tambah Akun Baru</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
              </div>

              {errorMsg && (
                <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    value={addFormData.nama}
                    onChange={(e) => setAddFormData({...addFormData, nama: e.target.value})}
                    placeholder="Contoh: Nama Pengguna" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alamat Email <span className="text-rose-500">*</span></label>
                  <input 
                    type="email" 
                    value={addFormData.email}
                    onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                    placeholder="email@konsultan.com" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role Akses <span className="text-rose-500">*</span></label>
                  <select 
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({...addFormData, role: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Direktur">Direktur</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Pengawas Lapangan">Pengawas Lapangan</option>
                    <option value="Owner / PPK">Owner / PPK</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Sementara <span className="text-rose-500">*</span></label>
                  <input 
                    type="password" 
                    value={addFormData.password}
                    onChange={(e) => setAddFormData({...addFormData, password: e.target.value})}
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors font-mono" 
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Pengguna akan diminta mengganti password saat login pertama kali.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button onClick={closeModal} disabled={isSubmitting} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50">Batal</button>
                <button onClick={handleAddAccount} disabled={isSubmitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Akun'}
                </button>
              </div>
            </div>
          )}

          {/* MODAL 1: EDIT AKUN */}
          {modalType === 'edit' && selectedAccount && (
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Edit3 className="w-4 h-4 text-amber-500"/> Edit Data Akun</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
              </div>

              {errorMsg && (
                <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={editFormData.nama} 
                    onChange={(e) => setEditFormData({...editFormData, nama: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Alamat Email</label>
                  <input 
                    type="email" 
                    value={editFormData.email} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Role Akses</label>
                    <select 
                      value={editFormData.role} 
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="Administrator">Administrator</option>
                      <option value="Direktur">Direktur</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Pengawas Lapangan">Pengawas Lapangan</option>
                      <option value="Owner / PPK">Owner / PPK</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
                    <select 
                      value={editFormData.status} 
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button onClick={closeModal} disabled={isSubmitting} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50">Batal</button>
                <button onClick={handleUpdateAccount} disabled={isSubmitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          )}

          {/* MODAL 2: RESET PASSWORD */}
          {modalType === 'reset' && selectedAccount && (
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Key className="w-4 h-4 text-blue-500"/> Reset Password</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
              </div>

              {errorMsg && (
                <div className="mx-5 mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div className="p-5 space-y-5">
                <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                  <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    Setel ulang kata sandi untuk akun <span className="font-bold">{selectedAccount.nama}</span>. Pastikan Anda memberikan password baru ini kepada pengguna yang bersangkutan.
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password Baru <span className="text-rose-500">*</span></label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter" 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors font-mono" 
                  />
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button onClick={closeModal} disabled={isSubmitting} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50">Batal</button>
                <button onClick={handleResetPassword} disabled={isSubmitting} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle2 className="w-4 h-4"/>}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Password Baru'}
                </button>
              </div>
            </div>
          )}

          {/* MODAL 3: KONFIRMASI HAPUS */}
          {modalType === 'delete' && selectedAccount && (
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6" onClick={e => e.stopPropagation()}>
              <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle className="w-6 h-6 text-rose-500 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Akun Pengguna</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Tindakan ini akan menghapus akun <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAccount.nama}</span> secara permanen dari sistem. Lanjutkan?
              </p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Batal</button>
                <button onClick={closeModal} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4"/> Ya, Hapus</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}