import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import useUserRole from '../hooks/useUserRole';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  MessageSquare,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  Loader2,
  Info,
  X,
  Send,
  User,
  LayoutGrid,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const Complain = () => {
  const { role: userRole } = useUserRole();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [form, setForm] = useState({
    title: '',
    category: 'Maintenance',
    priority: 'medium',
    description: '',
  });

  const categories = ['Maintenance', 'Security', 'Electricity', 'Water', 'Cleanliness', 'Noise', 'Parking', 'Other'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    if (!userRole || !auth.currentUser) return;

    setLoading(true);
    let q;
    if (userRole === 'admin' || userRole === 'security') {
      q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "complaints"),
        where("submittedBy", "==", auth.currentUser.uid),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComplaints(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to sync complaints");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error("Please fill in title and description");
      return;
    }

    const complaintData = {
      ...form,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      submittedBy: auth.currentUser.uid,
      submittedByName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
      userEmail: auth.currentUser.email,
      adminResponse: '',
    };

    try {
      await addDoc(collection(db, "complaints"), complaintData);
      toast.success("Complaint submitted successfully!");
      setForm({ title: '', category: 'Maintenance', priority: 'medium', description: '' });
      setShowForm(false);
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint");
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Complaint marked as ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error("Update failed");
    }
  };

  const handleAdminComment = async (id, comment) => {
    try {
      await updateDoc(doc(db, 'complaints', id), {
        adminComment: comment,
        updatedAt: serverTimestamp()
      });
      toast.success("Response added");
    } catch (err) {
      toast.error("Failed to add response");
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Delete this complaint record?")) return;
    try {
      await deleteDoc(doc(db, "complaints", id));
      toast.success("Record deleted");
      if (selectedComplaint?.id === id) setSelectedComplaint(null);
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      `${c.title} ${c.description} ${c.category}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterStatus === 'All' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { color: 'text-yellow-600 bg-yellow-100', icon: <Clock size={14} />, label: 'Pending' };
      case 'in-progress': return { color: 'text-blue-600 bg-blue-100', icon: <Loader2 size={14} className="animate-spin" />, label: 'In Progress' };
      case 'resolved': return { color: 'text-green-600 bg-green-100', icon: <CheckCircle size={14} />, label: 'Resolved' };
      case 'rejected': return { color: 'text-red-600 bg-red-100', icon: <ShieldAlert size={14} />, label: 'Rejected' };
      default: return { color: 'text-gray-600 bg-gray-100', icon: <Info size={14} />, label: status };
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  if (!userRole) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-30 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Complaint Desk</h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Society Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
            >
              <Plus size={18} />
              <span>Report Issue</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{complaints.length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Pending</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{complaints.filter(c => c.status === 'pending').length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Track</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{complaints.filter(c => c.status === 'in-progress').length}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Resolved</p>
              <p className="text-xl font-black text-slate-800 dark:text-white">{complaints.filter(c => c.status === 'resolved').length}</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search your complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {['All', 'pending', 'in-progress', 'resolved', 'rejected'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border dark:border-slate-700 ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Main List Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Fetching records...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 flex flex-col items-center text-center px-4"
          >
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Clean Desk!</h3>
            <p className="text-slate-500 max-w-sm">No complaints found. If you have any issue with society services, feel free to report it.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 text-blue-600 font-bold hover:underline"
            >
              Report an Issue Now
            </button>
          </motion.div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredComplaints.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.id}
                onClick={() => setSelectedComplaint(item)}
                className={`group bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer ${viewMode === 'list' ? 'flex items-center p-4' : 'flex flex-col'}`}
              >
                {viewMode === 'grid' && (
                  <div className="p-1">
                    <div className={`h-1.5 w-full rounded-full ${getStatusInfo(item.status).color.split(' ')[1]}`}></div>
                  </div>
                )}

                <div className={`p-6 flex-1 ${viewMode === 'list' ? 'py-2 flex items-center gap-6 w-full' : ''}`}>
                  {viewMode === 'list' ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        {getStatusInfo(item.status).icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 dark:text-white truncate">{item.title}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{item.category}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getPriorityColor(item.priority)}`}>{item.priority}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                        <span className={`text-[10px] font-black uppercase ${getStatusInfo(item.status).color.split(' ')[0]}`}>{item.status}</span>
                      </div>
                      <ChevronRight size={20} className="text-slate-300" />
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusInfo(item.status).color}`}>
                          {item.status}
                        </span>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-10 italic">"{item.description}"</p>

                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t dark:border-slate-800 pt-4 mt-auto">
                        <div className="flex items-center gap-2">
                          <Tag size={12} className="text-blue-500" />
                          <span>{item.category}</span>
                        </div>
                        <span>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">Raise Ticket</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X size={24} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="Leakage in bathroom..."
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white selection:bg-blue-100"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      >
                        {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Provide details about the issue..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <Send size={20} />
                    <span>Submit Report</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail View Modal */}
      <AnimatePresence>
        {selectedComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedComplaint(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusInfo(selectedComplaint.status).color}`}>
                      {selectedComplaint.status}
                    </span>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white pt-2">{selectedComplaint.title}</h2>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Ticket #{selectedComplaint.id.slice(0, 8)}</p>
                  </div>
                  <button onClick={() => setSelectedComplaint(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</p>
                    <p className="font-bold text-slate-800 dark:text-white uppercase">{selectedComplaint.category}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getPriorityColor(selectedComplaint.priority)}`}>{selectedComplaint.priority}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Issue Description</p>
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "{selectedComplaint.description}"
                  </div>
                </div>

                {selectedComplaint.adminComment && (
                  <div className="mb-8">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Resolution Message</p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                      {selectedComplaint.adminComment}
                    </div>
                  </div>
                )}

                {/* Admin Controls */}
                {(userRole === 'admin' || userRole === 'security') && (
                  <div className="border-t dark:border-slate-800 pt-8 mt-4 space-y-6">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleStatusUpdate(selectedComplaint.id, 'in-progress')}
                        className="px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedComplaint.id, 'resolved')}
                        className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 hover:text-white transition-all"
                      >
                        Mark Resolved
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedComplaint.id, 'rejected')}
                        className="px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={(e) => handleDelete(selectedComplaint.id, e)}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition-all ml-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Admin Note</label>
                      <div className="flex gap-2">
                        <input
                          id="adminNote"
                          placeholder="Update status note..."
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById('adminNote').value;
                            if (val) handleAdminComment(selectedComplaint.id, val);
                          }}
                          className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-6 rounded-2xl"
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <User size={12} />
                    <span>Reported by {selectedComplaint.submittedByName}</span>
                  </div>
                  <p>Created: {selectedComplaint.createdAt?.seconds ? new Date(selectedComplaint.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Complain;
