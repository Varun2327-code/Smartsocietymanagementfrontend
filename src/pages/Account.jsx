import React, { useState, useEffect } from "react";
import {
  FaUser, FaHome, FaUsers, FaUserShield, FaPhoneAlt,
  FaPlus, FaTrashAlt, FaMoneyBillWave, FaHistory, FaArrowRight, FaQrcode,
  FaBell, FaCalendarAlt, FaIdBadge, FaDownload, FaChartLine, FaFileInvoice,
  FaCamera, FaEdit, FaIdCard, FaCheckCircle
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, limit, orderBy, onSnapshot } from "firebase/firestore";
import { useFirestore } from "../hooks/useFirestore";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Account = () => {
  const navigate = useNavigate();
  const { userProfile: userData, loading, error } = useFirestore();
  const [payments, setPayments] = useState([]);
  const [fetchingPayments, setFetchingPayments] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [qrAmount, setQrAmount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [events, setEvents] = useState([]);
  const [showDigitalID, setShowDigitalID] = useState(false);

  const fetchPayments = async () => {
    if (!auth.currentUser) return;
    setFetchingPayments(true);
    try {
      const q = query(collection(db, "payments"), where("userId", "==", auth.currentUser.uid));
      const snap = await getDocs(q);
      const docList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPayments(docList.sort((a, b) => new Date(b.month) - new Date(a.month)));
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setFetchingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Notifications Listener
    const qNotif = query(collection(db, "notifications"), orderBy("timestamp", "desc"), limit(5));
    const unsubNotif = onSnapshot(qNotif, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Events Listener
    const qEvents = query(collection(db, "events"), limit(3));
    const unsubEvents = onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubNotif(); unsubEvents(); };
  }, []);

  const downloadReceipt = (payment) => {
    const docPDF = new jsPDF();
    docPDF.setFontSize(20);
    docPDF.text("Payment Receipt", 20, 20);
    docPDF.setFontSize(12);
    docPDF.text(`Month: ${payment.month}`, 20, 40);
    docPDF.text(`Amount: ₹${payment.amount}`, 20, 50);
    docPDF.text(`Status: ${payment.status}`, 20, 60);
    docPDF.text(`User Index: ${userData.id}`, 20, 70);
    docPDF.text(`Reference No: ${payment.id}`, 20, 80);
    docPDF.save(`Receipt_${payment.month}.pdf`);
  };

  const downloadIDCard = async () => {
    const element = document.getElementById('digital-id-card');
    const canvas = await html2canvas(element);
    const data = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = data;
    link.download = `${userData.name}_ID_Card.png`;
    link.click();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (error) return <div>Error: {error}</div>;
  if (!userData) return <div>No data available</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen"
    >
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Profile Header Card */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white dark:border-slate-800 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl -mr-32 -mt-32 rounded-full"></div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="relative group">
              <div className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-[2.4rem] bg-white dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {userData.profileImage ? (
                    <img src={userData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <FaUser className="text-6xl text-slate-200" />
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate("/edit-profile")}
                className="absolute bottom-2 right-2 p-3 bg-white dark:bg-slate-700 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-600 text-indigo-600"
              >
                <FaCamera />
              </button>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{userData.name}</h1>
                <span className="px-4 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                  {userData.role}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2">
                <FaHome className="text-indigo-500" /> Wing {userData.wing || 'A'} - {userData.flatNumber || 'XXX'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 uppercase tracking-widest">
                  {userData.email}
                </div>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 uppercase tracking-widest">
                  {userData.phone || "No Phone Registered"}
                </div>
              </div>
            </div>

            <div className="md:ml-auto">
              <button
                onClick={() => navigate("/edit-profile")}
                className="px-8 py-4 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:scale-[1.02] transition active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs"
              >
                <FaEdit className="text-sm" /> MANAGE PROFILE
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Occupancy & Family */}
          <div className="lg:col-span-2 space-y-8">

            {/* Occupancy Info */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                <FaIdCard className="text-emerald-500" /> Residency Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ownership</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-200">{userData.ownership || 'Owner'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-200">Active</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Verification</p>
                  <div className="flex items-center gap-1 text-emerald-500 font-black uppercase tracking-widest text-xs">
                    <FaCheckCircle className="text-lg" /> KYC OK
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bills & Payments Section */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full -mr-16 -mt-16"></div>
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                  <FaMoneyBillWave className="text-indigo-500" /> Bills & Payments
                </h3>
                <button
                  onClick={() => navigate('/dashboard', { state: { section: 'maintenance' } })}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                >
                  FULL LEDGER <FaArrowRight />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Payment Chart / Analytics */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 h-64">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FaChartLine className="text-indigo-500" /> Payment Analytics
                  </p>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={payments.slice(0, 6).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" hide />
                      <YAxis hide domain={[0, 'dataMax + 1000']} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                        {payments.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.status === 'Paid' ? '#6366f1' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Outstanding Card */}
                <div className="flex flex-col gap-4">
                  <div className="bg-slate-900 p-6 rounded-3xl text-white flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Dues</p>
                    <p className="text-3xl font-black mb-4">
                      ₹{payments.filter(p => p.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                    </p>
                    <button
                      onClick={() => {
                        const due = payments.filter(p => p.status !== 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
                        if (due > 0) { setQrAmount(due); setShowQR(true); }
                      }}
                      className="w-full py-4 bg-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition"
                    >
                      CLEAR OUTSTANDING
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Transactions List */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financial Log</p>
                {fetchingPayments ? (
                  <div className="py-4 text-center text-slate-400 font-bold italic animate-pulse">Syncing...</div>
                ) : (
                  payments.slice(0, 4).map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          <FaHistory className="text-sm" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{p.month}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{p.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300">₹{p.amount.toLocaleString()}</p>
                        {p.status === 'Paid' && (
                          <button
                            onClick={() => downloadReceipt(p)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <FaFileInvoice />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Event Summary Section */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                  <FaCalendarAlt className="text-blue-500" /> Upcoming Events
                </h3>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {events.length > 0 ? events.map((event, i) => (
                  <div key={i} className="min-w-[280px] p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">{event.date || 'TBD'}</p>
                      <h4 className="font-black text-slate-800 dark:text-white mb-2">{event.title}</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed line-clamp-2">{event.description}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-[9px] font-black px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-slate-500 uppercase">Members Only</span>
                    </div>
                  </div>
                )) : (
                  <div className="w-full py-10 text-center text-slate-400 font-bold italic">No events scheduled.</div>
                )}
              </div>
            </motion.div>

            {/* Family Members */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                  <FaUsers className="text-purple-500" /> Family Network
                </h3>
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(userData.familyMembers || []).length > 0 ? (
                  userData.familyMembers.map((member, i) => (
                    <div key={i} className="group p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white">{member.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.relation} • {member.age} Years</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-slate-400 font-bold italic">No family members found. Add in settings.</div>
                )}
              </div>
            </motion.div>

            {/* Domestic Help */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter">
                  <FaUserShield className="text-orange-500" /> Verified Domestic Help
                </h3>
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl hover:bg-indigo-100 transition"
                >
                  <FaPlus />
                </button>
              </div>
              <div className="space-y-4">
                {(userData.helpers || []).length > 0 ? (
                  userData.helpers.map((helper, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-black text-indigo-600">
                        {helper.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800 dark:text-white">{helper.name}</h4>
                          <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><FaCheckCircle /> SECURE</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{helper.role} • {helper.timing}</p>
                      </div>
                      <button className="px-4 py-2 text-[10px] font-black text-indigo-600 bg-white dark:bg-slate-700 rounded-xl shadow-sm uppercase tracking-widest">
                        LOGS
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 font-bold italic">No domestic help registered.</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Secondary Info */}
          <div className="space-y-8">

            {/* Emergency Contact */}
            <motion.div
              variants={itemVariants}
              className="bg-gradient-to-br from-red-500 to-rose-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-red-200 dark:shadow-none"
            >
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-red-50 uppercase tracking-tighter">
                <FaPhoneAlt className="animate-pulse" /> Emergency Contact
              </h3>
              <div className="space-y-4">
                {userData.emergencyContact ? (
                  <>
                    <div>
                      <p className="text-[10px] font-black text-red-100 uppercase tracking-widest leading-none mb-2">Primary Contact</p>
                      <p className="text-xl font-black">{userData.emergencyContact.name}</p>
                      <p className="text-[10px] font-black text-red-100 opacity-70 uppercase tracking-widest">{userData.emergencyContact.relation}</p>
                    </div>
                    <div className="pt-4 border-t border-white/20">
                      <p className="text-2xl font-black tracking-tighter">{userData.emergencyContact.phone}</p>
                    </div>
                  </>
                ) : (
                  <div className="py-2 text-red-100 font-bold italic text-sm">Not configured! Update to enable SOS features.</div>
                )}
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="w-full py-4 mt-4 bg-white/20 hover:bg-white/30 rounded-2xl font-black transition-colors backdrop-blur-md uppercase tracking-widest text-[10px]"
                >
                  MANAGE GUARDIANS
                </button>
              </div>
            </motion.div>

            {/* Notification Center */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tighter">
                <FaBell className="text-amber-500" /> Notifications
              </h3>
              <div className="space-y-4">
                {notifications.length > 0 ? notifications.map((n, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-l-4 border-indigo-500">
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-800 dark:text-white mb-1 line-clamp-1 truncate">{n.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 line-clamp-1">{n.description}</p>
                    </div>
                  </div>
                )) : (
                  <p className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Inbox Zero</p>
                )}
              </div>
            </motion.div>

            {/* Quick Actions / Digital ID Card */}
            <motion.div
              variants={itemVariants}
              className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700"></div>
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tighter relative z-10">
                <FaIdBadge className="text-indigo-200" /> Smart Identity
              </h3>
              <p className="text-xs font-bold text-indigo-100 mb-6 opacity-80 leading-relaxed uppercase tracking-wider">Access your resident portal QR and identity details instantly.</p>
              <button
                onClick={() => setShowDigitalID(true)}
                className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition active:scale-95 uppercase tracking-widest text-[10px]"
              >
                VIEW DIGITAL ID
              </button>
            </motion.div>

            {/* Quick Links / Badges */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter">Badges & Perks</h3>
              <div className="flex flex-wrap gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-2xl flex items-center gap-2 text-[10px] font-black border border-amber-100 dark:border-amber-900/20 uppercase tracking-widest">
                  🏆 On-time Payer
                </div>
                <div className="p-3 bg-sky-50 dark:bg-sky-900/10 text-sky-600 rounded-2xl flex items-center gap-2 text-[10px] font-black border border-sky-100 dark:border-sky-900/20 uppercase tracking-widest">
                  🤝 Friendly Resident
                </div>
              </div>
            </motion.div>

            {/* Account Settings */}
            <motion.div variants={itemVariants} className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
              <h3 className="text-lg font-black mb-6 uppercase tracking-tighter">Account Security</h3>
              <div className="space-y-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <button
                  onClick={() => navigate('/settings', { state: { tab: 'account' } })}
                  className="w-full pb-4 border-b border-white/10 flex justify-between items-center cursor-pointer hover:text-white transition"
                >
                  Change Password <FaEdit />
                </button>
                <button
                  onClick={() => navigate('/settings', { state: { tab: 'notifications' } })}
                  className="w-full pb-4 border-b border-white/10 flex justify-between items-center cursor-pointer hover:text-white transition"
                >
                  Notification Tuning <FaEdit />
                </button>
                <button
                  onClick={() => navigate('/settings', { state: { tab: 'account' } })}
                  className="w-full text-red-400 cursor-pointer hover:text-red-300 flex justify-between items-center"
                >
                  Delete Identity <FaTrashAlt />
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Digital ID Modal */}
      <AnimatePresence>
        {showDigitalID && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl"
          >
            <div className="bg-transparent w-full max-w-sm">
              <div id="digital-id-card" className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="bg-indigo-600 p-8 pt-12 text-center text-white relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-white p-1 shadow-xl mb-4 relative z-10">
                    <img
                      src={userData.profileImage || `https://ui-avatars.com/api/?name=${userData.name}`}
                      alt="ID"
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight relative z-10">{userData.name}</h2>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest relative z-10">Verfied Resident</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Wing/Flat</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{userData.wing}-{userData.flatNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valid Till</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">DEC 2026</p>
                    </div>
                  </div>
                  <div className="py-6 border-y border-slate-100 dark:border-slate-800 flex justify-center">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-inner group">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=Resident:${userData.id}`}
                        alt="Access QR"
                        className="w-32 h-32 opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] italic">Smart Society System • Secure Access</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={downloadIDCard}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <FaDownload /> SAVE TO STORAGE
                </button>
                <button
                  onClick={() => setShowDigitalID(false)}
                  className="px-6 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal (Payment) */}
      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 w-full max-w-sm border border-slate-200 dark:border-slate-800 text-center relative shadow-2xl"
            >
              <button
                onClick={() => setShowQR(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition"
              >
                <FaPlus className="rotate-45 text-2xl" />
              </button>

              <div className="mb-6 inline-block p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2rem]">
                <FaQrcode className="text-4xl text-indigo-600" />
              </div>

              <h2 className="text-2xl font-black mb-2 dark:text-white uppercase tracking-tighter">Quick Payment</h2>
              <p className="text-slate-500 font-bold mb-8 uppercase tracking-widest text-[9px]">Scan to clear your outstanding</p>

              <div className="bg-white p-6 rounded-[2.5rem] inline-block mb-8 border-2 border-dashed border-slate-200 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=6367100290@superyes&pn=SocietyMaintenance&am=${qrAmount}`)}`}
                  alt="UPI QR"
                  className="w-48 h-48"
                />
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pay</span>
                  <span className="text-xl font-black text-indigo-600">₹{qrAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  // In real app, you'd verify the transaction
                  setShowQR(false);
                  fetchPayments(); // Refresh
                }}
                className="w-full py-5 rounded-[1.5rem] bg-emerald-600 text-white font-black shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition uppercase tracking-widest text-xs"
              >
                PAYMENT COMPLETED
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Account;
