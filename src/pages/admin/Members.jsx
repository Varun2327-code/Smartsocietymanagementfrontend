// src/pages/Members.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useForm
} from '../../hooks/useFirestore'; // keep your existing hooks
import LoadingSpinner, { CardSkeleton } from '../../components/LoadingSpinner';
import { memberValidationSchema } from '../../utils/validationUtils';

/**
 * Clean Admin Panel - Members management
 * - Drawer for add/edit
 * - Modal for details
 * - Bulk actions, export CSV/JSON
 * - Pagination, search, filter, sort
 *
 * Requirements: tailwindcss + framer-motion + react-hot-toast
 */

const PAGE_SIZE = 8;

const Members = () => {
  // Firestore CRUD hooks
  const { data: members = [], loading: membersLoading, error: membersError } = useCollection('members');
  const { addDocument: addMember, loading: addLoading } = useAddDocument('members');
  const { updateDocument: updateMember, loading: updateLoading } = useUpdateDocument('members');
  const { deleteDocument: deleteMember, loading: deleteLoading } = useDeleteDocument('members');

  // local UI state
  const [query, setQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [detailMember, setDetailMember] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Add form hook (uses your useForm utility)
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
    const setRoles = new Set((members || []).map(m => m.role || 'member'));
    return Array.from(setRoles);
  }, [members]);

  const statuses = ['active', 'inactive'];

  // filtered and sorted list
  const filtered = useMemo(() => {
    const q = (members || []).filter(m => {
      const matchesQuery = !query ||
        (m.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(query.toLowerCase()) ||
        (m.phone || '').includes(query);
      const matchesRole = !filterRole || m.role === filterRole;
      const matchesStatus = !filterStatus || m.status === filterStatus;
      return matchesQuery && matchesRole && matchesStatus;
    }).sort((a, b) => {
      if (!a.name || !b.name) return 0;
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

    return q;
  }, [members, query, filterRole, filterStatus, sortAsc]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // helpers
  const toggleSelect = (id) => {
    setSelected(prev => {
      const cl = new Set(prev);
      if (cl.has(id)) cl.delete(id); else cl.add(id);
      return cl;
    });
  };

  const selectAllOnPage = () => {
    const ids = pageItems.map(it => it.id);
    setSelected(prev => {
      const cl = new Set(prev);
      let allSelected = ids.every(id => cl.has(id));
      if (allSelected) {
        ids.forEach(id => cl.delete(id));
      } else {
        ids.forEach(id => cl.add(id));
      }
      return cl;
    });
  };

  const clearSelected = () => setSelected(new Set());

  // add member
  const handleAddMember = async () => {
    const { isValid } = validateAddForm();
    if (!isValid) return toast.error('Please fix validation errors.');
    try {
      await addMember(formData);
      toast.success('Member added');
      resetForm();
      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add member');
    }
  };

  // edit member — open drawer with pre-filled fields
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
    if (!isValid) return toast.error('Please fix validation errors.');
    try {
      await updateMember(editingMember.id, editFormData);
      toast.success('Member updated');
      setEditingMember(null);
      setDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update member');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete member? This action cannot be undone.')) return;
    try {
      await deleteMember(id);
      toast.success('Member removed');
      setSelected(prev => {
        const cl = new Set(prev);
        cl.delete(id);
        return cl;
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete member');
    }
  };

  // bulk delete / status change
  const handleBulkDelete = async () => {
    if (selected.size === 0) return toast('No members selected');
    if (!confirm(`Delete ${selected.size} members?`)) return;
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selected).map(id => deleteMember(id));
      await Promise.all(promises);
      toast.success('Selected members deleted');
      clearSelected();
    } catch (err) {
      console.error(err);
      toast.error('Bulk delete failed');
    } finally { setBulkActionLoading(false); }
  };

  const handleBulkStatusChange = async (status) => {
    if (selected.size === 0) return toast('No members selected');
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selected).map(id => updateMember(id, { status }));
      await Promise.all(promises);
      toast.success(`Status updated to ${status}`);
      clearSelected();
    } catch (err) {
      console.error(err);
      toast.error('Bulk update failed');
    } finally { setBulkActionLoading(false); }
  };

  // exports
  const exportCSV = () => {
    const header = ['Name', 'Email', 'Phone', 'Unit', 'RoomNo', 'Role', 'Status'];
    const rows = (filtered || []).map(m => [
      m.name, m.email, m.phone, m.unit, m.roomNo || '', m.role, m.status
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `members_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `members_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  // UI skeleton while loading
  if (membersLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="h-8 w-1/4 bg-gray-100 rounded mb-3" />
          <p className="text-sm text-gray-500">Loading members...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-red-600 mb-4">Failed to load members: {membersError.message || 'Unknown'}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded">Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Members Management</h1>
          <p className="text-sm text-gray-500">Manage residents, roles and statuses.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border rounded px-3 py-2">
            <label htmlFor="search" className="sr-only">Search</label>
            <input id="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name, email, phone..."
              className="outline-none text-sm w-56"
            />
            {query && <button onClick={() => setQuery('')} className="text-sm px-2 text-gray-400">Clear</button>}
          </div>

          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
            className="border px-3 py-2 rounded text-sm bg-white">
            <option value="">All roles</option>
            {roles.map(r => <option value={r} key={r}>{r}</option>)}
          </select>

          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="border px-3 py-2 rounded text-sm bg-white">
            <option value="">All status</option>
            {statuses.map(s => <option value={s} key={s}>{s}</option>)}
          </select>

          <button onClick={() => setSortAsc(s => !s)} className="px-3 py-2 bg-white border rounded text-sm">
            Sort {sortAsc ? 'A→Z' : 'Z→A'}
          </button>

          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="px-3 py-2 bg-white border rounded text-sm">Export CSV</button>
            <button onClick={exportJSON} className="px-3 py-2 bg-white border rounded text-sm">Export JSON</button>
            <button onClick={() => setDrawerOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">Add Member</button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">{filtered.length} results</label>
          <div className="text-sm">
            <button onClick={selectAllOnPage} className="px-2 py-1 bg-gray-50 border rounded">Select page</button>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-yellow-700">{selected.size} selected</span>
              <button onClick={() => handleBulkStatusChange('active')} disabled={bulkActionLoading} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Active</button>
              <button onClick={() => handleBulkStatusChange('inactive')} disabled={bulkActionLoading} className="px-2 py-1 bg-yellow-600 text-white rounded text-sm">Inactive</button>
              <button onClick={handleBulkDelete} disabled={bulkActionLoading} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
              <button onClick={clearSelected} className="px-2 py-1 bg-gray-100 rounded text-sm">Clear</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 border rounded">Prev</button>
          <span className="text-sm">Page {page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 border rounded">Next</button>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white border rounded shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Select</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">No members found.</td>
                </tr>
              ) : (
                pageItems.map(member => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" aria-label={`select-${member.id}`} checked={selected.has(member.id)} onChange={() => toggleSelect(member.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-semibold">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{member.name}</div>
                          <div className="text-xs text-gray-500 hidden sm:block">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{member.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${member.role === 'admin' ? 'bg-red-100 text-red-700' : member.role === 'security' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setDetailMember(member)} className="text-sm text-indigo-600">View</button>
                        <button onClick={() => openEdit(member)} className="text-sm text-yellow-600">Edit</button>
                        <button onClick={() => handleDelete(member.id)} className="text-sm text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Add / Edit */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={() => { setDrawerOpen(false); setEditingMember(null); }} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-1/3 bg-white z-50 shadow-2xl p-6 overflow-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{editingMember ? 'Edit Member' : 'Add Member'}</h3>
                <button onClick={() => { setDrawerOpen(false); setEditingMember(null); }} className="text-gray-500">Close</button>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Full name</label>
                  <input value={editingMember ? editFormData.name : formData.name}
                    onChange={(e) => editingMember ? handleEditChange('name', e.target.value) : handleChange('name', e.target.value)}
                    onBlur={() => editingMember ? handleEditBlur('name') : handleBlur('name')}
                    className={`w-full px-3 py-2 border rounded ${((editingMember ? editErrors.name : errors.name) && (editingMember ? editTouched.name : touched.name)) ? 'border-red-500' : 'border-gray-300'}`} />
                  {((editingMember ? editErrors.name : errors.name) && (editingMember ? editTouched.name : touched.name)) && <p className="text-xs text-red-500 mt-1">{editingMember ? editErrors.name : errors.name}</p>}
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <input value={editingMember ? editFormData.email : formData.email}
                      onChange={(e) => editingMember ? handleEditChange('email', e.target.value) : handleChange('email', e.target.value)}
                      onBlur={() => editingMember ? handleEditBlur('email') : handleBlur('email')}
                      className={`w-full px-3 py-2 border rounded ${((editingMember ? editErrors.email : errors.email) && (editingMember ? editTouched.email : touched.email)) ? 'border-red-500' : 'border-gray-300'}`} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Phone</label>
                    <input value={editingMember ? editFormData.phone : formData.phone}
                      onChange={(e) => editingMember ? handleEditChange('phone', e.target.value) : handleChange('phone', e.target.value)}
                      onBlur={() => editingMember ? handleEditBlur('phone') : handleBlur('phone')}
                      className={`w-full px-3 py-2 border rounded ${((editingMember ? editErrors.phone : errors.phone) && (editingMember ? editTouched.phone : touched.phone)) ? 'border-red-500' : 'border-gray-300'}`} />
                  </div>
                </div>

                {/* Unit / Room */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Unit</label>
                    <input value={editingMember ? editFormData.unit : formData.unit}
                      onChange={(e) => editingMember ? handleEditChange('unit', e.target.value) : handleChange('unit', e.target.value)}
                      className="w-full px-3 py-2 border rounded border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Room No</label>
                    <input value={editingMember ? editFormData.roomNo : formData.roomNo}
                      onChange={(e) => editingMember ? handleEditChange('roomNo', e.target.value) : handleChange('roomNo', e.target.value)}
                      className="w-full px-3 py-2 border rounded border-gray-300" />
                  </div>
                </div>

                {/* Role / Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Role</label>
                    <select value={editingMember ? editFormData.role : formData.role}
                      onChange={(e) => editingMember ? handleEditChange('role', e.target.value) : handleChange('role', e.target.value)}
                      className="w-full px-3 py-2 border rounded border-gray-300">
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="security">Security</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Status</label>
                    <select value={editingMember ? editFormData.status : formData.status}
                      onChange={(e) => editingMember ? handleEditChange('status', e.target.value) : handleChange('status', e.target.value)}
                      className="w-full px-3 py-2 border rounded border-gray-300">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 justify-end mt-4">
                  <button onClick={() => { setDrawerOpen(false); setEditingMember(null); }} className="px-4 py-2 bg-gray-100 rounded">Cancel</button>

                  {editingMember ? (
                    <button onClick={handleUpdateMember} disabled={updateLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">
                      {updateLoading ? <LoadingSpinner size="sm" /> : 'Update Member'}
                    </button>
                  ) : (
                    <button onClick={handleAddMember} disabled={addLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">
                      {addLoading ? <LoadingSpinner size="sm" /> : 'Create Member'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detailMember && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={() => setDetailMember(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="fixed z-50 inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{detailMember.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{detailMember.email}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${detailMember.role === 'admin' ? 'bg-red-100 text-red-700' : detailMember.role === 'security' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{detailMember.role}</span>
                      <span className={`px-2 py-1 rounded text-xs ${detailMember.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{detailMember.status}</span>
                    </div>
                  </div>
                  <button onClick={() => setDetailMember(null)} className="text-gray-500">Close</button>
                </div>

                <div className="mt-4 text-sm text-gray-700">
                  <p><strong>Phone:</strong> {detailMember.phone || '-'}</p>
                  <p><strong>Unit:</strong> {detailMember.unit || '-'}</p>
                  <p><strong>Room No:</strong> {detailMember.roomNo || '-'}</p>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => { openEdit(detailMember); setDetailMember(null); }} className="px-3 py-2 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={() => { handleDelete(detailMember.id); setDetailMember(null); }} className="px-3 py-2 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* small helper */
function getInitials(name = '') {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
}

export default Members;
