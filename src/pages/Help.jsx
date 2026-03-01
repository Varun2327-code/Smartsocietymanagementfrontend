import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Wrench,
  Calendar,
  Users,
  AlertTriangle,
  Zap,
  BookOpen,
  ArrowRight,
  Send,
  X,
  Plus,
  Activity,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

const categories = [
  { id: 'general', label: 'All Topics', icon: <HelpCircle size={18} /> },
  { id: 'account', label: 'Account & Security', icon: <ShieldCheck size={18} /> },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
  { id: 'community', label: 'Community', icon: <Users size={18} /> },
];

const Help = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({ title: "", description: "", priority: "Low" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      category: "community",
      question: "How do I add a family member?",
      answer: "Navigate to the 'Family' module from your dashboard and click the 'Add Member' button. You will need to provide their name, contact details, and relation.",
    },
    {
      category: "maintenance",
      question: "How do I submit a maintenance request?",
      answer: "Visit the 'Complain Desk' section, click on 'New Request', and describe your issue. You can attach images and set a priority level for faster resolution.",
    },
    {
      category: "community",
      question: "How can I view upcoming events?",
      answer: "The 'Events' calendar displays all upcoming festivals, society meetings, and club activities. You can click on any event to see detailed timings and venues.",
    },
    {
      category: "account",
      question: "Is my personal information secure?",
      answer: "Absolutely. We use industry-standard Firebase encryption. Personal data is only visible to verified society admins and is never shared with third parties.",
    },
    {
      category: "maintenance",
      question: "How do I book the Clubhouse or Gym?",
      answer: "Go to the 'Amenities Hub'. Choose the facility, select an available date and time slot, and confirm. Some facilities might have a nominal fee.",
    },
    {
      category: "account",
      question: "What should I do if I forget my password?",
      answer: "Use the 'Forgot Password' link on the login page. An OTP or reset link will be sent to your registered email address.",
    },
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase());
      const matchesTab = activeTab === "general" || faq.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [search, activeTab]);

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return toast.error("Please login to report issues");
    if (!reportData.title || !reportData.description) return toast.error("Complete all fields");

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        ...reportData,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Resident",
        status: "Open",
        timestamp: serverTimestamp(),
      });
      toast.success("Help request submitted to admins");
      setShowReportModal(false);
      setReportData({ title: "", description: "", priority: "Low" });
    } catch (err) {
      toast.error("Failed to submit. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Dynamic Hero Section */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pt-20 pb-40 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.4),transparent)]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="px-4 py-1.5 bg-indigo-500/30 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100 border border-indigo-400/30">
              Support Hub
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
              How can we <br /> help you today?
            </h1>

            <div className="w-full max-w-2xl mt-8 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300" />
              <input
                placeholder="Search for articles, guides or questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] py-6 pl-16 pr-8 text-white placeholder:text-indigo-200 focus:ring-4 focus:ring-white/10 outline-none transition-all font-bold"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-24 relative z-20">

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Live Chat', icon: <MessageSquare className="text-emerald-500" />, desc: 'Chat with society bot', bg: 'bg-white' },
            { title: 'Phone Support', icon: <Phone className="text-blue-500" />, desc: '+91 93223 22321', bg: 'bg-white' },
            { title: 'Email Desk', icon: <Mail className="text-rose-500" />, desc: 'support@society.com', bg: 'bg-white' }
          ].map((card, i) => (
            <motion.div
              whileHover={{ y: -5 }}
              key={i}
              className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-xl flex items-center gap-6 group"
            >
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                {card.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">{card.title}</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-2">Knowledge Base</h3>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === cat.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center gap-4">
                      {cat.icon}
                      {cat.label}
                    </div>
                    <ChevronRight size={14} className={activeTab === cat.id ? 'text-white' : 'text-slate-300'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-20 transform group-hover:scale-110 transition-transform">
                <Zap size={64} fill="white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Need direct help?</p>
              <h4 className="text-xl font-black uppercase italic tracking-tighter mb-4">Found a bug in <br /> the system?</h4>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-400 hover:text-white transition-all shadow-xl"
              >
                Report Issue <AlertTriangle size={14} />
              </button>
            </div>

            {/* System Status */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">System Status</h3>
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full text-[10px] font-bold animate-pulse">
                  <CheckCircle2 size={10} /> Operational
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'Core Engine', status: 'Online' },
                  { name: 'Messaging Desk', status: 'Online' },
                  { name: 'Payment Gateway', status: 'Delayed' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.name}</span>
                    <span className={`text-[10px] font-black uppercase ${s.status === 'Online' ? 'text-emerald-500' : 'text-amber-500'}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main FAQ Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border dark:border-slate-800 shadow-sm min-h-[600px]">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Frequently Asked</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Found {filteredFaqs.length} relevant articles</p>
                </div>
                <BookOpen className="text-indigo-600" size={32} />
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredFaqs.map((faq, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={faq.question}
                      className="border-b dark:border-slate-800 pb-4 last:border-none"
                    >
                      <button
                        onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                        className="w-full flex items-center justify-between text-left group gap-4"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{faq.category}</span>
                          <h4 className="text-lg font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors tracking-tight leading-tight">
                            {faq.question}
                          </h4>
                        </div>
                        <div className={`p-2 rounded-lg transition-all ${openFAQ === index ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <ChevronDown size={18} />
                        </div>
                      </button>

                      <AnimatePresence>
                        {openFAQ === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                              {faq.answer}
                            </p>
                            <div className="mt-4 flex gap-4">
                              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                Read Full Guide <ArrowRight size={12} />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredFaqs.length === 0 && (
                  <div className="py-20 text-center">
                    <Search className="mx-auto text-slate-200 mb-6" size={64} />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">No Results</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Try different keywords or check all topics</p>
                  </div>
                )}
              </div>
            </div>

            {/* Helpful Tips Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800 flex flex-col justify-between">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl w-fit mb-6">
                  <Calendar size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Automate Guest Entry</h4>
                <p className="text-xs font-bold text-slate-500 mb-6">Pre-approve visitors to generate instant gate passes and skip waiting fees.</p>
                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 group">
                  Go to Security Hub <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-800 flex flex-col justify-between">
                <div className="p-4 bg-emerald-600 text-white rounded-2xl w-fit mb-6">
                  <Activity size={20} />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Real-time Pollution Map</h4>
                <p className="text-xs font-bold text-slate-500 mb-6">Check the society air quality and noise levels from the sensor dashboard.</p>
                <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 group">
                  Explore Sensors <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Issue Tracker</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 px-4 py-1 bg-slate-100 dark:bg-slate-800 rounded-full w-fit">Admins will be notified</p>
                </div>
                <button onClick={() => setShowReportModal(false)} className="p-3 text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
              </div>

              <form onSubmit={handleReportIssue} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Issue Title</label>
                  <input
                    value={reportData.title}
                    onChange={(e) => setReportData({ ...reportData, title: e.target.value })}
                    placeholder="Short summary of the problem"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Priority Level</label>
                  <div className="flex gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                    {['Low', 'Medium', 'High'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setReportData({ ...reportData, priority: p })}
                        className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${reportData.priority === p ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >{p}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Description</label>
                  <textarea
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    placeholder="Tell us exactly what happened..."
                    rows="4"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-3xl border-none focus:ring-2 focus:ring-indigo-500 font-bold dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-5 mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70' : ''}`}
                >
                  {isSubmitting ? 'Syncing...' : 'Dispatch Report'} <Send size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Help;
