import React, { useState, useEffect } from 'react';
import { addDoc, collection, getDocs, serverTimestamp, updateDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import useUserRole from '../hooks/useUserRole';

const FeedbackBoard = () => {
  const { role } = useUserRole();
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    if (!role || !auth.currentUser) return;
    const fetchEntries = async () => {
      setLoading(true);
      try {
        let q;
        if (role === 'admin' || role === 'security') {
          q = query(collection(db, "complaints"));
        } else {
          q = query(collection(db, "complaints"), where("submittedBy", "==", auth.currentUser.uid));
        }
        const querySnapshot = await getDocs(q);
        const allEntries = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allEntries.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setEntries(allEntries);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchEntries();
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.trim() === '' || description.trim() === '' || category === '' || priority === '') return;

    const entry = {
      title,
      description,
      category,
      priority,
      status: 'pending',
      createdAt: serverTimestamp(),
      submittedBy: auth.currentUser.uid,
    };

    try {
      const docRef = await addDoc(collection(db, "complaints"), entry);
      setEntries(prev => [...prev, { id: docRef.id, ...entry, createdAt: new Date() }]);
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('');
    } catch (error) {
      console.error("Error adding entry:", error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const docRef = doc(db, 'complaints', id);
      await updateDoc(docRef, { status: newStatus });
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
    } catch (err) {
      console.error('Error updating complaint status:', err);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (filter === 'All') return true;
    return entry.status.toLowerCase() === filter.toLowerCase();
  });

  const complaintCategories = ['Water', 'Electricity', 'Security', 'Cleanliness', 'Other'];

  return (
    <div className="bg-gradient-to-tr from-blue-50 to-purple-100 p-4">
      <div className="max-w-3xl mx-auto rounded-xl shadow-lg bg-white/70 backdrop-blur-md border border-white/30 p-4">
        <h1 className="text-2xl font-bold text-center text-blue-700 mb-4">Complaint Desk</h1>
        <p className="text-gray-600 text-sm text-center mb-4">
          Raise your complaint. Admins can approve or reject complaints.
        </p>

        {/* Filter */}
        <div className="flex justify-center gap-2 mb-4">
          {['All', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs rounded-full border ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-600 bg-white'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Form for user to submit complaint */}
        {role === 'resident' && (
          <div className="bg-white/80 rounded-lg p-4 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Submit Complaint</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select Category</option>
                {complaintCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none text-sm"
                rows="3"
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-md text-sm font-medium hover:scale-[1.01] hover:shadow transition"
              >
                Submit Complaint
              </button>
            </form>
          </div>
        )}

        {/* Approved Complaints for Users */}
        {role === 'resident' && (
          <div className="bg-white/80 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Approved Complaints</h2>
            {loading ? (
              <p className="text-center text-gray-500 text-sm">Loading...</p>
            ) : filteredEntries.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">No approved complaints yet.</p>
            ) : (
              <div className="overflow-y-auto max-h-64 pr-2 custom-scroll">
                <ul className="space-y-3">
                  {filteredEntries.map((item) => (
                    <li key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                      <p className="text-gray-800 text-sm font-semibold">Title: {item.title}</p>
                      <p className="text-gray-800 text-sm">Category: {item.category}</p>
                      <p className="text-gray-800 text-sm">Priority: {item.priority}</p>
                      <p className="text-gray-800 text-sm">{item.description}</p>
                      <div className="text-xs flex justify-between text-gray-500 mt-1">
                        <span>Status: <span className="font-semibold text-green-600">{item.status}</span></span>
                        <span>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Complaints List for Admin */}
        {(role === 'admin' || role === 'security') && (
          <div className="bg-white/80 rounded-lg p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Manage Complaints</h2>
            {loading ? (
              <p className="text-center text-gray-500 text-sm">Loading...</p>
            ) : filteredEntries.length === 0 ? (
              <p className="text-center text-gray-500 text-sm">No complaints found.</p>
            ) : (
              <div className="overflow-y-auto max-h-64 pr-2 custom-scroll">
                <ul className="space-y-3">
                  {filteredEntries.map((item) => (
                    <li key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                      <p className="text-gray-800 text-sm font-semibold">Title: {item.title}</p>
                      <p className="text-gray-800 text-sm">Category: {item.category}</p>
                      <p className="text-gray-800 text-sm">Priority: {item.priority}</p>
                      <p className="text-gray-800 text-sm">{item.description}</p>
                      <div className="text-xs flex justify-between text-gray-500 mt-1">
                        <span>Status: <span className="font-semibold text-blue-600">{item.status}</span></span>
                        <span>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Just now'}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        {item.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(item.id, 'approved')}
                              className="text-green-600 hover:text-green-900 text-xs font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusChange(item.id, 'rejected')}
                              className="text-red-600 hover:text-red-900 text-xs font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #6366f1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default FeedbackBoard;
