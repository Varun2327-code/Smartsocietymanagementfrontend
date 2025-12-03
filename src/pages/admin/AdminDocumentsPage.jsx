import React, { useState, useEffect } from 'react';
import { getAllDocuments, updateDocument } from '../../utils/firestoreUtils';
import { toast } from 'react-hot-toast';

const AdminDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    documentType: '',
    status: '',
    resident: ''
  });

  // Fetch all documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await getAllDocuments();
        console.log('Fetched documents:', docs);
        setDocuments(docs);
        setFilteredDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Apply filters
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
        doc.userEmail?.toLowerCase().includes(filters.resident.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      documentType: '',
      status: '',
      resident: ''
    });
  };

  const handleViewDetails = (doc) => {
    setSelectedDocument(doc);
    setRejectReason('');
    setModalOpen(true);
  };

  const handleApprove = async (docId) => {
    setActionLoading(true);
    try {
      await updateDocument(docId, { status: 'approved', reviewedAt: new Date() });
      toast.success('Document approved successfully');

      // Update local state
      setDocuments(docs => docs.map(doc =>
        doc.id === docId ? { ...doc, status: 'approved', reviewedAt: new Date() } : doc
      ));
      setModalOpen(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (docId) => {
    if (!rejectReason || rejectReason.trim() === '') {
      toast.error('Please enter a reject reason');
      return;
    }

    setActionLoading(true);
    try {
      await updateDocument(docId, { status: 'rejected', rejectReason: rejectReason.trim(), reviewedAt: new Date() });
      toast.success('Document rejected successfully');

      // Update local state
      setDocuments(docs => docs.map(doc =>
        doc.id === docId ? { ...doc, status: 'rejected', rejectReason: rejectReason.trim(), reviewedAt: new Date() } : doc
      ));
      setModalOpen(false);
      setSelectedDocument(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDocument(null);
    setRejectReason('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const renderDocumentFields = (doc) => {
    if (!doc) return null;

    const fields = [];

    // Common fields
    if (doc.description) {
      fields.push(
        <div key="description" className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.description}</p>
        </div>
      );
    }

    // Document type specific fields
    switch (doc.documentType) {
      case 'PAN Card':
        fields.push(
          <div key="pan-fields" className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.fullName || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.panNumber || 'N/A'}</p>
            </div>
          </div>
        );
        break;

      case 'Aadhaar Card':
        fields.push(
          <div key="aadhaar-fields" className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.fullName || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.aadhaarNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded whitespace-pre-wrap">{doc.address || 'N/A'}</p>
            </div>
          </div>
        );
        break;

      case 'Passport':
        fields.push(
          <div key="passport-fields" className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.passportNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.issueDate ? new Date(doc.issueDate).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        );
        break;

      case 'Rent Agreement':
        fields.push(
          <div key="rent-fields" className="space-y-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.tenantName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landlord Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.landlordName || 'N/A'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.startDate ? new Date(doc.startDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{doc.endDate ? new Date(doc.endDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
        );
        break;

      default:
        break;
    }

    return fields;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="text-4xl mr-3">📂</span>
            Admin Documents
          </h1>
          <p className="mt-2 text-gray-600">Review and manage all resident documents</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={filters.documentType}
                onChange={(e) => handleFilterChange('documentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Rent Agreement">Rent Agreement</option>
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Resident Email</label>
              <input
                type="text"
                value={filters.resident}
                onChange={(e) => handleFilterChange('resident', e.target.value)}
                placeholder="Search by email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Documents ({filteredDocuments.length})
              {(filters.documentType || filters.status || filters.resident) && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  - Filtered
                </span>
              )}
            </h2>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {documents.length === 0 ? 'No documents found.' : 'No documents match the current filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => {
                    const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                    const isNearExpiry = doc.expiryDate && !isExpired &&
                      (new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24) <= 30; // 30 days

                    return (
                      <tr key={doc.id} className={`${isExpired ? 'bg-red-50' : isNearExpiry ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {doc.fileName || 'Unnamed Document'}
                            {isExpired && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                            {isNearExpiry && !isExpired && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Expires Soon
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.documentType || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.userEmail || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.createdAt?.toDate().toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(doc.status)}`}>
                            {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewDetails(doc)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            View Details
                          </button>
                          {doc.status === 'pending' && (
                            <span className="text-orange-600 font-medium">Pending Review</span>
                          )}
                          {doc.status === 'approved' && (
                            <span className="text-green-600">Approved</span>
                          )}
                          {doc.status === 'rejected' && (
                            <span className="text-red-600">Rejected</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Document Details Modal */}
        {modalOpen && selectedDocument && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Document Details</h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Document Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Document Information</h4>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedDocument.fileName || 'N/A'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedDocument.documentType || 'N/A'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">User Email</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedDocument.userEmail || 'N/A'}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {selectedDocument.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedDocument.status)}`}>
                          {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                        </span>
                      </div>

                      {selectedDocument.status === 'rejected' && selectedDocument.rejectReason && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Reject Reason</label>
                          <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{selectedDocument.rejectReason}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Specific Fields */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Document Details</h4>
                    {renderDocumentFields(selectedDocument)}
                  </div>
                </div>

                {/* Document Preview */}
                {selectedDocument.fileURL && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Document Preview</h4>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <iframe
                        src={selectedDocument.fileURL}
                        className="w-full h-96 border-0 rounded"
                        title="Document Preview"
                      />
                      <div className="mt-4 text-center">
                        <a
                          href={selectedDocument.fileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open in New Tab
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedDocument.status === 'pending' && (
                  <div className="mt-6 border-t pt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Reject Reason (if rejecting)</label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Enter reason for rejection"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={closeModal}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(selectedDocument.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => handleApprove(selectedDocument.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading ? 'Approving...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDocumentsPage;
