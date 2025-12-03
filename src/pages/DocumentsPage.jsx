import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { useCollection, useAddDocument, useDeleteDocument } from '../hooks/useFirestore';
import { uploadFileToStorage, validateFile, deleteFileFromStorage } from '../utils/storageUtils';
import { getDocuments, addDocument, deleteDocument, validateDocumentForm, reuploadDocument } from '../utils/firestoreUtils';
import { toast } from 'react-hot-toast';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    file: null,
    documentType: '',
    fullName: '',
    panNumber: '',
    aadhaarNumber: '',
    address: '',
    passportNumber: '',
    tenantName: '',
    landlordName: '',
    startDate: '',
    endDate: '',
    issueDate: '',
    expiryDate: ''
  });
  const [errors, setErrors] = useState({});
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
  const [reuploadDoc, setReuploadDoc] = useState(null);
  const [reuploadFormData, setReuploadFormData] = useState({
    file: null,
    description: ''
  });
  const [reuploadErrors, setReuploadErrors] = useState({});

  // Fetch user's documents
  useEffect(() => {
    if (user) {
      const fetchDocuments = async () => {
        try {
          const docs = await getDocuments(user.uid);
          // Filter out documents with status 'pending'
          const filteredDocs = docs.filter(doc => doc.status !== 'pending');
          setDocuments(filteredDocs);
        } catch (error) {
          console.error('Error fetching documents:', error);
          toast.error('Failed to load documents');
        } finally {
          setLoading(false);
        }
      };
      fetchDocuments();
    }
  }, [user]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      setFormData({ ...formData, file });
      setErrors({ ...errors, file: null });
    }
  };

  const handleDocumentTypeChange = (e) => {
    const documentType = e.target.value;
    // Reset dynamic fields when document type changes
    setFormData({
      ...formData,
      documentType,
      fullName: '',
      panNumber: '',
      aadhaarNumber: '',
      address: '',
      passportNumber: '',
      tenantName: '',
      landlordName: '',
      startDate: '',
      endDate: '',
      issueDate: '',
      expiryDate: ''
    });
    setErrors({ ...errors, documentType: null });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateDocumentForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setUploading(true);
    try {
      let documentData = {
        userId: user.uid,
        userEmail: user.email,
        documentType: formData.documentType,
        ...formData,
        status: 'pending'
      };

      // Only upload file if one is selected
      if (formData.file) {
        // Upload file to storage
        const fileName = `${Date.now()}_${formData.file.name}`;
        const storagePath = `documents/${user.uid}/${fileName}`;
        const downloadURL = await uploadFileToStorage(formData.file, storagePath);

        // Add file-related data to document
        documentData = {
          ...documentData,
          fileName: formData.file.name,
          fileURL: downloadURL,
          storagePath
        };
      }

      await addDocument(documentData);
      toast.success('Document saved successfully');

      // Refresh documents
      const updatedDocs = await getDocuments(user.uid);
      setDocuments(updatedDocs);

      // Reset form
      setFormData({
        file: null,
        documentType: '',
        fullName: '',
        panNumber: '',
        aadhaarNumber: '',
        address: '',
        passportNumber: '',
        tenantName: '',
        landlordName: '',
        startDate: '',
        endDate: '',
        issueDate: '',
        expiryDate: '',
        description: ''
      });
      document.getElementById('file-input').value = '';
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (doc) => {
    if (doc.status === 'approved') {
      window.open(doc.fileURL, '_blank');
    }
  };

  const handleDelete = async (doc) => {
    if (doc.status === 'pending' || doc.status === 'rejected') {
      try {
        // Delete from storage
        await deleteFileFromStorage(doc.storagePath);
        // Delete from Firestore
        await deleteDocument(doc.id);
        toast.success('Document deleted successfully');

        // Refresh documents
        const updatedDocs = await getDocuments(user.uid);
        setDocuments(updatedDocs);
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Failed to delete document');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: 'none', className: '' };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'expired', className: 'text-red-600 font-semibold' };
    if (diffDays <= 30) return { status: 'expiring', className: 'text-yellow-600 font-semibold' };
    return { status: 'valid', className: 'text-gray-500' };
  };

  const handleView = (doc) => {
    window.open(doc.fileURL, '_blank');
  };

  const handleReupload = (doc) => {
    setReuploadDoc(doc);
    setReuploadFormData({
      file: null,
      description: doc.description || ''
    });
    setReuploadErrors({});
    setReuploadModalOpen(true);
  };

  const handleReuploadFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      setReuploadFormData({ ...reuploadFormData, file });
      setReuploadErrors({ ...reuploadErrors, file: null });
    }
  };

  const handleReuploadInputChange = (e) => {
    const { name, value } = e.target;
    setReuploadFormData({ ...reuploadFormData, [name]: value });
    setReuploadErrors({ ...reuploadErrors, [name]: null });
  };

  const handleReuploadSubmit = async (e) => {
    e.preventDefault();

    if (!reuploadFormData.file) {
      setReuploadErrors({ file: 'Please select a file to upload' });
      return;
    }

    setUploading(true);
    try {
      // Upload new file to storage
      const fileName = `${Date.now()}_${reuploadFormData.file.name}`;
      const storagePath = `documents/${user.uid}/${fileName}`;
      const downloadURL = await uploadFileToStorage(reuploadFormData.file, storagePath);

      // Prepare new document data
      const newDocumentData = {
        userId: user.uid,
        userEmail: user.email,
        documentType: reuploadDoc.documentType,
        fileName: reuploadFormData.file.name,
        fileURL: downloadURL,
        storagePath,
        description: reuploadFormData.description,
        ...reuploadDoc, // Copy other fields from old document
        status: 'pending' // Reset status to pending
      };

      // Re-upload document (archive old and add new)
      await reuploadDocument(reuploadDoc.id, newDocumentData);

      toast.success('Document re-uploaded successfully');

      // Refresh documents
      const updatedDocs = await getDocuments(user.uid);
      setDocuments(updatedDocs);

      // Close modal
      setReuploadModalOpen(false);
      setReuploadDoc(null);
    } catch (error) {
      console.error('Error re-uploading document:', error);
      toast.error('Failed to re-upload document');
    } finally {
      setUploading(false);
    }
  };

  const closeReuploadModal = () => {
    setReuploadModalOpen(false);
    setReuploadDoc(null);
    setReuploadFormData({
      file: null,
      description: ''
    });
    setReuploadErrors({});
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="text-4xl mr-3">📂</span>
            Resident Documents
          </h1>
          <p className="mt-2 text-gray-600">Upload and manage your personal and society-related documents</p>
        </div>

        {/* Expiry Alerts */}
        {documents.length > 0 && (
          <div className="mb-8">
            {documents.filter(doc => doc.expiryDate && getExpiryStatus(doc.expiryDate).status === 'expired').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Expired Documents</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>The following documents have expired:</p>
                      <ul className="list-disc list-inside mt-1">
                        {documents.filter(doc => doc.expiryDate && getExpiryStatus(doc.expiryDate).status === 'expired').map(doc => (
                          <li key={doc.id}>{doc.fileName}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {documents.filter(doc => doc.expiryDate && getExpiryStatus(doc.expiryDate).status === 'expiring').length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-400">⏰</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Documents Expiring Soon</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>The following documents will expire within 30 days:</p>
                      <ul className="list-disc list-inside mt-1">
                        {documents.filter(doc => doc.expiryDate && getExpiryStatus(doc.expiryDate).status === 'expiring').map(doc => (
                          <li key={doc.id}>{doc.fileName} - Expires: {new Date(doc.expiryDate).toLocaleDateString()}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Document</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                id="file-input"
                type="file"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select
                value={formData.documentType}
                onChange={handleDocumentTypeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Document Type</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Passport">Passport</option>
                <option value="Rent Agreement">Rent Agreement</option>
              </select>
              {errors.documentType && <p className="mt-1 text-sm text-red-600">{errors.documentType}</p>}
            </div>

            {/* Dynamic Fields based on Document Type */}
            {formData.documentType === 'PAN Card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name as per PAN card"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PAN number (e.g., ABCDE1234F)"
                  />
                  {errors.panNumber && <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>}
                </div>
              </div>
            )}

            {formData.documentType === 'Aadhaar Card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name as per Aadhaar card"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number</label>
                  <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter 12-digit Aadhaar number"
                  />
                  {errors.aadhaarNumber && <p className="mt-1 text-sm text-red-600">{errors.aadhaarNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter address as per Aadhaar card"
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>
            )}

            {formData.documentType === 'Passport' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passport Number</label>
                  <input
                    type="text"
                    name="passportNumber"
                    value={formData.passportNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter passport number"
                  />
                  {errors.passportNumber && <p className="mt-1 text-sm text-red-600">{errors.passportNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date</label>
                    <input
                      type="date"
                      name="issueDate"
                      value={formData.issueDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.issueDate && <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.expiryDate && <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>}
                  </div>
                </div>
              </div>
            )}

            {formData.documentType === 'Rent Agreement' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tenant Name</label>
                  <input
                    type="text"
                    name="tenantName"
                    value={formData.tenantName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter tenant name"
                  />
                  {errors.tenantName && <p className="mt-1 text-sm text-red-600">{errors.tenantName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Landlord Name</label>
                  <input
                    type="text"
                    name="landlordName"
                    value={formData.landlordName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter landlord name"
                  />
                  {errors.landlordName && <p className="mt-1 text-sm text-red-600">{errors.landlordName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter document description"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Documents</h2>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No documents uploaded yet. Upload your first document above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reject Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => {
                    const expiryStatus = getExpiryStatus(doc.expiryDate);
                    return (
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {doc.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.documentType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.createdAt?.toDate().toLocaleDateString()}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${expiryStatus.className}`}>
                          {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(doc.status)}`}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                            {doc.status === 'approved' && (
                              <span className="ml-2 text-green-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {doc.rejectReason || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {doc.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleView(doc)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Download
                              </button>
                              <button
                                onClick={() => handleReupload(doc)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Re-upload
                              </button>
                            </>
                          )}
                          {(doc.status === 'pending' || doc.status === 'rejected') && (
                            <button
                              onClick={() => handleDelete(doc)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
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

        {/* Reupload Modal */}
        {reuploadModalOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Re-upload Document</h3>
                <form onSubmit={handleReuploadSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select New File</label>
                    <input
                      type="file"
                      onChange={handleReuploadFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    {reuploadErrors.file && <p className="mt-1 text-sm text-red-600">{reuploadErrors.file}</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={reuploadFormData.description}
                      onChange={handleReuploadInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter document description"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeReuploadModal}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Re-upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
