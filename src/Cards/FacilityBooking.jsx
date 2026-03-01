import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Dumbbell,
    Waves,
    Users,
    CheckCircle,
    Clock,
    X,
    Plus,
    ChevronRight,
    MapPin,
    CreditCard,
    ShieldCheck,
    AlertCircle,
    Activity,
    CalendarCheck,
    Info,
    ArrowRight
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, orderBy } from 'firebase/firestore';
import { toast, Toaster } from 'react-hot-toast';
import useUserRole from '../hooks/useUserRole';

const FacilityBooking = () => {
    const { role: userRole } = useUserRole();
    const [activeTab, setActiveTab] = useState('explore');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [bookingData, setBookingData] = useState({ date: '', time: '' });

    const facilities = [
        {
            id: 1,
            name: 'Grand Clubhouse',
            icon: <Users size={28} />,
            price: '₹500/hr',
            color: 'bg-indigo-600',
            lightColor: 'bg-indigo-50 dark:bg-indigo-900/30',
            textColor: 'text-indigo-600',
            description: 'State-of-the-art event space for parties and meetings.',
            status: 'Open',
            capacity: '100 People'
        },
        {
            id: 2,
            name: 'Elite Gym',
            icon: <Dumbbell size={28} />,
            price: 'Free for Residents',
            color: 'bg-rose-600',
            lightColor: 'bg-rose-50 dark:bg-rose-900/30',
            textColor: 'text-rose-600',
            description: 'Fully equipped fitness center with modern machinery.',
            status: 'Open',
            capacity: '15 People'
        },
        {
            id: 3,
            name: 'Aqua Pool',
            icon: <Waves size={28} />,
            price: '₹100/visit',
            color: 'bg-blue-600',
            lightColor: 'bg-blue-50 dark:bg-blue-900/30',
            textColor: 'text-blue-600',
            description: 'Temperature controlled swimming pool with lifeguard.',
            status: 'Maintenance',
            capacity: '30 People'
        },
    ];

    useEffect(() => {
        if (!auth.currentUser || !userRole) return;

        // Admin sees all, Resident sees only theirs
        const q = (userRole === 'admin' || userRole === 'security')
            ? query(collection(db, 'facility_bookings'), orderBy('timestamp', 'desc'))
            : query(collection(db, 'facility_bookings'), where('userId', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBookings(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Sync error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) return toast.error("Authentication required");
        if (!bookingData.date || !bookingData.time) return toast.error("Select date and time");

        try {
            await addDoc(collection(db, 'facility_bookings'), {
                facilityName: selectedFacility.name,
                facilityId: selectedFacility.id,
                date: bookingData.date,
                time: bookingData.time,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || auth.currentUser.email.split('@')[0],
                status: 'Confirmed',
                timestamp: serverTimestamp()
            });

            toast.success("Booking confirmed!", {
                icon: '🎉',
                style: { borderRadius: '15px', background: '#333', color: '#fff' }
            });
            setSelectedFacility(null);
            setBookingData({ date: '', time: '' });
            setActiveTab('history');
        } catch (error) {
            toast.error("Booking system error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
            <Toaster position="top-right" />

            {/* High-End Header */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800 sticky top-0 z-30 h-24 flex items-center px-6 shadow-sm">
                <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <CalendarCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter italic">Amenities Hub</h1>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Society Asset Management</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('explore')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'explore' ? 'bg-white dark:bg-slate-700 shadow-xl text-indigo-600' : 'text-slate-500'}`}
                        >Explore</button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-xl text-indigo-600' : 'text-slate-500'}`}
                        >My Bookings</button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-12">
                <AnimatePresence mode="wait">
                    {activeTab === 'explore' ? (
                        <motion.div
                            key="explore"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {facilities.map((f) => (
                                <motion.div
                                    whileHover={{ y: -10 }}
                                    key={f.id}
                                    className="group bg-white dark:bg-slate-900 rounded-[3rem] p-8 border dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col relative overflow-hidden"
                                >
                                    {/* Status Badge */}
                                    <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${f.status === 'Open' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {f.status}
                                    </div>

                                    <div className={`w-16 h-16 rounded-3xl ${f.lightColor} ${f.textColor} flex items-center justify-center mb-8 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                                        {f.icon}
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter">{f.name}</h3>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">{f.description}</p>

                                    <div className="flex items-center gap-6 mt-auto">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Rate</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{f.price}</p>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100 dark:bg-slate-800" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Limit</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{f.capacity}</p>
                                        </div>
                                    </div>

                                    <button
                                        disabled={f.status !== 'Open'}
                                        onClick={() => setSelectedFacility(f)}
                                        className={`mt-8 w-full py-4 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl active:scale-95 ${f.status === 'Open' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/10' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                                    >
                                        Reserve Spot
                                    </button>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] border dark:border-slate-800 shadow-xl overflow-hidden"
                        >
                            <div className="p-8 border-b dark:border-slate-800 flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Booking History</h2>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl">
                                    <Activity size={20} />
                                </div>
                            </div>

                            <div className="divide-y dark:divide-slate-800">
                                {loading ? (
                                    <div className="p-20 flex flex-col items-center gap-4">
                                        <Activity className="animate-spin text-indigo-600" size={32} />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Fetching records...</p>
                                    </div>
                                ) : bookings.length === 0 ? (
                                    <div className="p-20 text-center">
                                        <Calendar size={48} className="mx-auto text-slate-200 mb-6" />
                                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No reservations on file</p>
                                    </div>
                                ) : (
                                    bookings.map((b) => (
                                        <div key={b.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                                                    <CalendarCheck size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">{b.facilityName}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Calendar size={12} /> {b.date}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12} /> {b.time}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                {userRole === 'admin' && (
                                                    <div className="hidden md:flex flex-col text-right">
                                                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Resident</p>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-white">{b.userName}</p>
                                                    </div>
                                                )}
                                                <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${b.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                    {b.status}
                                                </div>
                                                <ChevronRight className="text-slate-300" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Booking Modal */}
            <AnimatePresence>
                {selectedFacility && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFacility(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Confirm Spot</h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{selectedFacility.name}</p>
                                </div>
                                <button onClick={() => setSelectedFacility(null)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleBook} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Reservation Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-800 dark:text-white shadow-inner"
                                            value={bookingData.date}
                                            onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Time Slot Selection</label>
                                    <div className="relative">
                                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <select
                                            required
                                            className="w-full pl-14 pr-6 py-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-800 dark:text-white shadow-inner appearance-none"
                                            value={bookingData.time}
                                            onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                                        >
                                            <option value="">Choose your slot...</option>
                                            <option value="06:00 AM - 08:00 AM">Early Morning (6 AM - 8 AM)</option>
                                            <option value="08:00 AM - 10:00 AM">Morning (8 AM - 10 AM)</option>
                                            <option value="10:00 AM - 12:00 PM">Late Morning (10 AM - 12 PM)</option>
                                            <option value="04:00 PM - 06:00 PM">Evening (4 PM - 6 PM)</option>
                                            <option value="06:00 PM - 08:00 PM">Night (6 PM - 8 PM)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Charge Information</p>
                                        <CreditCard size={14} className="text-indigo-400" />
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 leading-none">{selectedFacility.price}</p>
                                        <p className="text-[10px] font-bold text-indigo-400">Subject to terms & conditions</p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full group relative flex items-center justify-center py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] overflow-hidden shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        Confirm Reservation <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                                    </span>
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FacilityBooking;
