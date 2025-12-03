// src/Cards/Security.jsx
import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { auth, db } from '../firebase';
import { collection, query as firestoreQuery, where as firestoreWhere, orderBy as firestoreOrderBy } from 'firebase/firestore';
import { useCollection, useAddDocument, useForm } from '../hooks/useFirestore';
import useUserRole from '../hooks/useUserRole';
import LoadingSpinner from '../components/LoadingSpinner';
import { visitorValidationSchema, deliveryValidationSchema } from '../utils/validationUtils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const Security = () => {
  const [activeTab, setActiveTab] = useState('visitors');
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const { role, loading: roleLoading } = useUserRole();

  // Query builders (always passed into hook — stable via useMemo)
  const visitorsQueryBuilder = useMemo(
    () => (colRef) => {
      // residents should only see their own visitors (security/admin see all)
      if (!auth.currentUser) return null;
      if (role === 'admin' || role === 'security') {
        return firestoreQuery(colRef, firestoreOrderBy('createdAt', 'desc'));
      }
      // resident
      return firestoreQuery(colRef, firestoreWhere('submittedBy', '==', auth.currentUser.uid), firestoreOrderBy('createdAt', 'desc'));
    },
    [role]
  );

  const deliveriesQueryBuilder = useMemo(
    () => (colRef) => {
      if (!auth.currentUser) return null;
      if (role === 'admin' || role === 'security') {
        return firestoreQuery(colRef, firestoreOrderBy('timestamp', 'desc'));
      }
      return firestoreQuery(colRef, firestoreWhere('submittedBy', '==', auth.currentUser.uid), firestoreOrderBy('timestamp', 'desc'));
    },
    [role]
  );

  const guardsQueryBuilder = useMemo(
    () => (colRef) => firestoreQuery(colRef, firestoreWhere('status', '==', 'Active')),
    []
  );

  const { data: visitors, loading: visitorsLoading } = useCollection('visitors', { queryBuilder: visitorsQueryBuilder });
  const { data: deliveries, loading: deliveriesLoading } = useCollection('deliveries', { queryBuilder: deliveriesQueryBuilder });
  const { data: guards, loading: guardsLoading } = useCollection('guards', { queryBuilder: guardsQueryBuilder });

  const { addDocument: addVisitor, loading: addVisitorLoading } = useAddDocument('visitors');
  const { addDocument: addDelivery, loading: addDeliveryLoading } = useAddDocument('deliveries');
  const { addDocument: addAlert, loading: addAlertLoading } = useAddDocument('alerts');

  const visitorForm = useForm({ name: '', purpose: '', flatNumber: '', vehicleNumber: '' }, visitorValidationSchema);
  const deliveryForm = useForm({ recipientName: '', flatNumber: '', itemDescription: '', deliveryPerson: '', contactNumber: '' }, deliveryValidationSchema);

  const handleAddVisitor = async () => {
    const v = visitorForm.validateForm();
    if (!v.isValid) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await addVisitor({
        ...visitorForm.formData,
        status: 'Entered',
        submittedBy: auth.currentUser?.uid,
        createdAt: new Date()
      });
      visitorForm.resetForm();
      setShowVisitorForm(false);
      toast.success('Visitor logged');
    } catch (err) {
      console.error(err);
      toast.error('Failed to log visitor');
    }
  };

  const handleAddDelivery = async () => {
    const v = deliveryForm.validateForm();
    if (!v.isValid) {
      toast.error('Please fix form errors');
      return;
    }
    try {
      await addDelivery({
        ...deliveryForm.formData,
        status: 'Pending',
        submittedBy: auth.currentUser?.uid,
        timestamp: new Date()
      });
      deliveryForm.resetForm();
      setShowDeliveryForm(false);
      toast.success('Delivery recorded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to record delivery');
    }
  };

  const handleEmergencyAlert = async () => {
    try {
      await addAlert({
        message: `Emergency triggered by ${auth.currentUser?.uid || 'unknown'}`,
        priority: 'High',
        type: 'Emergency',
        status: 'Active',
        sentBy: auth.currentUser?.uid,
        timestamp: new Date()
      });
      toast.success('Emergency alert sent');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send emergency alert');
    }
  };

  if (roleLoading || visitorsLoading || deliveriesLoading || guardsLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Security</h1>
          <p className="text-sm text-gray-600">Manage visitors, deliveries and see guards on duty</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Visitor Entries</h2>
                <Button onClick={() => setShowVisitorForm(true)}>Log Visitor</Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Purpose</th>
                      <th className="px-3 py-2">Flat</th>
                      <th className="px-3 py-2">Vehicle</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.length ? visitors.map((v) => (
                      <tr key={v.id} className="border-t">
                        <td className="px-3 py-2">{v.name}</td>
                        <td className="px-3 py-2">{v.purpose}</td>
                        <td className="px-3 py-2">{v.flatNumber}</td>
                        <td className="px-3 py-2">{v.vehicleNumber || '-'}</td>
                        <td className="px-3 py-2">{v.status}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="py-6 text-center text-gray-500">No visitors found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Deliveries</h2>
                <Button onClick={() => setShowDeliveryForm(true)} variant="outline">Record Delivery</Button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Recipient</th>
                      <th className="px-3 py-2">Flat</th>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.length ? deliveries.map((d) => (
                      <tr key={d.id} className="border-t">
                        <td className="px-3 py-2">{d.recipientName}</td>
                        <td className="px-3 py-2">{d.flatNumber}</td>
                        <td className="px-3 py-2">{d.itemDescription}</td>
                        <td className="px-3 py-2">{d.status}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="py-6 text-center text-gray-500">No deliveries found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Guards On Duty</h3>
                <span className="text-sm text-gray-500">Live</span>
              </div>
              <ul className="space-y-3">
                {guards.length ? guards.map((g) => (
                  <li key={g.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{g.name}</div>
                      <div className="text-sm text-gray-500">{g.shift}</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">On Duty</div>
                  </li>
                )) : (
                  <li className="text-sm text-gray-500">No guards on duty</li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-medium mb-3">Emergency</h3>
              <p className="text-sm text-gray-600 mb-4">Press to send emergency alert to admin & security</p>
              <Button onClick={handleEmergencyAlert} disabled={addAlertLoading} variant="destructive" className="w-full">
                🚨 PANIC BUTTON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Visitor Modal */}
      {showVisitorForm && (
        <Modal onClose={() => setShowVisitorForm(false)}>
          <h3 className="text-lg font-medium mb-3">Log New Visitor</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleAddVisitor(); }}>
            <div className="space-y-3">
              <Input placeholder="Name" value={visitorForm.formData.name} onChange={(e) => visitorForm.handleChange('name', e.target.value)} />
              {visitorForm.errors.name && <div className="text-sm text-red-600">{visitorForm.errors.name}</div>}
              <Input placeholder="Purpose" value={visitorForm.formData.purpose} onChange={(e) => visitorForm.handleChange('purpose', e.target.value)} />
              {visitorForm.errors.purpose && <div className="text-sm text-red-600">{visitorForm.errors.purpose}</div>}
              <Input placeholder="Flat Number" value={visitorForm.formData.flatNumber} onChange={(e) => visitorForm.handleChange('flatNumber', e.target.value)} />
              {visitorForm.errors.flatNumber && <div className="text-sm text-red-600">{visitorForm.errors.flatNumber}</div>}
              <Input placeholder="Vehicle (optional)" value={visitorForm.formData.vehicleNumber} onChange={(e) => visitorForm.handleChange('vehicleNumber', e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button type="button" onClick={() => setShowVisitorForm(false)} variant="secondary">Cancel</Button>
              <Button type="submit" disabled={addVisitorLoading}>{addVisitorLoading ? 'Logging...' : 'Log Visitor'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delivery Modal */}
      {showDeliveryForm && (
        <Modal onClose={() => setShowDeliveryForm(false)}>
          <h3 className="text-lg font-medium mb-3">Record Delivery</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleAddDelivery(); }}>
            <div className="space-y-3">
              <Input placeholder="Recipient Name" value={deliveryForm.formData.recipientName} onChange={(e) => deliveryForm.handleChange('recipientName', e.target.value)} />
              {deliveryForm.errors.recipientName && <div className="text-sm text-red-600">{deliveryForm.errors.recipientName}</div>}
              <Input placeholder="Flat Number" value={deliveryForm.formData.flatNumber} onChange={(e) => deliveryForm.handleChange('flatNumber', e.target.value)} />
              {deliveryForm.errors.flatNumber && <div className="text-sm text-red-600">{deliveryForm.errors.flatNumber}</div>}
              <Input placeholder="Item Description" value={deliveryForm.formData.itemDescription} onChange={(e) => deliveryForm.handleChange('itemDescription', e.target.value)} />
              {deliveryForm.errors.itemDescription && <div className="text-sm text-red-600">{deliveryForm.errors.itemDescription}</div>}
              <Input placeholder="Delivery Person" value={deliveryForm.formData.deliveryPerson} onChange={(e) => deliveryForm.handleChange('deliveryPerson', e.target.value)} />
              <Input placeholder="Contact Number" value={deliveryForm.formData.contactNumber} onChange={(e) => deliveryForm.handleChange('contactNumber', e.target.value)} />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button type="button" onClick={() => setShowDeliveryForm(false)} variant="secondary">Cancel</Button>
              <Button type="submit" disabled={addDeliveryLoading} variant="default">{addDeliveryLoading ? 'Recording...' : 'Record'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const Modal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg max-w-lg w-full p-5">
      <div className="mb-4 flex justify-end">
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
      </div>
      {children}
    </div>
  </div>
);

export default Security;
