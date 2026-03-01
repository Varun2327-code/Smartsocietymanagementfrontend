import React, { useEffect, useState, useMemo } from 'react';
import { db, auth } from '../firebase';
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Settings,
  ChevronRight,
  Shield,
  Zap,
  Calendar,
  Cloud,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const RightSidebar = ({ setActiveSection }) => {
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({ name: 'Resident', apartment: '-', role: 'Member', iconColor: '#6366f1' });
  const [announcements, setAnnouncements] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        onSnapshot(doc(db, 'users', u.uid), (s) => {
          if (s.exists()) {
            const d = s.data();
            setUserDetails({ name: d.name || 'Resident', apartment: d.apartment || 'N/A', role: d.role || 'Member', iconColor: d.iconColor || '#6366f1' });
          }
          setLoading(false);
        });
        onSnapshot(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1)), (s) => {
          setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return null;

  return (
    <div className="hidden lg:flex flex-col gap-6 w-full lg:w-80 p-6 bg-white dark:bg-slate-950 h-screen border-l dark:border-slate-800 overflow-y-auto scrollbar-hide">

      {/* 1. MINIMALIST PROFILE CARD */}
      <motion.div
        whileHover={{ scale: 0.98 }}
        onClick={() => navigate('/settings')}
        className="p-6 bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden cursor-pointer shadow-xl shadow-slate-900/10"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl font-black">
            {userDetails.name[0]}
          </div>
          <div>
            <h3 className="font-black uppercase tracking-tighter text-lg leading-none">{userDetails.name}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">{userDetails.apartment}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
          <span>{userDetails.role}</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
      </motion.div>

      {/* 2. INSTANT STATS (Clean 2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-center">
          <Cloud className="text-blue-400 mb-1" size={16} />
          <span className="text-sm font-black text-slate-900 dark:text-white">28°C</span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sunny</span>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl flex flex-col items-center justify-center text-center">
          <Clock className="text-indigo-400 mb-1" size={16} />
          <span className="text-sm font-black text-slate-900 dark:text-white">{dayjs().format('H:mm')}</span>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">IST</span>
        </div>
      </div>

      {/* 3. CORE ACTION BUTTONS */}
      <div className="space-y-2">
        <button
          onClick={() => setActiveSection ? setActiveSection('security') : navigate('/admin/security')}
          className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-[1.5rem] flex items-center justify-between group hover:bg-indigo-600 hover:text-white transition-all"
        >
          <div className="flex items-center gap-3">
            <Shield size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-inherit">Security Gate</span>
          </div>
          <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100" />
        </button>
        <button
          onClick={() => setActiveSection ? setActiveSection('accounts') : navigate('/settings')}
          className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-[1.5rem] flex items-center justify-between group hover:bg-emerald-600 hover:text-white transition-all"
        >
          <div className="flex items-center gap-3">
            <CreditCard size={18} />
            <span className="text-xs font-black uppercase tracking-widest text-inherit">Payments</span>
          </div>
          <ArrowUpRight size={14} className="opacity-40 group-hover:opacity-100" />
        </button>
      </div>

      {/* 4. LATEST UPDATE (Compact) */}
      <div className="mt-4 flex-1">
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Bulletin</h3>
          <ArrowUpRight size={12} className="text-slate-300" />
        </div>

        <div className="space-y-3">
          {announcements.length > 0 ? (
            <div className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2rem] shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <TrendingUp size={40} />
              </div>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic mb-1">
                "{announcements[0].content}"
              </p>
              <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">— {announcements[0].userName || 'Management'}</span>
            </div>
          ) : (
            <div className="py-8 text-center border-2 border-dashed dark:border-slate-800 rounded-[2rem]">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">All Systems Clear</p>
            </div>
          )}
        </div>
      </div>

      {/* 5. QUICK DIRECTORY (Clean Row) */}
      <div className="space-y-4 mb-2">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Emergency</h3>
        <div className="flex gap-2">
          <button className="flex-1 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
            <Phone size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Medical</span>
          </button>
          <button className="flex-1 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
            <Shield size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">Guard</span>
          </button>
        </div>
      </div>

      {/* 6. SYSTEM HEALTH (Compact Horizontal) */}
      <div className="mt-auto pt-6 border-t dark:border-slate-800">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Gate Online</span>
          </div>
          <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">V.2.4.0</span>
        </div>
      </div>

    </div>
  );
};

export default RightSidebar;
