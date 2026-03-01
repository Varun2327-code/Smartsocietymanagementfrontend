import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Eye,
  MessageSquare,
  Trash2,
  List,
  Info,
  Check,
  X,
  Zap,
  Activity,
  AlertOctagon,
  Shield,
  Droplets,
  Truck,
  ChevronRight,
  ShieldAlert,
  Archive,
  ArrowUpRight
} from 'lucide-react';
import useUserRole from '../../hooks/useUserRole';
import {
  useCollection,
  useUpdateDocument,
  useDeleteDocument
} from '../../hooks/useFirestore';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Triage', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock size={16} /> },
  { id: 'in-progress', label: 'Active', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <Activity size={16} /> },
  { id: 'resolved', label: 'Closed', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle size={16} /> },
];

const CATEGORY_ICONS = {
  'Maintenance': <Zap size={20} />,
  'Security': <Shield size={20} />,
  'Cleaning': <Droplets size={20} />,
  'General': <MessageSquare size={20} />,
  'Parking': <Truck size={20} />,
};

const Complaints = () => {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { role, loading: roleLoading } = useUserRole();
  const queryBuilder = useMemo(() => (colRef) => {
    if (role !== 'admin') return null;
    return colRef;
  }, [role]);

  const { data: complaints, loading: complaintsLoading } = useCollection('complaints', { queryBuilder });
  const loading = roleLoading || complaintsLoading;
  const { updateDocument: updateComplaint } = useUpdateDocument('complaints');
  const { deleteDocument: deleteComplaint } = useDeleteDocument('complaints');

  const filteredComplaints = useMemo(() => {
    if (!complaints) return [];
    return complaints.filter(c => {
      const q = query.toLowerCase();
      const matchesQuery = !query ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.submittedBy || '').toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || c.status === filter;
      return matchesQuery && matchesFilter;
    }).sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
  }, [complaints, filter, query]);

  const stats = useMemo(() => {
    if (!complaints) return { total: 0, pending: 0, active: 0, resolved: 0 };
    return complaints.reduce((acc, c) => {
      acc.total++;
      if (c.status === 'pending') acc.pending++;
      else if (c.status === 'in-progress') acc.active++;
      else if (c.status === 'resolved') acc.resolved++;
      return acc;
    }, { total: 0, pending: 0, active: 0, resolved: 0 });
  }, [complaints]);

  const handleStatusChange = async (id, newStatus) => {
    const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
    try {
      await updateComplaint(id, { status: newStatus, updatedAt: new Date().toISOString() });
      toast.success(`Workflow reached phase: ${newStatus}`, { id: loadingToast });
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      toast.error('Sync failed', { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Erase this incident from matrix?")) return;
    try {
      await deleteComplaint(id);
      toast.success("Incident purged");
      setIsDetailOpen(false);
    } catch (err) {
      toast.error("Purge failed");
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'low': return 'bg-sky-50 text-sky-600 border-sky-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 space-y-12 animate-pulse">
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
            Your current clearance level does not authorize access to the Triage Node.
            Please contact the Central Command if this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFEFE] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Premium Header Nexus */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-6 mb-4">
              <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 transition-transform hover:scale-110">
                <ShieldAlert size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                  Incident <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Nexus</span>
                </h1>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Resolution Intelligence Grid</p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 shadow-sm">
            {['all', ...STATUS_OPTIONS.map(o => o.id)].map(id => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all italic ${filter === id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100 border border-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {id === 'all' ? 'Universal' : STATUS_OPTIONS.find(o => o.id === id).label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tactical Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: 'Total Volume', val: stats.total, icon: <MessageSquare />, color: 'slate', sub: 'Matrix Entries' },
            { label: 'Triage Queue', val: stats.pending, icon: <Clock />, color: 'amber', sub: 'Awaiting Protocol' },
            { label: 'Active Pipeline', val: stats.active, icon: <Activity />, color: 'indigo', sub: 'Under Resolution' },
            { label: 'Resolved Nodes', val: stats.resolved, icon: <CheckCircle />, color: 'emerald', sub: 'Sealed Incidents' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-50/50 transition-all group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 transition-all group-hover:bg-indigo-50/50" />
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] text-${stat.color}-500/60 italic`}>{stat.label}</span>
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>{stat.icon}</div>
              </div>
              <div className="relative z-10">
                <div className="text-5xl font-black text-slate-900 leading-none mb-2 italic">{stat.val}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tactical Search Nexus */}
        <div className="relative mb-12 group">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
          <input
            type="text"
            placeholder="Scan incident matrix via keyword, resident hash or signal..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-20 pr-10 py-8 bg-white border border-slate-100 rounded-[3rem] text-sm font-black italic shadow-sm focus:ring-8 focus:ring-indigo-50 focus:border-indigo-100 transition-all outline-none placeholder:text-slate-200"
          />
        </div>

        {/* Incident Matrix Interface */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl shadow-indigo-100/20 overflow-hidden mb-24 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Incident Header</th>
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Origin Node</th>
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Priority Grid</th>
                  <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Status Flow</th>
                  <th className="px-12 py-10 text-right text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-12 py-40 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-inner">
                          <AlertOctagon size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase mb-4">Null Signal Detected.</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose italic">No incident nodes successfully materialized in this sector query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-indigo-50/20 transition-all group"
                    >
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform duration-500 ${c.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                            {CATEGORY_ICONS[c.category] || <MessageSquare size={20} />}
                          </div>
                          <div className="max-w-sm">
                            <div className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight mb-1">{c.title}</div>
                            <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.3em] italic">{c.category || 'Unclassified Segment'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-[10px] italic shadow-lg shadow-slate-200">
                            {c.submittedBy?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800 italic uppercase tracking-wider">{c.submittedBy}</div>
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Logged: {new Date(c.submittedAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <span className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] border italic shadow-sm ${getPriorityBadge(c.priority)}`}>
                          Grade {c.priority}
                        </span>
                      </td>
                      <td className="px-12 py-10">
                        <div className={`flex items-center gap-3 px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] w-max shadow-sm border italic ${STATUS_OPTIONS.find(o => o.id === c.status)?.color}`}>
                          <div className="w-2 h-2 rounded-full bg-current animate-pulse shadow-sm" />
                          {STATUS_OPTIONS.find(o => o.id === c.status)?.label || c.status}
                        </div>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={() => { setSelectedComplaint(c); setIsDetailOpen(true); }}
                            className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 hover:border-indigo-100 rounded-2xl transition-all active:scale-90"
                            title="Deep Inspection"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-4 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:shadow-2xl hover:shadow-rose-100 hover:border-rose-100 rounded-2xl transition-all active:scale-90"
                            title="Purge Node"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deep Inspection Drawer Nexus */}
      <AnimatePresence>
        {isDetailOpen && selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
              onClick={() => setIsDetailOpen(false)}
            />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-white z-[110] shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col pt-12"
            >
              <div className="px-12 flex items-center justify-between mb-16">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Incident Recon.</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Node Trace: {selectedComplaint.id?.substring(0, 16)}</p>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2rem] text-slate-400 transition-all group"
                >
                  <X size={28} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-12 space-y-16 pb-12 no-scrollbar">
                {/* Workflow Phase Tracker */}
                <div className="bg-slate-50/50 p-10 rounded-[4rem] border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Archive size={64} />
                  </div>
                  <div className="flex flex-col gap-8 relative z-10">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] italic">Current Phase</p>
                        <p className="text-4xl font-black text-slate-900 italic tracking-tight">{STATUS_OPTIONS.find(o => o.id === selectedComplaint.status)?.label}</p>
                      </div>
                      <div className="flex gap-2 mb-2">
                        {STATUS_OPTIONS.map(opt => (
                          <div key={opt.id} className={`h-2 transition-all duration-500 rounded-full ${selectedComplaint.status === opt.id ? 'w-10 bg-indigo-600' : 'w-4 bg-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Narrative Payload */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Signal Narrative Payload</span>
                  </div>
                  <div className="space-y-6 bg-white p-10 rounded-[3.5rem] border border-slate-50 shadow-inner group/card">
                    <h4 className="text-3xl font-black text-slate-900 leading-tight italic uppercase tracking-tighter group-hover/card:text-indigo-600 transition-colors">{selectedComplaint.title}</h4>
                    <p className="text-xl text-slate-500 leading-relaxed font-black italic border-l-8 border-slate-50 pl-10">
                      {selectedComplaint.description}
                    </p>
                  </div>
                </div>

                {/* Origin & Vectors */}
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic ml-4">Origin Node</span>
                    <div className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-50 group/origin transition-all hover:bg-white hover:shadow-xl">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-xl italic shadow-2xl group-hover/origin:rotate-6 transition-all">
                        {selectedComplaint.submittedBy?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 italic uppercase">{selectedComplaint.submittedBy}</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sector: {selectedComplaint.unit || 'CORE'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic ml-4">Temporal Sink</span>
                    <div className="flex items-center gap-5 p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-50">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><Clock size={28} /></div>
                      <div>
                        <div className="text-sm font-black text-slate-900 italic uppercase">Log Timestamp</div>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{new Date(selectedComplaint.submittedAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Control Interface */}
                <div className="pt-16 border-t border-slate-100 space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-indigo-600 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 italic">Resolution Pulse Sequence</span>
                  </div>
                  <div className="flex flex-col gap-6">
                    {selectedComplaint.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(selectedComplaint.id, 'in-progress')}
                        className="group relative w-full py-8 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-4 overflow-hidden italic"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <Zap size={20} className="group-hover:animate-pulse" />
                        Initiate Resolution Sequence
                      </button>
                    )}
                    {selectedComplaint.status === 'in-progress' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedComplaint.id, 'resolved')}
                          className="group relative w-full py-8 bg-emerald-600 text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-4 overflow-hidden italic"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          <CheckCircle size={20} className="group-hover:scale-125 transition-transform" />
                          Seal Incident Narrative
                        </button>
                        <button
                          onClick={() => handleStatusChange(selectedComplaint.id, 'pending')}
                          className="w-full py-5 text-slate-300 font-black uppercase tracking-[0.4em] text-[10px] hover:text-slate-900 transition-all italic flex items-center justify-center gap-3"
                        >
                          <Archive size={14} /> Reverse to Triage Cache
                        </button>
                      </>
                    )}
                    {selectedComplaint.status === 'resolved' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 bg-emerald-50 rounded-[4rem] border-4 border-emerald-100 text-center space-y-6 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -ml-16 -mt-16" />
                        <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 relative z-10 hover:rotate-12 transition-transform">
                          <CheckCircle size={40} />
                        </div>
                        <div className="relative z-10">
                          <h5 className="text-3xl font-black text-emerald-900 italic tracking-tighter uppercase mb-2">Narrative Sealed.</h5>
                          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em] italic">Node archived at {new Date(selectedComplaint.updatedAt).toLocaleTimeString()}</p>
                        </div>
                        <button
                          onClick={() => handleStatusChange(selectedComplaint.id, 'in-progress')}
                          className="relative z-10 p-4 text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] hover:text-indigo-800 transition-all italic flex items-center justify-center gap-2 mx-auto"
                        >
                          <ArrowUpRight size={14} /> Reopen Pulse
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-12 bg-slate-50 border-t border-slate-100 flex items-center justify-between mt-auto">
                <button
                  onClick={() => handleDelete(selectedComplaint.id)}
                  className="flex items-center gap-4 text-[10px] font-black text-rose-500 uppercase tracking-[0.4em] hover:text-rose-700 transition-all group italic"
                >
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:bg-rose-50 group-hover:rotate-12 transition-all"><Trash2 size={24} /></div>
                  Erase Signal Node
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="px-10 py-5 bg-white border-2 border-slate-100 rounded-[2rem] text-[10px] font-black tracking-[0.4em] uppercase hover:bg-slate-900 hover:text-white transition-all italic active:scale-95"
                >
                  Close Nexus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Complaints;
