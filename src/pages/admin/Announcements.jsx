import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import {
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  Calendar,
  Tag,
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  Bell,
  Info,
  AlertCircle,
  Zap,
  Megaphone,
  Pin,
  Clock,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Send
} from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  { id: 'general', label: 'General', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: <Info size={16} /> },
  { id: 'maintenance', label: 'Maintenance', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Zap size={16} /> },
  { id: 'event', label: 'Events', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <Star size={16} /> },
  { id: 'security', label: 'Security', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: <ShieldCheck size={16} /> },
];

const Announcements = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isPinned, setIsPinned] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const auth = getAuth();

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setAnnouncements(arr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(a => {
      const matchesSearch = (a.content || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "all" || a.category === activeCategory;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [announcements, searchTerm, activeCategory]);

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!content.trim()) return toast.error("Broadcast buffer empty.");

    const loadingToast = toast.loading(editingId ? "Syncing transmission..." : "Initiating broadcast...");
    try {
      let imageUrl = preview;
      if (imageFile) {
        const imageRef = ref(storage, `announcements/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const user = auth.currentUser;
      const data = {
        content,
        category,
        isPinned,
        imageUrl,
        updatedAt: serverTimestamp(),
      };

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), data);
        toast.success("Transmission Synchronized!", { id: loadingToast });
      } else {
        await addDoc(collection(db, "announcements"), {
          ...data,
          userId: user ? user.uid : null,
          createdAt: serverTimestamp(),
        });
        toast.success("Global Broadcast Executed!", { id: loadingToast });
      }

      closeDrawer();
    } catch (err) {
      toast.error("Handshake Failed.", { id: loadingToast });
    }
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingId(null);
    setContent("");
    setCategory("general");
    setIsPinned(false);
    setImageFile(null);
    setPreview(null);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setContent(a.content);
    setCategory(a.category || "general");
    setIsPinned(a.isPinned || false);
    setPreview(a.imageUrl || null);
    setImageFile(null);
    setShowDrawer(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "announcements", deleteConfirm));
      toast.success("Node Purged.");
    } catch (e) {
      toast.error("Purge Failed.");
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Premium Header Nexus */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-6 mb-4">
              <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 transition-transform hover:rotate-6">
                <Megaphone size={32} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                  Broadcast <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Nexus</span>
                </h1>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Society Global Transmission Hub</p>
              </div>
            </div>
          </motion.div>

          <button
            onClick={() => setShowDrawer(true)}
            className="group flex items-center gap-4 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            Initiate Blast
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Tactical Search & Filter Pulse */}
        <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 mb-16 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 transition-all group-hover:bg-indigo-100/50" />

          <div className="relative flex-1 group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search transmission logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-10 py-6 bg-slate-50 border-none rounded-[2.5rem] text-sm font-black placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all italic"
            />
          </div>

          <div className="flex gap-4">
            <div className="relative min-w-[220px]">
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
                className="w-full pl-14 pr-10 py-6 bg-white border border-slate-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none cursor-pointer italic"
              >
                <option value="all">All Channels</option>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Pulse */}
        {loading && (
          <div className="space-y-10">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-50 rounded-[4rem] animate-pulse border border-slate-100" />
            ))}
          </div>
        )}

        {/* Null Signal State */}
        {!loading && filteredAnnouncements.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32 bg-white rounded-[5rem] border border-slate-100 shadow-sm"
          >
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <Megaphone size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Silence in Sector.</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mt-4 leading-relaxed">No transmission logs detected matching your probe.</p>
          </motion.div>
        )}

        {/* Announcements Transmission Grid */}
        <div className="space-y-12">
          {filteredAnnouncements.map((a, i) => {
            const cat = CATEGORIES.find(c => c.id === a.category) || CATEGORIES[0];
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group overflow-hidden ${a.isPinned ? 'ring-4 ring-indigo-600/10' : ''}`}
              >
                {/* Pin Matrix Indicator */}
                {a.isPinned && (
                  <div className="absolute top-0 right-0 p-6">
                    <div className="bg-indigo-600/10 text-indigo-600 p-4 rounded-3xl backdrop-blur-md border border-indigo-600/20 group-hover:scale-110 transition-transform">
                      <Pin size={24} fill="currentColor" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${cat.color} group-hover:scale-110 transition-transform duration-500`}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border ${cat.color} italic shadow-sm`}>
                          {cat.label}
                        </span>
                        {a.isPinned && <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 italic">High Priority</span>}
                      </div>
                      <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.15em] flex items-center gap-2 italic">
                        <Clock size={12} /> {a.createdAt?.toDate ? a.createdAt.toDate().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : "SYNC PENDING..."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 self-end md:self-auto">
                    <button
                      onClick={() => openEdit(a)}
                      className="p-4 bg-slate-50 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-[1.5rem] transition-all border border-transparent hover:border-amber-100"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(a.id)}
                      className="p-4 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[1.5rem] transition-all border border-transparent hover:border-rose-100"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-xl text-slate-800 leading-[1.8] font-bold italic whitespace-pre-line mb-10 pl-4 border-l-4 border-slate-100 group-hover:border-indigo-600 transition-colors">
                  {a.content}
                </div>

                {a.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-inner group/img relative"
                  >
                    <img
                      src={a.imageUrl}
                      className="w-full object-cover max-h-[500px] transition-transform duration-700 group-hover/img:scale-105"
                      alt="Transmission Bio-Metric"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-10">
                      <p className="text-white text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                        Full Inspection Protocol <ChevronRight size={14} />
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Broadcast Creation Matrix (Glassmorphism Modal) */}
      <AnimatePresence>
        {showDrawer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />

            <motion.div
              className="relative w-full max-w-2xl bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] rounded-[4rem] z-[110] overflow-hidden flex flex-col"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
            >
              <div className="p-12 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">
                    {editingId ? "Sync Transmission Log" : "New Transmission Log"}
                  </h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Configure high-priority broadcast node</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-5 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2rem] text-slate-400 transition-all group"
                >
                  <X size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 pb-12">
                {/* Content Input */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2 italic ml-4">
                    <Megaphone size={14} /> Message Payload
                  </label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-[3rem] p-10 text-lg font-black italic focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none placeholder:text-slate-200 resize-none shadow-inner"
                    placeholder="Broadcast your signal to the matrix..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Category Selection */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2 italic ml-4">
                      <Tag size={14} /> Channel Sector
                    </label>
                    <div className="relative">
                      <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-14 pr-10 py-5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none cursor-pointer italic"
                      >
                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Priority Toggle */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2 italic ml-4">
                      <Star size={14} /> Priority Core
                    </label>
                    <button
                      onClick={() => setIsPinned(!isPinned)}
                      className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-4 italic ${isPinned ? 'bg-indigo-600 border-indigo-200 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} className={isPinned ? 'animate-bounce' : ''} />
                      {isPinned ? 'Global Pin Active' : 'Standard Priority'}
                    </button>
                  </div>
                </div>

                {/* Media Nexus Upload */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 flex items-center gap-2 italic ml-4">
                    <ImageIcon size={14} /> Visual Signal Vector
                  </label>

                  {preview ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-[3rem] overflow-hidden border-8 border-slate-50 shadow-2xl group/prev h-64"
                    >
                      <img src={preview} className="w-full h-full object-cover transition-transform duration-700 group-hover/prev:scale-110" alt="" />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/prev:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                        <button
                          onClick={() => { setPreview(null); setImageFile(null); }}
                          className="px-8 py-4 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.3em] hover:bg-rose-700 shadow-2xl transition-all active:scale-95 italic"
                        >
                          Clear Visual Signal
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <label
                      htmlFor="broadcast-img"
                      className="w-full h-48 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50 cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-100 group transition-all relative overflow-hidden"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="broadcast-img"
                        onChange={(e) => handleImageSelect(e.target.files[0])}
                      />
                      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600 via-transparent to-transparent pointer-events-none" />
                      <div className="w-16 h-16 bg-white rounded-3xl shadow-sm text-slate-200 group-hover:text-indigo-600 flex items-center justify-center mb-4 transition-all group-hover:rotate-12 group-hover:scale-110">
                        <ImageIcon size={32} />
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 italic">Inject Bio-Metric Signal</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="p-12 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <button
                  onClick={closeDrawer}
                  className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-slate-900 transition-all italic"
                >
                  Abort Transmission
                </button>
                <button
                  onClick={handleSave}
                  className="group relative flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-[2.5rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 italic overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Send size={20} className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                  {editingId ? "Re-Broadcast" : "Global Transmission"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Critical Purge Warning (Modern Modal) */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
            />

            <motion.div
              className="relative bg-white p-16 rounded-[4rem] shadow-2xl w-full max-w-lg text-center border border-white/20"
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotate: 5 }}
            >
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner group transition-transform hover:scale-110">
                <Trash2 size={48} className="group-hover:shake" />
              </div>
              <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">Purge Signal?</h3>
              <p className="text-[12px] text-slate-400 mt-6 leading-relaxed font-black uppercase tracking-widest italic">This action will permanently redact the transmission log from the society matrix.</p>

              <div className="mt-12 grid grid-cols-2 gap-6">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="py-6 px-10 bg-slate-50 text-slate-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-slate-100 transition-all italic"
                >
                  Keep Log
                </button>
                <button
                  onClick={handleDelete}
                  className="group relative py-6 px-10 bg-rose-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.4em] hover:bg-rose-700 shadow-2xl shadow-rose-100 transition-all italic overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcements;
