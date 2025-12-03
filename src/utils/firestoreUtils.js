import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Collection references
export const collections = {
  MEMBERS: 'members',
  COMPLAINTS: 'complaints',
  VISITORS: 'visitors',
  GATE_PASSES: 'gate_passes',
  EVENTS: 'events',
  MAINTENANCE: 'maintenance',
  ANNOUNCEMENTS: 'announcements',
  SECURITY_LOGS: 'security_logs',
  DOCUMENTS: 'documents'
};

// Dashboard metrics functions
export const getDashboardMetrics = async () => {
  try {
    const [
      membersSnapshot,
      complaintsSnapshot,
      visitorsSnapshot,
      gatePassesSnapshot
    ] = await Promise.all([
      getDocs(collection(db, collections.MEMBERS)),
      getDocs(collection(db, collections.COMPLAINTS)),
      getDocs(query(collection(db, collections.VISITORS), where('visitDate', '==', new Date().toISOString().split('T')[0]))),
      getDocs(query(collection(db, collections.GATE_PASSES), where('issueDate', '==', new Date().toISOString().split('T')[0])))
    ]);

    const totalMembers = membersSnapshot.size;
    const totalComplaints = complaintsSnapshot.size;
    const pendingComplaints = complaintsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const visitorsToday = visitorsSnapshot.size;
    const gatePassesToday = gatePassesSnapshot.size;

    return {
      totalMembers,
      visitorsToday,
      pendingComplaints,
      gatePassesToday
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
};

// Real-time metrics listener
export const subscribeToDashboardMetrics = (callback) => {
  const unsubscribeMembers = onSnapshot(collection(db, collections.MEMBERS), (snapshot) => {
    const members = snapshot.docs.map(doc => doc.data());
    const totalMembers = members.length;
    const activeMembers = members.filter(member => member.status === 'active').length;

    // Calculate new members today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newMembersToday = members.filter(member => {
      const createdAt = member.createdAt?.toDate?.() || new Date(member.createdAt);
      return createdAt >= today;
    }).length;

    callback({
      totalMembers,
      activeMembers,
      newMembersToday
    });
  });

  return () => {
    unsubscribeMembers();
  };
};

// Get recent activities
export const getRecentActivities = async (maxResults = 5) => {
  try {
    // Try to get recent members first
    const membersQuery = query(
      collection(db, collections.MEMBERS),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const membersSnapshot = await getDocs(membersQuery);

    if (membersSnapshot.docs.length > 0) {
      const activities = membersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          action: `New member: ${data.name || 'Unknown'}`,
          time: formatTimeDifference(data.createdAt?.toDate?.() || new Date(data.createdAt))
        };
      });
      return activities;
    }

    // If no members, try complaints
    const complaintsQuery = query(
      collection(db, collections.COMPLAINTS),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const complaintsSnapshot = await getDocs(complaintsQuery);

    if (complaintsSnapshot.docs.length > 0) {
      const activities = complaintsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          action: `New complaint: ${data.title || 'Unknown'}`,
          time: formatTimeDifference(data.createdAt?.toDate?.() || new Date(data.createdAt))
        };
      });
      return activities;
    }

    // If no complaints, try visitors
    const visitorsQuery = query(
      collection(db, collections.VISITORS),
      orderBy('visitDate', 'desc'),
      limit(maxResults)
    );
    const visitorsSnapshot = await getDocs(visitorsQuery);

    if (visitorsSnapshot.docs.length > 0) {
      const activities = visitorsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          action: `Visitor: ${data.name || 'Unknown'}`,
          time: formatTimeDifference(new Date(data.visitDate))
        };
      });
      return activities;
    }

    // If still no data, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Get weekly activity data for chart
export const getWeeklyActivityData = async () => {
  try {
    const membersSnapshot = await getDocs(collection(db, collections.MEMBERS));
    const members = membersSnapshot.docs.map(doc => doc.data());

    // Get last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      days.push(date);
    }

    // Count new members per day
    const activityData = days.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = members.filter(member => {
        const createdAt = member.createdAt?.toDate?.() || new Date(member.createdAt);
        return createdAt >= day && createdAt < nextDay;
      }).length;

      return {
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        date: day.toISOString().split('T')[0],
        newMembers: count
      };
    });

    return activityData;
  } catch (error) {
    console.error('Error fetching weekly activity data:', error);
    return [];
  }
};

// Helper function to format time difference
const formatTimeDifference = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
};

// Member CRUD Operations
export const getMembers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, collections.MEMBERS));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching members:', error);
    throw error;
  }
};

export const subscribeToMembers = (callback) => {
  return onSnapshot(collection(db, collections.MEMBERS), (snapshot) => {
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(members);
  });
};

