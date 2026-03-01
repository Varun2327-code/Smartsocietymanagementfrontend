import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useUserRole from "../hooks/useUserRole";
import {
  Users,
  Search,
  Search as FiSearch,
  Sun,
  Moon,
  Download,
  Plus,
  Grid,
  List,
  Phone,
  Mail,
  User,
  Shield,
  Trash2,
  X,
  Filter,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Activity,
  ChevronRight
} from "lucide-react";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

const avatarColors = [
  "from-indigo-500 to-indigo-700",
  "from-rose-500 to-rose-600",
  "from-emerald-500 to-emerald-700",
  "from-yellow-400 to-yellow-600",
  "from-pink-500 to-pink-600",
  "from-sky-500 to-sky-700",
];

const Directory = () => {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", designation: "", phone: "", email: "" });

  useEffect(() => {
    const q = query(collection(db, "directory"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContacts(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const roles = useMemo(() => {
    const setRoles = new Set(contacts.map((c) => c.designation));
    return ["All", ...Array.from(setRoles)];
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.designation.toLowerCase().includes(search.toLowerCase());
      const matchesRole = filterRole === "All" || c.designation === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [contacts, search, filterRole]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.designation) {
      toast.error("Name and Designation required");
      return;
    }
    try {
      await addDoc(collection(db, "directory"), {
        ...newContact,
        timestamp: serverTimestamp(),
      });
      toast.success("Contact added to directory");
      setDrawerOpen(false);
      setNewContact({ name: "", designation: "", phone: "", email: "" });
    } catch (err) {
      toast.error("Failed to add contact");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      await deleteDoc(doc(db, "directory", id));
      toast.success("Contact removed");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const getInitials = (name = "") =>
    name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const getAvatarClass = (name = "") => {
    const idx = (name?.length || 0) % avatarColors.length;
    return avatarColors[idx];
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Dynamic Header Overlay */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800 sticky top-0 z-30 h-24 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none">Society Directory</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Staff & Service Providers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold w-64 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white dark:bg-slate-700 shadow text-indigo-600" : "text-slate-500"}`}><Grid size={18} /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-700 shadow text-indigo-600" : "text-slate-500"}`}><List size={18} /></button>
            </div>
            {role === 'admin' && (
              <button onClick={() => setDrawerOpen(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <Plus size={16} /> <span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border dark:border-slate-800 ${filterRole === r ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 hover:border-indigo-300'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Activity className="animate-spin text-indigo-600" size={48} />
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Compiling Directory...</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            <AnimatePresence>
              {filteredContacts.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <User size={64} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">No Contacts Match</h3>
                  <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">Refine your search or filter criteria</p>
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={c.id}
                    className={viewMode === 'grid'
                      ? "group bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 relative flex flex-col items-center text-center overflow-hidden"
                      : "group bg-white dark:bg-slate-900 rounded-3xl p-5 border dark:border-slate-800 flex items-center justify-between hover:shadow-xl transition-all"}
                  >
                    <div className={viewMode === 'grid' ? "mb-6" : "flex items-center gap-4"}>
                      <div className={`shadow-xl ring-4 ring-white dark:ring-slate-800 rounded-full bg-gradient-to-br ${getAvatarClass(c.designation)} flex items-center justify-center text-white font-black 
                                        ${viewMode === 'grid' ? 'w-24 h-24 text-2xl' : 'w-12 h-12 text-sm'}`}>
                        {c.designation[0].toUpperCase()}
                      </div>
                      {viewMode === 'list' && (
                        <div className="text-left">
                          <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-base">{c.designation}</h3>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-60">Verified Support</p>
                        </div>
                      )}
                    </div>

                    {viewMode === 'grid' && (
                      <>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter mb-1">{c.designation}</h3>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6">Society Staff Account</p>

                        <div className="w-full space-y-3 mb-8">
                          <a href={`tel:${c.phone}`} className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-all font-bold text-sm">
                            <Phone size={16} /> {c.phone}
                          </a>
                          <a href={`mailto:${c.email}`} className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all font-bold text-sm">
                            <Mail size={16} /> Contact Support
                          </a>
                        </div>
                      </>
                    )}

                    {viewMode === 'list' && (
                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{c.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          <a href={`tel:${c.phone}`} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Phone size={16} /></a>
                          <a href={`mailto:${c.email}`} className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-900 hover:text-white transition-all"><Mail size={16} /></a>
                        </div>
                      </div>
                    )}

                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className={viewMode === 'grid'
                          ? "absolute top-5 right-5 p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                          : "p-3 text-slate-300 hover:text-red-500 ml-2"}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>
              <div className="mb-8 font-black uppercase italic tracking-tighter text-3xl text-slate-900 dark:text-white">New Entry</div>

              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Name</label>
                  <input value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="e.g. John Wick" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Designation</label>
                    <input value={newContact.designation} onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })} placeholder="e.g. Electrician" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phone Number</label>
                    <input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+91 XXXX" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email (Optional)</label>
                  <input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="john@society.com" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white" />
                </div>
                <button type="submit" className="w-full py-5 mt-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">Add to Directory</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Directory;
