import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  LogOut,
  MoreVertical,
  MapPin,
  Phone,
  Calendar,
  Truck,
  X,
  Trash2,
  ArrowRight,
  ChevronDown,
  Shield,
  Activity,
  Zap,
  Users
} from 'lucide-react';
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useForm
} from '../../hooks/useFirestore';
import { visitorValidationSchema } from '../../utils/validationUtils';
import toast from 'react-hot-toast';

import useUserRole from '../../hooks/useUserRole';
import Sidebar from '../../components/Sidebar';

const STATUS_CONFIG = {
  'Expected': { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <Calendar size={14} /> },
  'Checked In': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <Activity size={14} /> },
  'Checked Out': { color: 'bg-slate-50 text-slate-400 border-slate-100', icon: <LogOut size={14} /> },
};

const Visitors = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: visitors, loading: visitorsLoading } = useCollection('visitors');
  const { addDocument: logVisitor } = useAddDocument('visitors');
  const { updateDocument: updateStatus } = useUpdateDocument('visitors');
  const { deleteDocument: purgeRecord } = useDeleteDocument('visitors');

  const {
    formData,
    errors,
    handleChange,
    resetForm
  } = useForm({
    name: '',
    purpose: '',
    flatNumber: '',
    phone: '',
    vehicleNumber: '',
  }, visitorValidationSchema);

  const filteredVisitors = useMemo(() => {
    if (!Array.isArray(visitors)) return [];
    return visitors.filter(v => {
      const nameMatch = (v.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const flatMatch = (v.flatNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = (v.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = nameMatch || flatMatch || phoneMatch;
      const matchesFilter = activeFilter === "all" || v.status === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [visitors, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    if (!Array.isArray(visitors)) return { total: 0, active: 0, expected: 0 };
    return {
      total: visitors.length,
      active: visitors.filter(v => v.status === 'Checked In').length,
      expected: visitors.filter(v => v.status === 'Expected').length
    };
  }, [visitors]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Authorizing visitor sequence...");
    try {
      await logVisitor({
        ...formData,
        status: 'Expected',
        role: 'visitor',
        createdAt: new Date(),
        updatedAt: new Date().toISOString()
      });
      toast.success("Authorization Granted", { id: loadingToast });
      setShowDrawer(false);
      resetForm();
    } catch (err) {
      toast.error("Protocol Failure", { id: loadingToast });
    }
  };

  const handleStatusChange = async (id, status) => {
    const loadingToast = toast.loading(`Transitioning to ${status}...`);
    try {
      const updateData = {
        status,
        updatedAt: new Date().toISOString()
      };
      if (status === 'Checked In') updateData.checkInTime = new Date().toLocaleTimeString();
      if (status === 'Checked Out') updateData.checkOutTime = new Date().toLocaleTimeString();

      await updateStatus(id, updateData);
      toast.success(`Subject ${status}`, { id: loadingToast });
    } catch (err) {
      toast.error("Transition Aborted", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this visitor node?")) return;
    try {
      await purgeRecord(id);
      toast.success("Node Purged");
    } catch (err) {
      toast.error("Purge Failed");
    }
  };

  const loading = visitorsLoading || roleLoading;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 space-y-12 animate-pulse font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="h-12 w-64 bg-slate-200 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[3rem]" />)}
      </div>
    </div>
  );

  if (role !== 'admin' && role !== 'security') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-rose-100 text-center max-w-lg">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-rose-500">
            <Shield size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 uppercase italic">Access Denied</h1>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Your current clearance level does not authorize access to the Sentinel Node.
            Please contact the Central Command if this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Nexus */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                  Entry <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Sentinel</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">High-Clearance Access Matrix</p>
              </div>
            </div>
          </motion.div>

          <button
            onClick={() => setShowDrawer(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
            Log New Transit
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Quick Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Total Logs', val: stats.total, sub: 'Historical Data', icon: <Users />, color: 'indigo' },
            { label: 'Inside Perimeter', val: stats.active, sub: 'Active Signals', icon: <Activity />, color: 'emerald' },
            { label: 'Expected Transit', val: stats.expected, sub: 'Authorized Pending', icon: <Clock />, color: 'amber' }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{s.sub}</div>
              </div>
              <div>
                <div className="text-4xl font-black text-slate-900 mb-1 italic">{s.val}</div>
                <div className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform">
                {React.cloneElement(s.icon, { size: 120 })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tactical Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search by Identity, Unit, or Signal Vector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all"
            />
          </div>
          <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm gap-2 overflow-x-auto no-scrollbar">
            {['all', 'Expected', 'Checked In', 'Checked Out'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Visitor Cards Matrix */}
        {filteredVisitors.length === 0 ? (
          <div className="bg-white rounded-[4rem] py-40 text-center border border-dashed border-slate-200 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600 via-transparent to-transparent pointer-events-none" />
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Users size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 italic">Zero Signals Detected</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All transit nodes currently clear in this sector.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {filteredVisitors.map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-10">
                  <div className={`px-4 py-1.5 rounded-full border font-black uppercase tracking-widest flex items-center gap-2 ${STATUS_CONFIG[v.status]?.color}`}>
                    {STATUS_CONFIG[v.status]?.icon} {v.status}
                  </div>
                  <button onClick={() => handleDelete(v.id)} className="p-3 bg-slate-50 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic">{v.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                      <MapPin size={12} className="text-indigo-500" /> Unit {v.flatNumber} • Sector Apex
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-3xl border border-slate-100/50">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Purpose Vector</span>
                      <p className="text-xs font-bold text-slate-700 italic">{v.purpose}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Signal Hub</span>
                      <p className="text-xs font-bold text-slate-700">{v.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Status Pulse</span>
                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic leading-none mt-1">
                        {v.checkInTime ? `ENTRY [${v.checkInTime}]` : 'AWAITING PERIMETER'}
                      </div>
                    </div>

                    {v.status === 'Expected' && (
                      <button
                        onClick={() => handleStatusChange(v.id, 'Checked In')}
                        className="group/btn flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-105"
                      >
                        Authorize <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                    {v.status === 'Checked In' && (
                      <button
                        onClick={() => handleStatusChange(v.id, 'Checked Out')}
                        className="group/btn flex items-center gap-3 px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 shadow-xl shadow-slate-100 transition-all hover:scale-105"
                      >
                        Log Exit <LogOut size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    )}
                    {v.status === 'Checked Out' && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase italic">
                        <Trash2 size={12} /> Record Archived
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50/20 to-transparent pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Logic Entry Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDrawer(false)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white z-[110] shadow-2xl flex flex-col pt-12"
            >
              <div className="px-12 flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">New Transit.</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Register subject into perimiter matrix</p>
                </div>
                <button onClick={() => setShowDrawer(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.5rem] transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex-1 overflow-y-auto px-12 space-y-10 pb-12">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4 text-xs italic">Identifier Alias</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Subject Full Identity"
                    className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                  />
                  {errors.name && <p className="text-[10px] text-rose-500 font-black ml-4 uppercase tracking-widest italic">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4 text-xs italic">Target Node</label>
                    <input
                      name="flatNumber"
                      value={formData.flatNumber}
                      onChange={handleChange}
                      placeholder="e.g. B-404"
                      className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4 text-xs italic">Mission Purpose</label>
                    <input
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      placeholder="Maintenance/Service"
                      className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4 text-xs italic">Signal Vector (Phone)</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 [000-000-0000]"
                    className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4 text-xs italic">Transport Matrix (Optional)</label>
                  <input
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="CH-01-AX-0000"
                    className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                  />
                </div>

                <div className="pt-10">
                  <button
                    type="submit"
                    className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group"
                  >
                    Commit Authorization <Zap size={20} className="group-hover:animate-pulse" />
                  </button>
                </div>
              </form>

              <div className="p-12 border-t border-slate-50 bg-slate-50 text-center">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Sentinel Node Alpha-IX</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Visitors;
