import React, { useEffect, useState, useMemo } from "react";
import { db, storage } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  Users,
  MoreVertical,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  Image as ImageIcon,
  Zap,
  ChevronRight,
  ChevronLeft,
  Grid,
  List,
  Star,
  User,
  ShieldCheck,
  Globe,
  Settings2,
  Send,
  ArrowUpRight
} from "lucide-react";
import useUserRole from "../../hooks/useUserRole";
import toast from "react-hot-toast";

const CATEGORIES = ["Festival", "Meeting", "Function", "Sports", "Other"];
const STATUS_COLORS = {
  approved: "bg-emerald-50 text-emerald-600 border-emerald-100",
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEvent, setDrawerEvent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { role, loading: roleLoading } = useUserRole();

  const initialForm = {
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    category: "Festival",
    bannerFile: null,
    bannerUrl: "",
    attendees: [],
    status: "pending",
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (role === 'admin') fetchEvents();
  }, [role]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "events"), orderBy("date", "asc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEvents(list);
    } catch (err) {
      toast.error("Handshake Failed.");
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const s = search.toLowerCase();
      const matchesSearch = !search ||
        (e.title || "").toLowerCase().includes(s) ||
        (e.organizer || "").toLowerCase().includes(s);
      const matchesCategory = categoryFilter === "All" || e.category === categoryFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [events, search, categoryFilter, statusFilter]);

  const handleImageSelect = (file) => {
    if (!file) return;
    setForm({ ...form, bannerFile: file });
    toast.success("Signal Vector Identified.");
  };

  const handleSave = async () => {
    if (!form.title || !form.date) return toast.error("Essential Payload Missing.");

    const loadingToast = toast.loading(editing ? "Refining Synapse..." : "Blueprint Launching...");
    try {
      let bannerUrl = form.bannerUrl;
      if (form.bannerFile) {
        const fileRef = ref(storage, `event_banners/${Date.now()}_${form.bannerFile.name}`);
        await uploadBytes(fileRef, form.bannerFile);
        bannerUrl = await getDownloadURL(fileRef);
      }

      const payload = {
        title: form.title,
        description: form.description || "",
        date: form.date,
        time: form.time || "",
        location: form.location || "",
        organizer: form.organizer || "Society Mgmt",
        category: form.category,
        bannerUrl: bannerUrl || "",
        attendees: form.attendees || [],
        status: form.status,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "events", editing.id), payload);
        toast.success("Nexus Updated.", { id: loadingToast });
      } else {
        await addDoc(collection(db, "events"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Global Broadcast Executed.", { id: loadingToast });
      }

      setIsFormOpen(false);
      setEditing(null);
      setForm(initialForm);
      fetchEvents();
    } catch (err) {
      toast.error("Transmission Failed.", { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this event node from history?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast.success("Protocol Redacted.");
      fetchEvents();
      setIsDrawerOpen(false);
    } catch (err) {
      toast.error("Redaction Failed.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "events", id), { status });
      toast.success(`Vector ${status} Access Granted.`);
      fetchEvents();
      if (drawerEvent?.id === id) setDrawerEvent({ ...drawerEvent, status });
    } catch (err) {
      toast.error("Protocol Overwrite Failed.");
    }
  };

  if (loading) return (
    <div className="p-12 space-y-12 animate-pulse bg-[#FDFEFE] min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="h-14 w-80 bg-slate-100 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-[500px] bg-slate-50 rounded-[4rem] border border-slate-100" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFEFE] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Premium Header Nexus */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-6 mb-4">
              <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 transition-transform hover:scale-110">
                <Globe size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                  Events <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Matrix</span>
                </h1>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Global Synchronization Hub</p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden auto-cols-max">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-6 py-3 rounded-[1.5rem] transition-all italic text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-400'}`}
              >
                <Grid size={16} /> Grid
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-6 py-3 rounded-[1.5rem] transition-all italic text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-400'}`}
              >
                <List size={16} /> List
              </button>
            </div>
            <button
              onClick={() => { setEditing(null); setForm(initialForm); setIsFormOpen(true); }}
              className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 italic"
            >
              <Plus size={20} />
              Initiate Node
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Advanced Tactical Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-6 relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
            <input
              type="text"
              placeholder="Scan event signatures via title, orchestrator or sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-22 pr-10 py-7 bg-white border border-slate-100 rounded-[3rem] text-sm font-black italic shadow-sm focus:ring-8 focus:ring-indigo-50 transition-all outline-none placeholder:text-slate-200"
            />
          </div>

          <div className="md:col-span-3 relative group">
            <Filter className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-full pl-16 pr-10 py-7 bg-white border border-slate-100 rounded-[3rem] text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 focus:ring-8 focus:ring-indigo-50 outline-none appearance-none cursor-pointer italic"
            >
              <option>All Vectors</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="md:col-span-3 relative group">
            <ShieldCheck className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-full pl-16 pr-10 py-7 bg-white border border-slate-100 rounded-[3rem] text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 focus:ring-8 focus:ring-indigo-50 outline-none appearance-none cursor-pointer italic"
            >
              <option>Security Check-all</option>
              <option value="approved">Global Access</option>
              <option value="pending">Pending Triage</option>
              <option value="rejected">Blacklisted</option>
            </select>
          </div>
        </div>

        {/* Dynamic Viewport Rendering */}
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"
            >
              {filteredEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-[5rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all flex flex-col relative"
                >
                  <div className="relative h-72 overflow-hidden">
                    {ev.bannerUrl ? (
                      <img src={ev.bannerUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200">
                        <ImageIcon size={64} className="opacity-30" />
                      </div>
                    )}
                    <div className="absolute top-8 left-8">
                      <span className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-xl border italic ${STATUS_COLORS[ev.status]}`}>
                        {ev.status}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-10">
                      <div className="text-white">
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60 italic">{ev.category} Sector</div>
                        <h3 className="text-2xl font-black italic tracking-tighter leading-tight">{ev.title}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-10 flex-1 flex flex-col justify-between">
                    <div className="space-y-6 mb-10">
                      <div className="flex items-center gap-6 group/item">
                        <div className="w-14 h-14 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-indigo-600 transition-transform group-hover/item:rotate-12 border border-indigo-100 shadow-sm">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <div className="text-lg font-black text-slate-800 italic">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic mt-1 flex items-center gap-1"><Clock size={12} /> {ev.time || 'SYNCHRONIZING...'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 group/item">
                        <div className="w-14 h-14 bg-rose-50/50 rounded-2xl flex items-center justify-center text-rose-500 transition-transform group-hover/item:-rotate-12 border border-rose-100 shadow-sm">
                          <MapPin size={24} />
                        </div>
                        <div className="text-sm font-black text-slate-500 uppercase tracking-widest italic line-clamp-1">{ev.location}</div>
                      </div>

                      <div className="flex items-center gap-6 group/item">
                        <div className="w-14 h-14 bg-emerald-50/50 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover/item:scale-110 border border-emerald-100 shadow-sm">
                          <Users size={24} />
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{(ev.attendees || []).length} Pulse Signals</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-10 border-t border-slate-50 mt-auto">
                      <button
                        onClick={() => { setDrawerEvent(ev); setIsDrawerOpen(true); }}
                        className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all italic shadow-2xl shadow-slate-200"
                      >
                        Deep Inspect
                      </button>
                      <button
                        onClick={() => { setEditing(ev); setForm({ ...ev, bannerFile: null }); setIsFormOpen(true); }}
                        className="p-5 bg-slate-50 text-slate-300 hover:text-amber-500 hover:bg-white border border-transparent hover:border-amber-100 rounded-[1.5rem] transition-all"
                      >
                        <Edit2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="bg-white rounded-[5rem] border border-slate-100 shadow-2xl shadow-indigo-100/20 overflow-hidden mb-20"
            >
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Signature</th>
                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Timeline</th>
                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Sector</th>
                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Orchestrator</th>
                    <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Security</th>
                    <th className="px-12 py-10 text-right text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEvents.map((ev, i) => (
                    <motion.tr
                      key={ev.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-indigo-50/20 transition-all group"
                    >
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shadow-inner group-hover:scale-110 transition-transform border border-slate-50">
                            {ev.bannerUrl ? <img src={ev.bannerUrl} className="w-full h-full object-cover" /> : <Calendar size={28} />}
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-900 italic tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{ev.title}</div>
                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic mt-1">{ev.category} Prototype</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <div className="text-sm font-black text-slate-600 italic uppercase">{new Date(ev.date).toLocaleDateString()}</div>
                        <div className="text-[9px] text-slate-300 font-bold uppercase mt-1 tracking-widest">{ev.time || 'LOG-TBD'}</div>
                      </td>
                      <td className="px-12 py-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{ev.location}</td>
                      <td className="px-12 py-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{ev.organizer}</td>
                      <td className="px-12 py-10">
                        <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border shadow-sm italic ${STATUS_COLORS[ev.status]}`}>
                          {ev.status}
                        </span>
                      </td>
                      <td className="px-12 py-10 text-right opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => updateStatus(ev.id, 'approved')} className="p-4 bg-white border border-slate-100 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-100 rounded-2xl shadow-sm transition-all" title="Grant Protocol"><CheckCircle size={20} /></button>
                          <button onClick={() => updateStatus(ev.id, 'rejected')} className="p-4 bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 hover:border-rose-100 rounded-2xl shadow-sm transition-all" title="Deny Protocol"><X size={20} /></button>
                          <button onClick={() => { setDrawerEvent(ev); setIsDrawerOpen(true); }} className="p-4 bg-white border border-slate-100 text-indigo-500 hover:bg-indigo-50 hover:border-indigo-100 rounded-2xl shadow-sm transition-all" title="Deep Signal"><ArrowUpRight size={20} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Advanced Event Recon Drawer */}
      <AnimatePresence>
        {isDrawerOpen && drawerEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setIsDrawerOpen(false)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[650px] bg-white z-[110] shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col"
            >
              <div className="relative h-96 overflow-hidden">
                {drawerEvent.bannerUrl ? (
                  <img src={drawerEvent.bannerUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white/5">
                    <Calendar size={180} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-10 right-10 p-6 bg-white/20 backdrop-blur-3xl border border-white/20 rounded-[2.5rem] text-white hover:bg-white hover:text-slate-900 shadow-2xl transition-all group scale-100 hover:scale-110 active:scale-90"
                >
                  <X size={32} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="px-16 -mt-32 relative flex-1 overflow-y-auto space-y-16 pb-12 no-scrollbar">
                <div className="p-12 bg-white rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-50 flex flex-col items-center text-center group">
                  <span className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8 shadow-inner border italic ${STATUS_COLORS[drawerEvent.status]}`}>
                    {drawerEvent.status} Protocol
                  </span>
                  <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter leading-[0.9] mb-4 group-hover:text-indigo-600 transition-colors uppercase">{drawerEvent.title}</h2>
                  <div className="w-16 h-1 bg-indigo-600 rounded-full mb-6 shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                  <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-[9px] italic flex items-center gap-3">
                    <User size={14} /> Orchestrated By: {drawerEvent.organizer}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  <div className="bg-slate-50/50 p-10 rounded-[3.5rem] text-center space-y-4 border border-slate-50 relative overflow-hidden group/tile">
                    <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover/tile:opacity-100 transition-opacity" />
                    <Calendar className="mx-auto text-indigo-500 scale-125 relative z-10" size={32} />
                    <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 italic mb-2">Protocol Date</p>
                      <p className="text-lg font-black text-slate-900 italic uppercase">{drawerEvent.date}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-10 rounded-[3.5rem] text-center space-y-4 border border-slate-50 relative overflow-hidden group/tile">
                    <div className="absolute inset-0 bg-rose-600/5 opacity-0 group-hover/tile:opacity-100 transition-opacity" />
                    <MapPin className="mx-auto text-rose-500 scale-125 relative z-10" size={32} />
                    <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 italic mb-2">Sector Site</p>
                      <p className="text-lg font-black text-slate-900 italic uppercase line-clamp-1">{drawerEvent.location}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50/50 p-10 rounded-[3.5rem] text-center space-y-4 border border-slate-50 relative overflow-hidden group/tile">
                    <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover/tile:opacity-100 transition-opacity" />
                    <Users className="mx-auto text-emerald-500 scale-125 relative z-10" size={32} />
                    <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 italic mb-2">Pulse Signals</p>
                      <p className="text-lg font-black text-slate-900 italic uppercase">{(drawerEvent.attendees || []).length}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="h-[2px] w-16 bg-slate-900 rounded-full" />
                    <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-900 italic">Mission Narrative</h4>
                  </div>
                  <div className="text-2xl text-slate-600 leading-[1.8] font-black italic whitespace-pre-line border-l-12 border-slate-50 pl-16">
                    {drawerEvent.description || 'Global mission details classified.'}
                  </div>
                </div>

                <div className="flex gap-8 pt-16">
                  <button onClick={() => { updateStatus(drawerEvent.id, 'approved'); }} className="group relative flex-1 py-8 bg-emerald-600 text-white rounded-[3rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-700 transition-all italic overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    Authorize Protocol
                  </button>
                  <button onClick={() => { updateStatus(drawerEvent.id, 'rejected'); }} className="group relative flex-1 py-8 bg-rose-600 text-white rounded-[3rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-700 transition-all italic overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    Deny Vector
                  </button>
                </div>
              </div>

              <div className="p-12 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto">
                <button onClick={() => handleDelete(drawerEvent.id)} className="flex items-center gap-4 text-[10px] font-black text-rose-400 uppercase tracking-[0.5em] hover:text-rose-600 transition-all italic group">
                  <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center group-hover:bg-rose-50 transition-all border border-slate-100 group-hover:rotate-12"><Trash2 size={28} /></div>
                  Purge Data Node
                </button>
                <button onClick={() => { setEditing(drawerEvent); setForm({ ...drawerEvent, bannerFile: null }); setIsFormOpen(true); setIsDrawerOpen(false); }} className="px-14 py-6 bg-white text-slate-900 border-4 border-slate-100 rounded-[3rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-xl hover:bg-slate-900 hover:text-white transition-all italic active:scale-95">
                  Refine Source Logic
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Protocol Configuration Matrix (Premium Modal Form) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-3xl" onClick={() => setIsFormOpen(false)} />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              className="relative w-full max-w-3xl bg-white rounded-[5rem] shadow-[0_0_150px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pt-16"
            >
              <div className="px-16 flex items-center justify-between mb-12">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">{editing ? 'Logic Refinement' : 'New Matrix Initiation'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-2 italic">Global Broadcast Orchestration Protocol</p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="p-6 bg-slate-50 text-slate-300 hover:bg-slate-900 hover:text-white rounded-[2.5rem] transition-all group active:scale-90 shadow-inner">
                  <X size={28} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-16 space-y-12 pb-16 no-scrollbar max-h-[75vh]">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Sign-Title Vector</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none shadow-inner text-lg" placeholder="PROTOCOL NAME..." />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Host-Orchestrator</label>
                    <input value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} className="w-full px-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none shadow-inner text-lg" placeholder="AGENCY SOURCE..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Timeline Log</label>
                    <div className="relative">
                      <Calendar className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                      <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full pl-20 pr-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none shadow-inner cursor-pointer" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Phase Temporal</label>
                    <div className="relative">
                      <Clock className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                      <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full pl-20 pr-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none shadow-inner cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Site Coordinates</label>
                  <div className="relative">
                    <MapPin className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full pl-20 pr-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none shadow-inner" placeholder="DEPO SECTOR (Nexus/Core/Station)..." />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Matrix Sector</label>
                    <div className="relative">
                      <Settings2 className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full pl-20 pr-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none appearance-none cursor-pointer shadow-inner">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Initial Clearance</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full pl-20 pr-10 py-7 bg-slate-50 border-none rounded-[3rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none appearance-none cursor-pointer shadow-inner">
                        <option value="pending">Pending Sync</option>
                        <option value="approved">Global Proxy</option>
                        <option value="rejected">Blacklist Zone</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Visual Identification Payload</label>
                  <label className="w-full flex flex-col items-center justify-center p-16 border-4 border-dashed border-slate-100 rounded-[4rem] bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-100 transition-all cursor-pointer group relative overflow-hidden">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelect(e.target.files[0])} />
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600 via-transparent to-transparent pointer-events-none" />
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center text-slate-200 group-hover:text-indigo-600 transition-all group-hover:scale-110 group-hover:rotate-12 mb-6">
                      <ImageIcon size={48} />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase tracking-[0.4em] group-hover:text-indigo-700 italic">{form.bannerFile ? `DETECTED: ${form.bannerFile.name}` : 'INJECT VISUAL HASH'}</p>
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-600 italic ml-6">Mission Detailed Narrative</label>
                  <textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-12 py-10 bg-slate-50 border-none rounded-[4rem] focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black italic transition-all outline-none resize-none shadow-inner text-lg leading-relaxed placeholder:text-slate-200" placeholder="DEEP PROTOCOL INTELLIGENCE..." />
                </div>
              </div>

              <div className="p-16 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <button onClick={() => setIsFormOpen(false)} className="px-14 py-6 text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 hover:text-slate-900 transition-all italic">Abort Sequence</button>
                <button onClick={handleSave} className="group relative px-20 py-8 bg-slate-900 text-white rounded-[3.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:bg-indigo-600 transition-all active:scale-95 italic overflow-hidden flex items-center gap-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Send size={24} className="group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform shadow-2xl" />
                  {editing ? 'Refine Node' : 'Initialize Global Matrix'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
