import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  useCollection,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useForm
} from '../../hooks/useFirestore';
import { visitorValidationSchema } from '../../utils/validationUtils';
import LoadingSpinner from '../../components/LoadingSpinner';

const Visitors = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState(null);

  // ✅ Fetch visitors from Firestore
  const { data: visitors, loading: visitorsLoading, error: visitorsError } = useCollection('visitors');
  const { addDocument: addVisitor, loading: addLoading } = useAddDocument('visitors');
  const { updateDocument: updateVisitor, loading: updateLoading } = useUpdateDocument('visitors');
  const { deleteDocument: deleteVisitor, loading: deleteLoading } = useDeleteDocument('visitors');

  // Add form hook
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm
  } = useForm({
    name: '',
    purpose: '',
    flatNumber: '',
    vehicleNumber: ''
  }, visitorValidationSchema);

  return null;
};

export default Visitors;
