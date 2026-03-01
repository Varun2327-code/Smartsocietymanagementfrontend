import React, { useState, useMemo } from 'react';
import { auth } from '../firebase';
import { query, where, orderBy } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import useUserRole from '../hooks/useUserRole';
import {
  addVisitor,
  updateVisitorStatus,
  deleteVisitor,
  validateVisitorForm
} from '../utils/firestoreUtils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUserPlus,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiSearch,
  FiPhone,
  FiMapPin,
  FiTruck,
  FiLogOut,
  FiTrash2,
  FiMoreVertical,
  FiShare2
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Visitor = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('active'); // active, history, register
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Firestore Data Fetching
  const visitorsQueryBuilder = useMemo(
    () => (colRef) => {
      if (!auth.currentUser) return null;
      if (role === 'admin' || role === 'security') {
        return query(colRef, orderBy('timestamp', 'desc'));
      }
      return query(colRef, where('submittedBy', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));
    },
    [role]
  );

  const { data: visitors, loading: visitorsLoading } = useCollection('visitors', { queryBuilder: visitorsQueryBuilder });

  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    flatNumber: '',
    vehicleNumber: '',
    phone: '',
    type: 'Regular', // Regular, Delivery, Guest
    status: 'Expected'
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateVisitorForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      // If resident submits, status is 'Expected'. If security submits, status is 'Checked In'
      const finalStatus = (role === 'security' || role === 'admin') ? 'Checked In' : 'Expected';

      await addVisitor({
        ...formData,
        status: finalStatus,
        submittedBy: auth.currentUser.uid,
        submittedByName: auth.currentUser.displayName || auth.currentUser.email
      });

      toast.success(finalStatus === 'Expected' ? 'Visitor pass generated successfully' : 'Visitor checked in successfully');
      setFormData({
        name: '', purpose: '', flatNumber: '', vehicleNumber: '', phone: '', type: 'Regular'
      });
      setIsFormOpen(false);
      setActiveTab(finalStatus === 'Expected' ? 'history' : 'active');
    } catch (error) {
      toast.error('Failed to register visitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateVisitorStatus(id, newStatus);
      toast.success(`Visitor ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this visitor record?')) {
      try {
        await deleteVisitor(id);
        toast.success('Record deleted');
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      'Expected': { color: 'amber', icon: FiClock, label: 'Expected' },
      'Checked In': { color: 'green', icon: FiCheckCircle, label: 'On Site' },
      'Checked Out': { color: 'slate', icon: FiLogOut, label: 'Departed' },
      'Rejected': { color: 'red', icon: FiXCircle, label: 'Denied' }
    };
    return configs[status] || { color: 'slate', icon: FiClock, label: status };
  };

  const filteredVisitors = useMemo(() => {
    if (!visitors) return [];
    return visitors.filter(v => {
      const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.flatNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      if (activeTab === 'active') return matchesSearch && v.status === 'Checked In';
      if (activeTab === 'history') return matchesSearch && (v.status !== 'Checked In');
      return matchesSearch;
    });
  }, [visitors, searchTerm, activeTab]);

  if (roleLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Premium Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary transition-all shadow-sm"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  SafeEntry Hub <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">Secure</span>
                </h1>
                <p className="text-slate-500 font-medium">Verify and track society visits effectively</p>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 hover:shadow-xl hover:translate-y-[-2px] transition-all"
            >
              {isFormOpen ? <FiXCircle /> : <FiUserPlus />}
              {isFormOpen ? 'Cancel Entry' : 'New Visitor Access'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10">
        {/* Registration Portal */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-indigo-600 px-10 py-8 text-white">
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <FiUserPlus /> Entry Authorization Portal
                  </h2>
                  <p className="opacity-80 font-medium">Provide visitor details for digital pass generation</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Visitor Core Info */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiUsers className="text-primary" /> Core Information
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="Visitor Full Name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`w-full p-4 rounded-2xl border-2 transition-all outline-none font-bold ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary focus:bg-white'}`}
                      />
                      <input
                        type="text"
                        name="phone"
                        placeholder="Contact Number (10 digit)"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full p-4 rounded-2xl border-2 transition-all outline-none font-bold ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary focus:bg-white'}`}
                      />
                    </div>

                    {/* Visit Context */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiMapPin className="text-primary" /> Visit Context
                      </label>
                      <input
                        type="text"
                        name="flatNumber"
                        placeholder="Destination Flat/Unit"
                        value={formData.flatNumber}
                        onChange={handleInputChange}
                        className={`w-full p-4 rounded-2xl border-2 transition-all outline-none font-bold ${errors.flatNumber ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary focus:bg-white'}`}
                      />
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all outline-none font-bold"
                      >
                        <option value="Regular">Regular Guest</option>
                        <option value="Delivery">Delivery / Logistics</option>
                        <option value="Service">Home Service / Maintenance</option>
                        <option value="Emergency">Emergency Access</option>
                      </select>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FiTruck className="text-primary" /> Logistics
                      </label>
                      <input
                        type="text"
                        name="purpose"
                        placeholder="Reason for Visit"
                        value={formData.purpose}
                        onChange={handleInputChange}
                        className={`w-full p-4 rounded-2xl border-2 transition-all outline-none font-bold ${errors.purpose ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50 focus:border-primary focus:bg-white'}`}
                      />
                      <input
                        type="text"
                        name="vehicleNumber"
                        placeholder="Vehicle Number (Optional)"
                        value={formData.vehicleNumber}
                        onChange={handleInputChange}
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all outline-none font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                    ) : (
                      <>
                        <FiCheckCircle />
                        {(role === 'security' || role === 'admin') ? 'Confirm Immediate Check-In' : 'Issue Expected Visitor Pass'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit backdrop-blur-xl">
            {[
              { id: 'active', label: 'On-Site', icon: FiUsers },
              { id: 'history', label: 'Logbook', icon: FiClock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1 w-full group">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search visitor or flat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3.5 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Visitor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {visitorsLoading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-8 h-64 animate-pulse">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl"></div>
                    <div className="w-24 h-6 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="w-2/3 h-6 bg-slate-100 rounded-lg"></div>
                    <div className="w-1/2 h-4 bg-slate-100 rounded-lg"></div>
                  </div>
                </div>
              ))
            ) : filteredVisitors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-40 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100"
              >
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiUsers className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Clear Records</h3>
                <p className="text-slate-500 font-medium italic">No entries found for this category</p>
              </motion.div>
            ) : (
              filteredVisitors.map((v) => {
                const config = getStatusConfig(v.status);
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    layout
                    key={v.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group overflow-hidden"
                  >
                    {/* Status Ribbon */}
                    <div className={`px-8 py-3 bg-${config.color}-50 flex items-center justify-between border-b border-${config.color}-100/50`}>
                      <span className={`flex items-center gap-1.5 text-${config.color}-600 text-xs font-black uppercase tracking-widest`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {config.label}
                      </span>
                      {v.type && (
                        <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                          {v.type}
                        </span>
                      )}
                    </div>

                    <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary text-2xl font-black">
                          {v.name?.charAt(0)}
                        </div>
                        <div className="flex gap-2">
                          {v.phone && (
                            <a href={`tel:${v.phone}`} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-green-600 hover:bg-green-50 transition-all">
                              <FiPhone />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{v.name}</h3>
                        <p className="text-slate-400 font-bold text-sm tracking-wide">Visiting Flat: {v.flatNumber}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl mb-8">
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Purpose</p>
                          <p className="text-xs font-bold text-slate-700 truncate">{v.purpose}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Vehicle</p>
                          <p className="text-xs font-bold text-slate-700">{v.vehicleNumber || 'No Vehicle'}</p>
                        </div>
                      </div>

                      {/* Dynamic Action Buttons */}
                      <div className="flex gap-4">
                        {(role === 'security' || role === 'admin') && v.status === 'Expected' && (
                          <button
                            onClick={() => handleStatusUpdate(v.id, 'Checked In')}
                            className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                          >
                            <FiCheckCircle /> Allow Entry
                          </button>
                        )}
                        {(role === 'security' || role === 'admin') && v.status === 'Checked In' && (
                          <button
                            onClick={() => handleStatusUpdate(v.id, 'Checked Out')}
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition-all"
                          >
                            <FiLogOut /> Check-Out
                          </button>
                        )}
                        {v.status === 'Expected' && (
                          <button className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all">
                            <FiShare2 /> Share Pass
                          </button>
                        )}
                        {v.status === 'Checked Out' && (
                          <div className="flex-1 py-3 text-center text-[10px] font-black italic text-slate-400 uppercase">
                            Session Completed at {v.checkOutTime?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Visitor;
