import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiShield,
  FiFileText,
  FiDollarSign,
  FiAlertTriangle,
  FiTrendingUp,
  FiSettings,
  FiBell,
  FiCalendar,
  FiPieChart,
  FiArrowRight,
  FiActivity,
  FiZap,
  FiStar,
  FiHome
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { subscribeToDashboardMetrics, getRecentActivities } from "../utils/firestoreUtils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingComplaints: 0,
    monthlyRevenue: 0,
    activeGuards: 0,
    infrastructureHealth: 98
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time metrics
    const unsubscribe = subscribeToDashboardMetrics((data) => {
      setMetrics((prev) => ({ ...prev, ...data }));
      setLoading(false);
    });

    // Recent events/activities
    getRecentActivities().then((data) => {
      setActivities(data || []);
    });

    return () => unsubscribe();
  }, []);

  const stats = [
    {
      label: "Resident Population",
      value: metrics.totalMembers,
      change: "+12%",
      icon: <FiUsers />,
      color: "from-blue-600 to-indigo-600",
      path: "/admin/members"
    },
    {
      label: "Security Coverage",
      value: `${metrics.activeGuards || 0} Guards`,
      change: "Optimal",
      icon: <FiShield />,
      color: "from-rose-600 to-red-600",
      path: "/admin/security"
    },
    {
      label: "System Health",
      value: `${metrics.infrastructureHealth}%`,
      change: "Stable",
      icon: <FiZap />,
      color: "from-amber-500 to-orange-600",
      path: "/admin/maintenance"
    },
    {
      label: "Revenue Stream",
      value: `₹${(metrics.monthlyRevenue || 0).toLocaleString()}`,
      change: "+4.2%",
      icon: <FiDollarSign />,
      color: "from-emerald-500 to-teal-600",
      path: "/admin/expenses"
    }
  ];

  const chartData = [
    { name: "Mon", interaction: 4000, alerts: 240 },
    { name: "Tue", interaction: 3000, alerts: 139 },
    { name: "Wed", interaction: 2000, alerts: 980 },
    { name: "Thu", interaction: 2780, alerts: 390 },
    { name: "Fri", interaction: 1890, alerts: 480 },
    { name: "Sat", interaction: 2390, alerts: 380 },
    { name: "Sun", interaction: 3490, alerts: 430 },
  ];

  const quickLinks = [
    { label: "Member Registry", icon: <FiUsers />, path: "/admin/members", desc: "Digital resident database" },
    { label: "Gate Control", icon: <FiShield />, path: "/admin/security", desc: "Visitor & parcel logs" },
    { label: "Bill Generator", icon: <FiFileText />, path: "/admin/maintenance", desc: "Maintenance invoicing" },
    { label: "Expense Ledger", icon: <FiDollarSign />, path: "/admin/expenses", desc: "Society financial flow" },
    { label: "Resolution Hub", icon: <FiAlertTriangle />, path: "/admin/complaints", desc: "Resident issue tracking" },
    { label: "Circulars", icon: <FiBell />, path: "/admin/announcements", desc: "Broadcast broadcasts" },
    { label: "Vault", icon: <FiFileText />, path: "/admin/documents", desc: "Document repository" },
  ];

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Synchronizing Control Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <FiActivity className="animate-pulse" /> System Live
            </span>
            <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              v4.2.0-Luminous
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
            Administrative <span className="text-indigo-600">Console.</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl">
            Welcome back to the executive command center. You have <span className="text-indigo-600 font-bold">{metrics.pendingComplaints} critical alerts</span> requiring immediate attention.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/admin/announcements")} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 hover:scale-105 transition active:scale-95 text-slate-600">
            <FiBell size={20} />
          </button>
          <button onClick={() => navigate("/settings")} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 hover:scale-105 transition active:scale-95 text-slate-600">
            <FiSettings size={20} />
          </button>
        </div>
      </div>

      {/* High-Impact Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => navigate(stat.path)}
            className="group cursor-pointer"
          >
            <div className="relative p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-indigo-100">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.05] transition-opacity`} />

              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h3>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                <span className={`text-[10px] font-bold mb-1.5 px-2 py-0.5 rounded-full ${stat.change.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <FiTrendingUp className="text-indigo-600" /> Community Activity
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time interaction matrix</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>System Lifetime</option>
            </select>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '15px' }}
                />
                <Area
                  type="monotone"
                  dataKey="interaction"
                  stroke="#4f46e5"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Board */}
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl shadow-slate-200/50">
          <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <FiZap className="text-amber-500" /> Command Flux
          </h2>
          <div className="space-y-4">
            {quickLinks.slice(0, 5).map((link, i) => (
              <button
                key={i}
                onClick={() => navigate(link.path)}
                className="w-full group flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-600 rounded-3xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-90 transition-transform">
                    {link.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest group-hover:text-white transition-colors">{link.label}</p>
                    <p className="text-[9px] font-medium text-slate-400 group-hover:text-indigo-200 transition-colors">{link.desc}</p>
                  </div>
                </div>
                <FiArrowRight className="text-slate-300 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer / Status Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 px-2">Recent System Events</h3>
          <div className="space-y-4">
            {activities.slice(0, 3).map((act, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{act.action}</p>
                  <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase mt-1">{act.time}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-[10px] font-medium text-slate-400 italic px-2">No recent system logs available.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            <FiStar className="text-indigo-500/20 text-4xl animate-pulse" />
          </div>
          <h3 className="text-lg font-black mb-2">Operational Integrity</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">
            All society functions are currently running within optimal parameters. Maintenance radar is clear.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[8px] font-black">
                  <FiHome />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">99.8% Availability Score</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
