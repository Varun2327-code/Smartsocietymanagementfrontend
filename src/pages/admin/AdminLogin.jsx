import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiShield,
  FiArrowRight,
  FiCpu,
  FiActivity,
  FiTerminal
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.role === 'admin') {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminEmail', email);
        toast.success("Admin Session Initialized");
        navigate("/admin");
      } else {
        toast.error("Access Denied: Administrative Privileges Required");
        await auth.signOut();
      }
    } catch (error) {
      toast.error("Authentication Sequence Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Toaster position="top-center" />

      {/* Executive Backdrop - Sharp and Clean */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(244,63,94,0.03),transparent)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[1000px] flex items-stretch p-4"
      >
        {/* Left Side: Admin Terminal Section */}
        <div className="hidden lg:flex flex-1 bg-slate-900 rounded-[3rem] p-12 flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8">
            <FiTerminal className="text-slate-700 text-4xl" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-500/20 mb-10">
              <FiShield className="text-white text-3xl" />
            </div>
            <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tighter">
              Executive <br />
              <span className="text-rose-500">Command Center.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed font-medium">
              High-security gateway for society management and infrastructure control.
            </p>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-4 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <FiCpu className="text-rose-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">System Integrity: 100%</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">2.4ms</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Latency</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white">TLS 1.3</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protocol</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Admin Login Form */}
        <div className="w-full lg:w-[420px] lg:ml-12 flex flex-col justify-center">
          <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-200/50">
            <div className="mb-10 text-center lg:text-left">
              <div className="lg:hidden inline-flex w-12 h-12 bg-rose-500 rounded-xl items-center justify-center text-white mb-6">
                <FiShield size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Admin Override</h1>
              <p className="text-slate-400 text-sm font-medium">Verify administrative credentials to enter.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Admin Registry ID</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium"
                    placeholder="admin@smartsociety.os"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Keycode</label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500 transition-all font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-rose-500/20 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-[10px]">Initialize Admin Session</span>
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col gap-4">
              {/* Dev Credentials info for ease of use during development */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <FiActivity className="text-rose-500" /> System Debug
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Email: <span className="text-slate-900 select-all">admin@smartsociety.dev</span></p>
                <p className="text-[10px] text-slate-500 font-medium">Pass: <span className="text-slate-900 select-all">Admin123!</span></p>
              </div>

              <button
                onClick={() => navigate("/login")}
                className="text-center text-[10px] font-black text-slate-300 hover:text-indigo-600 transition-colors uppercase tracking-[0.3em]"
              >
                Back to Resident Portal
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
