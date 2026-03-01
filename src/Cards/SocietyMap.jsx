import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Map as MapIcon,
    Search,
    Filter,
    Activity,
    Zap,
    Users,
    Home,
    Info,
    ChevronRight,
    TrendingUp,
    AlertCircle,
    Cpu,
    Target,
    Waves,
    Globe,
    Lock,
    Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const SocietyMap = () => {
    const [selectedWing, setSelectedWing] = useState('A');
    const [hoveredFlat, setHoveredFlat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [viewMode, setViewMode] = useState('occupancy'); // 'occupancy' | 'maintenance' | 'energy' | 'security'

    const wings = ['A', 'B', 'C', 'D'];
    const floors = [7, 6, 5, 4, 3, 2, 1];
    const flatsPerFloor = [1, 2, 3, 4];

    // Status mapping with premium tactical colors
    const STYLES = {
        occupied: {
            bg: 'bg-indigo-600',
            light: 'bg-indigo-50',
            text: 'text-indigo-600',
            glow: 'shadow-indigo-500/40',
            label: 'Secured Hub'
        },
        empty: {
            bg: 'bg-emerald-500',
            light: 'bg-emerald-50',
            text: 'text-emerald-500',
            glow: 'shadow-emerald-500/40',
            label: 'Vacant Node'
        },
        maintenance: {
            bg: 'bg-amber-500',
            light: 'bg-amber-50',
            text: 'text-amber-500',
            glow: 'shadow-amber-500/40',
            label: 'Protocol Lock'
        },
        alert: {
            bg: 'bg-rose-600',
            light: 'bg-rose-50',
            text: 'text-rose-600',
            glow: 'shadow-rose-500/40',
            label: 'Incident Trace'
        }
    };

    // Advanced Mock Data Engine with Flux Simulation
    const flatData = useMemo(() => {
        const data = {};
        wings.forEach(w => {
            floors.forEach(f => {
                flatsPerFloor.forEach(fl => {
                    const id = `${w}-${f}0${fl}`;
                    const random = Math.random();
                    let status = 'occupied';
                    if (random > 0.88) status = 'empty';
                    else if (random > 0.78) status = 'maintenance';
                    else if (random > 0.95) status = 'alert';

                    data[id] = {
                        id,
                        wing: w,
                        floor: f,
                        number: fl,
                        status,
                        resident: status === 'occupied' ? `Host-${Math.floor(Math.random() * 900) + 100}` : 'UNAVAILABLE',
                        balance: status === 'occupied' ? (Math.random() > 0.85 ? -Math.floor(Math.random() * 8000) : 0) : 0,
                        lastAudit: '2026.II.24',
                        energy: Math.floor(Math.random() * 100),
                        water: Math.floor(Math.random() * 100),
                        securityLevel: Math.floor(Math.random() * 5) + 1
                    };
                });
            });
        });
        return data;
    }, []);

    const filteredStats = useMemo(() => {
        const wingData = Object.values(flatData).filter(f => f.wing === selectedWing);
        const total = wingData.length;
        const occupied = wingData.filter(f => f.status === 'occupied').length;
        const empty = wingData.filter(f => f.status === 'empty').length;
        const maintenance = wingData.filter(f => f.status === 'maintenance').length;

        return {
            total,
            occupied: Math.round((occupied / total) * 100),
            empty: Math.round((empty / total) * 100),
            maintenance: Math.round((maintenance / total) * 100)
        };
    }, [selectedWing, flatData]);

    const handleSearch = (e) => {
        const val = e.target.value.toUpperCase();
        setSearchQuery(val);
        const match = Object.values(flatData).find(f => f.id === val || `${f.floor}0${f.number}` === val);
        if (match) {
            setSelectedWing(match.wing);
            toast.success(`Unit ${match.id} Localized`, {
                icon: '🎯',
                style: { borderRadius: '2rem', background: '#0f172a', color: '#fff', fontSize: '10px', fontStyle: 'italic', fontWeight: '900', textTransform: 'uppercase' }
            });
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFEFE] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
            {/* Premium Header Nexus */}
            <div className="max-w-7xl mx-auto mb-16">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-6 mb-4">
                            <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] transition-transform hover:rotate-12">
                                <Globe size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">
                                    Spatial <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Atlas Matrix</span>
                                </h1>
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] mt-1 italic leading-none">Global Site Management & Resource Topology</p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex flex-wrap items-center gap-6">
                        {/* Wing Selector Grid */}
                        <div className="flex bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 shadow-inner">
                            {wings.map(wing => (
                                <button
                                    key={wing}
                                    onClick={() => setSelectedWing(wing)}
                                    className={`px-10 py-4 rounded-[1.75rem] text-[10px] uppercase font-black tracking-widest transition-all italic ${selectedWing === wing ? 'bg-white text-indigo-600 shadow-[0_10px_20px_-5px_rgba(99,102,241,0.2)]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Phase {wing}
                                </button>
                            ))}
                        </div>

                        {/* View Mode Topology Toggle */}
                        <div className="flex bg-slate-900/5 backdrop-blur-3xl p-2 rounded-[2.5rem] border border-white">
                            <button onClick={() => setViewMode('occupancy')} className={`p-4 rounded-[1.75rem] transition-all transform active:scale-90 ${viewMode === 'occupancy' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400'}`} title="Occupancy Map"><Home size={20} /></button>
                            <button onClick={() => setViewMode('maintenance')} className={`p-4 rounded-[1.75rem] transition-all transform active:scale-90 ${viewMode === 'maintenance' ? 'bg-white text-amber-500 shadow-xl' : 'text-slate-400'}`} title="Protocol View"><Shield size={20} /></button>
                            <button onClick={() => setViewMode('energy')} className={`p-4 rounded-[1.75rem] transition-all transform active:scale-90 ${viewMode === 'energy' ? 'bg-white text-purple-600 shadow-xl' : 'text-slate-400'}`} title="Energy Grid"><Zap size={20} /></button>
                            <button onClick={() => setViewMode('security')} className={`p-4 rounded-[1.75rem] transition-all transform active:scale-90 ${viewMode === 'security' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-400'}`} title="Security Matrix"><Lock size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Tactical Sidebar Console */}
                <div className="xl:col-span-3 space-y-10">
                    {/* Unit Localization Hub */}
                    <div className="bg-slate-900 rounded-[4rem] p-10 text-white shadow-[0_40px_80px_-20px_rgba(15,23,42,0.4)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-8 flex items-center gap-3 italic">
                            <Target size={14} className="text-indigo-400" /> Unit Localization
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearch}
                                placeholder="A-701, B-402..."
                                className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-16 text-sm font-black italic placeholder:text-white/10 outline-none focus:bg-white/10 focus:border-indigo-500/50 transition-all uppercase tracking-widest"
                            />
                        </div>
                    </div>

                    {/* Live Stream Flux Metrics */}
                    <div className="bg-white rounded-[4rem] p-10 border border-slate-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.03)] space-y-10 relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50/50 blur-3xl rounded-full" />
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic mb-2 uppercase">Phase {selectedWing} Pulse.</h3>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] italic leading-none">Real-Time Occupancy Flux</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                { id: 'occupied', label: 'Secured Nodes', val: filteredStats.occupied, color: 'indigo' },
                                { id: 'empty', label: 'Vacant Sectors', val: filteredStats.empty, color: 'emerald' },
                                { id: 'maintenance', label: 'Protocol Lockout', val: filteredStats.maintenance, color: 'amber' }
                            ].map((stat) => (
                                <button
                                    key={stat.id}
                                    onClick={() => setStatusFilter(statusFilter === stat.id ? 'all' : stat.id)}
                                    className={`w-full group flex flex-col gap-4 p-5 rounded-[2.5rem] transition-all border ${statusFilter === stat.id ? `bg-${stat.color}-50 border-${stat.color}-100 shadow-xl shadow-${stat.color}-100/20` : 'bg-white border-transparent hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center justify-between w-full px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${STYLES[stat.id].bg} shadow-lg shadow-${stat.color}-500/40 animate-pulse`} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{stat.label}</span>
                                        </div>
                                        <span className={`text-lg font-black text-${stat.color}-600 italic tracking-tighter`}>{stat.val}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-white">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.val}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full ${STYLES[stat.id].bg} rounded-full`}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sector Warning Monitor */}
                    <div className="p-10 bg-rose-50 rounded-[4rem] border border-rose-100 shadow-lg shadow-rose-100/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-4 mb-6 text-rose-600">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
                                <AlertCircle size={24} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Active Alert</span>
                        </div>
                        <p className="text-sm font-black text-rose-900 leading-relaxed italic">HVAC Synchronizer (Phase C) reporting 12% drop in air-flow efficiency. Auto-repair sequence initiated.</p>
                        <button className="mt-8 flex items-center gap-3 text-rose-600 font-black text-[10px] uppercase tracking-[0.3em] hover:text-rose-800 transition-colors italic">
                            Full Diagnostics <ChevronRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Main Spatial Grid Matrix */}
                <div className="xl:col-span-9">
                    <div className="bg-white rounded-[5rem] p-16 border border-slate-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col items-center">
                        {/* Global Background Topology Aura */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-indigo-50/20 rounded-full blur-[160px] pointer-events-none animate-pulse" />

                        <div className="relative z-10 space-y-6 w-full max-w-5xl">
                            {floors.map(floor => (
                                <div key={floor} className="flex items-center gap-12 group/row">
                                    <div className="w-20 flex flex-col items-end opacity-40 group-hover/row:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] italic mb-1">Level</span>
                                        <span className="text-4xl font-black text-slate-200 group-hover/row:text-slate-900 transition-all italic tracking-tighter leading-none">{floor < 10 ? `0${floor}` : floor}</span>
                                    </div>

                                    <div className="flex-1 grid grid-cols-4 gap-8">
                                        {flatsPerFloor.map(flatNum => {
                                            const flatId = `${selectedWing}-${floor}0${flatNum}`;
                                            const flat = flatData[flatId];
                                            const isFiltered = statusFilter === 'all' || flat.status === statusFilter;
                                            const isSearched = searchQuery && flatId.includes(searchQuery);

                                            return (
                                                <motion.button
                                                    key={flatId}
                                                    onMouseEnter={() => setHoveredFlat(flatId)}
                                                    onMouseLeave={() => setHoveredFlat(null)}
                                                    onClick={() => setSelectedUnit(flat)}
                                                    animate={{
                                                        opacity: isFiltered ? 1 : 0.08,
                                                        scale: isSearched ? 1.08 : 1,
                                                        filter: isFiltered ? 'blur(0px)' : 'blur(4px)'
                                                    }}
                                                    whileHover={{ y: -12, scale: 1.05 }}
                                                    className={`relative h-32 rounded-[3.5rem] bg-slate-50 border border-white flex flex-col items-center justify-center transition-all duration-700 overflow-hidden shadow-inner group/unit ${isSearched ? 'shadow-[0_30px_60px_-15px_rgba(99,102,241,0.3)] ring-4 ring-indigo-50 ring-offset-4' : ''}`}
                                                >
                                                    {isFiltered && (
                                                        <div className={`absolute inset-0 opacity-0 group-hover/unit:opacity-100 transition-opacity bg-gradient-to-br from-indigo-600/5 to-purple-600/5`} />
                                                    )}

                                                    {/* Status Nucleus */}
                                                    <div className={`w-3 h-3 rounded-full mb-4 shadow-xl ${STYLES[flat.status].bg} ${isFiltered ? 'animate-pulse' : ''} shadow-[0_0_15px_rgba(99,102,241,0.5)]`} />

                                                    <span className="text-2xl font-black text-slate-900 tracking-tighter italic leading-none">{floor}0{flatNum}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 group-hover/unit:text-indigo-600 transition-colors italic">{STYLES[flat.status].label}</span>

                                                    {/* View Mode Topology Layers */}
                                                    <AnimatePresence>
                                                        {viewMode === 'energy' && isFiltered && (
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${flat.energy}%` }}
                                                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500/20 to-purple-500/5 pointer-events-none"
                                                            />
                                                        )}
                                                        {viewMode === 'security' && isFiltered && (
                                                            <div className="absolute top-4 right-6 flex gap-1 opacity-40">
                                                                {Array.from({ length: 5 }).map((_, i) => (
                                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < flat.securityLevel ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Facility Support Infrastructure Interface */}
                        <div className="mt-20 pt-16 border-t border-slate-50 w-full flex flex-col md:flex-row items-center justify-between gap-12 relative">
                            <div className="flex items-center gap-12">
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Infrastructure Root</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-white">
                                            <Cpu size={24} />
                                        </div>
                                        <p className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Portal Main Terminal</p>
                                    </div>
                                </div>
                                <div className="hidden lg:block w-48 h-[2px] bg-gradient-to-r from-indigo-600 via-indigo-600/50 to-transparent rounded-full shadow-lg shadow-indigo-100" />
                            </div>

                            <div className="flex gap-6">
                                {[
                                    { icon: <Shield />, label: 'Security: Nominal' },
                                    { icon: <Zap />, label: 'Grid: Stable' },
                                    { icon: <Waves />, label: 'Hydraulics: 98%' },
                                    { icon: <Activity />, label: 'Health: Optimal' }
                                ].map((sys, idx) => (
                                    <div
                                        key={idx}
                                        className="p-5 bg-slate-50 rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:bg-white border-2 border-transparent hover:border-slate-100 transition-all cursor-help shadow-sm group/sys"
                                        title={sys.label}
                                    >
                                        <div className="group-hover/sys:scale-110 transition-transform">
                                            {React.cloneElement(sys.icon, { size: 20 })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Float HUD Information Node */}
            <AnimatePresence>
                {hoveredFlat && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                        className="fixed bottom-16 right-16 w-96 bg-slate-900/90 backdrop-blur-3xl text-white p-10 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 z-[100] overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-10">
                                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] italic shadow-lg ${STYLES[flatData[hoveredFlat].status].bg}`}>
                                    {STYLES[flatData[hoveredFlat].status].label}
                                </div>
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Activity size={18} className="animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic">Live Flux</span>
                                </div>
                            </div>

                            <h4 className="text-5xl font-black italic mb-2 tracking-tighter uppercase leading-none">Unit {hoveredFlat}</h4>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-12 italic border-l-4 border-indigo-600 pl-4">{flatData[hoveredFlat].resident}</p>

                            <div className="grid grid-cols-2 gap-8 pb-4 border-b border-white/5 mb-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] italic">System Clearance</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className={`w-3 h-1 rounded-full ${i < flatData[hoveredFlat].securityLevel ? 'bg-indigo-400' : 'bg-white/5'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em] italic">Capital Delta</p>
                                    <p className={`text-lg font-black italic ${flatData[hoveredFlat].balance < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {flatData[hoveredFlat].balance < 0 ? `₹${Math.abs(flatData[hoveredFlat].balance).toLocaleString()}` : 'CLEARANCE'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                                    <Zap size={14} className="text-amber-400" /> {flatData[hoveredFlat].energy}% Load
                                </div>
                                <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                    <Eye size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deep Analytic Unit Terminal (Modal) */}
            <AnimatePresence>
                {selectedUnit && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/70 backdrop-blur-2xl"
                            onClick={() => setSelectedUnit(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.8, y: 100, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 100, opacity: 0 }}
                            className="relative w-full max-w-2xl bg-white rounded-[5rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5)] overflow-hidden p-16"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] rounded-full pointer-events-none" />

                            <div className="flex justify-between items-start mb-16 relative z-10">
                                <div className="flex items-center gap-8">
                                    <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center text-white ${STYLES[selectedUnit.status].bg} shadow-2xl transition-transform hover:rotate-12`}>
                                        <Home size={40} />
                                    </div>
                                    <div>
                                        <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">Unit {selectedUnit.id}</h2>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 italic pl-1 border-l-4 border-slate-900">Analytic Diagnostic Interface</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedUnit(null)} className="p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-[2.5rem] transition-all group scale-100 hover:scale-110 active:scale-95 shadow-inner">
                                    <X size={32} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            <div className="space-y-12 relative z-10">
                                <div className="grid grid-cols-2 gap-8 bg-slate-50/80 backdrop-blur-xl p-10 rounded-[4rem] border border-white shadow-inner">
                                    <div className="space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Global Node Host</p>
                                            <p className="text-2xl font-black text-slate-900 italic uppercase underline decoration-indigo-200 decoration-4 underline-offset-8">{selectedUnit.resident}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Temporal Audit Log</p>
                                            <p className="text-xl font-black text-slate-800 italic uppercase">{selectedUnit.lastAudit}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-6 text-right">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Clearance Matrix</p>
                                            <div className="flex items-center justify-end gap-3 text-emerald-600 font-black text-xs italic uppercase">
                                                <Shield size={18} /> Verified Active
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Real-Time Load</p>
                                            <span className="text-2xl font-black text-indigo-600 italic tracking-tighter">{selectedUnit.energy * 4} kwh/p</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Pulse Matrix */}
                                <div className="grid grid-cols-3 gap-6">
                                    {[
                                        { label: 'Energy Flux', val: selectedUnit.energy, icon: <Zap />, color: 'amber' },
                                        { label: 'Liquid Flux', val: selectedUnit.water, icon: <Waves />, color: 'blue' },
                                        { id: 'security', label: 'Security Level', val: selectedUnit.securityLevel * 20, icon: <Shield />, color: 'emerald' }
                                    ].map((metric, i) => (
                                        <div key={i} className="bg-slate-50/30 p-8 rounded-[3rem] border border-slate-50 flex flex-col items-center text-center group/metric transition-all hover:bg-white hover:shadow-xl">
                                            <div className={`w-14 h-14 bg-${metric.color}-50 text-${metric.color}-600 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover/metric:rotate-12`}>
                                                {metric.icon}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic leading-none">{metric.label}</p>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                                <div className={`h-full bg-${metric.color}-500 rounded-full`} style={{ width: `${metric.val}%` }} />
                                            </div>
                                            <p className="text-base font-black text-slate-900 italic leading-none">{metric.label === 'Security Level' ? `Lv. ${selectedUnit.securityLevel}` : `${metric.val}%`}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-6 pt-4">
                                    <button className="flex-1 py-8 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 italic active:scale-95 shadow-2xl">
                                        <TrendingUp size={20} /> Narrative History
                                    </button>
                                    <button className="flex-1 py-8 bg-slate-50 text-slate-400 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center justify-center gap-4 italic active:scale-95 border-2 border-transparent hover:border-slate-200">
                                        <Users size={20} /> Host Handshake
                                    </button>
                                </div>
                            </div>

                            <p className="mt-16 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] italic animate-pulse">High-Clearance Diagnostic Disclosure Active</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SocietyMap;
