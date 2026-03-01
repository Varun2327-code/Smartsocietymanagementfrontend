import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from '../../hooks/useFirestore';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Camera, User, Phone,
  Shield, Users, Briefcase, Home, Info,
  Trash2, PlusCircle, CheckCircle
} from 'lucide-react';

const EditProfile = () => {
  const navigate = useNavigate();
  const { userProfile, loading, error, updateUserProfile } = useFirestore();
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    apartment: '',
    wing: '',
    flatNumber: '',
    ownership: 'Owner',
    emergencyContact: { name: '', relation: '', phone: '' },
    familyMembers: [],
    helpers: []
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        apartment: userProfile.apartment || '',
        wing: userProfile.wing || '',
        flatNumber: userProfile.flatNumber || '',
        ownership: userProfile.ownership || 'Owner',
        emergencyContact: userProfile.emergencyContact || { name: '', relation: '', phone: '' },
        familyMembers: userProfile.familyMembers || [],
        helpers: userProfile.helpers || []
      });
      setPreviewUrl(userProfile.profileImage || null);
    }
  }, [userProfile]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [name]: value }
    }));
  };

  const addItem = (type) => {
    const newItem = type === 'familyMembers'
      ? { name: '', relation: '', age: '' }
      : { name: '', role: '', timing: '' };
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], newItem]
    }));
  };

  const removeItem = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const updateItem = (type, index, field, value) => {
    const newList = [...formData[type]];
    newList[index][field] = value;
    setFormData(prev => ({ ...prev, [type]: newList }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      let profileImage = previewUrl;
      if (imageFile) {
        const storageRef = ref(storage, `profiles/${userProfile.id}/${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        profileImage = await getDownloadURL(snapshot.ref);
      }

      const result = await updateUserProfile({ ...formData, profileImage });
      if (result.type === 'success') {
        setStatusMsg({ type: 'success', text: 'Profile synced across all devices!' });
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-indigo-600">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 font-black mb-8 hover:text-indigo-600 transition tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> CANCEL CHANGES
        </button>

        <form onSubmit={handleSubmit} className="space-y-8 pb-20">

          {/* Header & Status */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Edit <span className="text-indigo-600">Preferences</span>
            </h1>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'SYNCING...' : <><Save className="w-5 h-5" /> SAVE PROFILE</>}
            </button>
          </div>

          <AnimatePresence>
            {statusMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-4 rounded-2xl font-bold text-center ${statusMsg.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
              >
                {statusMsg.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Sections */}
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Left: Identity */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl text-center">
                <div className="relative inline-block group mb-6">
                  <img
                    src={previewUrl || 'https://ui-avatars.com/api/?name=User'}
                    alt="Preview"
                    className="w-32 h-32 rounded-[2rem] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-lg"
                  />
                  <label className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                  </label>
                </div>
                <div className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Phone</label>
                    <input
                      type="tel" name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none outline-indigo-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 uppercase tracking-tighter">
                  <Home className="w-5 h-5" /> Residency
                </h3>
                <div className="space-y-4">
                  <select
                    name="ownership" value={formData.ownership} onChange={handleChange}
                    className="w-full p-4 bg-white/10 rounded-2xl border border-white/20 outline-none font-bold"
                  >
                    <option value="Owner" className="text-slate-900">Owner</option>
                    <option value="Tenant" className="text-slate-900">Tenant</option>
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text" name="wing" placeholder="Wing" value={formData.wing} onChange={handleChange}
                      className="w-full p-4 bg-white/10 rounded-2xl border border-white/20 outline-none font-bold placeholder:text-white/40"
                    />
                    <input
                      type="text" name="flatNumber" placeholder="Flat" value={formData.flatNumber} onChange={handleChange}
                      className="w-full p-4 bg-white/10 rounded-2xl border border-white/20 outline-none font-bold placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detailed Info */}
            <div className="lg:col-span-2 space-y-8">

              {/* Emergency Contact */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-rose-500 uppercase tracking-tighter">
                  <Shield className="w-6 h-6" /> Guardian Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    placeholder="Full Name" name="name" value={formData.emergencyContact.name} onChange={handleEmergencyChange}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-indigo-500 font-bold border-none"
                  />
                  <input
                    placeholder="Relation" name="relation" value={formData.emergencyContact.relation} onChange={handleEmergencyChange}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-indigo-500 font-bold border-none"
                  />
                  <input
                    placeholder="Contact No." name="phone" value={formData.emergencyContact.phone} onChange={handleEmergencyChange}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-indigo-500 font-bold border-none"
                  />
                </div>
              </div>

              {/* Family Members */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-3 text-purple-500 uppercase tracking-tighter">
                    <Users className="w-6 h-6" /> Family Members
                  </h3>
                  <button type="button" onClick={() => addItem('familyMembers')} className="text-indigo-600"><PlusCircle /></button>
                </div>
                <div className="space-y-4">
                  {formData.familyMembers.map((member, i) => (
                    <div key={i} className="flex gap-4 items-center animate-in slide-in-from-right-2">
                      <input
                        placeholder="Name" value={member.name} onChange={(e) => updateItem('familyMembers', i, 'name', e.target.value)}
                        className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                      />
                      <input
                        placeholder="Relation" value={member.relation} onChange={(e) => updateItem('familyMembers', i, 'relation', e.target.value)}
                        className="w-32 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                      />
                      <button type="button" onClick={() => removeItem('familyMembers', i)} className="text-red-400 p-2"><Trash2 /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* domestic Help */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black flex items-center gap-3 text-orange-500 uppercase tracking-tighter">
                    <Briefcase className="w-6 h-6" /> Domestic Help
                  </h3>
                  <button type="button" onClick={() => addItem('helpers')} className="text-indigo-600"><PlusCircle /></button>
                </div>
                <div className="space-y-4">
                  {formData.helpers.map((helper, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <input
                        placeholder="Name" value={helper.name} onChange={(e) => updateItem('helpers', i, 'name', e.target.value)}
                        className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                      />
                      <input
                        placeholder="Role (Maid, Driver)" value={helper.role} onChange={(e) => updateItem('helpers', i, 'role', e.target.value)}
                        className="w-48 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold border-none"
                      />
                      <button type="button" onClick={() => removeItem('helpers', i)} className="text-red-400 p-2"><Trash2 /></button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
