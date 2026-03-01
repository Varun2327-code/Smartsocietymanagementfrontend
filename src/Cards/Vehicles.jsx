import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Search,
    Trash2,
    CheckCircle,
    Clock,
    Car,
    Zap,
    ShieldCheck,
    ShieldAlert,
    ArrowRightLeft,
    Filter,
    Activity,
    User,
    Hash,
    MapPin,
    TrendingUp,
    X,
    Navigation,
    Shield,
    Key,
    UserPlus,
    Maximize2,
    MoreVertical,
    Cpu,
    Target,
    Layers,
    Globe
} from 'lucide-react';
import {
    useCollection,
    useAddDocument,
    useUpdateDocument,
    useDeleteDocument
} from '../hooks/useFirestore';
import useUserRole from '../hooks/useUserRole';
import toast from 'react-hot-toast';

const Vehicles = () => {
    const [showAdd, setShowAdd] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const [newVehicle, setNewVehicle] = useState({
        type: 'Car',
        model: '',
        plate: '',
        spot: '',
        owner: '',
        rfidTag: 'SM-ACTIVE-NODE',
        lastEntry: new Date().toISOString()
    });

    const { role, loading: roleLoading } = useUserRole();
    const queryBuilder = useMemo(() => (colRef) => {
        if (!role) return null;
        return colRef;
    }, [role]);

    const { data: vehicles, loading: vehiclesLoading } = useCollection('vehicles', { queryBuilder });
    const loading = roleLoading || vehiclesLoading;
    const { addDocument } = useAddDocument('vehicles');
    const { updateDocument } = useUpdateDocument('vehicles');
    const { deleteDocument } = useDeleteDocument('vehicles');

    // Advanced Fleet Intelligence Engine
    const stats = useMemo(() => {
        if (!vehicles) return { total: 0, cars: 0, bikes: 0, pending: 0 };
        return {
            total: vehicles.length,
            cars: vehicles.filter(v => v.type === 'Car').length,
            bikes: vehicles.filter(v => v.type === 'Bike').length,
            pending: vehicles.filter(v => !v.verified).length
        };
    }, [vehicles]);

    const filteredVehicles = useMemo(() => {
        if (!vehicles) return [];
        return vehicles.filter(v => {
            const matchesSearch = (v.plate || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (v.owner || "").toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || v.type === filterType;
            return matchesSearch && matchesType;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [vehicles, searchQuery, filterType]);

    const handleAddVehicle = async () => {
        if (!newVehicle.model || !newVehicle.plate || !newVehicle.owner) {
            toast.error('Identity records incomplete');
            return;
        }

        const loadingToast = toast.loading('Synchronizing vehicle node...');
        try {
            await addDocument({
                ...newVehicle,
                verified: false,
                status: 'Authorized',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            toast.success('Vehicle registered to society matrix', { id: loadingToast });
            setNewVehicle({ type: 'Car', model: '', plate: '', spot: '', owner: '', rfidTag: 'SM-ACTIVE-NODE', lastEntry: new Date().toISOString() });
            setShowAdd(false);
        } catch (error) {
            toast.error('Registration sequence failed', { id: loadingToast });
        }
    };

    const toggleVerification = async (id, currentStatus) => {
        try {
            await updateDocument(id, { verified: !currentStatus });
            toast.success(`${currentStatus ? 'Revoked' : 'Granted'} Clearance Protocol`);
        } catch (error) {
            toast.error('Signal interference');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Purge vehicle from registry?')) return;
        try {
            await deleteDocument(id);
            toast.success('Vehicle purged from matrix');
            if (selectedVehicle?.id === id) setSelectedVehicle(null);
        } catch (error) {
            toast.error('Purge sequence aborted');
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#FDFEFE] p-12 space-y-12 animate-pulse font-['Plus_Jakarta_Sans',sans-serif]">
            <div className="h-14 w-80 bg-slate-100 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-44 bg-slate-50 border border-slate-100 rounded-[3rem]" />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-50 border border-slate-100 rounded-[3.5rem]" />)}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFEFE] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Premium Header Nexus */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-6 mb-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] transition-transform hover:rotate-12">
                                <Navigation size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                                    Fleet <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Transit Matrix</span>
                                </h1>
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-1 italic leading-none">Global Society Terminal & Allocation Interface</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-6">
                        <div className="flex bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            <button onClick={() => setViewMode('grid')} className={`p-4 rounded-[1.75rem] transition-all transform active:scale-90 ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}><Layers size={20} /></button>
                            <button onClick={() => setViewMode('table')} className={`p-4 rounded-[1.75rem] transition-all transform active:scale-90 ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`}><Search size={20} /></button>
                        </div>
                        {(role === 'admin' || role === 'security') && (
                            <button
                                onClick={() => setShowAdd(true)}
                                className="group flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-xs shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 italic"
                            >
                                <UserPlus size={20} className="group-hover:rotate-12 transition-transform" />
                                Initialize Unit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tactical Statistics Matrix */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                {[
                    { label: 'Global Fleet', val: stats.total, sub: 'Active Signals', icon: <Car />, color: 'indigo' },
                    { label: 'Heavy Nodes', val: stats.cars, sub: 'Class: Alpha', icon: <Cpu />, color: 'blue' },
                    { label: 'Light Nodes', val: stats.bikes, sub: 'Class: Beta', icon: <Zap />, color: 'purple' },
                    { label: 'Pending Clear', val: stats.pending, sub: 'Access Triage', icon: <ShieldAlert />, color: 'rose' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-10 rounded-[4rem] border border-slate-50 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:shadow-2xl hover:shadow-indigo-50/50 transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-slate-50 rounded-full blur-3xl group-hover:bg-indigo-50 transition-colors" />
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-${stat.color}-100/50`}>{stat.icon}</div>
                            <Activity size={18} className="text-slate-200 group-hover:text-emerald-400 transition-colors animate-pulse" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-5xl font-black text-slate-900 leading-none mb-3 italic tracking-tighter">{stat.val}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1 italic leading-none">{stat.label}</div>
                            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest italic leading-none">{stat.sub}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search & Resource Filter Console */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={24} />
                    <input
                        type="text"
                        placeholder="Scan model, plate hash or hub identity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-20 pr-8 py-7 bg-white border border-slate-100 rounded-[3rem] text-sm font-black italic shadow-sm focus:ring-8 focus:ring-indigo-50 transition-all outline-none tracking-widest uppercase placeholder:text-slate-200"
                    />
                </div>
                <div className="flex bg-slate-50 p-2 rounded-[3rem] border border-slate-100 shadow-inner gap-2 overflow-x-auto no-scrollbar">
                    {['all', 'Car', 'Bike'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-12 py-5 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.4em] transition-all italic whitespace-nowrap ${filterType === type ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {type === 'all' ? 'All Vectors' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Transit Matrix Grid */}
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="popLayout">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredVehicles.map((v, i) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={v.id}
                                    className="bg-white rounded-[4rem] p-10 border border-slate-50 shadow-sm relative group overflow-hidden hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.08)] transition-all flex flex-col"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[5rem] pointer-events-none group-hover:bg-indigo-50/50 transition-colors" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-12">
                                            <div className={`p-6 rounded-[2.5rem] transition-transform group-hover:scale-110 shadow-2xl ${v.type === 'Car' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
                                                <Car size={32} />
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-3">
                                                <button
                                                    onClick={() => (role === 'admin' || role === 'security') && toggleVerification(v.id, v.verified)}
                                                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all italic shadow-lg ${v.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'} ${(role === 'admin' || role === 'security') ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-80'}`}
                                                >
                                                    {v.verified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                                    {v.verified ? 'Verified Node' : 'Access Restricted'}
                                                </button>
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono italic">TAG: {v.rfidTag || 'NO-REF-SYN'}</span>
                                            </div>
                                        </div>

                                        <div className="mb-10">
                                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic mb-2 uppercase leading-none">{v.model}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                                    <Hash size={18} />
                                                </div>
                                                <span className="text-xl font-black text-indigo-600 font-mono tracking-[0.2em]">{v.plate}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 mb-10">
                                            <div className="p-6 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-2 group/tile hover:bg-white transition-colors">
                                                <div className="flex items-center gap-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                                                    <User size={12} className="text-indigo-500" /> Host Logic
                                                </div>
                                                <p className="text-sm font-black text-slate-800 uppercase italic truncate">{v.owner}</p>
                                            </div>
                                            <div className="p-6 bg-indigo-50/20 rounded-[2.5rem] border border-indigo-100/50 space-y-2 group/tile hover:bg-white transition-colors">
                                                <div className="flex items-center gap-3 text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] italic">
                                                    <MapPin size={12} /> Hub Spot
                                                </div>
                                                <p className="text-sm font-black text-indigo-600 uppercase italic">{v.spot || 'NODE-F7'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-10 border-t border-slate-50 mt-auto">
                                            <div className="flex items-center gap-3 text-slate-400">
                                                <Clock size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{new Date(v.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex gap-4">
                                                <button onClick={() => setSelectedVehicle(v)} className="p-5 bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-white border-2 border-transparent hover:border-slate-100 rounded-[1.75rem] transition-all shadow-sm"><Maximize2 size={20} /></button>
                                                {(role === 'admin' || role === 'security') && (
                                                    <button onClick={() => handleDelete(v.id)} className="p-5 bg-slate-50 text-slate-300 hover:text-rose-600 hover:bg-white border-2 border-transparent hover:border-slate-100 rounded-[1.75rem] transition-all shadow-sm"><Trash2 size={20} /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[5rem] border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.03)] overflow-hidden mb-20">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Signature</th>
                                        <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Registry Hash</th>
                                        <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Host Node</th>
                                        <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Clearance</th>
                                        <th className="px-12 py-10 text-right text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Ops</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredVehicles.map((v, i) => (
                                        <motion.tr
                                            key={v.id}
                                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                            className="hover:bg-indigo-50/20 transition-all group"
                                        >
                                            <td className="px-12 py-10">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform ${v.type === 'Car' ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>
                                                        <Car size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-black text-slate-900 italic uppercase leading-none">{v.model}</div>
                                                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic mt-2">{v.type} Prototype</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-10 font-bold text-indigo-600 font-mono tracking-widest text-base">{v.plate}</td>
                                            <td className="px-12 py-10 text-[11px] font-black text-slate-500 uppercase italic tracking-widest">{v.owner}</td>
                                            <td className="px-12 py-10">
                                                <span className={`px-5 py-2 rounded-full border text-[9px] font-black uppercase tracking-widest italic shadow-sm ${v.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {v.verified ? 'Secured' : 'Restricted'}
                                                </span>
                                            </td>
                                            <td className="px-12 py-10 text-right opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <div className="flex items-center justify-end gap-3">
                                                    {(role === 'admin' || role === 'security') && <button onClick={() => toggleVerification(v.id, v.verified)} className="p-4 bg-white border border-slate-100 text-indigo-500 hover:bg-indigo-50 rounded-2xl transition-all shadow-sm" title="Toggle Verification"><Key size={18} /></button>}
                                                    <button onClick={() => setSelectedVehicle(v)} className="p-4 bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all shadow-sm" title="View Diagnostics"><Target size={18} /></button>
                                                    {(role === 'admin' || role === 'security') && <button onClick={() => handleDelete(v.id)} className="p-4 bg-white border border-slate-100 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm" title="Purge Record"><Trash2 size={18} /></button>}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AnimatePresence>

                {filteredVehicles.length === 0 && !loading && (
                    <div className="py-40 text-center bg-white rounded-[5rem] border-4 border-dashed border-slate-50">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                            <Car size={64} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-2">Void Grid Detected.</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic leading-none">All fleet coordinates currently offline.</p>
                    </div>
                )}
            </div>

            {/* Registration Console (Modal) */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl" onClick={() => setShowAdd(false)} />
                        <motion.div
                            initial={{ scale: 0.8, y: 100, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 100, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white rounded-[5rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5)] overflow-hidden p-16"
                        >
                            <div className="flex justify-between items-start mb-16 relative z-10">
                                <div>
                                    <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Register Unit.</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-slate-900">Fleet Integration Handshake Protocol</p>
                                </div>
                                <button onClick={() => setShowAdd(false)} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2.5rem] transition-all group scale-100 hover:scale-110 active:scale-95 shadow-inner">
                                    <X size={32} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Transit Protocol</label>
                                    <div className="flex gap-4 bg-slate-50 p-3 rounded-[3rem] border border-white shadow-inner">
                                        {['Car', 'Bike'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setNewVehicle({ ...newVehicle, type: t })}
                                                className={`flex-1 py-6 rounded-[2.5rem] text-[10px] uppercase font-black tracking-[0.4em] transition-all italic ${newVehicle.type === t ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {t === 'Car' ? 'Heavy Host (Alpha)' : 'Light Host (Beta)'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Model Hash</label>
                                        <input
                                            type="text"
                                            placeholder="DESIGN SIGNATURE..."
                                            className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-none focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black text-lg italic transition-all outline-none shadow-inner"
                                            value={newVehicle.model}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Registry Plate</label>
                                        <input
                                            type="text"
                                            placeholder="HASH-PLATE..."
                                            className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-none focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black text-lg font-mono tracking-widest transition-all outline-none shadow-inner uppercase"
                                            value={newVehicle.plate}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Host Primary Node</label>
                                        <input
                                            type="text"
                                            placeholder="IDENTITY SIGNATURE..."
                                            className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-none focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black text-lg italic transition-all outline-none shadow-inner uppercase"
                                            value={newVehicle.owner}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, owner: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] italic ml-6 leading-none">Allocation Spot</label>
                                        <input
                                            type="text"
                                            placeholder="COORDINATE-FIX..."
                                            className="w-full p-8 rounded-[2.5rem] bg-slate-50 border-none focus:bg-white focus:ring-8 focus:ring-indigo-50 font-black text-lg italic transition-all outline-none shadow-inner uppercase"
                                            value={newVehicle.spot}
                                            onChange={(e) => setNewVehicle({ ...newVehicle, spot: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-10">
                                    <button
                                        onClick={handleAddVehicle}
                                        className="w-full py-10 bg-slate-900 text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-xs shadow-[0_40px_80px_-20px_rgba(15,23,42,0.4)] hover:bg-indigo-600 transition-all flex items-center justify-center gap-6 group italic active:scale-95"
                                    >
                                        Commit Access Protocol <ShieldCheck size={28} className="group-hover:rotate-12 transition-transform" />
                                    </button>
                                </div>
                            </div>

                            <p className="mt-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.8em] italic animate-pulse">Global Fleet Synchronization Protocol Active</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Deep Inspect Diagnostic (Drawer-like Modal) */}
            <AnimatePresence>
                {selectedVehicle && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-3xl" onClick={() => setSelectedVehicle(null)} />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            className="fixed right-0 top-0 bottom-0 w-full md:w-[650px] bg-white z-[160] shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col p-16"
                        >
                            <div className="flex justify-between items-center mb-16">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl">
                                        <Car size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Diagnostic Case</h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Unit Hash: {selectedVehicle.id}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedVehicle(null)} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2rem] transition-all group shadow-sm">
                                    <X size={28} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-12 no-scrollbar">
                                <div className="bg-slate-50/50 p-12 rounded-[4rem] border border-slate-50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[80px] rounded-full" />
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <span className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-10 shadow-inner border italic ${selectedVehicle.verified ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {selectedVehicle.verified ? 'Global Access Granted' : 'Clearance Required'}
                                        </span>
                                        <h2 className="text-6xl font-black text-slate-900 italic tracking-tighter uppercase mb-2 leading-none">{selectedVehicle.model}</h2>
                                        <p className="text-2xl font-black text-indigo-600 font-mono tracking-[0.4em] mb-12 opacity-80">{selectedVehicle.plate}</p>

                                        <div className="grid grid-cols-2 gap-6 w-full">
                                            <div className="bg-white/80 p-8 rounded-[3rem] shadow-sm flex flex-col items-center">
                                                <User size={24} className="text-indigo-600 mb-4" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Host Identity</span>
                                                <p className="text-lg font-black text-slate-900 italic uppercase">{selectedVehicle.owner}</p>
                                            </div>
                                            <div className="bg-white/80 p-8 rounded-[3rem] shadow-sm flex flex-col items-center">
                                                <MapPin size={24} className="text-purple-600 mb-4" />
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Static Spot</span>
                                                <p className="text-lg font-black text-slate-900 italic uppercase">{selectedVehicle.spot || 'ALPHA-01'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Signal Strength', val: 98, icon: <Activity />, color: 'emerald' },
                                        { label: 'Registry Sync', val: 100, icon: <Globe />, color: 'indigo' },
                                        { label: 'Matrix Load', val: 12, icon: <Zap />, color: 'amber' }
                                    ].map((m, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-50 shadow-sm flex flex-col items-center text-center">
                                            <div className={`w-12 h-12 bg-${m.color}-50 text-${m.color}-600 rounded-xl flex items-center justify-center mb-4`}>{m.icon}</div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic leading-none mb-2">{m.label}</p>
                                            <p className="text-lg font-black text-slate-900 italic tracking-tighter leading-none">{m.val}%</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-6">
                                        <div className="h-[2px] w-12 bg-slate-900 rounded-full" />
                                        <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-900 italic">Narrative Logs</h4>
                                    </div>
                                    <div className="text-xl text-slate-500 leading-relaxed font-black italic border-l-8 border-indigo-50 pl-10">
                                        Unit localized at Main Perimeter Gate.
                                        Clearance verified via RFID handshake.
                                        Internal society routing active.
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto rounded-[3rem]">
                                {(role === 'admin' || role === 'security') && (
                                    <button onClick={() => handleDelete(selectedVehicle.id)} className="flex items-center gap-4 text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] hover:text-rose-600 transition-all italic group">
                                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center group-hover:bg-rose-50 transition-all border border-slate-100 group-hover:rotate-12"><Trash2 size={24} /></div>
                                        Purge Node
                                    </button>
                                )}
                                {(role === 'admin' || role === 'security') && (
                                    <button onClick={() => toggleVerification(selectedVehicle.id, selectedVehicle.verified)} className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all italic active:scale-95 flex items-center gap-4">
                                        <Key size={18} /> Re-Authorize Protocol
                                    </button>
                                )}
                                {(role !== 'admin' && role !== 'security') && (
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic mx-auto">Read-Only Diagnostic View</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Vehicles;
