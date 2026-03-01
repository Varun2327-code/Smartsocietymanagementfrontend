import React, { useMemo, useEffect } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useCollection, useAddDocument } from '../hooks/useFirestore';
import useUserRole from '../hooks/useUserRole';
import LoadingSpinner from './LoadingSpinner';
import { motion } from 'framer-motion';
import { FiShield, FiClock, FiActivity, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GuardShiftStatus = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { data: guards, loading: guardsLoading } = useCollection('guards');
  const { addDocument: addGuard } = useAddDocument('guards');

  // Demo guards data
  const demoGuards = [
    { name: 'John Smith', shift: 'Day', status: true },
    { name: 'Sarah Johnson', shift: 'Night', status: false },
    { name: 'Mike Davis', shift: 'Day', status: true }
  ];

  const createDemoGuards = async () => {
    if (role !== 'admin') return;

    try {
      const promises = demoGuards.map(guard =>
        addGuard({
          ...guard,
          timestamp: serverTimestamp()
        })
      );
      await Promise.all(promises);
      toast.success('Security matrix initialized with demo data');
    } catch (error) {
      console.error('Error creating demo guards:', error);
      // We don't toast error here to avoid spamming residents if permissions fail
    }
  };

  // Logic to handle empty state
  useEffect(() => {
    if (!roleLoading && !guardsLoading && guards && guards.length === 0 && role === 'admin') {
      createDemoGuards();
    }
  }, [role, roleLoading, guardsLoading, guards]); // Added guards to dependency array

  const loading = roleLoading || guardsLoading;

  if (loading) {
    return (
      <div className="bg-white/40 backdrop-blur-xl border border-white/20 p-8 rounded-[32px] shadow-sm">
        <div className="h-8 w-48 bg-slate-100 rounded-xl mb-6 animate-pulse" />
        <LoadingSpinner size="md" className="flex justify-center py-10" />
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-100 p-8 rounded-[40px] shadow-2xl shadow-slate-200/40">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FiShield className="text-indigo-600" />
            Active Security Grid
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Sentinel Status</p>
        </div>
        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          {guards.filter(g => g.status).length} On Duty
        </div>
      </div>

      {guards.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[30px] border border-dashed border-slate-200">
          <FiUser size={48} className="mx-auto text-slate-200" />
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest italic">No sentinels active on grid.</p>
          {role === 'admin' && (
            <button
              onClick={createDemoGuards}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase"
            >
              Seed Data
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {guards.map((guard, idx) => (
            <motion.div
              key={guard.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group p-5 bg-white border border-slate-50 rounded-[24px] hover:shadow-xl hover:shadow-indigo-50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${guard.status ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                  {guard.name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{guard.name || 'Unknown Guard'}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                    <FiClock size={10} /> {guard.shift || 'Day'} Protocol
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${guard.status
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-slate-50 text-slate-400 border-slate-100'
                } `}>
                <FiActivity size={10} className={guard.status ? 'animate-pulse' : ''} />
                {guard.status ? 'In Field' : 'Off Rotation'}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardShiftStatus;
