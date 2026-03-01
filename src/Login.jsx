import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiZap,
  FiCheckCircle,
  FiHome,
  FiCalendar,
  FiTool,
  FiAlertCircle,
  FiUsers
} from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { toast, Toaster } from "react-hot-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let userRole = 'resident';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData?.role === 'user' ? 'resident' : userData?.role || 'resident';
      }

      toast.success("Welcome back!", { icon: '👋' });
      if (userRole === 'admin') navigate("/admin/dashboard");
      else navigate("/dashboard");
    } catch (error) {
      toast.error("Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
          role: 'resident',
          status: 'active',
          createdAt: serverTimestamp()
        });
      }
      toast.success("Logged in with Google!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Google login failed.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return toast.error("Please enter your email");
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Reset link sent!");
      setShowResetModal(false);
    } catch (error) {
      toast.error("Failed to send reset link.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Toaster position="top-center" />

      {/* Soft Luminous Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[1100px] flex items-stretch p-4 lg:p-0"
      >
        {/* Left Side: Smart Society Intelligence */}
        <div className="hidden lg:flex flex-1 bg-white border border-slate-200 rounded-[3.5rem] p-12 flex-col justify-between shadow-sm relative overflow-hidden group font-['Plus_Jakarta_Sans',sans-serif]">
          {/* Decorative Society Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 h-full flex flex-col">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-2xl mb-8 w-fit"
            >
              <FiHome className="text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Smart Square Residency v2</span>
            </motion.div>

            <h2 className="text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
              Your Society, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Perfectly Automated.</span>
            </h2>

            {/* Premium Visual Overlay */}
            <div className="relative flex-1 mt-4 mb-8 rounded-[2.5rem] overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000"
                alt="Modern Society"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex flex-col justify-end p-8">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-white text-xl font-black mb-2 italic">"Efficiency is the key to community harmony."</p>
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-400" />
                    <span className="text-white/80 text-[10px] font-black uppercase tracking-widest">Enterprise Grade OS</span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] transition-all hover:border-indigo-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scale</h4>
                <p className="text-2xl font-black text-slate-900 leading-none">1,200+</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase mt-2">Active Units</p>
              </div>
              <div className="p-6 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-500/20 text-white flex flex-col justify-between cursor-pointer active:scale-95 transition-all" onClick={() => navigate('/register')}>
                <div className="flex justify-between items-start">
                  <FiZap size={20} className="text-indigo-200" />
                  <FiArrowRight />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">New Complex?</h4>
                  <p className="text-xs font-black uppercase tracking-tighter">Create Your Society</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[450px] lg:ml-12">
          <div className="bg-white/80 backdrop-blur-xl border border-white lg:border-none shadow-xl lg:shadow-none rounded-[3rem] p-8 lg:p-0 flex flex-col justify-center h-full">
            <div className="mb-10 text-center lg:text-left">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4 block">
                Secure Authentication
              </span>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h1>
              <p className="text-slate-400 font-medium">Please enter your credentials to continue.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Identity</label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
                    placeholder="name@society.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Key</label>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium"
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
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 group transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-xs">Authorize</span>
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-8 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <span className="relative bg-[#f8fafc] lg:bg-white px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Fast Connect</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-slate-200 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <FcGoogle size={20} />
              <span className="text-sm">Sign in with Google</span>
            </button>

            <p className="mt-8 text-center text-slate-400 text-sm font-medium">
              New identity? {" "}
              <button
                onClick={() => navigate("/register")}
                className="text-indigo-600 font-black hover:text-indigo-700 transition-colors uppercase tracking-widest text-xs ml-1"
              >
                Create Account
              </button>
            </p>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <button
                onClick={() => navigate("/admin-login")}
                className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]"
              >
                <FiShield className="text-xs" />
                Administrative Access Only
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modern Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-2xl font-black text-slate-900 mb-2">Reset Key</h3>
              <p className="text-slate-500 text-sm mb-6 font-medium">We'll send a recovery link to your inbox.</p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                  placeholder="name@email.com"
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {resetLoading ? "Processing..." : "Continue"}
                  </button>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;