import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiMail,
  FiPhone,
  FiHome,
  FiLock,
  FiArrowRight,
  FiArrowLeft,
  FiCheck,
  FiActivity,
  FiSmartphone,
  FiLayout
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    wing: "",
    apartment: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      if (!formData.name || !formData.email || !formData.mobile) {
        toast.error("Please fill personal details");
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.wing || !formData.apartment) {
        toast.error("Society info required");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords mismatch!");
    }
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: user.email,
        mobile: formData.mobile,
        wing: formData.wing,
        apartment: formData.apartment,
        createdAt: serverTimestamp(),
        role: "resident", // Standard role
        status: 'active'
      });

      toast.success("Identity Created!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Owner", icon: FiUser },
    { id: 2, title: "Unit", icon: FiHome },
    { id: 3, title: "Secure", icon: FiLock }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-10 font-['Plus_Jakarta_Sans',sans-serif]">
      <Toaster position="top-right" />

      <div className="hidden lg:block absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_10%_10%,rgba(99,102,241,0.03),transparent)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[1240px] flex gap-8 bg-white/50 backdrop-blur-3xl border border-white rounded-[4rem] p-6 shadow-2xl relative z-10"
      >
        {/* Left Side: Visual Experience */}
        <div className="hidden lg:flex flex-1 bg-slate-900 rounded-[3.5rem] relative overflow-hidden p-12 flex-col justify-between group">
          {/* High-Impact Image Backdrop */}
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000"
            alt="Futuristic Building"
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl mb-8">
              <FiLayout className="text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Digital Infrastructure</span>
            </div>
            <h2 className="text-5xl font-black text-white leading-tight mb-6">
              Build Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Digital Life.</span>
            </h2>
            <p className="text-slate-300 font-medium text-lg max-w-sm">Every great community starts with a single connection. Join thousands of smart residents.</p>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="p-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl">
              <p className="text-2xl font-black text-white">4.9/5</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Resident Rating</p>
            </div>
            <div className="p-6 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
              <p className="text-2xl font-black text-white">Fast</p>
              <p className="text-[10px] text-indigo-200 font-bold uppercase mt-1 tracking-widest">Auto-Onboarding</p>
            </div>
          </div>
        </div>

        {/* Right Side: Step Wizard */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center max-w-2xl mx-auto">
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter italic">Create Identity.</h1>
            <p className="text-slate-400 font-medium">Stage {step} of 3 • Authentication Wizard</p>
          </div>

          {/* Stepper Wizard Indicator */}
          <div className="flex justify-between items-center mb-16 relative">
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2" />
            <motion.div
              className="absolute top-1/2 left-0 h-[2px] bg-indigo-600 -translate-y-1/2"
              animate={{ width: `${(step - 1) * 50}%` }}
              transition={{ type: "spring", stiffness: 100 }}
            />
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-3 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${step >= s.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 rotate-12' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {step > s.id ? <FiCheck size={20} /> : <s.icon size={20} />}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleRegister} className="flex-1 overflow-visible">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proprietor Name</label>
                    <div className="relative group">
                      <FiUser className="absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 pl-14 text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-600/20 transition-all font-bold"
                        placeholder="Johnathan Doe"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600/20 transition-all font-bold"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Comm</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600/20 transition-all font-bold"
                        placeholder="+91 00000 00000"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 bg-indigo-50 rounded-[2rem] flex items-center gap-4 mb-4 border border-indigo-100">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <FiHome size={20} />
                    </div>
                    <div>
                      <p className="text-indigo-900 font-black text-sm uppercase italic">Geo-Spatial Locality</p>
                      <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">Pinpoint your residence in the grid</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Complex Sector</label>
                      <select name="wing" value={formData.wing} onChange={handleInputChange} className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 text-slate-900 font-bold focus:outline-none focus:bg-white focus:border-indigo-600/20 appearance-none outline-none">
                        <option value="">Select Wing</option>
                        {['A', 'B', 'C', 'D'].map(w => <option key={w} value={w}>Wing {w}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Offset</label>
                      <input type="text" name="apartment" value={formData.apartment} onChange={handleInputChange} className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600/20 font-black" placeholder="Flat No. (X-00)" required />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Master Access Key</label>
                    <div className="relative group">
                      <FiLock className="absolute left-5 top-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 pl-14 pr-14 text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600/20 transition-all font-mono"
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-5 text-slate-300 hover:text-slate-900 active:scale-90 transition-all"><FiEye /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duplicate Verification</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 text-slate-900 placeholder-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600/20 transition-all font-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-12 flex gap-4">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="px-8 py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-[10px] transition-all"><FiArrowLeft size={18} /></button>
              )}
              <button
                type={step < 3 ? "button" : "submit"}
                onClick={step < 3 ? nextStep : undefined}
                disabled={loading}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-3xl shadow-xl shadow-slate-900/10 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 group"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : <>{step < 3 ? "Next Stage" : "Finalize Protocol"} <FiArrowRight className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Already verified?
            <button onClick={() => navigate("/login")} className="text-indigo-600 ml-2 hover:underline transition-all">Login Identity</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
