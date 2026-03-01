import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaQrcode, FaCalendarAlt, FaClock, FaCheckCircle, FaShareAlt, FaTrash } from 'react-icons/fa';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';

const VisitorApproval = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showQR, setShowQR] = useState(null);
    const [newVisitor, setNewVisitor] = useState({
        name: '',
        purpose: '',
        date: new Date().toISOString().split('T')[0],
        time: '12:00',
        flatNumber: ''
    });

    // Fetch visitors created by this resident
    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'visitors'),
            where('submittedBy', '==', auth.currentUser.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setVisitors(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching visitors:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleCreatePass = async (e) => {
        e.preventDefault();
        if (!newVisitor.name || !newVisitor.purpose) return alert("Please fill details");

        try {
            const docRef = await addDoc(collection(db, 'visitors'), {
                ...newVisitor,
                status: 'approved', // Pre-approved by resident
                submittedBy: auth.currentUser.uid,
                timestamp: serverTimestamp(),
                type: 'pre-approved'
            });

            setNewVisitor({
                name: '',
                purpose: '',
                date: new Date().toISOString().split('T')[0],
                time: '12:00',
                flatNumber: ''
            });

            setShowQR({ id: docRef.id, ...newVisitor });
            setActiveTab('history');
            alert("Visitor pass generated!");
        } catch (error) {
            console.error("Error creating pass:", error);
            alert("Failed to create pass");
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                    <FaUserPlus className="text-emerald-600" /> Visitor Pre-approval
                </h1>
                <p className="text-slate-500 font-medium">Generate digital gate passes for your guests.</p>
            </div>

            <div className="flex gap-4 mb-8">
                {['create', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-xl font-bold transition capitalize ${activeTab === tab ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
                    >
                        {tab === 'create' ? 'Generate Pass' : 'Recent Passes'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'create' ? (
                    <motion.div
                        key="create-tab"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="max-w-xl"
                    >
                        <form onSubmit={handleCreatePass} className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Guest Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. John Doe"
                                        className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
                                        value={newVisitor.name}
                                        onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Flat Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. A-402"
                                        className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
                                        value={newVisitor.flatNumber}
                                        onChange={(e) => setNewVisitor({ ...newVisitor, flatNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Purpose of Visit</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Family Dinner"
                                    className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
                                    value={newVisitor.purpose}
                                    onChange={(e) => setNewVisitor({ ...newVisitor, purpose: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Arrival Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
                                        value={newVisitor.date}
                                        onChange={(e) => setNewVisitor({ ...newVisitor, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Approx Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-emerald-500 font-bold dark:text-white"
                                        value={newVisitor.time}
                                        onChange={(e) => setNewVisitor({ ...newVisitor, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition"
                            >
                                Generate Pass
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="history-tab"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {loading ? (
                            <p className="col-span-full text-center text-slate-500">Loading passes...</p>
                        ) : visitors.length === 0 ? (
                            <p className="col-span-full text-center text-slate-500 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 py-10 rounded-3xl">No passes generated yet.</p>
                        ) : (
                            visitors.map((v) => (
                                <div key={v.id} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                                            <FaQrcode className="w-6 h-6" />
                                        </div>
                                        <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            {v.status}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">{v.name}</h3>
                                    <p className="text-sm text-slate-400 font-bold mb-4">{v.purpose}</p>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <FaCalendarAlt className="text-slate-300" /> {v.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <FaClock className="text-slate-300" /> {v.time}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowQR(v)}
                                            className="flex-1 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md"
                                        >
                                            View QR
                                        </button>
                                        <button className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-emerald-600 transition">
                                            <FaShareAlt />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* QR Code Modal Display */}
            <AnimatePresence>
                {showQR && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl p-10 w-full max-w-sm text-center relative"
                        >
                            <button onClick={() => setShowQR(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                                <FaTrash className="hover:text-red-500 transition" title="Close" />
                            </button>

                            <div className="mb-6 inline-block p-4 bg-emerald-50 rounded-3xl">
                                <FaQrcode className="w-16 h-16 text-emerald-600" />
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Gate Pass</h2>
                            <p className="text-slate-500 font-bold mb-6">Pass ID: {showQR.id.substring(0, 8).toUpperCase()}</p>

                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8 text-left space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase">Guest</span>
                                    <span className="text-sm font-bold">{showQR.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase">Valid On</span>
                                    <span className="text-sm font-bold">{showQR.date}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-black text-slate-400 uppercase">Flat</span>
                                    <span className="text-sm font-bold">{showQR.flatNumber}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-emerald-600 font-black text-sm py-4 border-2 border-dashed border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                                <FaCheckCircle /> PRE-APPROVED
                            </div>

                            <p className="mt-6 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Share this pass with your guest</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VisitorApproval;
