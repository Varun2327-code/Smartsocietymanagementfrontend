import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiFileText,
  FiUpload,
  FiTrash2,
  FiEye,
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiArchive,
  FiPlus,
  FiArrowLeft,
  FiRefreshCcw,
  FiInfo
} from 'react-icons/fi';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { uploadFileToStorage, validateFile, deleteFileFromStorage } from '../utils/storageUtils';
import {
  getDocuments,
  addDocument,
  deleteDocument,
  validateDocumentForm,
  reuploadDocument,
  getArchivedDocuments
} from '../utils/firestoreUtils';
import { toast } from 'react-hot-toast';

const DocumentsPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [activeTab, setActiveTab] = useState('active');
  const [documents, setDocuments] = useState([]);
  const [archivedDocs, setArchivedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    expiryDate: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [reuploadModalOpen, setReuploadModalOpen] = useState(false);
  const [reuploadDoc, setReuploadDoc] = useState(null);
  const [reuploadFormData, setReuploadFormData] = useState({
    file: null,
    description: ''
  });

  const CATEGORIES = ['All', 'Identity Proof', 'Property Document', 'Agreements', 'Utilities', 'Other'];

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [docs, archDocs] = await Promise.all([
        getDocuments(user.uid),
        getArchivedDocuments(user.uid)
      ]);
      setDocuments(docs);
      setArchivedDocs(archDocs);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: null });
  };

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

      if (formData.file) {
        const fileName = `${Date.now()}_${formData.file.name}`;
        const storagePath = `documents/${user.uid}/${fileName}`;
        const downloadURL = await uploadFileToStorage(formData.file, storagePath);

        documentData = {
          ...documentData,
          fileName: formData.file.name,
          fileURL: downloadURL,
          storagePath
        };
      }

      await addDocument(documentData);
      toast.success('Document submitted for verification');
      setIsFormOpen(false);
      loadAllData();

      setFormData({
        file: null, documentType: '', fullName: '', panNumber: '', aadhaarNumber: '',
        address: '', passportNumber: '', tenantName: '', landlordName: '',
        startDate: '', endDate: '', issueDate: '', expiryDate: '', description: ''
      });
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadForm = (formTitle) => {
    toast.success(`${formTitle} will be downloaded. This is a secure template provided by the management.`);
    setTimeout(() => {
      window.alert(`Downloading ${formTitle}...\n(In production, this would open a real PDF link)`);
    }, 500);
  };

  const SOCIETY_FORMS = [
    { title: 'NOC Request Form', type: 'Official Template', desc: 'Standard form for No Objection Certificate applications.', icon: '📜', id: 'noc-form' },
    { title: 'Member Rulebook v2.1', type: 'Policy', desc: 'Updated society rules and regulations for 2024.', icon: '📘', id: 'rulebook' },
    { title: 'Vehicle Permit Blank', type: 'Form', desc: 'Request form for new resident vehicle parking stickers.', icon: '🚗', id: 'vehicle-permit' },
  ];

  const handleDelete = async (doc) => {
    if (window.confirm("Delete this document? This cannot be undone.")) {
      try {
        if (doc.storagePath) await deleteFileFromStorage(doc.storagePath);
        await deleteDocument(doc.id);
        toast.success('Document removed');
        loadAllData();
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'amber', icon: FiClock, label: 'Pending Verification' },
      approved: { color: 'green', icon: FiCheckCircle, label: 'Verified Official' },
      rejected: { color: 'red', icon: FiXCircle, label: 'Action Required' }
    };
    return configs[status] || { color: 'slate', icon: FiInfo, label: status };
  };

  const filteredDocs = (activeTab === 'active' ? documents : archivedDocs).filter(doc => {
    const matchesSearch = doc.documentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory || doc.documentType === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-solid mx-auto"></div>
          <p className="mt-4 text-slate-500 font-bold animate-pulse">Accessing Secure Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header & Sub-header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:text-primary transition-all active:scale-95"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  Document Vault <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">Secure</span>
                </h1>
                <p className="text-slate-500 font-medium">Manage your verified society credentials</p>
              </div>
            </div>

            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 hover:shadow-xl hover:translate-y-[-2px] transition-all active:scale-95"
            >
              {isFormOpen ? <FiXCircle /> : <FiPlus />}
              {isFormOpen ? 'Close Portal' : 'Upload New Document'}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-indigo-600 px-10 py-8 text-white">
                  <h2 className="text-2xl font-black tracking-tight">Direct Submission</h2>
                  <p className="opacity-80 font-medium">Fill in the details for verification</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Document Type Section */}
                    <div className="space-y-4">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <FiFileText className="text-primary" /> Core Information
                      </label>
                      <select
                        value={formData.documentType}
                        onChange={(e) => {
                          handleInputChange(e);
                          setFormData(prev => ({ ...prev, documentType: e.target.value }));
                        }}
                        name="documentType"
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:border-primary focus:bg-white transition-all outline-none font-bold"
                      >
                        <option value="">Select Document Type</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Rent Agreement">Rent Agreement</option>
                        <option value="Electricity Bill">Electricity Bill</option>
                      </select>
                      {errors.documentType && <p className="text-red-500 text-xs font-bold pl-2">{errors.documentType}</p>}

                      <div className="relative">
                        <input
                          id="file-input"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <label
                          htmlFor="file-input"
                          className="flex flex-col items-center justify-center w-full h-32 border-4 border-dashed border-slate-100 rounded-3xl cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all group"
                        >
                          <FiUpload className="w-8 h-8 text-slate-300 group-hover:text-primary transition-colors mb-2" />
                          <span className="text-sm font-black text-slate-400 group-hover:text-primary">
                            {formData.file ? formData.file.name : 'Upload File (PDF/JPG)'}
                          </span>
                        </label>
                        {errors.file && <p className="text-red-500 text-xs font-bold pl-2 mt-2">{errors.file}</p>}
                      </div>
                    </div>

                    {/* Dynamic Details Section */}
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                      <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <FiInfo className="text-primary" /> Verification Details
                      </label>

                      {formData.documentType === 'PAN Card' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <input type="text" name="fullName" placeholder="Full Name as on PAN" value={formData.fullName} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-slate-200" />
                          <input type="text" name="panNumber" placeholder="PAN Number (ABCDE1234F)" value={formData.panNumber} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-slate-200" />
                        </motion.div>
                      )}

                      {formData.documentType === 'Aadhaar Card' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <input type="text" name="fullName" placeholder="Full Name as on Aadhaar" value={formData.fullName} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-slate-200" />
                          <input type="text" name="aadhaarNumber" placeholder="12-digit Aadhaar Number" value={formData.aadhaarNumber} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-slate-200" />
                        </motion.div>
                      )}

                      {formData.documentType === 'Passport' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          <input type="text" name="passportNumber" placeholder="Passport Number" value={formData.passportNumber} onChange={handleInputChange} className="w-full p-4 rounded-xl border border-slate-200" />
                          <div className="grid grid-cols-2 gap-4">
                            <input type="date" name="issueDate" value={formData.issueDate} onChange={handleInputChange} className="p-4 rounded-xl border border-slate-200 text-sm" />
                            <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="p-4 rounded-xl border border-slate-200 text-sm" />
                          </div>
                        </motion.div>
                      )}

                      {!formData.documentType && (
                        <div className="h-full flex items-center justify-center text-slate-300 italic py-10">
                          Select a document type to enter specific details
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all disabled:opacity-50"
                  >
                    {uploading ? 'Processing Securely...' : 'Certify & Submit'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
          <div className="flex p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit">
            {[
              { id: 'active', label: 'My Vault', icon: FiFileText },
              { id: 'forms', label: 'Society Forms', icon: FiSearch },
              { id: 'archive', label: 'History', icon: FiArchive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1 w-full">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-3.5 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
            <select
              className="w-full md:w-48 py-3.5 px-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-600"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Document Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {activeTab === 'forms' ? (
              <motion.div
                key="society-forms-vault"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 col-span-full"
              >
                {SOCIETY_FORMS.map((form, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                      {form.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{form.title}</h3>
                    <p className="text-primary text-xs font-black uppercase tracking-widest mb-4">{form.type}</p>
                    <p className="text-slate-500 text-sm mb-6 leading-relaxed">{form.desc}</p>
                    <button
                      type="button"
                      onClick={() => handleDownloadForm(form.title)}
                      className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <FiDownload /> Download Template
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : filteredDocs.length === 0 ? (
              <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiArchive className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Safe & Empty</h3>
                <p className="text-slate-500 font-medium">No documents found matching your current view</p>
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const config = getStatusConfig(doc.status);
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    layout
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col"
                  >
                    {/* Status Top Bar */}
                    <div className={`px-6 py-3 bg-${config.color}-50 flex items-center justify-between`}>
                      <span className={`flex items-center gap-1.5 text-${config.color}-600 text-xs font-black uppercase tracking-wider`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {config.label}
                      </span>
                      {doc.expiryDate && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <FiClock /> Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="p-8 flex-1">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary border border-slate-100">
                          <FiFileText className="w-7 h-7" />
                        </div>
                        <div className="flex gap-1">
                          {doc.fileURL && (
                            <button
                              onClick={() => window.open(doc.fileURL, '_blank')}
                              className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all"
                            >
                              <FiEye />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{doc.documentType}</h3>
                      <p className="text-slate-400 text-sm font-bold mb-4 line-clamp-1">{doc.fileName || 'Data-only Record'}</p>

                      {doc.status === 'rejected' && doc.rejectReason && (
                        <div className="p-3 bg-red-50 rounded-xl mb-4 border border-red-100">
                          <p className="text-[10px] text-red-600 font-black uppercase mb-1">Feedback from MGMT:</p>
                          <p className="text-xs text-red-800 font-medium italic">"{doc.rejectReason}"</p>
                        </div>
                      )}

                      <div className="space-y-2 mb-8">
                        {doc.fullName && (
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">HOLDER</span>
                            <span className="text-slate-700">{doc.fullName}</span>
                          </div>
                        )}
                        {doc.panNumber && (
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">PAN ID</span>
                            <span className="text-slate-700">{doc.panNumber.substring(0, 5)}****{doc.panNumber.slice(-1)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50/50 border-t border-slate-50 mt-auto">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 text-[10px] font-black">
                            {user.email?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident Doc</span>
                        </div>

                        <button
                          onClick={() => {
                            if (doc.status === 'rejected') {
                              // Re-upload logic would go here
                              toast.info("Please use upload new document to replace rejected records.");
                            }
                          }}
                          className="p-2 rounded-lg bg-white shadow-sm text-slate-400 hover:text-primary hover:scale-110 transition-all"
                        >
                          <FiRefreshCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default DocumentsPage;
