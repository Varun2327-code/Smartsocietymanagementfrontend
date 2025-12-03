import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const EditProfile = () => {
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    dateOfBirth: '',
    apartment: '',
    wing: '',
    numberOfMembers: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchUserData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserData = async (userId) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          bio: data.bio || '',
          dateOfBirth: data.dateOfBirth || '',
          apartment: data.apartment || '',
          wing: data.wing || '',
          numberOfMembers: data.numberOfMembers || '',
        });
        setProfilePicture(data.profilePicture || null);
        setPreviewUrl(data.profilePicture || null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setStatusMsg({ type: 'error', text: 'Failed to load profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrl(previewUrl);
      setProfilePicture(file);
    }
  };

  const uploadImageToFirebase = async (file) => {
    if (!file || typeof file === 'string') return file;
    const storageRef = ref(storage, `profilePictures/${user.uid}/${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatusMsg(null);

    try {
      let profilePictureUrl = previewUrl;
      if (profilePicture && typeof profilePicture !== 'string') {
        profilePictureUrl = await uploadImageToFirebase(profilePicture);
      }

      await setDoc(
        doc(db, 'users', user.uid),
        {
          ...userData,
          profilePicture: profilePictureUrl,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setStatusMsg({ type: 'success', text: 'Profile updated successfully 🎉' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setStatusMsg({ type: 'error', text: 'Failed to update profile ❌' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-blue-200">
        <h2 className="text-3xl font-extrabold text-center text-indigo-700 mb-6">
          ✏️ Edit Your Profile
        </h2>

        {statusMsg && (
          <div
            className={`mb-4 text-center py-2 px-4 rounded-md font-medium ${
              statusMsg.type === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={previewUrl || '/default-profile-pic.png'}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-200 shadow-md"
              />
              <label
                htmlFor="upload-button"
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition"
              >
                📷
              </label>
              <input
                type="file"
                id="upload-button"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { name: 'name', label: 'Full Name *', type: 'text' },
              { name: 'email', label: 'Email *', type: 'email' },
              { name: 'phone', label: 'Phone Number', type: 'tel' },
              { name: 'apartment', label: 'Apartment Number', type: 'text' },
              { name: 'wing', label: 'Wing/Building', type: 'text' },
              { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
              { name: 'numberOfMembers', label: 'Family Members', type: 'number' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={userData[field.name]}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 transition"
                  required={field.label.includes('*')}
                />
              </div>
            ))}
          </div>

          {/* Address & Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={userData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your address..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={userData.bio}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Write a short description about yourself..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => fetchUserData(user.uid)}
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
