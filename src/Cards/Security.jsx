import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import useUserRole from '../hooks/useUserRole';
import {
  Shield,
  UserPlus,
  Package,
  Users,
  AlertTriangle,
  Search,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Plus,
  ArrowLeft,
  Loader2,
  Phone,
  LayoutGrid,
  List,
  History,
  Activity,
  UserCheck,
  UserX,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const Security = () => {
  const { role: userRole } = useUserRole();
  const [activeTab, setActiveTab] = useState('visitors');
  const [visitors, setVisitors] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [guards, setGuards] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showGuardForm, setShowGuardForm] = useState(false);

  // Form states
  const [visitorForm, setVisitorForm] = useState({ name: '', purpose: '', flatNumber: '', phone: '', vehicleNumber: '' });
  const [deliveryForm, setDeliveryForm] = useState({ recipientName: '', flatNumber: '', itemDescription: '', deliveryPerson: '', contactNumber: '' });
  const [guardForm, setGuardForm] = useState({ name: '', shift: 'Morning', contact: '', status: 'Active' });

  useEffect(() => {
    if (!userRole || !auth.currentUser) return;

    const collectionsToSync = [
      {
        name: 'visitors',
        setter: setVisitors,
        q: (userRole === 'admin' || userRole === 'security')
          ? query(collection(db, 'visitors'), orderBy('timestamp', 'desc'))
          : query(collection(db, 'visitors'), where('submittedBy', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'))
      },
      {
        name: 'deliveries',
        setter: setDeliveries,
        q: (userRole === 'admin' || userRole === 'security')
          ? query(collection(db, 'deliveries'), orderBy('timestamp', 'desc'))
          : query(collection(db, 'deliveries'), where('submittedBy', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'))
      },
      {
        name: 'guards',
        setter: setGuards,
        q: query(collection(db, 'guards'), where('status', '==', 'Active'))
      },
      {
        name: 'alerts',
        setter: setAlerts,
        q: query(collection(db, 'alerts'), orderBy('timestamp', 'desc'))
      }
    ];

    const unsubscribes = collectionsToSync.map(col => {
      try {
        return onSnapshot(col.q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          col.setter(data);
          if (col.name === 'visitors') setLoading(false);
        });
      } catch (err) {
        console.error(`Error syncing ${col.name}:`, err);
        return () => { };
      }
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [userRole]);

  const handleAddVisitor = async (e) => {
    e.preventDefault();
    if (!visitorForm.name || !visitorForm.flatNumber) return toast.error("Name and Flat are required");

    try {
      await addDoc(collection(db, 'visitors'), {
        ...visitorForm,
        status: 'Entered',
        timestamp: serverTimestamp(),
        submittedBy: auth.currentUser.uid,
        submittedByName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      });
      toast.success("Visitor logged successfully");
      setVisitorForm({ name: '', purpose: '', flatNumber: '', phone: '', vehicleNumber: '' });
      setShowVisitorForm(false);
    } catch (err) {
      toast.error("Failed to log visitor");
    }
  };

  const handleAddDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryForm.recipientName || !deliveryForm.flatNumber) return toast.error("Recipient and Flat are required");

    try {
      await addDoc(collection(db, 'deliveries'), {
        ...deliveryForm,
        status: 'Pending',
        timestamp: serverTimestamp(),
        submittedBy: auth.currentUser.uid,
      });
      toast.success("Delivery recorded");
      setDeliveryForm({ recipientName: '', flatNumber: '', itemDescription: '', deliveryPerson: '', contactNumber: '' });
      setShowDeliveryForm(false);
    } catch (err) {
      toast.error("Failed to record delivery");
    }
  };

  const handleAddGuard = async (e) => {
    e.preventDefault();
    if (!guardForm.name) return toast.error("Name is required");

    try {
      await addDoc(collection(db, 'guards'), {
        ...guardForm,
        createdAt: serverTimestamp(),
      });
      toast.success("Guard added to roster");
      setGuardForm({ name: '', shift: 'Morning', contact: '', status: 'Active' });
      setShowGuardForm(false);
    } catch (err) {
      toast.error("Failed to add guard");
    }
  };

  const handlePanicButton = async () => {
    if (!window.confirm("TRIGGER EMERGENCY ALERT? This will notify all security personnel.")) return;

    try {
      await addDoc(collection(db, 'alerts'), {
        type: 'EMERGENCY',
        sender: auth.currentUser.displayName || auth.currentUser.email,
        senderUid: auth.currentUser.uid,
        status: 'ACTIVE',
        timestamp: serverTimestamp(),
        message: 'Panic button pressed! Assistance required immediately.'
      });
      toast.error("EMERGENCY ALERT SENT!", { duration: 5000 });
    } catch (err) {
      toast.error("Failed to trigger alert");
    }
  };

  const updateStatus = async (col, id, newStatus) => {
    try {
      await updateDoc(doc(db, col, id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Updated to ${newStatus}`);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const deleteRecord = async (col, id) => {
    if (!window.confirm("Delete this record permanently?")) return;
    try {
      await deleteDoc(doc(db, col, id));
      toast.success("Record deleted");
    } catch (err) {
      toast.error("Deletion failed");
    }
  };

  const filteredData = useMemo(() => {
    const s = search.toLowerCase();
    if (activeTab === 'visitors') {
      return visitors.filter(v => v.name?.toLowerCase().includes(s) || v.flatNumber?.toLowerCase().includes(s));
    }
    if (activeTab === 'deliveries') {
      return deliveries.filter(d => d.recipientName?.toLowerCase().includes(s) || d.flatNumber?.toLowerCase().includes(s));
    }
    if (activeTab === 'guards') {
      return guards.filter(g => g.name?.toLowerCase().includes(s));
    }
    return alerts;
  }, [activeTab, visitors, deliveries, guards, alerts, search]);

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Dynamic Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-30 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">Security Gate</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Live Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('visitors')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'visitors' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
              >Visitors</button>
              <button
                onClick={() => setActiveTab('deliveries')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'deliveries' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
              >Deliveries</button>
              <button
                onClick={() => setActiveTab('guards')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'guards' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
              >Guards</button>
            </div>

            {(userRole === 'admin' || userRole === 'security') && (
              <button
                onClick={() => {
                  if (activeTab === 'visitors') setShowVisitorForm(true);
                  else if (activeTab === 'deliveries') setShowDeliveryForm(true);
                  else if (activeTab === 'guards') setShowGuardForm(true);
                }}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-tighter shadow-xl active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>Log New</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">

        {/* Top Activity Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Grounds</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {visitors.filter(v => v.status === 'Entered').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Package size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Deliveries</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
              {deliveries.filter(d => d.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-sm transition-all hover:shadow-md group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <UserCheck size={20} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guards Active</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{guards.length}</p>
          </div>
          <div className="bg-red-600 p-6 rounded-[2rem] shadow-xl shadow-red-500/20 group relative overflow-hidden cursor-pointer active:scale-95 transition-all" onClick={handlePanicButton}>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 text-white rounded-2xl animate-pulse">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className="text-[10px] font-black text-red-200 uppercase tracking-widest">Panic System</p>
              <p className="text-2xl font-black text-white mt-1">SOS TRIGGER</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 opacity-50"></div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white font-bold transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {['visitors', 'deliveries', 'guards', 'alerts'].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border dark:border-slate-700 ${activeTab === t ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 hover:border-blue-300'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Alerts (If Any) */}
        {alerts.filter(a => a.status === 'ACTIVE').length > 0 && (
          <div className="mb-8 space-y-3">
            {alerts.filter(a => a.status === 'ACTIVE').map(alert => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={alert.id}
                className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center animate-ping">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-red-600 uppercase text-xs tracking-tighter">Emergency Triggered</h4>
                    <p className="text-sm font-bold text-red-800 dark:text-red-200">{alert.message} <span className="text-xs opacity-60">by {alert.sender}</span></p>
                  </div>
                </div>
                {(userRole === 'admin' || userRole === 'security') && (
                  <button
                    onClick={() => updateStatus('alerts', alert.id, 'RESOLVED')}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg"
                  >Clear Alert</button>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Data Grid Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Syncing with Mainframe...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredData.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Shield size={64} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">All Clear!</h3>
                  <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">No matching records found in this section</p>
                </div>
              ) : (
                filteredData.map((item) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={item.id}
                    className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col border-b-4 border-b-transparent hover:border-b-blue-600"
                  >
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${(item.status === 'Entered' || item.status === 'Pending' || item.status === 'ACTIVE')
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                          {item.status}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                          {item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'LIVE'}
                        </div>
                      </div>

                      {/* Content based on Tab */}
                      {activeTab === 'visitors' && (
                        <>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">{item.name}</h3>
                          <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                                <Activity size={14} />
                              </div>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Purpose: <span className="text-slate-800 dark:text-white uppercase">{item.purpose}</span></p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-50 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600">
                                <Search size={14} />
                              </div>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Flat: <span className="text-slate-800 dark:text-white uppercase">{item.flatNumber}</span></p>
                            </div>
                            {item.vehicleNumber && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600">
                                  <Activity size={14} />
                                </div>
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Vehicle: <span className="text-slate-800 dark:text-white uppercase">{item.vehicleNumber}</span></p>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {activeTab === 'deliveries' && (
                        <>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">{item.recipientName}</h3>
                          <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                                <Package size={14} />
                              </div>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Item: <span className="text-slate-800 dark:text-white uppercase">{item.itemDescription}</span></p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600">
                                <Search size={14} />
                              </div>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Flat: <span className="text-slate-800 dark:text-white uppercase">{item.flatNumber}</span></p>
                            </div>
                          </div>
                        </>
                      )}

                      {activeTab === 'guards' && (
                        <>
                          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 transition-colors uppercase italic tracking-tighter">{item.name}</h3>
                          <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                                <Clock size={14} />
                              </div>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Shift: <span className="text-slate-800 dark:text-white uppercase">{item.shift}</span></p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600">
                                <Phone size={14} />
                              </div>
                              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Contact: <span className="text-slate-800 dark:text-white">{item.contact || 'N/A'}</span></p>
                            </div>
                          </div>
                        </>
                      )}

                      {activeTab === 'alerts' && (
                        <>
                          <h3 className="text-xl font-black text-red-600 mb-2 uppercase italic tracking-tighter">{item.type}</h3>
                          <p className="text-base text-slate-600 dark:text-slate-300 font-bold mb-4">"{item.message}"</p>
                          <p className="text-[10px] font-black uppercase text-slate-400">Sent by: {item.sender}</p>
                        </>
                      )}
                    </div>

                    {/* Dynamic Footer Actions */}
                    {(userRole === 'admin' || userRole === 'security') && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 flex justify-end gap-2">
                        {activeTab === 'visitors' && item.status === 'Entered' && (
                          <button
                            onClick={() => updateStatus('visitors', item.id, 'Checked Out')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                          >Check Out</button>
                        )}
                        {activeTab === 'deliveries' && item.status === 'Pending' && (
                          <button
                            onClick={() => updateStatus('deliveries', item.id, 'Picked Up')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                          >Mark Collected</button>
                        )}
                        <button
                          onClick={() => deleteRecord(activeTab === 'alerts' ? 'alerts' : activeTab, item.id)}
                          className="p-3 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Submission Modals */}
      <AnimatePresence>
        {showVisitorForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowVisitorForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter italic">Log Visitor</h2>
              <form onSubmit={handleAddVisitor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Name" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={visitorForm.name} onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })} />
                  <input placeholder="Flat" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={visitorForm.flatNumber} onChange={(e) => setVisitorForm({ ...visitorForm, flatNumber: e.target.value })} />
                </div>
                <input placeholder="Purpose" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={visitorForm.purpose} onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Phone" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={visitorForm.phone} onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })} />
                  <input placeholder="Vehicle No." className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={visitorForm.vehicleNumber} onChange={(e) => setVisitorForm({ ...visitorForm, vehicleNumber: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">Log Entry</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeliveryForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeliveryForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter italic">Record Delivery</h2>
              <form onSubmit={handleAddDelivery} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Recipient Name" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={deliveryForm.recipientName} onChange={(e) => setDeliveryForm({ ...deliveryForm, recipientName: e.target.value })} />
                  <input placeholder="Flat" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={deliveryForm.flatNumber} onChange={(e) => setDeliveryForm({ ...deliveryForm, flatNumber: e.target.value })} />
                </div>
                <input placeholder="Item Description" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={deliveryForm.itemDescription} onChange={(e) => setDeliveryForm({ ...deliveryForm, itemDescription: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Delivery Person" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={deliveryForm.deliveryPerson} onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryPerson: e.target.value })} />
                  <input placeholder="Contact Phone" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={deliveryForm.contactNumber} onChange={(e) => setDeliveryForm({ ...deliveryForm, contactNumber: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20">Record Package</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGuardForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGuardForm(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter italic">Add Guard</h2>
              <form onSubmit={handleAddGuard} className="space-y-4">
                <input placeholder="Full Name" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={guardForm.name} onChange={(e) => setGuardForm({ ...guardForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={guardForm.shift} onChange={(e) => setGuardForm({ ...guardForm, shift: e.target.value })}>
                    <option>Morning</option>
                    <option>Evening</option>
                    <option>Night</option>
                  </select>
                  <input placeholder="Contact" className="w-full bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" value={guardForm.contact} onChange={(e) => setGuardForm({ ...guardForm, contact: e.target.value })} />
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20">Add Guard</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Security;
