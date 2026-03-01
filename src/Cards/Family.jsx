import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Phone,
  Home,
  User,
  Shield,
  ChevronRight,
  MoreVertical,
  Activity,
  MapPin,
  Mail,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  LayoutGrid,
  List
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "react-hot-toast";

const Family = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  // States for filters
  const [filterRole, setFilterRole] = useState("All");
  const [filterWing, setFilterWing] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !loadingAuth) return;

    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast.error("Cloud sync failed");
      setLoading(false);
    });

    return () => unsub();
  }, [user, loadingAuth]);

  const wings = useMemo(() => {
    const w = new Set(users.map(u => u.wing).filter(Boolean));
    return ["All", ...Array.from(w)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.apartment?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === "All" || u.role?.toLowerCase() === filterRole.toLowerCase();
      const matchesWing = filterWing === "All" || u.wing === filterWing;

      return matchesSearch && matchesRole && matchesWing;
    });
  }, [users, searchTerm, filterRole, filterWing]);

  if (loadingAuth || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4">
        <Activity className="animate-spin text-blue-600" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Accessing Resident Registry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800 sticky top-0 z-30 h-24 flex items-center shadow-sm px-6">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-blue-600 transition-all hover:scale-110 active:scale-95 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter italic">Resident Family</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                <Users size={10} /> {users.length} Registered Members
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-xl relative hidden md:block">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search by name, flat, or wing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}><List size={18} /></button>
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 rounded-xl transition-all border ${isFilterOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-500'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">

        {/* Dynamic Filters Area */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 flex flex-wrap gap-10 shadow-sm">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Member Role</label>
                  <div className="flex gap-2">
                    {['All', 'Admin', 'Resident'].map(r => (
                      <button
                        key={r}
                        onClick={() => setFilterRole(r)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${filterRole === r ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >{r}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Building Wing</label>
                  <div className="flex gap-2">
                    {wings.map(w => (
                      <button
                        key={w}
                        onClick={() => setFilterWing(w)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${filterWing === w ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                      >{w}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Card Grid */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          <AnimatePresence>
            {filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <Users size={64} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Empty Registry</h3>
                <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">No residents matching your filter criteria</p>
              </motion.div>
            ) : (
              filteredUsers.map((u, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  key={u.id}
                  className={viewMode === 'grid'
                    ? "group bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
                    : "group bg-white dark:bg-slate-900 rounded-3xl p-5 border dark:border-slate-800 flex items-center justify-between hover:shadow-xl transition-all"}
                >
                  {/* Card Decoration */}
                  {viewMode === 'grid' && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-600/5 to-transparent rounded-bl-full pointer-events-none" />
                  )}

                  <div className={viewMode === 'grid' ? "flex flex-col items-center text-center" : "flex items-center gap-6"}>
                    <div className={`relative ${viewMode === 'grid' ? 'mb-6' : ''}`}>
                      <div className={`rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black 
                                        ${viewMode === 'grid' ? 'w-24 h-24 text-3xl' : 'w-14 h-14 text-sm'}`}>
                        <User size={viewMode === 'grid' ? 40 : 20} className="text-slate-400" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl border-4 border-white dark:border-slate-900 shadow-lg">
                        <Home size={viewMode === 'grid' ? 16 : 12} />
                      </div>
                    </div>

                    <div className={viewMode === 'grid' ? "space-y-1" : "text-left"}>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{u.name || 'Unknown Resident'}</h3>
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                          {u.role || 'Member'}
                        </span>
                        <span className="text-slate-400 font-bold text-xs uppercase tracking-tighter flex items-center gap-1">
                          <MapPin size={10} /> {u.apartment || '?'}{u.wing ? ` - ${u.wing}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="mt-8 pt-8 border-t dark:border-slate-800 w-full space-y-3">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl">
                        <Mail size={16} className="text-slate-400" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate">{u.email || 'No email registered'}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${u.phone}`} className="flex-1 flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">
                          <Phone size={14} /> Call Resident
                        </a>
                        <button className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:text-blue-600 transition-all">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="hidden lg:flex flex-col text-right">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`tel:${u.phone}`} className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Phone size={18} /></a>
                        <button className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl"><MoreVertical size={18} /></button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Family;