export const addMember = async (memberData) => {
  try {
    const docRef = await addDoc(collection(db, collections.MEMBERS), {
      ...memberData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

export const updateMember = async (id, memberData) => {
  try {
    const docRef = doc(db, collections.MEMBERS, id);
    await updateDoc(docRef, {
      ...memberData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

export const deleteMember = async (id) => {
  try {
    const docRef = doc(db, collections.MEMBERS, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Form validation utilities
export const validateMemberForm = (formData) => {
  const errors = {};

  if (!formData.name?.trim()) {
    errors.name = 'Name is required';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }

  if (!formData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  }

  if (!formData.unit?.trim()) {
    errors.unit = 'Unit number is required';
  }

  if (!formData.role?.trim()) {
    errors.role = 'Role is required';
  }

  return errors;
};

// Complaints CRUD Operations
export const getComplaints = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, collections.COMPLAINTS));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

export const subscribeToComplaints = (callback) => {
  return onSnapshot(collection(db, collections.COMPLAINTS), (snapshot) => {
    const complaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(complaints);
  });
};

export const addComplaint = async (complaintData) => {
  try {
    const docRef = await addDoc(collection(db, collections.COMPLAINTS), {
      ...complaintData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding complaint:', error);
    throw error;
  }
};

export const updateComplaint = async (id, complaintData) => {
  try {
    const docRef = doc(db, collections.COMPLAINTS, id);
    await updateDoc(docRef, {
      ...complaintData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    throw error;
  }
};

export const deleteComplaint = async (id) => {
  try {
    const docRef = doc(db, collections.COMPLAINTS, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting complaint:', error);
    throw error;
  }
};

// Complaint form validation
export const validateComplaintForm = (formData) => {
  const errors = {};

  if (!formData.title?.trim()) {
    errors.title = 'Title is required';
  }

  if (!formData.description?.trim()) {
    errors.description = 'Description is required';
  }

  if (!formData.category?.trim()) {
    errors.category = 'Category is required';
  }

  if (!formData.priority?.trim()) {
    errors.priority = 'Priority is required';
  }

  return errors;
};

// Documents CRUD Operations
export const getDocuments = async (userId) => {
  try {
    const q = query(
      collection(db, collections.DOCUMENTS),
      where('userId', '==', userId),
      where('archived', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sort by createdAt descending on client side
    return docs.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getAllDocuments = async () => {
  try {
    // First try with ordering and archived filter (requires composite index)
    try {
      const q = query(
        collection(db, collections.DOCUMENTS),
        where('archived', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (indexError) {
      console.warn('Composite index not found, falling back to unordered query:', indexError);
      // Fallback to unordered query if index doesn't exist
      const querySnapshot = await getDocs(
        query(collection(db, collections.DOCUMENTS), where('archived', '==', false))
      );
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort on client side as fallback
      return docs.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    }
  } catch (error) {
    console.error('Error fetching all documents:', error);
    throw error;
  }
};

export const addDocument = async (documentData) => {
  try {
    const docRef = await addDoc(collection(db, collections.DOCUMENTS), {
      ...documentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending',
      archived: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
};

export const updateDocument = async (id, documentData) => {
  try {
    const docRef = doc(db, collections.DOCUMENTS, id);
    await updateDoc(docRef, {
      ...documentData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (id) => {
  try {
    const docRef = doc(db, collections.DOCUMENTS, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Archive document (for versioning)
export const archiveDocument = async (id) => {
  try {
    const docRef = doc(db, collections.DOCUMENTS, id);
    await updateDoc(docRef, {
      archived: true,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error archiving document:', error);
    throw error;
  }
};

// Re-upload document (archive old and add new)
export const reuploadDocument = async (oldDocId, newDocumentData) => {
  try {
    // Archive the old document
    await archiveDocument(oldDocId);

    // Add the new document
    const newDocId = await addDocument({
      ...newDocumentData,
      archived: false
    });

    return newDocId;
  } catch (error) {
    console.error('Error re-uploading document:', error);
    throw error;
  }
};

// Get archived documents for a user
export const getArchivedDocuments = async (userId) => {
  try {
    const q = query(
      collection(db, collections.DOCUMENTS),
      where('userId', '==', userId),
      where('archived', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return docs.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
  } catch (error) {
    console.error('Error fetching archived documents:', error);
    throw error;
  }
};

// Document form validation
export const validateDocumentForm = (formData) => {
  const errors = {};

  // File is now optional
  // if (!formData.file) {
  //   errors.file = 'File is required';
  // }

  if (!formData.documentType) {
    errors.documentType = 'Document Type is required';
  }

  // Description is now optional
  // if (!formData.description?.trim()) {
  //   errors.description = 'Description is required';
  // }

  // Dynamic field validation based on document type
  if (formData.documentType === 'PAN Card') {
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.panNumber?.trim()) {
      errors.panNumber = 'PAN Number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.toUpperCase())) {
      errors.panNumber = 'Please enter a valid PAN number (e.g., ABCDE1234F)';
    }
  }

  if (formData.documentType === 'Aadhaar Card') {
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.aadhaarNumber?.trim()) {
      errors.aadhaarNumber = 'Aadhaar Number is required';
    } else if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) {
      errors.aadhaarNumber = 'Please enter a valid 12-digit Aadhaar number';
    }
    if (!formData.address?.trim()) {
      errors.address = 'Address is required';
    }
  }

  if (formData.documentType === 'Passport') {
    if (!formData.passportNumber?.trim()) {
      errors.passportNumber = 'Passport Number is required';
    }
    if (!formData.issueDate) {
      errors.issueDate = 'Issue Date is required';
    }
    if (!formData.expiryDate) {
      errors.expiryDate = 'Expiry Date is required';
    }
  }

  if (formData.documentType === 'Rent Agreement') {
    if (!formData.tenantName?.trim()) {
      errors.tenantName = 'Tenant Name is required';
    }
    if (!formData.landlordName?.trim()) {
      errors.landlordName = 'Landlord Name is required';
    }
    if (!formData.startDate) {
      errors.startDate = 'Start Date is required';
    }
    if (!formData.endDate) {
      errors.endDate = 'End Date is required';
    }
  }

  // Date validations
  if (formData.issueDate && new Date(formData.issueDate) > new Date()) {
    errors.issueDate = 'Issue Date cannot be in the future';
  }

  if (formData.expiryDate && formData.issueDate && new Date(formData.expiryDate) < new Date(formData.issueDate)) {
    errors.expiryDate = 'Expiry Date cannot be before Issue Date';
  }

  if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
    errors.endDate = 'End Date cannot be before Start Date';
  }

  return errors;
};
