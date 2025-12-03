import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { IoPersonCircleOutline } from 'react-icons/io5';
import { FiUser, FiBell } from 'react-icons/fi';

const RightSidebar = () => {
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({
    name: '',
    apartment: '',
    numMembers: '',
    iconColor: '#4c73e6',
  });
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState(null);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setError('Please log in to view your details');
        setAnnouncementsLoading(false);
        setLoading(false);
        return;
      }

      try {
        const unsubscribeUserDetails = setupUserDetailsListener(currentUser);
        const unsubscribeAnnouncements = setupAnnouncementsListener();
        return () => {
          unsubscribeUserDetails && unsubscribeUserDetails();
          unsubscribeAnnouncements && unsubscribeAnnouncements();
        };
      } catch (err) {
        console.error('Error during initial data fetch:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
    };
  }, []);

  const setupUserDetailsListener = (currentUser) => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid); // ✅ fixed to 'users'
      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('User document data:', data); // ✅ debug log
            setUserDetails({
              name: data.name || 'Not available',
              apartment: data.apartment || 'Not available',
              numMembers: data.numberOfMembers || data.numMembers || data.members || 'Not available',
              iconColor: data.iconColor || '#4c73e6',
            });
          } else {
            setUserDetails({
              name: currentUser.displayName || 'User',
              apartment: 'Not assigned',
              numMembers: 'Not specified',
              iconColor: '#4c73e6',
            });
          }
        },
        (error) => {
          console.error('Error listening to user details:', error);
          setError(
            error.code === 'permission-denied'
              ? 'You do not have permission to view user details'
              : 'Failed to fetch user details'
          );
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up user details listener:', error);
      setError('Failed to connect to user details service');
    }
  };

  const setupAnnouncementsListener = () => {
    try {
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'announcements'),
          orderBy('createdAt', 'desc'),
          limit(3)
        ),
        async (querySnapshot) => {
          try {
            const fetchedAnnouncements = await Promise.all(
              querySnapshot.docs.map(async (docSnap) => {
                const announcementData = docSnap.data();
                if (!announcementData.content) return null;

                const userName = announcementData.userName || 'Unknown User';

                return {
                  id: docSnap.id,
                  content: announcementData.content,
                  userName,
                  createdAt:
                    announcementData.createdAt?.toDate() || new Date(),
                };
              })
            );

            setAnnouncements(fetchedAnnouncements.filter(Boolean));
            setAnnouncementsLoading(false);
          } catch (error) {
            console.error('Error processing announcements:', error);
            setAnnouncementsLoading(false);
          }
        },
        (error) => {
          console.error('Error listening to announcements:', error);
          setAnnouncementsLoading(false);
          setError(
            error.code === 'permission-denied'
              ? 'You do not have permission to view announcements'
              : 'Failed to fetch announcements'
          );
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up announcements listener:', error);
      setAnnouncementsLoading(false);
      setError('Failed to connect to announcements service');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 font-semibold">{error}</div>;
  }

  return (
    <div className="hidden lg:flex flex-col gap-6 w-full lg:w-1/4 p-6 bg-white shadow-xl rounded-xl">
      {/* Profile Icon Button */}
      <div className="flex justify-end">
        <button
          onClick={handleProfileClick}
          className="text-6xl cursor-pointer transition duration-200 hover:scale-110"
          title="Go to Profile"
          aria-label="Go to Profile"
        >
          <IoPersonCircleOutline style={{ color: userDetails.iconColor }} />
        </button>
      </div>

      {/* User Details */}
      <div className="p-6 bg-gradient-to-r from-white/70 via-white/50 to-white/70 backdrop-blur-md rounded-2xl shadow-lg">
        <h3 className="text-2xl font-extrabold mb-6 text-gray-900 flex items-center gap-2">
          <FiUser className="text-blue-600" /> Your Details:
        </h3>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">Name:</span>
            <span className="text-gray-600">{userDetails.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">
              Apartment Number:
            </span>
            <span className="text-gray-600">{userDetails.apartment}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-gray-700">
              Number of Members:
            </span>
            <span className="text-gray-600">{userDetails.numMembers}</span>
          </div>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="p-6 bg-gradient-to-r from-white/70 via-white/50 to-white/70 backdrop-blur-md rounded-2xl shadow-lg flex-1 flex flex-col">
        <h3 className="text-2xl font-extrabold mb-6 text-gray-900 flex items-center gap-2">
          <FiBell className="text-yellow-500" /> Recent Announcements
        </h3>

        <div className="relative flex-1">
          {/* Scrollable Announcements Container */}
          <div
            id="announcements-container"
            className="flex-1 overflow-y-auto pr-2 space-y-4"
            style={{
              maxHeight: '400px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#6B7280 #E5E7EB',
            }}
          >
            {announcementsLoading ? (
              <p className="text-gray-700">Loading announcements...</p>
            ) : announcements.length === 0 ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <p className="text-gray-700">
                    🔔 Water supply will be temporarily shut down for
                    maintenance on <strong>7th July from 10 AM to 2 PM</strong>.
                    Please store water in advance.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    by: Society Management
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <p className="text-gray-700">
                    💳 Maintenance fee for <strong>July 2025</strong> is due by{' '}
                    <strong>10th July</strong>. Kindly pay through the portal to
                    avoid penalties.
                  </p>
                  <p className="text-gray-500 text-sm mt-2">by: Finance Team</p>
                </div>
              </>
            ) : (
              announcements.map((announcement, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
                >
                  <p className="text-gray-700">{announcement.content}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    by: {announcement.userName}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
