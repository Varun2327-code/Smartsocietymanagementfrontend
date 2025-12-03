// src/pages/admin/Security.jsx
import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { auth } from '../../firebase';
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useForm
} from '../../hooks/useFirestore';
import useUserRole from '../../hooks/useUserRole';
import LoadingSpinner from '../../components/LoadingSpinner';
import { collection, query as firestoreQuery, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { guardValidationSchema } from '../../utils/validationUtils';

const AdminSecurity = () => {
  const { role, loading: roleLoading } = useUserRole();
  const [activeTab, setActiveTab] = useState('visitors');
  const [showGuardForm, setShowGuardForm] = useState(false);
  const [editingGuard, setEditingGuard] = useState(null);
  const [showAlertForm, setShowAlertForm] = useState(false);

  // Query builders (always passed in)
  const visitorsQB = useMemo(() => (colRef) => firestoreQuery(colRef, firestoreOrderBy('createdAt', 'desc')), []);
  const guardsQB = useMemo(() => (colRef) => firestoreQuery(colRef, firestoreOrderBy('name', 'asc')), []);
  const deliveriesQB = useMemo(() => (colRef) => firestoreQuery(colRef, firestoreOrderBy('timestamp', 'desc')), []);
  const alertsQB = useMemo(() => (colRef) => firestoreQuery(colRef, firestoreOrderBy('timestamp', 'desc')), []);

  const { data: visitors, loading: visitorsLoading } = useCollection('visitors', { queryBuilder: visitorsQB });
  const { data: guards, loading: guardsLoading } = useCollection('guards', { queryBuilder: guardsQB });
  const { data: deliveries, loading: deliveriesLoading } = useCollection('deliveries', { queryBuilder: deliveriesQB });
  const { data: alerts, loading: alertsLoading } = useCollection('alerts', { queryBuilder: alertsQB });

  const { addDocument: addGuard, loading: addGuardLoading } = useAddDocument('guards');
  const { addDocument: addAlert, loading: addAlertLoading } = useAddDocument('alerts');
  const { updateDocument: updateVisitor } = useUpdateDocument('visitors');
  const { updateDocument: updateGuard, loading: updateGuardLoading } = useUpdateDocument('guards');
  const { updateDocument: updateAlert } = useUpdateDocument('alerts');
  const { deleteDocument: deleteGuard } = useDeleteDocument('guards');

  const guardForm = useForm({ name: '', contact: '', shift: 'Day', status: 'Active' }, guardValidationSchema);
  const alertForm = useForm({ message: '', priority: 'Medium', type: 'General' }, {
    message: (v) => (!v ? 'Message required' : null)
  });

  if (roleLoading) return <LoadingSpinner />;
  if (role !== 'admin') return <div className="p-8">Access denied — admin only</div>;

  const handleApproveVisitor = async (id) => {
    try {
      await updateVisitor(id, { status: 'Approved', approvedBy: auth.currentUser?.uid });
      toast.success('Visitor approved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve');
    }
  };

  const handleRejectVisitor = async (id) => {
    try {
      await updateVisitor(id, { status: 'Rejected', rejectedBy: auth.currentUser?.uid });
      toast.success('Visitor rejected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject');
    }
  };

  const handleAddGuard = async () => {
    const v = guardForm.validateForm();
    if (!v.isValid) return toast.error('Please fix guard form');

    try {
      await addGuard(guardForm.formData);
      guardForm.resetForm();
      setShowGuardForm(false);
      toast.success('Guard added');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add guard');
    }
  };

  const handleUpdateGuard = async () => {
    const v = guardForm.validateForm();
    if (!v.isValid) return toast.error('Please fix guard form');
    try {
      await updateGuard(editingGuard.id, guardForm.formData);
      guardForm.resetForm();
      setEditingGuard(null);
      setShowGuardForm(false);
      toast.success('Guard updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update guard');
    }
  };

  const handleDeleteGuard = async (id) => {
    if (!confirm('Delete guard?')) return;
    try {
      await deleteGuard(id);
      toast.success('Guard deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete guard');
    }
  };

  const handleSendAlert = async () => {
    const v = alertForm.validateForm();
    if (!v.isValid) return toast.error('Please write an alert message');
    try {
      await addAlert({
        ...alertForm.formData,
        sentBy: auth.currentUser?.uid,
        status: 'Active',
        timestamp: new Date()
      });
      alertForm.resetForm();
      setShowAlertForm(false);
      toast.success('Alert sent');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send alert');
    }
  };

  const handleResolveAlert = async (id) => {
    try {
      await updateAlert(id, { status: 'Resolved', resolvedBy: auth.currentUser?.uid });
      toast.success('Alert resolved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to resolve alert');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded shadow mb-6">
          <h1 className="text-2xl font-semibold">Security Admin</h1>
          <p className="text-sm text-gray-500">Manage visitors, guards, deliveries and alerts</p>
        </div>

        <div className="bg-white p-6 rounded shadow mb-6">
          <div className="flex space-x-4">
            {[
              { id: 'visitors', label: 'Visitor Approvals' },
              { id: 'guards', label: 'Guard Management' },
              { id: 'deliveries', label: 'Delivery Logs' },
              { id: 'alerts', label: 'Security Alerts' }
            ].map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded ${activeTab === t.id ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          {activeTab === 'visitors' && (
            <>
              <h2 className="text-lg font-medium mb-4">Visitor Approvals</h2>
              {visitorsLoading ? <LoadingSpinner /> : (
                <table className="min-w-full">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Purpose</th>
                      <th className="px-3 py-2">Flat</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map(v => (
                      <tr key={v.id} className="border-t">
                        <td className="px-3 py-2">{v.name}</td>
                        <td className="px-3 py-2">{v.purpose}</td>
                        <td className="px-3 py-2">{v.flatNumber}</td>
                        <td className="px-3 py-2">{v.status}</td>
                        <td className="px-3 py-2 space-x-2">
                          {v.status === 'Entered' && (
                            <>
                              <button onClick={() => handleApproveVisitor(v.id)} className="text-green-600">Approve</button>
                              <button onClick={() => handleRejectVisitor(v.id)} className="text-red-600">Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'guards' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Guard Management</h2>
                <button onClick={() => { setShowGuardForm(true); setEditingGuard(null); guardForm.resetForm(); }} className="px-3 py-1 bg-blue-600 text-white rounded">Add Guard</button>
              </div>

              {guardsLoading ? <LoadingSpinner /> : (
                <table className="min-w-full">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Contact</th>
                      <th className="px-3 py-2">Shift</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guards.map(g => (
                      <tr key={g.id} className="border-t">
                        <td className="px-3 py-2">{g.name}</td>
                        <td className="px-3 py-2">{g.contact}</td>
                        <td className="px-3 py-2">{g.shift}</td>
                        <td className="px-3 py-2">{g.status}</td>
                        <td className="px-3 py-2 space-x-2">
                          <button onClick={() => { setEditingGuard(g); guardForm.setFormData(g); setShowGuardForm(true); }} className="text-blue-600">Edit</button>
                          <button onClick={() => handleDeleteGuard(g.id)} className="text-red-600">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Guard modal */}
              {showGuardForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-5 rounded max-w-md w-full">
                    <h3 className="mb-3">{editingGuard ? 'Edit Guard' : 'Add Guard'}</h3>
                    <div className="space-y-3">
                      <input placeholder="Name" value={guardForm.formData.name} onChange={(e) => guardForm.handleChange('name', e.target.value)} className="w-full border px-3 py-2 rounded" />
                      {guardForm.errors.name && <div className="text-sm text-red-600">{guardForm.errors.name}</div>}
                      <input placeholder="Contact" value={guardForm.formData.contact} onChange={(e) => guardForm.handleChange('contact', e.target.value)} className="w-full border px-3 py-2 rounded" />
                      {guardForm.errors.contact && <div className="text-sm text-red-600">{guardForm.errors.contact}</div>}
                      <select value={guardForm.formData.shift} onChange={(e) => guardForm.handleChange('shift', e.target.value)} className="w-full border px-3 py-2 rounded">
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Split">Split</option>
                      </select>
                      <select value={guardForm.formData.status} onChange={(e) => guardForm.handleChange('status', e.target.value)} className="w-full border px-3 py-2 rounded">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button onClick={() => { setShowGuardForm(false); setEditingGuard(null); guardForm.resetForm(); }} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
                      <button onClick={editingGuard ? handleUpdateGuard : handleAddGuard} disabled={addGuardLoading || updateGuardLoading} className="px-3 py-2 bg-blue-600 text-white rounded">{addGuardLoading || updateGuardLoading ? 'Saving...' : 'Save'}</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'deliveries' && (
            <>
              <h2 className="text-lg font-medium mb-4">Delivery Logs</h2>
              {deliveriesLoading ? <LoadingSpinner /> : (
                <table className="min-w-full">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Recipient</th>
                      <th className="px-3 py-2">Flat</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Guard</th>
                      <th className="px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(d => (
                      <tr key={d.id} className="border-t">
                        <td className="px-3 py-2">{d.recipientName}</td>
                        <td className="px-3 py-2">{d.flatNumber}</td>
                        <td className="px-3 py-2">{d.itemDescription}</td>
                        <td className="px-3 py-2">{d.status}</td>
                        <td className="px-3 py-2">{d.guardId || 'N/A'}</td>
                        <td className="px-3 py-2">{d.timestamp?.toDate ? d.timestamp.toDate().toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {activeTab === 'alerts' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Security Alerts</h2>
                <button onClick={() => setShowAlertForm(true)} className="px-3 py-1 bg-orange-600 text-white rounded">Send Alert</button>
              </div>

              {showAlertForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white p-5 rounded max-w-md w-full">
                    <h3 className="mb-3">Send Alert</h3>
                    <textarea placeholder="Message" value={alertForm.formData.message} onChange={(e) => alertForm.handleChange('message', e.target.value)} className="w-full border px-3 py-2 rounded" rows={4} />
                    <div className="mt-3 flex space-x-2">
                      <select value={alertForm.formData.priority} onChange={(e) => alertForm.handleChange('priority', e.target.value)} className="border px-3 py-2 rounded">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <select value={alertForm.formData.type} onChange={(e) => alertForm.handleChange('type', e.target.value)} className="border px-3 py-2 rounded">
                        <option value="General">General</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Security">Security</option>
                        <option value="Maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button onClick={() => setShowAlertForm(false)} className="px-3 py-2 bg-gray-100 rounded">Cancel</button>
                      <button onClick={handleSendAlert} disabled={addAlertLoading} className="px-3 py-2 bg-orange-600 text-white rounded">{addAlertLoading ? 'Sending...' : 'Send'}</button>
                    </div>
                  </div>
                </div>
              )}

              {alertsLoading ? <LoadingSpinner /> : (
                <div className="space-y-3">
                  {alerts.map(a => (
                    <div key={a.id} className={`p-3 border rounded ${a.priority === 'Critical' || a.priority === 'High' ? 'bg-red-50 border-red-200' : ''}`}>
                      <div className="flex justify-between">
                        <div>
                          <div className="font-medium">{a.message}</div>
                          <div className="text-xs text-gray-500">Type: {a.type} • {a.timestamp?.toDate ? a.timestamp.toDate().toLocaleString() : '-'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{a.priority}</div>
                          {a.status === 'Active' && <button onClick={() => handleResolveAlert(a.id)} className="text-green-600 text-sm">Resolve</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
