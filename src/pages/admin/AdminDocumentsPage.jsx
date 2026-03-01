import React, { useState, useEffect } from 'react';
import { getAllDocuments, updateDocument } from '../../utils/firestoreUtils';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText, FiFilter, FiCheckCircle, FiXCircle,
  FiEye, FiClock, FiSearch, FiRefreshCw, FiExternalLink,
  FiAlertTriangle, FiArrowRight, FiShield, FiInbox,
  FiChevronDown, FiHash, FiCalendar, FiUser
} from 'react-icons/fi';

import useUserRole from '../../hooks/useUserRole';

const AdminDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const { role, loading: roleLoading } = useUserRole();
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [filters, setFilters] = useState({
    documentType: '',
    status: '',
    resident: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expiring: 0
  });

  useEffect(() => {
    if (role === 'admin') fetchDocuments();
  }, [role]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await getAllDocuments();
      setDocuments(docs);
      calculateStats(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load identity grid');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (docs) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    setStats({
      total: docs.length,
      pending: docs.filter(d => d.status === 'pending').length,
      approved: docs.filter(d => d.status === 'approved').length,
      rejected: docs.filter(d => d.status === 'rejected').length,
      expiring: docs.filter(d => d.expiryDate && new Date(d.expiryDate) > today && new Date(d.expiryDate) <= thirtyDaysFromNow).length
    });
  };

  useEffect(() => {
    let filtered = documents;

    if (filters.documentType) {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }
    if (filters.status) {
      filtered = filtered.filter(doc => doc.status === filters.status);
    }
    if (filters.resident) {
      filtered = filtered.filter(doc =>
        doc.userEmail?.toLowerCase().includes(filters.resident.toLowerCase()) ||
        doc.fullName?.toLowerCase().includes(filters.resident.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, filters]);

  const handleApprove = async (docId) => {
    setActionLoading(true);
    try {
      await updateDocument(docId, {
        status: 'approved',
        reviewedAt: new Date(),
        approverId: 'admin' // In a real app, this would be the logged-in admin's ID
      });
      toast.success('Certificate Authenticated');
      setDocuments(docs => docs.map(d =>
        d.id === docId ? { ...d, status: 'approved', reviewedAt: new Date() } : d
      ));
      setModalOpen(false);
    } catch (error) {
      toast.error('Authentication Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (docId) => {
    if (!rejectReason.trim()) return toast.error('Exclusion reason required');
    setActionLoading(true);
    try {
      await updateDocument(docId, {
        status: 'rejected',
        rejectReason: rejectReason.trim(),
        reviewedAt: new Date()
      });
      toast.error('Document Flagged for Correction');
      setDocuments(docs => docs.map(d =>
        d.id === docId ? { ...d, status: 'rejected', rejectReason: rejectReason.trim(), reviewedAt: new Date() } : d
      ));
      setModalOpen(false);
      setRejectReason('');
    } catch (error) {
      toast.error('Operation Failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] p-6 lg:p-12 overflow-x-hidden">
      <Toaster position="top-right" />

      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl mb-4">
              <FiShield className="text-indigo-600" />
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Security Registry</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none mb-3">
              Identity <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 italic">Grid.</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg">Central verification hub for resident infrastructure.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4"
          >
            <button
              onClick={fetchDocuments}
              className="p-5 bg-white border border-slate-100 rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group active:scale-95"
            >
              <FiRefreshCw className={`text-xl group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="px-8 py-5 bg-slate-900 rounded-[2.5rem] flex items-center gap-4 text-white shadow-2xl shadow-slate-900/20">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <FiInbox className="text-xl" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Pipeline</p>
                <p className="text-xl font-black">{stats.total} Assets</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Pending Review', value: stats.pending, icon: FiClock, color: 'text-amber-500', bg: 'bg-amber-50', borderColor: 'border-amber-100' },
            { label: 'Authorized', value: stats.approved, icon: FiCheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', borderColor: 'border-emerald-100' },
            { label: 'Exclusions', value: stats.rejected, icon: FiXCircle, color: 'text-rose-500', bg: 'bg-rose-50', borderColor: 'border-rose-100' },
            { label: 'Expiring Soon', value: stats.expiring, icon: FiAlertTriangle, color: 'text-indigo-500', bg: 'bg-indigo-50', borderColor: 'border-indigo-100' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700`} />
              <div className="relative z-10 flex items-center gap-5">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:rotate-12`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logic Grid: Filters + Table */}
        <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[3.5rem] shadow-2xl shadow-indigo-100/30 overflow-hidden">
          {/* Filter Bar */}
          <div className="p-8 border-b border-slate-100 flex flex-wrap gap-6 items-center">
            <div className="flex-1 min-w-[280px] relative group">
              <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by Identity or Asset No..."
                className="w-full bg-slate-50 border border-transparent rounded-[1.5rem] p-5 pl-16 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-100 transition-all font-bold"
                onChange={(e) => setFilters(f => ({ ...f, resident: e.target.value }))}
              />
            </div>

            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-slate-50 border border-transparent rounded-2xl px-6 py-4 pr-12 font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                  onChange={(e) => setFilters(f => ({ ...f, documentType: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Rent Agreement">Rent Agreement</option>
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  className="appearance-none bg-slate-50 border border-transparent rounded-2xl px-6 py-4 pr-12 font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all cursor-pointer"
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="">Security Level</option>
                  <option value="pending">Pending Review</option>
                  <option value="approved">Verified</option>
                  <option value="rejected">Flagged</option>
                </select>
                <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table Surface */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Identification</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Proprietor</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registry Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filteredDocuments.map((doc, idx) => (
                    <motion.tr
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-all cursor-default"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform ${doc.status === 'rejected' ? 'text-rose-500' : 'text-indigo-600'}`}>
                            <FiFileText size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 tracking-tight leading-none mb-1">{doc.fileName || 'Registry Asset'}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: {doc.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <p className="font-bold text-slate-700 text-sm leading-none mb-1">{doc.fullName || 'Anonymous User'}</p>
                          <p className="text-[11px] text-slate-400 font-medium leading-none">{doc.userEmail}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                          <FiClock size={14} />
                          <span>{doc.createdAt?.toDate ? doc.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(doc.status)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse bg-current`} />
                          {doc.status}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => { setSelectedDocument(doc); setModalOpen(true); }}
                          className="px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:-translate-y-1 active:scale-95 transition-all shadow-sm"
                        >
                          Review Asset
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filteredDocuments.length === 0 && (
              <div className="p-24 text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <FiInbox size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Registry Silent.</h3>
                <p className="text-slate-400 font-medium">No assets matching the current security query were found.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {modalOpen && selectedDocument && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-[1100px] h-[90vh] bg-white rounded-[4rem] shadow-2xl relative z-10 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 lg:p-12 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center text-indigo-600 border border-slate-100">
                    <FiFileText size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Asset Analysis.</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Protocol Reference: {selectedDocument.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-14 h-14 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all hover:rotate-90"
                >
                  <FiXCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Left: Metadata */}
                  <div className="space-y-10">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-4 h-[2px] bg-indigo-600 rounded-full" />
                        Core Metadata
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <FiUser className="text-indigo-600 mb-3" size={20} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Proprietor</p>
                          <p className="font-bold text-slate-900">{selectedDocument.fullName || 'N/A'}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <FiHash className="text-indigo-600 mb-3" size={20} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Document No</p>
                          <p className="font-bold text-slate-900">{selectedDocument.panNumber || selectedDocument.aadhaarNumber || selectedDocument.passportNumber || 'N/A'}</p>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <FiCalendar className="text-indigo-600 mb-3" size={20} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Expiry Date</p>
                          <p className="font-bold text-slate-900">{selectedDocument.expiryDate ? new Date(selectedDocument.expiryDate).toLocaleDateString() : 'Non-Expiring'}</p>
                        </div>
                        <div className={`p-6 rounded-[2rem] border ${getStatusStyle(selectedDocument.status)}`}>
                          <FiShield className="mb-3" size={20} />
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Status</p>
                          <p className="font-black uppercase tracking-widest text-xs">{selectedDocument.status}</p>
                        </div>
                      </div>
                    </div>

                    {selectedDocument.description && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Registry Notes</h4>
                        <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                          <p className="text-slate-600 font-medium italic leading-relaxed">"{selectedDocument.description}"</p>
                        </div>
                      </div>
                    )}

                    {selectedDocument.status === 'pending' && (
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Protocol Correction</h4>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/5 focus:border-rose-200 transition-all font-bold min-h-[120px]"
                          placeholder="Enter detailed reason for flagging this asset..."
                        />
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleReject(selectedDocument.id)}
                            disabled={actionLoading}
                            className="flex-1 py-5 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-xl shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {actionLoading ? 'Flagging...' : 'Flag & Reject Asset'}
                          </button>
                          <button
                            onClick={() => handleApprove(selectedDocument.id)}
                            disabled={actionLoading}
                            className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {actionLoading ? 'Authenticating...' : 'Validate & Authorize'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Preview */}
                  <div className="relative h-full flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                      Asset Visualization
                      {selectedDocument.fileURL && (
                        <a href={selectedDocument.fileURL} target="_blank" rel="noreferrer" className="text-indigo-600 flex items-center gap-2 hover:underline">
                          Full Screen <FiExternalLink />
                        </a>
                      )}
                    </h4>

                    <div className="flex-1 bg-slate-100 rounded-[3rem] border border-slate-200 overflow-hidden relative group">
                      {selectedDocument.fileURL ? (
                        <iframe
                          src={selectedDocument.fileURL}
                          className="w-full h-full border-none"
                          title="Asset Preview"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                          <FiEye size={48} className="mb-4 opacity-20" />
                          <p className="font-black text-lg text-slate-900 mb-2 italic">Visual Ghost.</p>
                          <p className="text-sm font-medium">This asset exists as metadata only or the visual payload failed to load.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDocumentsPage;
