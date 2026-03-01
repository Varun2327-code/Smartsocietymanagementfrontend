import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Activity, Zap, Command, Fingerprint, Search, Cpu } from 'lucide-react';

const LoadingScreen = () => {
  const [step, setStep] = useState(0);
  const loadingSteps = [
    { text: "Nexus Core Initialization", icon: <Cpu size={20} /> },
    { text: "Quantum Handshake Secure", icon: <Lock size={20} /> },
    { text: "Bio-Metric Signature Verification", icon: <Fingerprint size={20} /> },
    { text: "Society Matrix Synchronization", icon: <Command size={20} /> },
    { text: "Global Asset Indexing", icon: <Search size={20} /> },
    { text: "High-Clearance Access Granted", icon: <Shield size={20} /> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFEFE] font-['Plus_Jakarta_Sans',sans-serif] overflow-hidden relative">
      {/* Dynamic Tactical Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-100/20 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/20 rounded-full blur-[160px] animate-pulse" />

      {/* Main Protocol Interface */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-16">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-48 h-48 bg-white/80 backdrop-blur-3xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(99,102,241,0.2)] flex items-center justify-center border-4 border-white overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-28 h-28 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 opacity-20" />
              <Shield className="text-white relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" size={56} />
            </div>

            {/* Tactical Scanner Beam */}
            <motion.div
              animate={{ top: ['-20%', '120%', '-20%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent z-20 blur-[1px]"
            />
          </motion.div>

          {/* Satellite Orbit Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-dashed border-indigo-100/50 rounded-full animate-[spin_20s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-purple-100/30 rounded-full animate-ping opacity-10" />
        </div>

        {/* Narrative Signal */}
        <div className="text-center px-6">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4 italic">
            Nexus <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 text-5xl">Pulse</span>
          </h1>

          <div className="relative h-12 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex items-center gap-4 text-indigo-600 font-black text-[12px] uppercase tracking-[0.4em] italic"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shadow-sm">
                  {loadingSteps[step].icon}
                </div>
                {loadingSteps[step].text}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Modular Progress Hub */}
        <div className="mt-16 relative w-80">
          <div className="h-2 bg-slate-100 rounded-full border border-white shadow-inner overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] rounded-full animate-[gradient_2s_linear_infinite]"
              style={{
                backgroundImage: 'linear-gradient(90deg, #6366f1, #a855f7, #6366f1)'
              }}
            />
          </div>
          <div className="flex justify-between mt-4 px-2">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Syncing Sector 7</span>
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest italic">Protocol 4.0.1</span>
          </div>
        </div>
      </div>

      {/* Security Disclaimer Footnote */}
      <p className="absolute bottom-12 text-slate-300 text-[9px] font-black uppercase tracking-[0.5em] italic flex items-center gap-3">
        <Lock size={12} className="text-indigo-200" /> Fully Encrypted Signal Via Society Matrix Nexus
      </p>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradient {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}} />
    </div>
  );
};

export default LoadingScreen;
