import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords don't match");
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: formData.fullName.trim(),
        email: formData.email.toLowerCase(),
        createdAt: serverTimestamp(),
        role: 'resident',
        status: 'active'
      });

      await sendEmailVerification(user);
      toast.success('Registration path sent to email.');
      setTimeout(() => navigate("/dashboard"), 2000);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Toaster position="top-right" />

      {/* Radiant Background Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-[3rem] p-10 shadow-2xl shadow-indigo-100/20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-600/20 mb-6 font-bold text-white text-3xl">
              <FiCheckCircle />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Quick Join</h1>
            <p className="text-slate-500 text-sm font-medium">Join the society network in seconds.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity (Name)</label>
              <div className="relative group">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Network Identity (Email)</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  placeholder="name@gmail.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Key</label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"><FiEye /></button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Verify Key</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-slate-900 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 mt-6 transition-all"
            >
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <><span className="uppercase tracking-widest text-xs">Join Network</span><FiArrowRight /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-sm font-medium">
            Already verified?
            <button onClick={() => navigate("/login")} className="text-indigo-600 font-black hover:text-indigo-700 uppercase tracking-widest text-xs ml-2">Sign In</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
