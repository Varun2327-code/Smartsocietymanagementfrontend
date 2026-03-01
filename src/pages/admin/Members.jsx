import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Upload,
  Mail,
  Phone,
  Home,
  User,
  Info,
  Shield,
  Activity,
  Zap,
  Users,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useForm
} from '../../hooks/useFirestore';
import useUserRole from '../../hooks/useUserRole';
import LoadingSpinner, { CardSkeleton } from '../../components/LoadingSpinner';
import { memberValidationSchema } from '../../utils/validationUtils';

const PAGE_SIZE = 12;

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const Members = () => {
  // Firestore CRUD hooks
  const { role, loading: roleLoading } = useUserRole();
  const queryBuilder = useMemo(() => (colRef) => {
    if (role !== 'admin') return null;
    return colRef;
  }, [role]);

  const { data: members = [], loading: membersLoading } = useCollection('members', { queryBuilder });
  const { addDocument: addMember, loading: addLoading } = useAddDocument('members');
  const { updateDocument: updateMember, loading: updateLoading } = useUpdateDocument('members');
  const { deleteDocument: deleteMember, loading: deleteLoading } = useDeleteDocument('members');

  // local UI state
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [detailMember, setDetailMember] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef(null);

  // Add form hook
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm: validateAddForm,
    resetForm
  } = useForm({
    name: '',
    email: '',
    phone: '',
    unit: '',
    roomNo: '',
    role: 'member',
    status: 'active'
  }, memberValidationSchema);

  // Edit form hook
  const {
    formData: editFormData,
    errors: editErrors,
    touched: editTouched,
    handleChange: handleEditChange,
    handleBlur: handleEditBlur,
    validateForm: validateEditForm,
    setFormData: setEditFormData
  } = useForm({
    name: '',
    email: '',
    phone: '',
    unit: '',
    roomNo: '',
    role: 'member',
    status: 'active'
  }, memberValidationSchema);

  // derived roles & statuses
  const roles = useMemo(() => {
    const r = new Set((members || []).map(m => m.role).filter(Boolean));
    return Array.from(r).sort();
  }, [members]);

  // filtered and sorted list
  const filtered = useMemo(() => {
    let result = (members || []).filter(m => {
      const q = query.toLowerCase();
      const matchesQuery = !query ||
        (m.name || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q) ||
        (m.phone || '').includes(q) ||
        (m.unit || '').toLowerCase().includes(q);
      const matchesRole = !filterRole || m.role === filterRole;
      const matchesStatus = !filterStatus || m.status === filterStatus;
      return matchesQuery && matchesRole && matchesStatus;
    });

    result.sort((a, b) => {
      const valA = (a[sortField] || '').toString().toLowerCase();
      const valB = (b[sortField] || '').toString().toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [members, query, filterRole, filterStatus, sortField, sortAsc]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages || 1); }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // helpers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pageItems.length && pageItems.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageItems.map(m => m.id)));
    }
  };

  const clearSelected = () => setSelected(new Set());

  // CRUD actions
  const handleAddMember = async () => {
    const { isValid } = validateAddForm();
    if (!isValid) return toast.error('Check Protocol Constraints.');
    const loadingToast = toast.loading("Registering identity node...");
    try {
      await addMember({ ...formData, createdAt: new Date() });
      toast.success('Identity Materialized', { id: loadingToast });
      resetForm();
      setDrawerOpen(false);
    } catch (err) {
      toast.error('Materialization Failed', { id: loadingToast });
    }
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setEditFormData({
      name: member.name || '',
      email: member.email || '',
      phone: member.phone || '',
      unit: member.unit || '',
      roomNo: member.roomNo || '',
      role: member.role || 'member',
      status: member.status || 'active'
    });
    setDrawerOpen(true);
  };

  const handleUpdateMember = async () => {
    const { isValid } = validateEditForm();
    if (!isValid) return toast.error('Check Protocol Constraints.');
    const loadingToast = toast.loading("Reconfiguring identity node...");
    try {
      await updateMember(editingMember.id, editFormData);
      toast.success('Node Reconfigured', { id: loadingToast });
      setEditingMember(null);
      setDrawerOpen(false);
    } catch (err) {
      toast.error('Reconfiguration Failed', { id: loadingToast });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Purge this identity node from matrix?')) return;
    try {
      await deleteMember(id);
      toast.success('Node Purged');
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      toast.error('Purge Failed');
    }
  };

  const handleBulkStatus = async (status) => {
    if (selected.size === 0) return;
    setBulkActionLoading(true);
    const loadingToast = toast.loading(`Transitioning ${selected.size} nodes to ${status}...`);
    try {
      await Promise.all(Array.from(selected).map(id => updateMember(id, { status })));
      toast.success(`Transition Synchronized`, { id: loadingToast });
      clearSelected();
    } catch (err) {
      toast.error('Sync Handshake Failed', { id: loadingToast });
    } finally { setBulkActionLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0 || !window.confirm(`Purge ${selected.size} nodes from matrix?`)) return;
    setBulkActionLoading(true);
    const loadingToast = toast.loading(`Purging selection...`);
    try {
      await Promise.all(Array.from(selected).map(id => deleteMember(id)));
      toast.success('Matrix Cleansed', { id: loadingToast });
      clearSelected();
    } catch (err) {
      toast.error('Cleansing Aborted', { id: loadingToast });
    } finally { setBulkActionLoading(false); }
  };

  // Export/Import
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Unit', 'Room', 'Role', 'Status'];
    const rows = filtered.map(m => [
      m.name, m.email, m.phone, m.unit, m.roomNo || '', m.role, m.status
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `matrix_export_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const newMembers = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const member = {};
        headers.forEach((h, i) => {
          if (h === 'name') member.name = values[i];
          if (h === 'email') member.email = values[i];
          if (h === 'phone') member.phone = values[i];
          if (h === 'unit') member.unit = values[i];
          if (h === 'room' || h === 'roomno') member.roomNo = values[i];
          if (h === 'role') member.role = values[i] || 'member';
          if (h === 'status') member.status = values[i] || 'active';
        });
        return member;
      });

      setBulkActionLoading(true);
      const loadingToast = toast.loading(`Importing ${newMembers.length} nodes...`);
      try {
        await Promise.all(newMembers.map(m => addMember({ ...m, createdAt: new Date() })));
        toast.success(`Import Synchronized`, { id: loadingToast });
        setShowImportModal(false);
      } catch (err) {
        toast.error('Import Handshake Failed', { id: loadingToast });
      } finally {
        setBulkActionLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const loading = membersLoading || roleLoading;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] p-12 space-y-12 animate-pulse">
      <div className="h-12 w-64 bg-slate-200 rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-slate-100 rounded-[3rem]" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 h-80 bg-slate-100 rounded-[3rem]" />
        <div className="h-80 bg-slate-100 rounded-[3rem]" />
      </div>
    </div>
  );

  if (role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-rose-100 text-center max-w-lg">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-rose-500">
            <Shield size={40} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 uppercase italic">Access Denied</h1>
          <p className="text-slate-500 font-bold text-sm leading-relaxed">
            Your current clearance level does not authorize access to the Identity Matrix.
            Please contact the Central Command if this is an error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header Nexus */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transition-transform hover:scale-110">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                  Identity <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Matrix</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">High-Clearance Citizen Nexus</p>
              </div>
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowImportModal(true)}
              className="group p-4 bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 rounded-2xl shadow-sm transition-all hover:shadow-lg active:scale-95"
              title="Import Matrix"
            >
              <Upload size={20} />
            </button>
            <button
              onClick={exportCSV}
              className="group p-4 bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 rounded-2xl shadow-sm transition-all hover:shadow-lg active:scale-95"
              title="Export Matrix"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
              Register Node
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-12">
        {/* Tactical Intel Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { label: 'Total Citizens', val: members.length, sub: 'Global Pop', icon: <Users />, color: 'indigo' },
            { label: 'Active Access', val: members.filter(m => m.status === 'active').length, sub: 'Authorized', icon: <CheckCircle />, color: 'emerald' },
            { label: 'Admin Staff', val: members.filter(m => m.role === 'admin').length, sub: 'High Clearance', icon: <Shield />, color: 'rose' },
            { label: 'Security Force', val: members.filter(m => m.role === 'security').length, sub: 'Tactical Units', icon: <Zap />, color: 'amber' }
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">{s.sub}</div>
              </div>
              <div>
                <div className="text-4xl font-black text-slate-900 mb-1 italic">{s.val}</div>
                <div className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tactical Search Nexus */}
        <div className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Identify subject by name, unit, or signal..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="w-full pl-16 pr-8 py-6 bg-slate-50 border-none rounded-[2.5rem] text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterRole}
              onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
              className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">All Clearances</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-white border border-slate-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 focus:ring-4 focus:ring-indigo-50 transition-all outline-none appearance-none cursor-pointer"
            >
              <option value="">All States</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="flex items-center gap-3 px-8 py-4 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              <Activity size={14} /> {sortAsc ? 'ASC' : 'DESC'}
            </button>
          </div>
        </div>

        {/* Bulk Action Pulse */}
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className="bg-indigo-600 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-indigo-200"
            >
              <div className="flex items-center gap-6 text-white ml-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black text-lg italic">
                  {selected.size}
                </div>
                <div>
                  <span className="font-black uppercase tracking-[0.2em] text-xs italic opacity-80">Bulk Protocol.</span>
                  <p className="text-sm font-bold opacity-100 italic">Nodes selected for modification matrix</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mr-4">
                <button onClick={() => handleBulkStatus('active')} disabled={bulkActionLoading} className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-indigo-600 transition-all italic">
                  Activate Access
                </button>
                <button onClick={() => handleBulkStatus('inactive')} disabled={bulkActionLoading} className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-amber-600 transition-all italic">
                  Suspend Access
                </button>
                <button onClick={handleBulkDelete} disabled={bulkActionLoading} className="px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-all italic">
                  Purge Matrix
                </button>
                <button onClick={clearSelected} className="p-3 text-white/50 hover:text-white transition-all">
                  <X size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Identity Grid Matrix */}
        <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden mb-20 relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/30">
                  <th className="px-10 py-8">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                      checked={selected.size === pageItems.length && pageItems.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject Identity</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Signal Vector</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Residency Node</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clearance</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">State</th>
                  <th className="px-10 py-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Ops</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-10 py-32 text-center">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                        <Users size={48} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2 italic">Null Identity Buffer</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Zero subject signals detected in this sector.</p>
                    </td>
                  </tr>
                ) : (
                  pageItems.map((member, idx) => (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-indigo-50/20 transition-all group"
                    >
                      <td className="px-10 py-8">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                          checked={selected.has(member.id)}
                          onChange={() => toggleSelect(member.id)}
                        />
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-lg italic shadow-xl shadow-slate-200 group-hover:bg-indigo-600 transition-all">
                              {getInitials(member.name)}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-4 border-white rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'} shadow-sm`} />
                          </div>
                          <div>
                            <div className="text-lg font-black text-slate-900 italic group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{member.name}</div>
                            <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic mt-0.5">ID: {member.id.substring(0, 12)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <Mail size={12} className="text-slate-300 group-hover:text-indigo-600 transition-colors" /> {member.email}
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <Phone size={12} className="text-slate-300 group-hover:text-indigo-600 transition-colors" /> {member.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3 text-xs font-black text-slate-900 italic group-hover:text-indigo-600 transition-colors uppercase">
                          <MapPin size={14} className="text-slate-300" />
                          Unit {member.unit} <ChevronRight size={10} className="text-slate-300" /> {member.roomNo || 'CORE'}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic ${member.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-sm shadow-rose-50' :
                          member.role === 'security' ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm shadow-blue-50' :
                            'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-50'
                          }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest italic ${member.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          <Activity size={10} className={member.status === 'active' ? 'animate-pulse' : ''} />
                          {member.status === 'active' ? 'Operational' : 'Restricted'}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => setDetailMember(member)} className="p-3 bg-white text-slate-400 hover:text-indigo-600 border border-slate-50 rounded-xl shadow-sm hover:shadow-lg transition-all" title="Inspect Node">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => openEdit(member)} className="p-3 bg-white text-slate-400 hover:text-amber-600 border border-slate-50 rounded-xl shadow-sm hover:shadow-lg transition-all" title="Modify Node">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(member.id)} className="p-3 bg-white text-slate-400 hover:text-rose-600 border border-slate-50 rounded-xl shadow-sm hover:shadow-lg transition-all" title="Purge Node">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Pulse */}
          <div className="bg-slate-50/50 px-10 py-8 flex items-center justify-between border-t border-slate-50">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
              Showing <span className="text-slate-900">{pageItems.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}</span> - <span className="text-slate-900">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of <span className="text-slate-900">{filtered.length}</span> Citizen Slots
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl disabled:opacity-30 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${page === i + 1 ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 italic' : 'bg-white text-slate-400 border border-slate-100 hover:text-indigo-600'}`}
                >
                  {(i + 1).toString().padStart(2, '0')}
                </button>
              )).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-4 bg-white text-slate-400 border border-slate-100 rounded-2xl disabled:opacity-30 hover:text-indigo-600 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logic Drawer Nexus */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setDrawerOpen(false); setEditingMember(null); }} />

            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white z-[110] shadow-2xl flex flex-col pt-12"
            >
              <div className="px-12 flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">{editingMember ? 'Modify Subject.' : 'New Subject.'}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Append new identity node into the core matrix</p>
                </div>
                <button
                  onClick={() => { setDrawerOpen(false); setEditingMember(null); }}
                  className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-[1.5rem] transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-12 space-y-10 pb-12">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 italic ml-4">
                    <User size={14} /> Personal Vector
                  </h4>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Identifier Alias</label>
                    <input
                      type="text"
                      value={editingMember ? editFormData.name : formData.name}
                      onChange={(e) => editingMember ? handleEditChange('name', e.target.value) : handleChange('name', e.target.value)}
                      placeholder="Subject Identity Full Name"
                      className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                    />
                    {((editingMember ? editErrors.name : errors.name) && (editingMember ? editTouched.name : touched.name)) && <p className="text-[10px] text-rose-500 font-black ml-4 uppercase tracking-widest italic">{editingMember ? editErrors.name : errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Signal Vector (Email)</label>
                      <input
                        type="email"
                        value={editingMember ? editFormData.email : formData.email}
                        onChange={(e) => editingMember ? handleEditChange('email', e.target.value) : handleChange('email', e.target.value)}
                        placeholder="identity@nexus.sh"
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Comms Vector (Phone)</label>
                      <input
                        type="text"
                        value={editingMember ? editFormData.phone : formData.phone}
                        onChange={(e) => editingMember ? handleEditChange('phone', e.target.value) : handleChange('phone', e.target.value)}
                        placeholder="+91 [000-000-0000]"
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 italic ml-4">
                    <Home size={14} /> Residency Coordinates
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Sector Node (Unit)</label>
                      <input
                        type="text"
                        value={editingMember ? editFormData.unit : formData.unit}
                        onChange={(e) => editingMember ? handleEditChange('unit', e.target.value) : handleChange('unit', e.target.value)}
                        placeholder="e.g. ALPHA-Sector"
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Local Core (Room)</label>
                      <input
                        type="text"
                        value={editingMember ? editFormData.roomNo : formData.roomNo}
                        onChange={(e) => editingMember ? handleEditChange('roomNo', e.target.value) : handleChange('roomNo', e.target.value)}
                        placeholder="e.g. CORE-101"
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2 italic ml-4">
                    <Shield size={14} /> Protocol Access
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Clearance Level</label>
                      <select
                        value={editingMember ? editFormData.role : formData.role}
                        onChange={(e) => editingMember ? handleEditChange('role', e.target.value) : handleChange('role', e.target.value)}
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="member">Tier 1: Member</option>
                        <option value="admin">Tier 10: Administrator</option>
                        <option value="security">Tier 5: Security staff</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-4 text-xs italic">Node State</label>
                      <select
                        value={editingMember ? editFormData.status : formData.status}
                        onChange={(e) => editingMember ? handleEditChange('status', e.target.value) : handleChange('status', e.target.value)}
                        className="w-full px-8 py-5 bg-slate-50 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 font-black text-sm transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="active">Operational: Active</option>
                        <option value="inactive">Suspended: Static</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12 pt-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => { setDrawerOpen(false); setEditingMember(null); }}
                  className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 transition-all italic"
                >
                  Abort Protocol
                </button>
                <button
                  onClick={editingMember ? handleUpdateMember : handleAddMember}
                  disabled={addLoading || updateLoading}
                  className="group flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {(addLoading || updateLoading) ? <LoadingSpinner size="sm" /> : editingMember ? 'Commit Node Changes' : 'Execute Registration'}
                  <Zap size={18} className="group-hover:animate-pulse" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deep Inspection Nexus */}
      <AnimatePresence>
        {detailMember && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setDetailMember(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden p-12 border border-white/20"
            >
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-10">
                  <div className="w-32 h-32 rounded-[3.5rem] bg-slate-900 flex items-center justify-center text-white text-5xl font-black italic shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
                    {getInitials(detailMember.name)}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter uppercase">{detailMember.name}</h3>
                    <div className="flex gap-4">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic ${detailMember.role === 'admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>T-{detailMember.role === 'admin' ? '10' : detailMember.role === 'security' ? '05' : '01'} {detailMember.role}</span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic ${detailMember.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{detailMember.status === 'active' ? 'Operational' : 'Restricted'}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDetailMember(null)} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-900 rounded-[2rem] transition-all">
                  <X size={32} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 bg-slate-50/50 rounded-[3.5rem] p-10 border border-slate-100 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-600 via-transparent to-transparent pointer-events-none" />
                <div className="space-y-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Signal Identifier</p>
                    <p className="text-sm font-bold text-slate-800 break-words">{detailMember.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Comms Protocol</p>
                    <p className="text-sm font-bold text-slate-800">{detailMember.phone}</p>
                  </div>
                </div>
                <div className="space-y-6 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Space Allocation</p>
                    <p className="text-sm font-bold text-slate-800 uppercase italic">Sector {detailMember.unit} | {detailMember.roomNo || 'CORE'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Materialization Vector</p>
                    <p className="text-sm font-bold text-slate-800 uppercase italic">{detailMember.createdAt?.toDate ? detailMember.createdAt.toDate().toLocaleDateString() : 'Historical Node'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex gap-6">
                <button
                  onClick={() => { openEdit(detailMember); setDetailMember(null); }}
                  className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group"
                >
                  <Edit2 size={20} className="group-hover:rotate-12 transition-transform" /> Reconfigure Node
                </button>
                <button
                  onClick={() => { handleDelete(detailMember.id); setDetailMember(null); }}
                  className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm"
                >
                  <Trash2 size={32} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal Nexus */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowImportModal(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-[3.5rem] p-12 border border-slate-100"
            >
              <div className="text-center space-y-4 mb-10">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Upload size={32} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Batch Upload.</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">System expects CSV format with headers: <br /><span className="text-indigo-600">Name, Email, Phone, Unit, Room, Role, Status</span></p>
              </div>

              <div className="space-y-6">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300 font-black uppercase tracking-[0.2em] hover:border-indigo-200 hover:text-indigo-400 transition-all group relative overflow-hidden flex flex-col items-center gap-3"
                >
                  <div className="absolute inset-0 bg-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Plus size={32} className="relative z-10" />
                  <span className="relative z-10">Inject Node Data</span>
                </button>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-slate-900 transition-all italic"
                >
                  Abort Protocol
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Members;
