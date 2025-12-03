import React, { useState } from "react";
import {
  BellIcon,
  LockClosedIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 🔔 Toast System
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleDeleteAccount = () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      showToast("Click again to confirm account deletion", "warning");
      setTimeout(() => setShowDeleteConfirm(false), 4000);
    } else {
      showToast("Account deleted successfully", "success");
      console.log("User account deleted (placeholder)");
      // TODO: integrate Firebase delete user logic
    }
  };

  const cardClass = `bg-white ${
    darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
  } shadow-md rounded-xl transition-all`;

  return (
    <div
      className={`min-h-screen p-6 md:p-10 transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* 🔙 Back Button */}
      <button
        onClick={() => window.history.back()}
        className={`flex items-center mb-6 text-blue-600 hover:text-blue-800 transition-colors`}
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2" />
        Back
      </button>

      <h1 className="text-3xl font-semibold mb-8">Society Settings ⚙️</h1>

      {/* ✅ Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg flex items-center shadow-lg z-50 ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-yellow-400 text-black"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircleIcon className="w-5 h-5 mr-2" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          )}
          {toast.message}
        </div>
      )}

      {/* ⚙️ Settings Sections */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* 🔐 Account Settings */}
        <div id="account" className={cardClass}>
          <SectionHeader
            icon={LockClosedIcon}
            title="Account Settings"
            subtitle="Manage your security preferences"
            darkMode={darkMode}
          />
          <form className="p-6 space-y-4">
            <InputField label="Current Password" type="password" />
            <InputField label="New Password" type="password" />
            <InputField label="Confirm Password" type="password" />
            <button
              type="button"
              className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all"
              onClick={() => showToast("Password updated successfully")}
            >
              Update Password
            </button>
          </form>
        </div>

        {/* 🔔 Notifications */}
        <div id="notifications" className={cardClass}>
          <SectionHeader
            icon={BellIcon}
            title="Notifications"
            subtitle="Choose how you want to be notified"
            darkMode={darkMode}
          />
          <div className="p-6 space-y-4">
            <ToggleItem
              title="Society Announcements"
              desc="Receive important updates from society"
              enabled={notificationsEnabled}
              onToggle={() => {
                setNotificationsEnabled(!notificationsEnabled);
                showToast(
                  notificationsEnabled
                    ? "Announcements turned off"
                    : "Announcements enabled"
                );
              }}
              darkMode={darkMode}
            />
            <ToggleItem
              title="Maintenance Reminders"
              desc="Get notified about upcoming maintenance"
              enabled={notificationsEnabled}
              onToggle={() => {
                setNotificationsEnabled(!notificationsEnabled);
                showToast(
                  notificationsEnabled
                    ? "Reminders turned off"
                    : "Reminders enabled"
                );
              }}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* 📋 Maintenance */}
        <div id="maintenance" className={cardClass}>
          <SectionHeader
            icon={ClipboardDocumentListIcon}
            title="Maintenance & Billing"
            subtitle="Manage your maintenance preferences"
            darkMode={darkMode}
          />
          <div className="p-6 space-y-4">
            <ToggleItem
              title="Maintenance Due Alerts"
              desc="Receive alerts before due date"
              enabled={notificationsEnabled}
              onToggle={() => {
                setNotificationsEnabled(!notificationsEnabled);
                showToast("Maintenance alert settings updated");
              }}
              darkMode={darkMode}
            />
            <ToggleItem
              title="Auto-Pay"
              desc="Enable automatic payment processing"
              enabled={autoPayEnabled}
              onToggle={() => {
                setAutoPayEnabled(!autoPayEnabled);
                showToast(
                  autoPayEnabled ? "Auto-pay disabled" : "Auto-pay enabled"
                );
              }}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* 🌓 Appearance */}
        <div id="appearance" className={cardClass}>
          <SectionHeader
            icon={BellIcon}
            title="Appearance"
            subtitle="Customize your theme and layout"
            darkMode={darkMode}
          />
          <div className="p-6">
            <ToggleItem
              title="Dark Mode"
              desc="Enable dark mode for better night-time visibility"
              enabled={darkMode}
              onToggle={() => {
                setDarkMode(!darkMode);
                showToast(
                  darkMode ? "Switched to Light Mode" : "Switched to Dark Mode"
                );
              }}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* 🔒 Privacy & Security */}
        <div id="privacy" className={cardClass}>
          <SectionHeader
            icon={ShieldCheckIcon}
            title="Privacy & Security"
            subtitle="Manage your data and account settings"
            darkMode={darkMode}
          />
          <div className="p-6">
            <p
              className={`text-sm mb-4 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Manage your privacy preferences and account data.
            </p>
            <button
              onClick={handleDeleteAccount}
              className={`flex items-center text-red-600 hover:text-red-700 transition-all ${
                showDeleteConfirm ? "animate-pulse" : ""
              }`}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {showDeleteConfirm
                ? "Click again to confirm deletion"
                : "Delete my account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Components ---------------- */
const SectionHeader = ({ icon: Icon, title, subtitle, darkMode }) => (
  <div
    className={`flex items-center gap-3 p-4 border-b ${
      darkMode ? "border-gray-700" : "border-gray-200"
    }`}
  >
    <Icon className="w-6 h-6 text-blue-600" />
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  </div>
);

const ToggleItem = ({ title, desc, enabled, onToggle, darkMode }) => (
  <div
    className={`flex items-center justify-between py-2 ${
      darkMode ? "text-gray-300" : "text-gray-800"
    }`}
  >
    <div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={enabled}
        onChange={onToggle}
        className="sr-only"
      />
      <div
        className={`w-11 h-6 rounded-full transition-all ${
          enabled ? "bg-blue-600" : "bg-gray-300"
        }`}
      />
      <div
        className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : ""
        }`}
      />
    </label>
  </div>
);

const InputField = ({ label, type }) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <input
      type={type}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      required
    />
  </div>
);

export default Settings;
