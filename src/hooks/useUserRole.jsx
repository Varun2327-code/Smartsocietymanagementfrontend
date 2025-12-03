// src/hooks/useUserRole.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/**
 * Custom hook to get the current user's role.
 * For demonstration, it fetches the role from Firestore user document.
 */
const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role === 'user' ? 'resident' : data.role || "resident"); // map 'user' to 'resident'
          } else {
            setRole("resident");
          }
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setRole("resident"); // Default to resident if permission denied or other error
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { role, loading };
};

export default useUserRole;
