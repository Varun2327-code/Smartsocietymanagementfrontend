import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Filter,
    PieChart,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    X,
    Trash2,
    Tag,
    Calendar,
    Target,
    Zap,
    CreditCard,
    Package,
    Shield,
    Droplet,
    Briefcase,
    Activity,
    DollarSign,
    Layers
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, query, onSnapshot, serverTimestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const CATEGORY_MAP = {
    'Maintenance': { icon: <Package size={14} />, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    'Utility': { icon: <Droplet size={14} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    'Security': { icon: <Shield size={14} />, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    'Salary': { icon: <Briefcase size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    'Landscaping': { icon: <Target size={14} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    'Other': { icon: <Tag size={14} />, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
};

const ExpenseTracker = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    useEffect(() => {
        const q = query(collection(db, 'society_expenses'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredExpenses = useMemo(() => {
        return Array.isArray(expenses) ? expenses.filter(e => {
            const matchesSearch = (e.title || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'all' || e.category === activeCategory;
            return matchesSearch && matchesCategory;
        }) : [];
    }, [expenses, searchTerm, activeCategory]);

    const stats = useMemo(() => {
        if (!Array.isArray(expenses)) return { total: 0, paid: 0, pending: 0 };
        return {
            total: expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
            paid: expenses.filter(e => e.status === 'Paid').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
            pending: expenses.filter(e => e.status === 'Pending').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
        };
    }, [expenses]);

    const chartData = useMemo(() => {
        const categories = {};
        expenses.forEach(e => {
            categories[e.category] = (categories[e.category] || 0) + Number(e.amount);
        });
        return {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#6366F1', '#3B82F6', '#F43F5E', '#10B981', '#F59E0B', '#94A3B8'],
                borderWidth: 0,
                hoverOffset: 20
            }]
        };
    }, [expenses]);

    const handleLogExpense = async (formData) => {
        const loadingToast = toast.loading("Committing transaction vector...");
        try {
            await addDoc(collection(db, 'society_expenses'), {
                ...formData,
                amount: parseFloat(formData.amount),
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });
            toast.success("Ledger Synchronized", { id: loadingToast });
            setShowModal(false);
        } catch (error) {
            toast.error("Handshake Failed", { id: loadingToast });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Purge this fiscal record?")) return;
        try {
            await deleteDoc(doc(db, 'society_expenses', id));
            toast.success("Record Purged");
        } catch (err) {
            toast.error("Purge Aborted");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] p-12 space-y-12 animate-pulse font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="h-12 w-64 bg-slate-200 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[3rem]" />)}
            </div>
            <div className="h-80 bg-slate-100 rounded-[4rem]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Header Nexus */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-rose-100 transition-transform hover:scale-110">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                                    Fiscal <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-600">Ledger</span>
                                </h1>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">High-Clearance Capital Matrix</p>
                            </div>
                        </div>
                    </motion.div>

                    <button
                        onClick={() => setShowModal(true)}
                        className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                        Logic Provision
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Visual Intelligence Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                            { label: 'Global Outflow', val: stats.total, icon: <TrendingUp />, color: 'rose' },
                            { label: 'Cleared Nodes', val: stats.paid, icon: <ArrowDownLeft />, color: 'emerald' },
                            { label: 'Delta Debt', val: stats.pending, icon: <ArrowUpRight />, color: 'amber' }
                        ].map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block italic">{s.label}</span>
                                <div className="text-3xl font-black text-slate-900 italic">₹{s.val.toLocaleString()}</div>
                                <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-all text-slate-900`}>
                                    {React.cloneElement(s.icon, { size: 100 })}
                                </div>
                            </motion.div>
                        ))}

                        <div className="sm:col-span-3 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[4rem] group-hover:bg-rose-50/50 transition-colors" />
                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 font-bold flex items-center gap-2">
                                    <PieChart size={14} className="text-rose-600" /> Category Distribution Pulse
                                </h3>
                                <div className="flex gap-4">
                                    {['Maintenance', 'Utility', 'Security'].map(c => (
                                        <div key={c} className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${CATEGORY_MAP[c].color.replace('text-', 'bg-')}`} />
                                            <span className="text-[9px] font-black text-slate-400 uppercase italic">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="h-48 flex items-center justify-center relative z-10">
                                <Doughnut data={chartData} options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    cutout: '80%',
                                    radius: '90%'
                                }} />
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic leading-none">Net Total</span>
                                    <span className="text-2xl font-black text-slate-900 italic mt-1">₹{stats.total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-slate-900 p-12 rounded-[4rem] shadow-2xl shadow-slate-200 text-white space-y-10 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors" />
                        <div className="space-y-4 relative z-10">
                            <div className="p-4 bg-white/10 rounded-2xl w-fit text-rose-400 ring-1 ring-white/20"><Zap size={24} /></div>
                            <h4 className="text-3xl font-black tracking-tighter italic">Budget Efficiency.</h4>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">System status: <span className="text-emerald-400">Optimal Liquidity</span>. Capital outflows are balanced against periodic maintenance requirements.</p>
                        </div>
                        <div className="space-y-6 pt-8 border-t border-white/10 relative z-10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Utility Correlation</span>
                                    <span className="text-xs font-black uppercase text-emerald-400 italic">Sync Stable</span>
                                </div>
                                <Activity size={16} className="text-emerald-400 animate-pulse" />
                            </div>
                            <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '84%' }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ledger Nexus Hub */}
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-600 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Find transaction by memorandum..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-rose-100 focus:border-rose-200 outline-none transition-all"
                        />
                    </div>
                    <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm gap-2 overflow-x-auto no-scrollbar">
                        {['all', ...Object.keys(CATEGORY_MAP)].map(c => (
                            <button
                                key={c}
                                onClick={() => setActiveCategory(c)}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === c ? 'bg-rose-600 text-white shadow-lg shadow-rose-100' : 'text-slate-400 hover:bg-slate-50'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden mb-20">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Fiscal Source</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vector Category</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Timestamp</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Magnitude</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">State</th>
                                    <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ops</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredExpenses.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-10 py-24 text-center">
                                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                                <Layers size={40} />
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1 italic">Void Fiscal Chamber</h3>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No transaction signals recorded in this sector.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpenses.map((exp, i) => {
                                        const cat = CATEGORY_MAP[exp.category] || CATEGORY_MAP.Other;
                                        return (
                                            <motion.tr
                                                key={exp.id}
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="hover:bg-rose-50/20 transition-all group"
                                            >
                                                <td className="px-10 py-8 font-black text-slate-900 group-hover:text-rose-600 transition-colors uppercase italic text-base tracking-tight">{exp.title}</td>
                                                <td className="px-10 py-8">
                                                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl w-fit border ${cat.bg} ${cat.color} text-[9px] font-black uppercase tracking-widest`}>
                                                        {cat.icon}
                                                        {exp.category}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <Calendar size={14} className="text-slate-300" /> {exp.date}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right font-black text-slate-900 text-lg italic">₹{Number(exp.amount).toLocaleString()}</td>
                                                <td className="px-10 py-8 text-right">
                                                    <span className={`px-5 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest ${exp.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-50' : 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-50'}`}>
                                                        {exp.status}
                                                    </span>
                                                </td>
                                                <td className="px-10 py-8 text-right opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => handleDelete(exp.id)} className="p-3 bg-white text-rose-500 border border-rose-100 rounded-xl shadow-sm hover:bg-rose-50 transition-all">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Outflow Provision Drawer */}
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
                                    <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">Fiscal Push.</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Append new capital transit to ledger</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.5rem] transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-12 space-y-10 pb-12">
                                <ExpenseForm onSubmit={handleLogExpense} />
                            </div>

                            <div className="p-12 border-t border-slate-50 bg-slate-50 text-center">
                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Capital Node Gamma-74</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const ExpenseForm = ({ onSubmit }) => {
    const [form, setForm] = useState({ title: '', amount: '', category: 'Maintenance', status: 'Paid', date: new Date().toISOString().split('T')[0] });

    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 block ml-4 text-xs italic">Memorandum Identifier</label>
                <input
                    placeholder="e.g. Structural Rejuvenation Core"
                    className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 font-black text-sm tracking-tight transition-all outline-none"
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 block ml-4 text-xs italic">Capital Magnitude (₹)</label>
                    <div className="relative">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-300 text-lg italic">₹</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-14 pr-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 font-black text-sm tracking-tight transition-all outline-none"
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 block ml-4 text-xs italic">Clearance Vector</label>
                    <select
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 font-black text-sm transition-all outline-none appearance-none cursor-pointer"
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                        <option value="Paid">Verified Paid</option>
                        <option value="Pending">Pending Delta</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 block ml-4 text-xs italic">Fiscal Classification</label>
                <div className="grid grid-cols-2 gap-3">
                    {Object.keys(CATEGORY_MAP).map(c => (
                        <button
                            key={c}
                            onClick={() => setForm({ ...form, category: c })}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest italic ${form.category === c ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-100' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200'}`}
                        >
                            {CATEGORY_MAP[c].icon} {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 block ml-4 text-xs italic">Timestamp Bound</label>
                <input
                    type="date"
                    value={form.date}
                    className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-rose-100 focus:ring-4 focus:ring-rose-50 font-black text-sm transition-all cursor-pointer outline-none"
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
            </div>

            <div className="pt-6">
                <button
                    onClick={() => onSubmit(form)}
                    className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl hover:bg-rose-600 transition-all flex items-center justify-center gap-4 group"
                >
                    Commit Transaction <Zap size={20} className="group-hover:animate-pulse" />
                </button>
            </div>
        </div>
    );
};

export default ExpenseTracker;
