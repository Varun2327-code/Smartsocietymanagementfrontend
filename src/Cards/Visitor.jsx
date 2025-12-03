import React, { useState, useMemo } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from '../hooks/useFirestore';
import useUserRole from '../hooks/useUserRole';

const Visitor = () => {
  const { role, loading: roleLoading } = useUserRole();

  const visitorsQueryBuilder = useMemo(
    () => (colRef) => {
      if (!auth.currentUser) return null;
      if (role === 'admin' || role === 'security') {
        return query(colRef, orderBy('timestamp', 'desc'));
      }
      // resident
      return query(colRef, where('submittedBy', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));
    },
    [role]
  );

  const { data: visitors, loading: visitorsLoading } = useCollection('visitors', { queryBuilder: visitorsQueryBuilder });

  const [visitor, setVisitor] = useState({
    name: '',
    purpose: '',
    flatNumber: '',
    vehicleNumber: '',
  });

  const handleChange = (e) => {
    setVisitor({ ...visitor, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert('Please log in to register a visitor');
      return;
    }
    if (!visitor.name || !visitor.purpose || !visitor.flatNumber) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'visitors'), {
        ...visitor,
        status: 'Entered',
        timestamp: serverTimestamp(),
        submittedBy: auth.currentUser.uid,
      });
      setVisitor({
        name: '',
        purpose: '',
        flatNumber: '',
        vehicleNumber: '',
      });
      alert('Visitor registered successfully');
    } catch (error) {
      console.error('Error adding visitor:', error);
      alert('Failed to register visitor: ' + error.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => (window.location.href = '/')}
        className="mb-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center"
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-center">Visitor Management</h1>

      {/* Visitor Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-6 mb-10 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Visitor Name*"
            value={visitor.name}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-lg w-full"
          />
          <input
            type="text"
            name="flatNumber"
            placeholder="Flat Number*"
            value={visitor.flatNumber}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-lg w-full"
          />
          <input
            type="text"
            name="purpose"
            placeholder="Purpose of Visit*"
            value={visitor.purpose}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-lg w-full"
          />
          <input
            type="text"
            name="vehicleNumber"
            placeholder="Vehicle Number (optional)"
            value={visitor.vehicleNumber}
            onChange={handleChange}
            className="border border-gray-300 p-3 rounded-lg w-full"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Register Visitor
        </button>
      </form>

      {/* Visitor List */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Visitors</h2>
        {visitorsLoading || roleLoading ? (
          <p>Loading...</p>
        ) : visitors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Purpose</th>
                  <th className="px-4 py-2 text-left">Flat Number</th>
                  <th className="px-4 py-2 text-left">Vehicle</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-2">{v.name}</td>
                    <td className="px-4 py-2">{v.purpose}</td>
                    <td className="px-4 py-2">{v.flatNumber}</td>
                    <td className="px-4 py-2">{v.vehicleNumber || '-'}</td>
                    <td className="px-4 py-2">{v.status}</td>
                    <td className="px-4 py-2">{v.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No visitors found.</p>
        )}
      </div>
    </div>
  );
};

export default Visitor;
