// src/hooks/useFirestore.js
import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query as firestoreQuery,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * useCollection(collectionName, options)
 *
 * options:
 *  - queryBuilder: (collectionRef) => a Firestore Query (optional). If it returns null, hook returns empty array.
 *  - listen: boolean (default true) - if true uses onSnapshot, else one-time getDocs
 */
export const useCollection = (collectionName, options = {}) => {
  const { queryBuilder = null, listen = true } = options;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const colRef = collection(db, collectionName);

      const builtQuery = typeof queryBuilder === 'function' ? queryBuilder(colRef) : (queryBuilder || colRef);

      // if builder returns null -> do nothing (no access / not ready)
      if (!builtQuery) {
        setData([]);
        setLoading(false);
        return;
      }

      if (listen) {
        unsubRef.current = onSnapshot(
          builtQuery,
          (snapshot) => {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            setData(docs);
            setLoading(false);
          },
          (err) => {
            console.error('useCollection snapshot error:', err);
            setError(err.message || String(err));
            setLoading(false);
          }
        );
      } else {
        (async () => {
          try {
            const snap = await getDocs(builtQuery);
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setData(docs);
            setLoading(false);
          } catch (err) {
            console.error('useCollection getDocs error:', err);
            setError(err.message || String(err));
            setLoading(false);
          }
        })();
      }
    } catch (err) {
      console.error('useCollection build error:', err);
      setError(err.message || String(err));
      setLoading(false);
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, // the user should pass stable queryBuilder (useMemo)
      // We don't JSON.stringify function; consumer should memoize queryBuilder
      queryBuilder, listen]);

  return { data, loading, error };
};

/**
 * useAddDocument(collectionName)
 */
export const useAddDocument = (collectionName) => {
  const [loading, setLoading] = useState(false);

  const addDocument = async (payload) => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...payload,
        // prefer caller-provided timestamp; otherwise serverTimestamp
        createdAt: payload.createdAt || serverTimestamp()
      });
      setLoading(false);
      return docRef.id;
    } catch (err) {
      setLoading(false);
      console.error('useAddDocument error:', err);
      throw err;
    }
  };

  return { addDocument, loading };
};

/**
 * useUpdateDocument(collectionName)
 */
export const useUpdateDocument = (collectionName) => {
  const [loading, setLoading] = useState(false);

  const updateDocument = async (docId, updates) => {
    setLoading(true);
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('useUpdateDocument error:', err);
      throw err;
    }
  };

  return { updateDocument, loading };
};

/**
 * useDeleteDocument(collectionName)
 */
export const useDeleteDocument = (collectionName) => {
  const [loading, setLoading] = useState(false);

  const deleteDocument = async (docId) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, collectionName, docId));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error('useDeleteDocument error:', err);
      throw err;
    }
  };

  return { deleteDocument, loading };
};

/**
 * useForm(initialData, validationSchema)
 * validationSchema: object where value is a function(value) => string|null
 */
export const useForm = (initialData = {}, validationSchema = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
    // optimistic: clear field error when typing
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleBlur = (field) => {
    if (validationSchema && typeof validationSchema[field] === 'function') {
      const err = validationSchema[field](formData[field]);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema || {}).forEach((field) => {
      const validator = validationSchema[field];
      if (typeof validator === 'function') {
        const err = validator(formData[field]);
        if (err) newErrors[field] = err;
      }
    });
    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const resetForm = (data = initialData) => {
    setFormData(data);
    setErrors({});
  };

  // helper for admin edit (set whole form)
  const setFormDataDirect = (newData) => setFormData(newData);

  return {
    formData,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    resetForm,
    setFormData: setFormDataDirect
  };
};
