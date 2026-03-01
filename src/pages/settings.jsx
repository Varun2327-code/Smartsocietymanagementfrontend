import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Lock, Eye, Palette, ShieldCheck, Trash2,
  ArrowLeft, CheckCircle, AlertTriangle, Moon,
  Sun, UserX, Key, Smartphone, HeartPulse,
  Download, LogOut, ShieldAlert, Globe
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from "firebase/auth";
import { useFirestore } from "../hooks/useFirestore";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, loading, updateUserProfile } = useFirestore();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "account");
  const [toast, setToast] = useState(null);

  // Settings State (Locally managed for snappy feel, then synced)
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: {
      announcements: true,
      maintenance: true,
      visitors: true,
      security: true
    },
    privacy: {
      showPhone: true,
      showUnit: true,
      visibility: "Public"
    },
    financial: {
      autoPay: false,
      analytics: true
    },
    emergency: {
      silentSOS: false,
      trackLateEntry: false
    },
    language: "English"
  });

  // Password State
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [updatingPass, setUpdatingPass] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reAuthPass, setReAuthPass] = useState("");

  useEffect(() => {
    if (userProfile?.settings) {
      setSettings(userProfile.settings);
    }
  }, [userProfile]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (path, value) => {
    // Path like "notifications.announcements"
    const keys = path.split('.');
    const newSettings = { ...settings };

    if (keys.length === 1) {
      newSettings[keys[0]] = value;
    } else {
      newSettings[keys[0]] = { ...newSettings[keys[0]], [keys[1]]: value };
    }

    setSettings(newSettings);

    // Sync to Firestore
    const res = await updateUserProfile({ settings: newSettings });
    if (res.type === 'error') {
      showToast("Failed to sync settings", "error");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.next !== passwords.confirm) {
      showToast("Passwords do not match", "error");
      return;
    }

    setUpdatingPass(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, passwords.current);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwords.next);
      showToast("Password updated successfully");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, reAuthPass);
      await reauthenticateWithCredential(user, credential);

      // Cleanup Firestore (Optional but good practice)
      // await deleteDoc(doc(db, "users", user.uid));

      await deleteUser(user);
      navigate("/login");
    } catch (err) {
      showToast("Re-authentication failed", "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const sidebarItems = [
    { id: "account", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "financial", label: "Billing", icon: ShieldCheck },
    { id: "emergency", label: "SOS Mode", icon: HeartPulse },
    { id: "appearance", label: "Appearance", icon: Palette }
  ];

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500`}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 font-black uppercase tracking-widest text-[10px] ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              }`}
          >
            {toast.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto p-4 md:p-10">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(-1)}
              className="p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-xl hover:scale-110 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-indigo-600" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Command <span className="text-indigo-600">Center</span></h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Configuration & Safety</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all ${activeTab === item.id
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none"
                  : "bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 border border-slate-100 dark:border-slate-800"
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100 dark:border-slate-800"
              >
                {activeTab === "account" && (
                  <div className="space-y-12">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                        <Lock className="text-indigo-500" /> Security Protocol
                      </h2>
                      <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Identity Code (Current Password)</label>
                          <input
                            type="password"
                            required
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                            className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-black border-none outline-indigo-500 transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">New Cipher</label>
                          <input
                            type="password"
                            required
                            value={passwords.next}
                            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                            className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-black border-none outline-indigo-500 transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Confirm Cipher</label>
                          <input
                            type="password"
                            required
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-black border-none outline-indigo-500 transition-all"
                            placeholder="••••••••"
                          />
                        </div>
                        <button
                          disabled={updatingPass}
                          className="md:col-span-2 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition active:scale-95 disabled:opacity-50"
                        >
                          {updatingPass ? "ENCRYPTING..." : "UPDATE SECURITY KEY"}
                        </button>
                      </form>
                    </div>

                    <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xl font-black text-red-500 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                        <Trash2 /> Danger Zone
                      </h3>
                      <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-[2rem] border border-red-100 dark:border-red-900/20">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                          Deleting your account is irreversible. All your residency data, visitor logs, and payment history will be purged from the Smart Society mainframe.
                        </p>
                        <button
                          onClick={() => setShowDeleteModal(true)}
                          className="px-8 py-4 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition"
                        >
                          INITIATE ACCOUNT PURGE
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                      <Bell className="text-amber-500" /> Alert Dispatcher
                    </h2>
                    <div className="space-y-4">
                      <Toggle
                        icon={ShieldCheck}
                        label="Security Alerts"
                        desc="Instant SOS and guest arrival alerts"
                        checked={settings.notifications.security}
                        onChange={(v) => handleToggle("notifications.security", v)}
                      />
                      <Toggle
                        icon={LogOut}
                        label="Society Broadcasts"
                        desc="Important announcements and event notices"
                        checked={settings.notifications.announcements}
                        onChange={(v) => handleToggle("notifications.announcements", v)}
                      />
                      <Toggle
                        icon={Smartphone}
                        label="Visitor Feed"
                        desc="Notifications when guests arrive at the gate"
                        checked={settings.notifications.visitors}
                        onChange={(v) => handleToggle("notifications.visitors", v)}
                      />
                      <Toggle
                        icon={Bell}
                        label="Billing Reminders"
                        desc="Auto-reminders 3 days before payment due date"
                        checked={settings.notifications.maintenance}
                        onChange={(v) => handleToggle("notifications.maintenance", v)}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "privacy" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                      <Eye className="text-emerald-500" /> Stealth Settings
                    </h2>
                    <div className="space-y-4">
                      <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] mb-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Directory Visibility</label>
                        <div className="grid grid-cols-2 gap-4">
                          {["Public", "Hidden", "Members Only"].map(opt => (
                            <button
                              key={opt}
                              onClick={() => handleToggle("privacy.visibility", opt)}
                              className={`p-4 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2 transition-all ${settings.privacy.visibility === opt
                                ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                : "border-transparent bg-white dark:bg-slate-700 text-slate-400"
                                }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Toggle
                        icon={Smartphone}
                        label="Visible Phone Number"
                        desc="Allow neighbors to see your contact in directory"
                        checked={settings.privacy.showPhone}
                        onChange={(v) => handleToggle("privacy.showPhone", v)}
                      />
                      <Toggle
                        icon={Globe}
                        label="Sync with Map"
                        desc="Show your unit status on the Interactive Society Map"
                        checked={settings.privacy.showUnit}
                        onChange={(v) => handleToggle("privacy.showUnit", v)}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "financial" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                      <ShieldCheck className="text-indigo-500" /> Fiscal Controls
                    </h2>
                    <div className="space-y-4">
                      <Toggle
                        icon={Key}
                        label="Autopay Maintenance"
                        desc="Auto-debit from linked UPI/Wallet on 1st of month"
                        checked={settings.financial.autoPay}
                        onChange={(v) => handleToggle("financial.autoPay", v)}
                      />
                      <Toggle
                        icon={Download}
                        label="Billing Analytics"
                        desc="Generate monthly spending and usage reports"
                        checked={settings.financial.analytics}
                        onChange={(v) => handleToggle("financial.analytics", v)}
                      />
                      <div className="pt-8 space-y-4">
                        <button className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-600 flex items-center justify-between group">
                          Download Lifetime Ledger <Download className="w-4 h-4 group-hover:translate-y-1 transition" />
                        </button>
                        <button className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl font-black text-[10px] uppercase tracking-widest text-slate-600 flex items-center justify-between group">
                          Request Tax Certificate <Globe className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "emergency" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-black text-rose-500 mb-8 flex items-center gap-3 uppercase tracking-tighter">
                      <HeartPulse className="animate-pulse" /> Guardian Protocol
                    </h2>
                    <div className="bg-rose-50 dark:bg-rose-900/10 p-8 rounded-[2.5rem] border border-rose-100 dark:border-rose-900/20 mb-8">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-2">SOS Configuration</p>
                      <h3 className="text-lg font-black text-rose-950 dark:text-white">The red SOS button on your dashboard will immediately utilize these rules.</h3>
                    </div>
                    <div className="space-y-4">
                      <Toggle
                        icon={ShieldAlert}
                        label="Silent SOS"
                        desc="Disable loud alarms on your device when triggering SOS"
                        checked={settings.emergency.silentSOS}
                        onChange={(v) => handleToggle("emergency.silentSOS", v)}
                      />
                      <Toggle
                        icon={Lock}
                        label="Late Entry Monitor"
                        desc="Alert family if you haven't entered society by 11 PM"
                        checked={settings.emergency.trackLateEntry}
                        onChange={(v) => handleToggle("emergency.trackLateEntry", v)}
                      />
                    </div>
                    <div className="pt-12">
                      <button
                        onClick={() => navigate("/edit-profile")}
                        className="w-full p-6 bg-rose-600 text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-200"
                      >
                        MANAGE EMERGENCY CONTACTS
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "appearance" && (
                  <div className="space-y-12">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-tighter">
                      <Palette className="text-purple-500" /> UI Customization
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div
                        onClick={() => handleToggle("darkMode", false)}
                        className={`p-8 rounded-[2.5rem] border-4 cursor-pointer transition-all ${!settings.darkMode ? "border-indigo-600 bg-white shadow-2xl" : "border-transparent bg-slate-50 opacity-50"}`}
                      >
                        <Sun className="w-12 h-12 text-amber-500 mb-4" />
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Light Mode</h3>
                        <p className="text-[9px] font-bold text-slate-400 mt-2">Maximum clarity for daylight use.</p>
                      </div>
                      <div
                        onClick={() => handleToggle("darkMode", true)}
                        className={`p-8 rounded-[2.5rem] border-4 cursor-pointer transition-all ${settings.darkMode ? "border-indigo-600 bg-slate-800 shadow-2xl" : "border-transparent bg-slate-100 opacity-50"}`}
                      >
                        <Moon className="w-12 h-12 text-indigo-400 mb-4" />
                        <h3 className="font-black text-white uppercase tracking-widest text-[10px]">Dark Mode</h3>
                        <p className="text-[9px] font-bold text-slate-500 mt-2">Easier on the eyes in late hours.</p>
                      </div>
                    </div>
                    <div className="pt-8">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Sidebar Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => handleToggle("language", e.target.value)}
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] font-black border-none outline-indigo-500 appearance-none uppercase tracking-widest text-xs"
                      >
                        <option>English</option>
                        <option>Hindi / हिंदी</option>
                        <option>Marathi / मराठी</option>
                        <option>Gujarati / ગુજરાતી</option>
                      </select>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] max-w-md w-full text-center border border-rose-100 dark:border-rose-900/30"
            >
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
                <UserX className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Permanent Purge</h2>
              <p className="text-slate-500 font-bold mb-8 uppercase tracking-widest text-[10px]">Verify your identity to finalize account deletion</p>

              <input
                type="password"
                placeholder="Enter Current Cipher"
                value={reAuthPass}
                onChange={(e) => setReAuthPass(e.target.value)}
                className="w-full p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black mb-6 text-center border-none outline-rose-500"
              />

              <div className="flex gap-4">
                <button
                  onClick={handleAccountDeletion}
                  className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  DELETE PERMANENTLY
                </button>
                <button
                  onClick={() => { setShowDeleteModal(false); setReAuthPass(""); }}
                  className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  ABORT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Toggle = ({ icon: Icon, label, desc, checked, onChange }) => (
  <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center gap-6 group hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
    <div className={`p-4 rounded-2xl ${checked ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-600 text-slate-400 shadow-sm'}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">{label}</h4>
      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{desc}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`w-14 h-8 rounded-full p-1 transition-all flex items-center ${checked ? 'bg-indigo-600 justify-end' : 'bg-slate-200 dark:bg-slate-600 justify-start'}`}
    >
      <motion.div layout className="w-6 h-6 bg-white rounded-full shadow-lg" />
    </button>
  </div>
);

export default Settings;
