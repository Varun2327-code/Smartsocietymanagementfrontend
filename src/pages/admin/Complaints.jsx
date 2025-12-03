import React, { useState, useEffect } from 'react';
import { 
  subscribeToComplaints, 
  updateComplaint 
} from '../../utils/firestoreUtils';

const Complaints = () => {
  const [filter, setFilter] = useState('all');
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time complaints updates
  useEffect(() => {
    const unsubscribe = subscribeToComplaints((complaintsData) => {
      setComplaints(complaintsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredComplaints = filter === 'all' 
    ? complaints 
    : complaints.filter(complaint => complaint.status === filter);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateComplaint(id, { status: newStatus });
      alert(`Complaint ${id} status changed to ${newStatus}`);
    } catch (error) {
      console.error('Error updating complaint status:', error);
      alert('Failed to update complaint status. Please try again.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
        
        {/* Filter buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'pending' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'in-progress' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'resolved' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{complaints.length}</div>
          <div className="text-sm text-gray-600">Total Complaints</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{complaints.filter(c => c.status === 'pending').length}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-sm p-4 border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{complaints.filter(c => c.status === 'in-progress').length}</div>
          <div className="text-sm text-blue-600">In Progress</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-600">{complaints.filter(c => c.status === 'resolved').length}</div>
          <div className="text-sm text-green-600">Resolved</div>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{complaint.title}</div>
                    <div className="text-sm text-gray-500">{complaint.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.submittedBy}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.submittedAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {complaint.status !== 'resolved' && (
                      <div className="flex space-x-2">
                        {complaint.status === 'pending' && (
                          <button
                            onClick={() => handleStatusChange(complaint.id, 'in-progress')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Start Progress
                          </button>
                        )}
                        {complaint.status === 'in-progress' && (
                          <button
                            onClick={() => handleStatusChange(complaint.id, 'resolved')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Mark Resolved
                          </button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900">
                          View Details
                        </button>
                      </div>
                    )}
                    {complaint.status === 'resolved' && (
                      <span className="text-gray-500">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Complaints;
