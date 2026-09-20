import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api'; 
import { 
  Search, Plus, Filter, Loader2, AlertTriangle, 
  Users, Shield, User, Mail, ShieldAlert, CheckCircle2, 
  XCircle, Edit3, Trash2, Calendar
} from 'lucide-react';

export default function AccountList() {
  const navigate = useNavigate();
  
  // --- STATE MANAJEMEN ---
  const [accountList, setAccountList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = "Prisma Group - Daftar Akun";
  }, []);
  
  // --- SEARCH & FILTER ---
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({ role: 'Semua', status: 'Semua' });
  const filterRef = useRef(null);

  // --- LOGIKA ROLE (HAK AKSES / RBAC) ---
  const [currentUserRole, setCurrentUserRole] = useState('Tamu');

  useEffect(() => {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const user = JSON.parse(userDataStr);
        setCurrentUserRole(user.role || 'Tamu');
      } catch (error) {}
    }
  }, []);

  const isAdmin = currentUserRole === 'Administrator';

  // --- FETCH DATA DARI LARAVEL ---
  const fetchAccounts = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Sesuaikan endpoint API ini dengan rute Laravel Anda (misal: /users atau /accounts)
      const response = await api.get('/users');
      
      const formattedData = response.data.data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'Tamu',
        status: user.is_active ? 'aktif' : 'nonaktif', // Sesuaikan dengan field DB Anda
        createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-',
        originalData: user 
      }));
      
      setAccountList(formattedData);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setErrorMsg('Gagal memuat data akun. Pastikan server terhubung atau Anda memiliki akses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) setShowFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- DELETE LOGIC (Jika diperlukan langsung di list) ---
  const handleDelete = async (id, name) => {
    if(!window.confirm(`Apakah Anda yakin ingin menghapus akun ${name}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchAccounts();
    } catch (error) {
      alert('Gagal menghapus akun.');
    }
  };

  // --- LOGIKA FILTER ---
  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilter = (key) => setFilters(prev => ({ ...prev, [key]: 'Semua' }));

  const filteredAccounts = accountList.filter(acc => {
    const query = searchQuery.toLowerCase();
    const matchSearch = 
      acc.name.toLowerCase().includes(query) ||
      acc.email.toLowerCase().includes(query);
    
    const matchRole = filters.role === 'Semua' || acc.role === filters.role;
    const matchStatus = filters.status === 'Semua' || acc.status === filters.status;
    
    return matchSearch && matchRole && matchStatus;
  });

  // --- PEWARNAAN ROLE & STATUS ---
  const getRoleStyle = (role) => {
    if (role === 'Administrator') return { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", icon: <ShieldAlert size={14}/> };
    if (role === 'Team Leader') return { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", icon: <Shield size={14}/> };
    if (role === 'Pengawas Lapangan') return { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", icon: <User size={14}/> };
    return { bg: "bg-gray-500/10", text: "text-gray-600 dark:text-gray-400", border: "border-gray-500/20", icon: <User size={14}/> };
  };

  const getStatusStyle = (status) => {
    if (status === 'aktif') return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
    return "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400";
  };

  return (
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8 font-sans bg-gray-50/50 dark:bg-gray-900/50 flex flex-col">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="text-blue-600 dark:text-blue-400" size={32} />
            Daftar Akun
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manajemen pengguna, hak akses, dan status akun sistem.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none backdrop-blur-sm transition-all text-sm disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FILTER DROPDOWN */}
          <div className="relative" ref={filterRef}>
            <button 
              disabled={isLoading}
              onClick={() => setShowFilter(!showFilter)} 
              className={`p-2.5 border rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm disabled:opacity-50 ${
                showFilter || filters.role !== 'Semua' || filters.status !== 'Semua' 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600' 
                  : 'bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Filter size={20} />
            </button>

            {showFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-5 z-50">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Filter Akun</h4>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Hak Akses (Role)</label>
                    <div className="flex flex-wrap gap-2">
                      {['Semua', 'Administrator', 'Team Leader', 'Pengawas Lapangan', 'Tamu'].map(opt => (
                        <button 
                          key={opt}
                          onClick={() => handleFilterChange('role', opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            filters.role === opt 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Status Akun</label>
                    <div className="flex flex-wrap gap-2">
                      {['Semua', 'aktif', 'nonaktif'].map(opt => (
                        <button 
                          key={opt}
                          onClick={() => handleFilterChange('status', opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border capitalize ${
                            filters.status === opt 
                              ? 'bg-blue-600 text-white border-blue-600' 
                              : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button onClick={() => { setFilters({ role: 'Semua', status: 'Semua' }); setShowFilter(false); }} className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Reset Filter</button>
                </div>
              </div>
            )}
          </div>

          {/* TAMBAH AKUN BUTTON */}
          {isAdmin && (
            <button onClick={() => navigate('/accounts/input')} disabled={isLoading} className="flex-1 md:flex-none w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50">
              <Plus size={18} /> Tambah Akun
            </button>
          )}
        </div>
      </div>

      {/* FILTER TAGS AKTIF */}
      {(filters.role !== 'Semua' || filters.status !== 'Semua') && (
        <div className="flex flex-wrap gap-2 mb-6 -mt-2">
          {filters.role !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 text-purple-600 text-xs font-bold rounded-full border border-purple-500/20">
              Role: {filters.role}
              <button onClick={() => clearFilter('role')} className="hover:bg-purple-500/20 p-0.5 rounded-full transition-colors"><XCircle size={14}/></button>
            </span>
          )}
          {filters.status !== 'Semua' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full border border-emerald-500/20">
              Status: {filters.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
              <button onClick={() => clearFilter('status')} className="hover:bg-emerald-500/20 p-0.5 rounded-full transition-colors"><XCircle size={14}/></button>
            </span>
          )}
        </div>
      )}

      {/* NOTIFIKASI ERROR */}
      {errorMsg && (
        <div className="p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-medium">
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1 w-full bg-white/70 dark:bg-gray-800/40 backdrop-blur-md border border-gray-200/60 dark:border-white/10 rounded-2xl shadow-sm min-h-[400px]">
          <Loader2 size={40} className="text-blue-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memuat data akun sistem...</p>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (CARD) */}
          <div className="grid grid-cols-1 gap-4 md:hidden mb-8">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc) => {
                const roleStyle = getRoleStyle(acc.role);
                return (
                  <div key={acc.id} className="p-5 rounded-2xl border bg-white/70 dark:bg-gray-800/40 backdrop-blur-md border-gray-200/60 dark:border-white/10 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all">
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold text-lg border border-blue-200 dark:border-blue-800">
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{acc.name}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={12}/> {acc.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm border-y border-gray-100 dark:border-gray-700/50 py-3">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Role Akses</p>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                          {roleStyle.icon} {acc.role}
                        </span>
                      </div>
                      <div>
                         <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Status</p>
                         <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${getStatusStyle(acc.status)}`}>
                            {acc.status === 'aktif' ? <CheckCircle2 size={12}/> : <XCircle size={12}/>} {acc.status}
                          </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button onClick={() => navigate(`/accounts/edit/${acc.id}`)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold">
                          <Edit3 size={16} /> Edit
                        </button>
                        <button onClick={() => handleDelete(acc.id, acc.name)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold">
                          <Trash2 size={16} /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white/70 dark:bg-gray-800/40 backdrop-blur-md rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm">
                <Users size={40} className="mx-auto text-gray-400 mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">Akun tidak ditemukan.</p>
                <p className="text-sm text-gray-500 mt-1">Coba sesuaikan filter atau kata kunci.</p>
              </div>
            )}
          </div>

          {/* DESKTOP VIEW (TABLE) */}
          <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-gray-800/40 backdrop-blur-md shadow-lg mb-8">
            <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-200/60 dark:border-white/10">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[35%]">Profil Pengguna</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%]">Peran (Role)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%]">Bergabung</th>
                  {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center w-[15%]">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60 dark:divide-white/10">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc) => {
                    const roleStyle = getRoleStyle(acc.role);

                    return (
                      <tr key={acc.id} className="transition-colors group hover:bg-white/40 dark:hover:bg-white/5">
                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-extrabold border border-blue-200 dark:border-blue-800">
                              {acc.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{acc.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={12}/> {acc.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wider ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                            {roleStyle.icon} {acc.role}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wider ${getStatusStyle(acc.status)}`}>
                             {acc.status === 'aktif' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {acc.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 font-medium">
                            <Calendar size={16} className="text-gray-400" /> <span>{acc.createdAt}</span>
                          </div>
                        </td>

                        {isAdmin && (
                          <td className="px-6 py-4 align-middle text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => navigate(`/accounts/edit/${acc.id}`)} className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-all border border-blue-200 dark:border-blue-800" title="Edit Akun">
                                <Edit3 size={16} />
                              </button>
                              <button onClick={() => handleDelete(acc.id, acc.name)} className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl transition-all border border-rose-200 dark:border-rose-800" title="Hapus Akun">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? "5" : "4"} className="px-6 py-12 text-center text-gray-500">
                      <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">Akun tidak ditemukan.</p>
                      <p className="text-sm mt-1">Coba sesuaikan filter pencarian.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FOOTER LEGEND */}
      {!isLoading && filteredAccounts.length > 0 && (
        <div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-gray-800/40 backdrop-blur-sm p-4 mt-auto">
          <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Keterangan Indikator</h4>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><ShieldAlert size={16} className="text-purple-500" /> <span>Administrator (Hak Penuh)</span></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><Shield size={16} className="text-blue-500" /> <span>Team Leader</span></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><User size={16} className="text-amber-500" /> <span>Pengawas Lapangan</span></div>
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 hidden md:block mx-2"></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><CheckCircle2 size={16} className="text-emerald-500" /> <span>Akun Aktif</span></div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300"><XCircle size={16} className="text-rose-500" /> <span>Akun Nonaktif</span></div>
          </div>
        </div>
      )}

    </div>
  );
}