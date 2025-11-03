// src/components/GuardShiftStatus.jsx
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import LoadingSpinner from './LoadingSpinner';

const GuardShiftStatus = () => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Demo guards data
  const demoGuards = [
    { name: 'John Smith', shift: 'Day', status: true },
    { name: 'Sarah Johnson', shift: 'Night', status: false },
    { name: 'Mike Davis', shift: 'Day', status: true }
  ];

  // Function to create demo guards
  const createDemoGuards = async () => {
    try {
      const promises = demoGuards.map(guard =>
        addDoc(collection(db, 'guards'), {
          ...guard,
          timestamp: serverTimestamp()
        })
      );
      await Promise.all(promises);
      console.log('Demo guards created successfully');
    } catch (error) {
      console.error('Error creating demo guards:', error);
    }
  };

  useEffect(() => {
    const guardsRef = collection(db, 'guards');
    const unsubscribe = onSnapshot(guardsRef, (snapshot) => {
      let guardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If no guards exist, create demo guards
      if (guardsData.length === 0) {
        createDemoGuards();
        // Note: onSnapshot will trigger again after demo guards are added
        return;
      }

      // Ensure all guards have required fields with defaults
      guardsData = guardsData.map(guard => ({
        ...guard,
        name: guard.name || 'Unknown Guard',
        shift: guard.shift || 'Day',
        status: guard.status !== undefined ? guard.status : false
      }));

      setGuards(guardsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching guards:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Guard Shift Status</h2>
        <LoadingSpinner size="md" className="flex justify-center" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Guard Shift Status</h2>
      {guards.length === 0 ? (
        <p className="text-gray-500">No guards available</p>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {guards.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{guard.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guard.shift}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      guard.status
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {guard.status ? 'On Duty' : 'Off Duty'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GuardShiftStatus;
