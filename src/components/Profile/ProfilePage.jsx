import React, { useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';
import { validateEmail, validatePhone } from '../../utils/validationUtils';
import LoadingSpinner from '../LoadingSpinner';

const ProfilePage = () => {
  const { userProfile, loading, error, updateUserProfile } = useFirestore();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  React.useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // Validate
    if (!validateEmail(formData.email)) {
      setNotification({ type: 'error', message: 'Invalid email' });
      return;
    }
    if (!validatePhone(formData.phone)) {
      setNotification({ type: 'error', message: 'Invalid phone' });
      return;
    }

    setSaving(true);
    const result = await updateUserProfile(formData);
    setSaving(false);
    setNotification(result);
    setTimeout(() => setNotification(null), 3000);
  };

  const isAdmin = userProfile?.role === 'admin';
  const editableFields = isAdmin ? ['name', 'flatNumber', 'role', 'email', 'phone', 'profileImage', 'numberOfMembers'] : ['email', 'phone', 'profileImage', 'numberOfMembers'];

  if (loading) return <LoadingSpinner />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="profile-page">
      <h1>User Profile</h1>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <form>
        {['name', 'flatNumber', 'role', 'email', 'phone', 'profileImage', 'numberOfMembers'].map(field => (
          <div key={field}>
            <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
            <input
              type={field === 'email' ? 'email' : field === 'numberOfMembers' ? 'number' : 'text'}
              name={field}
              value={formData[field] || ''}
              onChange={handleChange}
              disabled={!editableFields.includes(field)}
            />
          </div>
        ))}
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
