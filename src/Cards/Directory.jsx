import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import useUserRole from "../hooks/useUserRole";
import { FiSearch, FiSun, FiMoon, FiDownload, FiPlus, FiGrid, FiList } from "react-icons/fi";

/**
 * Directory.jsx
 * Upgraded Society Directory component (cards + table, filters, add drawer, exports)
 *
 * Requirements:
 * - Tailwind CSS
 * - framer-motion
 * - useUserRole hook in ../hooks/useUserRole (returns { role } or similar)
 *
 * Drop into your routes and import like: import Directory from './pages/Directory';
 */

const sampleContacts = [
  { name: "Harshad Patel", designation: "Watchman", phone: "9876543210", email: "harshad@watchman.com" },
  { name: "Peter Parker", designation: "Security Guard", phone: "9876543211", email: "peter@security.com" },
  { name: "Ravi Kumar", designation: "Manager", phone: "9876543212", email: "ravi.kumar@manager.com" },
  { name: "Anjali Singh", designation: "Cleaner", phone: "9876543213", email: "anjali.singh@cleaner.com" },
  { name: "Vikram Sharma", designation: "Electrician", phone: "9876543214", email: "vikram.sharma@electrician.com" },
  { name: "Priya Patel", designation: "Plumber", phone: "9876543215", email: "priya.patel@plumber.com" },
];

const avatarColors = [
  "from-indigo-500 to-indigo-700",
  "from-rose-500 to-rose-600",
  "from-emerald-500 to-emerald-700",
  "from-yellow-400 to-yellow-600",
  "from-pink-500 to-pink-600",
  "from-sky-500 to-sky-700",
];

