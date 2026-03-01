import React, { useEffect, useState, useRef } from 'react';
import { subscribeToDashboardMetrics, getRecentActivities, getWeeklyActivityData } from '../../utils/firestoreUtils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers, FiUserPlus, FiActivity, FiTrendingUp,
  FiZap, FiBell, FiShield, FiArrowUpRight,
  FiMessageSquare, FiCalendar, FiMoreVertical, FiRefreshCw
} from 'react-icons/fi';
import useUserRole from '../../hooks/useUserRole';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newMembersToday: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyActivityData, setWeeklyActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useUserRole();
  const [isMounted, setIsMounted] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!isMounted || role !== 'admin') return;
    setLoading(true);

    const unsubscribe = subscribeToDashboardMetrics((data) => {
      if (mountedRef.current) {
        setMetrics(data);
        setLoading(false);
      }
    });

    refreshData();
    return () => unsubscribe();
  }, [isMounted, role]);

  const refreshData = async () => {
    try {
      const [activities, weeklyData] = await Promise.all([
        getRecentActivities(),
        getWeeklyActivityData()
      ]);
      if (mountedRef.current) {
        setRecentActivities(activities);
        setWeeklyActivityData(weeklyData);
      }
    } catch (err) {
      console.error('Data loading error:', err);
    }
  };

  const getMetricGradient = (color) => {
    switch (color) {
      case 'blue': return 'from-blue-600 to-indigo-600 shadow-blue-500/20';
      case 'emerald': return 'from-emerald-500 to-teal-600 shadow-emerald-500/20';
      case 'purple': return 'from-purple-500 to-indigo-700 shadow-purple-500/20';
      default: return 'from-slate-700 to-slate-900';
    }
  };

  return (
    <div className="space-y-10 pb-20 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-[2px] bg-indigo-600 rounded-full" />
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Master Command</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">
            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Pulse.</span>
          </h1>
          <p className="text-slate-400 font-medium">Real-time synthesis of society interactions and growth.</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <button
            onClick={refreshData}
            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-lg transition-all active:scale-95 group"
          >
            <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-700" size={20} />
          </button>
          <button className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-slate-900/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3">
            Generate Snapshot <FiArrowUpRight />
          </button>
        </div>
      </div>

      {/* High-Velocity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: 'Total Members', value: metrics.totalMembers, icon: FiUsers, color: 'blue', label: 'Residents on Grid' },
          { title: 'Active Presence', value: metrics.activeMembers, icon: FiActivity, color: 'emerald', label: 'Secured Identities' },
          { title: 'Network Growth', value: metrics.newMembersToday, icon: FiUserPlus, color: 'purple', label: 'Inbound Today' },
        ].map((metric, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${getMetricGradient(metric.color)} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-[3rem]`} />
            <div className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 relative z-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rotate-45 translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start justify-between mb-8">
                <div className={`w-16 h-16 bg-gradient-to-br ${getMetricGradient(metric.color)} rounded-[1.5rem] flex items-center justify-center text-white shadow-xl`}>
                  <metric.icon size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{metric.title}</p>
                  <p className="text-4xl font-black text-slate-900 leading-none">{metric.value}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${metric.color === 'blue' ? 'bg-blue-500' : metric.color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'} animate-pulse`} />
                <span className="text-xs font-bold text-slate-400">{metric.label}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytic Synthesis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Core Activity Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:col-span-2 bg-white border border-slate-100 p-10 rounded-[3.5rem] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Activity Synthesis.</h3>
              <p className="text-slate-400 text-sm font-medium">Trajectory of new identity registrations.</p>
            </div>
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
              {['7D', '1M', '1Y'].map(t => (
                <button key={t} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${t === '7D' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
              ))}
            </div>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivityData}>
                <defs>
                  <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '1.5rem',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '1rem'
                  }}
                  itemStyle={{
                    color: '#6366f1',
                    fontWeight: 900,
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="newMembers"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorMembers)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Real-time Interaction Stream */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl shadow-slate-900/40 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />

          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-black tracking-tight leading-none mb-1 italic">Interaction.</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Stream</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <FiBell size={18} className="animate-bounce" />
            </div>
          </div>

          <div className="space-y-6 overflow-y-auto flex-1 relative z-10 scrollbar-hide">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                <FiZap size={48} className="mb-4" />
                <p className="font-black text-[10px] uppercase tracking-[0.3em]">No Active Flux</p>
              </div>
            ) : (
              recentActivities.map((activity, idx) => (
                <div key={idx} className="group relative">
                  <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-0 bg-indigo-500 rounded-full group-hover:h-8 transition-all" />
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                      <FiShield size={18} className="text-slate-400 group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold leading-tight mb-1 group-hover:text-indigo-400 transition-colors">{activity.action}</p>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <button className="mt-8 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">View All Histories</button>
        </motion.div>
      </div>

      {/* Extended Synthesis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Activity Rate', value: `${Math.round((metrics.activeMembers / metrics.totalMembers) * 100) || 0}%`, icon: FiTrendingUp, color: 'text-indigo-500' },
          { label: 'Network Points', value: '48.2k', icon: FiZap, color: 'text-amber-500' },
          { label: 'Open Comm', value: '12', icon: FiMessageSquare, color: 'text-emerald-500' },
          { label: 'Scheduled', value: '4', icon: FiCalendar, color: 'text-purple-500' },
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center group"
          >
            <div className={`w-14 h-14 bg-slate-50 ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all`}>
              <item.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-2xl font-black text-slate-900">{item.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
