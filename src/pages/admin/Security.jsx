import React, { useState, useMemo } from 'react';
import {
  Shield,
  Users,
  Package,
  AlertTriangle,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  UserCheck,
  Phone,
  Search,
  ArrowRight,
  Eye,
  Lock,
  Zap,
  Radio,
  Target,
  Bell,
  Fingerprint,
  Cpu,
  Layers,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useUserRole from '../../hooks/useUserRole';
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useForm
} from '../../hooks/useFirestore';
import {
  query as firestoreQuery,
  orderBy as firestoreOrderBy
} from 'firebase/firestore';
import { guardValidationSchema } from '../../utils/validationUtils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { auth } from '../../firebase';
import toast from 'react-hot-toast';

const AdminSecurity = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('visitors');
  const [showGuardForm, setShowGuardForm] = useState(false);
  const [editingGuard, setEditingGuard] = useState(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tactical Query Builders - Auth Gated
  const visitorsQB = useMemo(() => (colRef) => role === 'admin' ? firestoreQuery(colRef, firestoreOrderBy('createdAt', 'desc')) : null, [role]);
  const guardsQB = useMemo(() => (colRef) => role === 'admin' ? firestoreQuery(colRef, firestoreOrderBy('name', 'asc')) : null, [role]);
  const deliveriesQB = useMemo(() => (colRef) => role === 'admin' ? firestoreQuery(colRef, firestoreOrderBy('timestamp', 'desc')) : null, [role]);
  const alertsQB = useMemo(() => (colRef) => role === 'admin' ? firestoreQuery(colRef, firestoreOrderBy('timestamp', 'desc')) : null, [role]);

  const { data: visitors = [], loading: visitorsLoading } = useCollection('visitors', { queryBuilder: visitorsQB });
  const { data: guards = [], loading: guardsLoading } = useCollection('guards', { queryBuilder: guardsQB });
  const { data: deliveries = [], loading: deliveriesLoading } = useCollection('deliveries', { queryBuilder: deliveriesQB });
  const { data: alerts = [], loading: alertsLoading } = useCollection('alerts', { queryBuilder: alertsQB });

  const { addDocument: addGuard } = useAddDocument('guards');
  const { addDocument: addAlert } = useAddDocument('alerts');
  const { updateDocument: updateVisitor } = useUpdateDocument('visitors');
  const { updateDocument: updateGuard } = useUpdateDocument('guards');
  const { updateDocument: updateAlert } = useUpdateDocument('alerts');
  const { deleteDocument: deleteGuard } = useDeleteDocument('guards');

  const guardForm = useForm({ name: '', contact: '', shift: 'Day', status: 'Active' }, guardValidationSchema);
  const alertForm = useForm({ message: '', priority: 'Medium', type: 'General' }, {
    message: (v) => (!v ? 'Message required' : null)
  });

  if (roleLoading) return (
    <div className="min-h-screen bg-[#FDFEFE] flex items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );

  if (role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFEFE] font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-20 bg-white rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(244,63,94,0.2)] border border-rose-50 max-w-lg"
      >
        <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-rose-600 shadow-xl shadow-rose-100">
          <ShieldAlert size={48} className="animate-bounce" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter italic italic">Security Breach.</h2>
        <p className="text-slate-400 font-black mt-4 uppercase text-[10px] tracking-[0.4em] italic leading-relaxed">Identity Clearance Insufficient for Sector Access. Localizing Threat Coordinates...</p>
        <button onClick={() => window.history.back()} className="mt-12 px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-rose-600 transition-all active:scale-95 italic">Log Out Handshake</button>
      </motion.div>
    </div>
  );

  const handleApproveVisitor = async (id) => {
    const loadingToast = toast.loading('Synchronizing approval...');
    try {
      await updateVisitor(id, { status: 'Approved', approvedBy: auth.currentUser?.uid });
      toast.success('Visitor Identity Validated', { id: loadingToast });
    } catch (err) {
      toast.error('Sync Interrupted', { id: loadingToast });
    }
  };

  const handleRejectVisitor = async (id) => {
    const loadingToast = toast.loading('Synchronizing rejection...');
    try {
      await updateVisitor(id, { status: 'Rejected', rejectedBy: auth.currentUser?.uid });
      toast.success('Access Vector Denied', { id: loadingToast });
    } catch (err) {
      toast.error('Sync Interrupted', { id: loadingToast });
    }
  };

  const handleGuardAction = async () => {
    const v = guardForm.validateForm();
    if (!v.isValid) return toast.error('Check Node Identities');

    const loadingToast = toast.loading('Updating Personnel Matrix...');
    try {
      if (editingGuard) {
        await updateGuard(editingGuard.id, guardForm.formData);
        toast.success('Personnel Record Updated', { id: loadingToast });
      } else {
        await addGuard(guardForm.formData);
        toast.success('Personnel Identity Initialized', { id: loadingToast });
      }
      guardForm.resetForm();
      setEditingGuard(null);
      setShowGuardForm(false);
    } catch (err) {
      toast.error('Matrix Sync Failed', { id: loadingToast });
    }
  };

  const handleSendAlert = async () => {
    const v = alertForm.validateForm();
    if (!v.isValid) return toast.error('Signal message required');

    const loadingToast = toast.loading('Broadcasting Signal...');
    try {
      await addAlert({
        ...alertForm.formData,
        sentBy: auth.currentUser?.uid,
        status: 'Active',
        timestamp: new Date()
      });
      alertForm.resetForm();
      setShowAlertForm(false);
      toast.success('Emergency Broadcast Logged', { id: loadingToast });
    } catch (err) {
      toast.error('Broadcast Interrupted', { id: loadingToast });
    }
  };

  const tabs = [
    { id: 'visitors', label: 'Identity Filter', icon: <Users size={20} />, color: 'indigo' },
    { id: 'guards', label: 'Personnel Roster', icon: <Fingerprint size={20} />, color: 'purple' },
    { id: 'deliveries', label: 'Supply Nexus', icon: <Package size={20} />, color: 'amber' },
    { id: 'alerts', label: 'Signaling Hub', icon: <Radio size={20} />, color: 'rose' }
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFE] pb-24 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Tactical Header */}
      <div className="max-w-7xl mx-auto px-8 pt-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-16">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-6">
              <span className="px-5 py-2 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 shadow-[0_15px_30px_-5px_rgba(225,29,72,0.3)] italic">
                <Shield size={14} className="animate-pulse" /> Security Matrix Hub
              </span>
              <span className="px-5 py-2 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic shadow-inner border border-white">
                Ver: SM-4.0.1
              </span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-6 italic uppercase">
              Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-indigo-600">Protocol.</span>
            </h1>
            <p className="text-slate-400 font-black text-xl max-w-2xl italic leading-relaxed uppercase text-[12px] tracking-widest opacity-80">
              High-clearance synchronization with society perimeter nodes, guard telemetry, and emergency broadcast signals.
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-4">
            {activeTab === 'guards' && (
              <button
                onClick={() => { setShowGuardForm(true); setEditingGuard(null); guardForm.resetForm(); }}
                className="group px-10 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] flex items-center gap-4 hover:scale-105 transition-all active:scale-95 italic"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Initialize Personnel
              </button>
            )}
            {activeTab === 'alerts' && (
              <button
                onClick={() => setShowAlertForm(true)}
                className="group px-10 py-6 bg-rose-600 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_30px_60px_-15px_rgba(225,29,72,0.3)] flex items-center gap-4 hover:scale-105 transition-all active:scale-95 italic"
              >
                <Radio size={20} className="animate-pulse" /> Dispatch Signal
              </button>
            )}
            <div className="flex bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 shadow-inner">
              <button className="p-4 text-slate-400 hover:text-indigo-600 transition-colors"><Bell size={20} /></button>
              <button className="p-4 text-slate-400 hover:text-indigo-600 transition-colors"><Search size={20} /></button>
            </div>
          </div>
        </div>

        {/* Tactical Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative overflow-hidden group p-1 rounded-[3rem] transition-all ${activeTab === tab.id ? 'shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]' : ''}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${tab.id === 'visitors' ? 'from-indigo-600 to-indigo-400' :
                tab.id === 'guards' ? 'from-purple-600 to-purple-400' :
                  tab.id === 'deliveries' ? 'from-amber-600 to-amber-400' :
                    'from-rose-600 to-rose-400'
                }`} />
              <div className={`relative z-10 p-8 rounded-[2.8rem] transition-all flex flex-col items-center gap-4 border-2 ${activeTab === tab.id
                ? 'bg-white border-transparent'
                : 'bg-white border-slate-50 text-slate-400 group-hover:bg-transparent group-hover:text-white'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeTab === tab.id ? `bg-${tab.color}-50 text-${tab.color}-600` : 'bg-slate-50 text-slate-400 group-hover:bg-white/20 group-hover:text-white'}`}>
                  {tab.icon}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] italic ${activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-white'}`}>
                  {tab.label}
                </span>
                {activeTab === tab.id && <motion.div layoutId="tab-underline" className={`absolute bottom-6 w-8 h-1 bg-${tab.color}-600 rounded-full`} />}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white border border-slate-50 rounded-[5rem] p-12 md:p-20 shadow-[0_80px_150px_-30px_rgba(0,0,0,0.04)] relative overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50/50 blur-[100px] rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'visitors' && (
                <div className="space-y-12">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-6">
                        Identity Queue <Target size={32} className="text-indigo-400" />
                      </h2>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-indigo-600">Pending Authorization Matrix</p>
                    </div>
                    <div className="px-10 py-4 bg-indigo-50/50 rounded-[2rem] text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em] border border-indigo-100 italic">
                      {visitors.filter(v => v.status === 'Entered').length} Live Signals Detected
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {visitors.length === 0 ? (
                      <div className="col-span-full py-20 text-center opacity-30 select-none">
                        <Users size={64} className="mx-auto mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">No active identity signals localized</p>
                      </div>
                    ) : visitors.map((v, i) => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-10 bg-slate-50/50 border border-slate-50 rounded-[3.5rem] group transition-all hover:bg-white hover:shadow-2xl hover:shadow-indigo-50/50 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/50 rounded-bl-[3rem] pointer-events-none group-hover:bg-indigo-50 transition-colors" />
                        <div className="flex justify-between items-start mb-10 relative z-10">
                          <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic shadow-sm shadow-indigo-100 ${v.status === 'Entered' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 text-slate-500'}`}>
                            {v.status}
                          </span>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">{v.flatId || 'GATE-01'}</p>
                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-2 italic leading-none">{new Date(v.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <div className="relative z-10 mb-8 px-2">
                          <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-all italic leading-none uppercase">{v.name}</h3>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic mt-2 opacity-60">Objective: {v.purpose}</p>
                        </div>

                        {v.status === 'Entered' && (
                          <div className="flex gap-4 relative z-10">
                            <button onClick={() => handleApproveVisitor(v.id)} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-indigo-600 transition-all italic active:scale-95">Verify</button>
                            <button onClick={() => handleRejectVisitor(v.id)} className="px-6 py-5 bg-white text-rose-600 border border-rose-100 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-rose-50 transition-all italic active:scale-95">Deny</button>
                          </div>
                        )}

                        {v.status !== 'Entered' && (
                          <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between text-slate-300">
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] italic">Archive Signature</span>
                            <ChevronRight size={14} />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'guards' && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-6">
                      Personnel Pulse <Cpu size={32} className="text-purple-400" />
                    </h2>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-purple-600">Active Duty Topology</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    {guards.map((g, i) => (
                      <motion.div
                        key={g.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-12 bg-slate-50/50 border border-slate-50 rounded-[4rem] group hover:bg-white hover:shadow-[0_60px_120px_-30px_rgba(99,102,241,0.1)] hover:border-indigo-100 transition-all duration-700 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/50 rounded-bl-[4rem] pointer-events-none group-hover:bg-purple-50 transition-colors" />
                        <div className="flex justify-between items-start mb-10 relative z-10">
                          <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-xl shadow-slate-100 border border-slate-50 group-hover:rotate-12">
                            <UserCheck size={28} />
                          </div>
                          <div className={`p-4 rounded-2xl shadow-inner border border-white ${g.status === 'Active' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-300'}`}>
                            <Activity size={18} className={g.status === 'Active' ? 'animate-pulse' : ''} />
                          </div>
                        </div>
                        <div className="relative z-10 mb-10 px-2 text-center md:text-left">
                          <h3 className="text-3xl font-black text-slate-900 mb-2 truncate italic uppercase tracking-tighter">{g.name}</h3>
                          <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                            <span className="px-5 py-1.5 bg-purple-50 text-purple-600 rounded-full text-[9px] font-black uppercase tracking-[0.3em] italic border border-purple-100">
                              {g.shift} Shift Hub
                            </span>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white/80 group-hover:shadow-sm transition-all">
                              <Phone size={14} className="text-indigo-400" />
                              <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase italic">{g.contact}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 relative z-10">
                          <button onClick={() => { setEditingGuard(g); guardForm.setFormData(g); setShowGuardForm(true); }} className="flex-1 py-5 bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all italic active:scale-95">Edit Record</button>
                          <button onClick={() => handleDeleteGuard(g.id)} className="p-5 bg-rose-50 text-rose-300 rounded-2xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'deliveries' && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-6">
                      Supply Pipeline <Layers size={32} className="text-amber-400" />
                    </h2>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-amber-600">Global Logistic Flow Monitor</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {deliveries.map((d, i) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-10 bg-slate-50/50 border border-slate-50 rounded-[4rem] group hover:bg-white hover:shadow-2xl transition-all duration-500 overflow-hidden relative"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-[3rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-center mb-10 relative z-10">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-xl shadow-amber-100 border border-white group-hover:scale-110 transition-transform">
                            <Package size={28} />
                          </div>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] italic">{d.status} Matrix</span>
                        </div>
                        <div className="relative z-10 px-2 mb-8">
                          <h3 className="text-2xl font-black text-slate-900 mb-1 leading-none italic uppercase tracking-tight">{d.recipientName}</h3>
                          <div className="flex items-center gap-3 mt-3">
                            <MapPin size={12} className="text-amber-400" />
                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em] italic">Sector {d.flatNumber} Access</span>
                          </div>
                        </div>
                        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-50 shadow-inner group-hover:border-amber-100 transition-all">
                          <p className="text-xs font-black text-slate-500 leading-relaxed italic opacity-80">"{d.itemDescription}"</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase flex items-center gap-6">
                      Signaling Center <Radio size={32} className="text-rose-400" />
                    </h2>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-rose-600">Global Emergency Broadcast Nexus</p>
                  </div>

                  <div className="space-y-6">
                    {alerts.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-10 border-l-[12px] rounded-[3.5rem] transition-all relative overflow-hidden group ${a.status === 'Active' ? 'bg-rose-50/50 border-rose-600 shadow-[0_40px_80px_-20px_rgba(225,29,72,0.1)]' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/50 blur-[60px] rounded-full pointer-events-none group-hover:bg-rose-100/30 transition-colors" />
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-8">
                          <div className="flex-1 space-y-6">
                            <div className="flex items-center gap-6 flex-wrap">
                              <span className={`px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.4em] italic shadow-sm ${a.priority === 'Critical' ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-slate-500 border border-slate-100'}`}>
                                {a.priority} Priority Handshake
                              </span>
                              <div className="flex items-center gap-3 text-slate-400">
                                <Clock size={14} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{a.timestamp?.toDate ? a.timestamp.toDate().toLocaleString() : 'LIVE SIGNAL'}</span>
                              </div>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 leading-tight italic uppercase tracking-tighter">"{a.message}"</h3>
                            <div className="flex items-center gap-4 text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] italic leading-none pl-1 border-l-4 border-rose-200">
                              Broadcast Mode: {a.type} Nexus
                            </div>
                          </div>
                          {a.status === 'Active' && (
                            <button onClick={() => handleResolveAlert(a.id)} className="w-full md:w-auto px-10 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-emerald-600 transition-all shadow-2xl active:scale-95 italic flex items-center justify-center gap-4">
                              <ShieldCheck size={20} /> Resolve Signal
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Identity Signature Modal */}
      <AnimatePresence>
        {showGuardForm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl" onClick={() => setShowGuardForm(false)} />
            <motion.div
              initial={{ scale: 0.8, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 100, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-[5rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.4)] overflow-hidden p-16 border border-white"
            >
              <div className="flex justify-between items-start mb-16 relative z-10">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">{editingGuard ? 'Modify Profile' : 'Init Personnel'}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-slate-900">Security Identity Registry Integration</p>
                </div>
                <button onClick={() => setShowGuardForm(false)} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2.5rem] transition-all group shadow-inner">
                  <X size={32} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="space-y-10 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Full Primary Signature</label>
                  <input
                    placeholder="ENTER IDENTITY..."
                    value={guardForm.formData.name}
                    onChange={(e) => guardForm.handleChange('name', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-[2.5rem] p-8 font-black text-lg italic transition-all outline-none shadow-inner focus:bg-white focus:ring-8 focus:ring-indigo-50 uppercase tracking-tight"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Communication Link</label>
                  <input
                    placeholder="ENTER CONTACT..."
                    value={guardForm.formData.contact}
                    onChange={(e) => guardForm.handleChange('contact', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-[2.5rem] p-8 font-black text-lg italic transition-all outline-none shadow-inner focus:bg-white focus:ring-8 focus:ring-indigo-50 tracking-widest"
                  />
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Shift Topology</label>
                    <select value={guardForm.formData.shift} onChange={(e) => guardForm.handleChange('shift', e.target.value)} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 font-black uppercase tracking-[0.3em] text-[10px] outline-none shadow-inner italic appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                      <option value="Day">Day Protocol</option>
                      <option value="Night">Night Protocol</option>
                      <option value="Split">Split Sequence</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Status Flux</label>
                    <select value={guardForm.formData.status} onChange={(e) => guardForm.handleChange('status', e.target.value)} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 font-black uppercase tracking-[0.3em] text-[10px] outline-none shadow-inner italic appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                      <option value="Active">Operational</option>
                      <option value="Inactive">Offline</option>
                      <option value="On Leave">Hibernation</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-4 relative z-10">
                <button
                  onClick={handleGuardAction}
                  className="w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-xs shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-6 group italic active:scale-95"
                >
                  Commit Authorization <ShieldCheck size={28} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Panic Broadcast Modal */}
      <AnimatePresence>
        {showAlertForm && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-rose-950/20 backdrop-blur-3xl" onClick={() => setShowAlertForm(false)} />
            <motion.div
              initial={{ scale: 0.8, y: 100, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 100, opacity: 0 }}
              className="relative w-full max-w-xl bg-white rounded-[5rem] shadow-[0_80px_160px_-40px_rgba(225,29,72,0.5)] overflow-hidden p-16 border-4 border-rose-50"
            >
              <div className="flex justify-between items-start mb-16 relative z-10">
                <div>
                  <h2 className="text-4xl font-black text-rose-600 italic tracking-tighter uppercase leading-none">Dispatch.</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-rose-600">Global Emergency Broadcast Sequence</p>
                </div>
                <button onClick={() => setShowAlertForm(false)} className="p-6 bg-slate-50 hover:bg-rose-600 hover:text-white rounded-[2.5rem] transition-all group shadow-inner">
                  <X size={32} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="space-y-10 relative z-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-rose-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Narrative Message Payload</label>
                  <textarea
                    placeholder="ENTER EMERGENCY PROTOCOL DATA..."
                    value={alertForm.formData.message}
                    onChange={(e) => alertForm.handleChange('message', e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-[3rem] p-10 font-bold text-slate-900 focus:bg-white focus:ring-8 focus:ring-rose-100 h-48 outline-none shadow-inner italic uppercase tracking-widest text-sm"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-rose-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Priority Grade</label>
                    <select value={alertForm.formData.priority} onChange={(e) => alertForm.handleChange('priority', e.target.value)} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 font-black uppercase tracking-[0.4em] text-[10px] outline-none shadow-inner italic cursor-pointer focus:bg-rose-50 transition-colors">
                      <option value="Low">Low Grade</option>
                      <option value="Medium">Medium Grade</option>
                      <option value="High">High Grade</option>
                      <option value="Critical">Critical Breach</option>
                    </select>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-rose-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Signal Topology</label>
                    <select value={alertForm.formData.type} onChange={(e) => alertForm.handleChange('type', e.target.value)} className="w-full bg-slate-50 border-none rounded-[2rem] p-6 font-black uppercase tracking-[0.4em] text-[10px] outline-none shadow-inner italic cursor-pointer focus:bg-rose-50 transition-colors">
                      <option value="General">General Signal</option>
                      <option value="Emergency">Emergency Node</option>
                      <option value="Security">Security Breach</option>
                      <option value="Maintenance">Maintenance Alert</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-4 relative z-10">
                <button
                  onClick={handleSendAlert}
                  className="w-full py-10 bg-rose-600 text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-xs shadow-2xl hover:bg-rose-700 transition-all flex items-center justify-center gap-6 group italic active:scale-95"
                >
                  Commit Broadcast <Radio size={28} className="animate-pulse" />
                </button>
              </div>
              <p className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] italic animate-pulse">Global Security Signal Disclosure Active</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSecurity;
