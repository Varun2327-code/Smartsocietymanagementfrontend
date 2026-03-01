import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CreditCard,
  Plus,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  Filter,
  PieChart,
  Calendar,
  MoreVertical,
  Trash2,
  FileText,
  Activity,
  ArrowRightLeft,
  X,
  AlertCircle,
  Download
} from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument
} from "../../hooks/useFirestore";
import toast from "react-hot-toast";
import useUserRole from "../../hooks/useUserRole";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const STATUS_CONFIG = {
  paid: "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50 text-[9px]",
  pending: "bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50 text-[9px]",
  overdue: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-50 text-[9px]",
};

const Maintenance = () => {
  const [activeTab, setActiveTab] = useState("billing");
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { role, loading: roleLoading } = useUserRole();
  const queryBuilder = useMemo(() => (colRef) => {
    if (role !== 'admin') return null;
    return colRef;
  }, [role]);

  const { data: bills, loading: billsLoading } = useCollection('maintenance', { queryBuilder });
  const loading = billsLoading || roleLoading;
  const { addDocument: generateBill } = useAddDocument('maintenance');
  const { updateDocument: updateBill } = useUpdateDocument('maintenance');
  const { deleteDocument: deleteBill } = useDeleteDocument('maintenance');

  const totals = useMemo(() => {
    if (!Array.isArray(bills)) return { total: 0, collected: 0, pending: 0, overdue: 0 };
    return bills.reduce((acc, b) => {
      const amt = Number(b.amount || 0);
      acc.total += amt;
      if (b.status === 'paid') acc.collected += amt;
      else if (b.status === 'pending') acc.pending += amt;
      else if (b.status === 'overdue') acc.overdue += amt;
      return acc;
    }, { total: 0, collected: 0, pending: 0, overdue: 0 });
  }, [bills]);

  const filteredBills = useMemo(() => {
    if (!Array.isArray(bills)) return [];
    return bills.filter(b => {
      const matchesSearch = (b.month || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.month) - new Date(a.month));
  }, [bills, searchTerm, statusFilter]);

  const barData = useMemo(() => {
    const sorted = [...(Array.isArray(bills) ? bills : [])].sort((a, b) => new Date(a.month) - new Date(b.month)).slice(-6);
    return {
      labels: sorted.map(b => b.month),
      datasets: [{
        label: "Revenue Stream (₹)",
        data: sorted.map(b => b.amount),
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 12,
      }],
    };
  }, [bills]);

  const pieData = useMemo(() => ({
    labels: ["Collected", "Pending", "Overdue"],
    datasets: [{
      data: [totals.collected, totals.pending, totals.overdue],
      backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
      borderWidth: 0,
    }],
  }), [totals]);

  const handleGenerate = async (formData) => {
    const loadingToast = toast.loading("Launching billing sequence...");
    try {
      await generateBill({
        ...formData,
        amount: Number(formData.amount),
        status: 'pending',
        timestamp: new Date().toISOString()
      });
      toast.success("Bills generated!", { id: loadingToast });
      setShowModal(false);
    } catch (err) {
      toast.error("Generation failed", { id: loadingToast });
    }
  };

  const markAsPaid = async (id) => {
    try {
      await updateBill(id, { status: 'paid', paidAt: new Date().toISOString() });
      toast.success("Payment verified");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 space-y-12 animate-pulse">
      <div className="h-12 w-64 bg-slate-200 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[3rem]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-[3rem]" />
        <div className="h-80 bg-slate-100 rounded-[3rem]" />
      </div>
    </div>
  );

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-rose-100 text-center max-w-lg">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-rose-500">
            <Shield size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 uppercase italic">Access Denied</h1>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Your current clearance level does not authorize access to the Revenue Forge.
            Please contact the Central Command if this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Nexus */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <CreditCard size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Revenue <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Forge Nexus</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">High-Clearance Fiscal Infrastructure</p>
              </div>
            </div>
          </motion.div>

          <button
            onClick={() => setShowModal(true)}
            className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
            Launch Billing Wave
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Volume', val: totals.total, sub: 'Gross Quota', icon: <TrendingUp />, color: 'indigo' },
            { label: 'Collected', val: totals.collected, sub: 'Verified Assets', icon: <CheckCircle />, color: 'emerald' },
            { label: 'Pending', val: totals.pending, sub: 'In Arrears', icon: <Clock />, color: 'amber' },
            { label: 'Liquidity', val: totals.total ? Math.round((totals.collected / totals.total) * 100) + '%' : '0%', sub: 'Fiscal Health', icon: <Zap />, color: 'blue' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all"
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                <Activity size={16} className="text-slate-200 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 leading-none mb-2">
                  {typeof stat.val === 'number' ? `₹${stat.val.toLocaleString()}` : stat.val}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-[9px] font-bold text-slate-300 uppercase italic leading-none">{stat.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts & Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[4rem] group-hover:bg-indigo-50/50 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center gap-2">
              <TrendingUp size={14} className="text-indigo-600" /> Revenue Forecast Matrix
            </h3>
            <div className="h-72 relative z-10">
              <Bar data={barData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { display: false }, border: { display: false } },
                  x: { grid: { display: false }, border: { display: false } }
                }
              }} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[4rem] group-hover:bg-indigo-50/50 transition-colors" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10 flex items-center gap-2">
              <PieChart size={14} className="text-indigo-600" /> Collection Breakdown
            </h3>
            <div className="h-60 relative z-10 flex items-center justify-center">
              <Pie data={pieData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: { size: 10, weight: '900', family: 'Plus Jakarta Sans' },
                      usePointStyle: true,
                      padding: 20
                    }
                  }
                }
              }} />
            </div>
          </div>
        </div>

        {/* Search & Filter Matrix */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Locate billing cycle or memorandum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-3xl text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all outline-none"
            />
          </div>
          <div className="flex bg-white p-1.5 rounded-3xl border border-slate-100 shadow-sm gap-1">
            {['all', 'paid', 'pending', 'overdue'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Billing Matrix Table */}
        <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fiscal Vector</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quota Value</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Maturity Date</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clearance Status</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-10 py-24 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Activity size={40} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-1 italic">Void Fiscal Space</h3>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No active billing nodes detected in this quadrant.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b, i) => (
                    <motion.tr
                      key={b.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-indigo-50/20 transition-all group"
                    >
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                            {b.month?.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic">{b.month}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-0.5">{b.notes || 'Routine Protocol Maintenance'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 font-black text-slate-900 text-lg italic">
                        ₹{Number(b.amount).toLocaleString()}
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <Calendar size={14} className="text-slate-300" /> {b.dueDate}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-2 rounded-full border font-black uppercase tracking-widest ${STATUS_CONFIG[b.status]}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                          {b.status !== 'paid' && (
                            <button
                              onClick={() => markAsPaid(b.id)}
                              className="p-3 bg-white text-emerald-600 border border-emerald-100 rounded-xl shadow-sm hover:bg-emerald-50 transition-all"
                              title="Authorize Payment"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteBill(b.id)}
                            className="p-3 bg-white text-rose-500 border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 transition-all"
                            title="Purge Node"
                          >
                            <Trash2 size={18} />
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

      {/* Bill Generation Drawer */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white z-[110] shadow-2xl flex flex-col pt-12"
            >
              <div className="px-12 flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">Forge Provision.</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure society maintenance quota</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.5rem] transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-12 space-y-10 pb-12">
                <BillForm onSubmit={handleGenerate} />
              </div>

              <div className="p-12 border-t border-slate-50 bg-slate-50 text-center">
                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Revenue Protocol 2026.IV</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* Bill Form Component */
const BillForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({ month: '', amount: '', dueDate: '', notes: '' });

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4">Vector Month (Cycle)</label>
        <input
          placeholder="e.g. September 2026"
          className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm tracking-tight transition-all"
          onChange={(e) => setFormData({ ...formData, month: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4">Quota Magnitude (₹)</label>
        <div className="relative">
          <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg italic">₹</span>
          <input
            type="number"
            placeholder="0.00"
            className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm tracking-tight transition-all"
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4">Timeline Maturity (Due Date)</label>
        <input
          type="date"
          className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all cursor-pointer"
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 block ml-4">Protocol Directives (Notes)</label>
        <textarea
          rows={4}
          placeholder="Memorandum for this billing cycle..."
          className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm tracking-tight transition-all resize-none"
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <div className="pt-6">
        <button
          onClick={() => onSubmit(formData)}
          className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group"
        >
          Initialize Provision <Zap size={20} className="group-hover:animate-pulse" />
        </button>
      </div>
    </div>
  );
};

export default Maintenance;