const Directory = () => {
  const navigate = useNavigate();
  const { role } = useUserRole(); // expects { role } — 'admin' or 'resident' etc.
  const [contacts, setContacts] = useState(sampleContacts);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'table'
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", designation: "", phone: "", email: "" });
  const [selectedIds, setSelectedIds] = useState(new Set());

  const roles = useMemo(() => {
    const setRoles = new Set(contacts.map((c) => c.designation));
    return Array.from(setRoles);
  }, [contacts]);

  const totalContacts = contacts.length;
  const departments = roles.length;

  // Derived filtered + sorted
  const filteredContacts = useMemo(() => {
    const q = contacts
      .filter((c) => {
        const matchesSearch =
          !search ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.designation.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          c.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !filterRole || c.designation === filterRole;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => (sortAsc ? a.designation.localeCompare(b.designation) : b.designation.localeCompare(a.designation)));
    return q;
  }, [contacts, search, filterRole, sortAsc]);

  // Avatar helper
  const getInitials = (name = "") =>
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const getAvatarClass = (name = "") => {
    const idx = (name?.length || 0) % avatarColors.length;
    return avatarColors[idx];
  };

  // Add contact (admin only)
  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.designation.trim()) {
      alert("Please provide at least name and designation.");
      return;
    }
    const email = newContact.email?.trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please provide a valid email or leave it empty.");
      return;
    }
    if (newContact.phone && !/^[0-9+ -]{6,}$/.test(newContact.phone)) {
      alert("Please provide a valid phone number or leave it empty.");
      return;
    }

    const contact = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      designation: newContact.designation.trim(),
      phone: newContact.phone.trim(),
      email: newContact.email.trim(),
    };
    setContacts((prev) => [contact, ...prev]);
    setNewContact({ name: "", designation: "", phone: "", email: "" });
    setDrawerOpen(false);
  };

  const handleDelete = (email) => {
    if (!confirm("Delete this contact?")) return;
    setContacts((prev) => prev.filter((c) => c.email !== email));
  };

  // Exports
  const handleExportCSV = () => {
    const header = ["Name", "Designation", "Phone", "Email"];
    const rows = contacts.map((c) => [c.name, c.designation, c.phone, c.email]);
    const csvContent = [header, ...rows].map((r) => r.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `directory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `directory_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Selection for bulk actions
  const toggleSelect = (email) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(email)) copy.delete(email);
      else copy.add(email);
      return copy;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return alert("No contacts selected");
    if (!confirm(`Delete ${selectedIds.size} contacts? This cannot be undone.`)) return;
    setContacts((prev) => prev.filter((c) => !selectedIds.has(c.email)));
    clearSelection();
  };

  // small motion variants
  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
  };

  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen p-6 bg-gradient-to-br from-slate-50 to-white`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600">
              Society Directory
            </h1>
            <p className="mt-1 text-sm text-gray-600">Quickly find staff & service providers — call or email with one click.</p>
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
              <span className="px-3 py-1 rounded-full bg-gray-100">{totalContacts} contacts</span>
              <span className="px-3 py-1 rounded-full bg-gray-100">{departments} departments</span>
              <span className="px-3 py-1 rounded-full bg-gray-100">Last updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, role, phone, email..."
                className="outline-none text-sm w-64"
              />
              {search && (
                <button onClick={() => setSearch("")} className="ml-2 text-xs text-gray-500">Clear</button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 rounded-lg ${viewMode === "cards" ? "bg-indigo-600 text-white" : "bg-white border"}`}
                aria-pressed={viewMode === "cards"}
                title="Card view"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-lg ${viewMode === "table" ? "bg-indigo-600 text-white" : "bg-white border"}`}
                aria-pressed={viewMode === "table"}
                title="Table view"
              >
                <FiList />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortAsc((s) => !s)}
                className="px-3 py-2 bg-white border rounded-lg text-sm"
                title="Toggle sort"
              >
                Sort {sortAsc ? "A→Z" : "Z→A"}
              </button>

              <button onClick={handleExportCSV} className="px-3 py-2 bg-white border rounded-lg text-sm flex items-center gap-2">
                <FiDownload /> CSV
              </button>

              <button onClick={handleExportJSON} className="px-3 py-2 bg-white border rounded-lg text-sm flex items-center gap-2">
                <FiDownload /> JSON
              </button>

              <button onClick={() => setDarkMode((d) => !d)} className="px-3 py-2 bg-white border rounded-lg" title="Toggle theme">
                {darkMode ? <FiSun /> : <FiMoon />}
              </button>
            </div>
          </div>
        </div>

        {/* Filter chips + Bulk actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterRole("")}
              className={`px-3 py-1 rounded-lg ${filterRole === "" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
            >
              All
            </button>
            {roles.map((r, i) => (
              <button
                key={r}
                onClick={() => setFilterRole((prev) => (prev === r ? "" : r))}
                className={`px-3 py-1 rounded-lg ${filterRole === r ? "bg-indigo-600 text-white" : "bg-gray-100"}`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-yellow-100 rounded">Selected: {selectedIds.size}</span>
                {role === "admin" && (
                  <button onClick={handleBulkDelete} className="px-3 py-1 bg-red-600 text-white rounded">Delete Selected</button>
                )}
                <button onClick={clearSelection} className="px-3 py-1 bg-gray-100 rounded">Clear</button>
              </div>
            )}

            {role === "admin" && (
              <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg">
                <FiPlus /> Add Contact
              </button>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 gap-6">
          {viewMode === "cards" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredContacts.map((c) => (
                  <motion.div
                    key={c.email || c.name}
                    layout
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={cardVariants}
                    className="bg-white rounded-2xl shadow p-4 relative border"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarClass(c.name)} flex items-center justify-center text-white font-semibold text-lg`}>
                        {getInitials(c.name)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-800">{c.name}</h3>
                            <p className="text-sm text-gray-500">{c.designation}</p>
                          </div>
                          <div className="text-sm text-gray-400">{/* small placeholder */}</div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <a href={`tel:${c.phone}`} className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200">Call</a>
                          <a href={`mailto:${c.email}`} className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200">Email</a>
                        </div>
                      </div>
                    </div>

                    {/* selection & admin actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.email)}
                        onChange={() => toggleSelect(c.email)}
                        className="h-4 w-4"
                        aria-label={`Select ${c.name}`}
                      />
                    </div>

                    {role === "admin" && (
                      <div className="mt-4 flex items-center justify-between">
                        <button onClick={() => handleDelete(c.email)} className="text-red-600 text-sm">Delete</button>
                        {/* optionally more admin actions */}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm">Select</th>
                      <th className="px-4 py-3 text-left text-sm">Name</th>
                      <th className="px-4 py-3 text-left text-sm">Designation</th>
                      <th className="px-4 py-3 text-left text-sm">Phone</th>
                      <th className="px-4 py-3 text-left text-sm">Email</th>
                      {role === "admin" && <th className="px-4 py-3 text-left text-sm">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredContacts.map((c) => (
                      <tr key={c.email}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.has(c.email)} onChange={() => toggleSelect(c.email)} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarClass(c.name)} flex items-center justify-center text-white font-semibold text-sm`}>
                              {getInitials(c.name)}
                            </div>
                            <div>
                              <div className="font-semibold">{c.name}</div>
                              <div className="text-xs text-gray-500 hidden sm:block">{c.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{c.designation}</td>
                        <td className="px-4 py-3 text-sm"><a className="text-indigo-600" href={`tel:${c.phone}`}>{c.phone}</a></td>
                        <td className="px-4 py-3 text-sm"><a className="text-indigo-600" href={`mailto:${c.email}`}>{c.email}</a></td>
                        {role === "admin" && (
                          <td className="px-4 py-3 text-sm">
                            <button onClick={() => handleDelete(c.email)} className="text-red-600">Delete</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer for adding contact (admin) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 md:left-1/4 md:right-1/4 bg-white rounded-t-2xl shadow-2xl p-6 z-50 border"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add New Contact</h3>
                <button onClick={() => setDrawerOpen(false)} className="text-gray-500">Close</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={newContact.name} onChange={(e) => setNewContact((s) => ({ ...s, name: e.target.value }))} placeholder="Full name" className="p-2 border rounded" />
                <input value={newContact.designation} onChange={(e) => setNewContact((s) => ({ ...s, designation: e.target.value }))} placeholder="Designation" className="p-2 border rounded" />
                <input value={newContact.phone} onChange={(e) => setNewContact((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" className="p-2 border rounded" />
                <input value={newContact.email} onChange={(e) => setNewContact((s) => ({ ...s, email: e.target.value }))} placeholder="Email" className="p-2 border rounded" />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                <button onClick={handleAddContact} className="px-4 py-2 rounded bg-indigo-600 text-white">Add Contact</button>
              </div>
            </motion.div>

            {/* backdrop */}
            <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/30 z-30" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Directory;
