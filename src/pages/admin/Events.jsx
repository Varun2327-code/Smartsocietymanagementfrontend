import React, { useEffect, useState, useMemo } from "react";
import { db, storage } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from "framer-motion";

// Advanced Admin Events System
// - Categories
// - Image upload (Firebase Storage)
// - Status: approved / pending / rejected
// - Drawer for event details
// - RSVP count (attendees array length)
// - Sorting, Search, Filters
// - Edit / Delete and Admin quick actions

// NOTE: This component expects `db` and `storage` to be initialized in ../../firebase
// Tailwind CSS utility classes are used for styling. Framer Motion powers small animations.

const CATEGORIES = ["Festival", "Meeting", "Function", "Sports", "Other"];

export default function EventsAdmin() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("upcoming"); // 'upcoming' | 'newest'

  // Form / Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerEvent, setDrawerEvent] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const initialForm = {
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    organizer: "",
    category: "Festival",
    bannerFile: null,
    bannerUrl: "",
    attendees: [],
    status: "pending",
  };

  const [form, setForm] = useState(initialForm);

  // fetch events
  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "events"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!mounted) return;
        setEvents(list);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => (mounted = false);
  }, []);

  // Derived filtered & sorted list
  const filteredEvents = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = events.slice();

    if (categoryFilter !== "All") {
      list = list.filter((e) => e.category === categoryFilter);
    }
    if (statusFilter !== "All") {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (s) {
      list = list.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(s) ||
          (e.organizer || "").toLowerCase().includes(s) ||
          (e.description || "").toLowerCase().includes(s)
      );
    }

    // Sorting
    if (sortBy === "upcoming") {
      list.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === "newest") {
      // If you store a createdAt timestamp in Firestore, use it. We'll fallback to id order.
      list.sort((a, b) => {
        if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
        return b.id.localeCompare(a.id) * -1;
      });
    }

    return list;
  }, [events, search, categoryFilter, statusFilter, sortBy]);

  // helpers
  const uploadBanner = async (file) => {
    if (!file) return null;
    const fileRef = ref(storage, `event_banners/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return url;
  };

  const openCreateForm = () => {
    setEditing(null);
    setForm(initialForm);
    setIsFormOpen(true);
  };

  const openEditForm = (event) => {
    setEditing(event);
    setForm({ ...event, bannerFile: null });
    setIsFormOpen(true);
  };

  const openDrawer = (event) => {
    setDrawerEvent(event);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerEvent(null);
    setIsDrawerOpen(false);
  };

  // Create or update event
  const handleSave = async () => {
    try {
      // Basic validation
      if (!form.title || !form.date) {
        alert("Please provide at least a title and date.");
        return;
      }

      let bannerUrl = form.bannerUrl || "";
      if (form.bannerFile) {
        bannerUrl = await uploadBanner(form.bannerFile);
      }

      const payload = {
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time || "",
        location: form.location || "",
        organizer: form.organizer || "",
        category: form.category || "Other",
        bannerUrl,
        attendees: form.attendees || [],
        status: form.status || (editing ? form.status : "pending"),
        createdAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, "events", editing.id), payload);
        setEvents((prev) => prev.map((p) => (p.id === editing.id ? { ...p, ...payload } : p)));
      } else {
        const refDoc = await addDoc(collection(db, "events"), payload);
        setEvents((prev) => [...prev, { id: refDoc.id, ...payload }]);
      }

      setIsFormOpen(false);
      setEditing(null);
      setForm(initialForm);
    } catch (err) {
      console.error(err);
      alert("Failed to save event. Check console.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event permanently?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete.");
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "events", id), { status });
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    } catch (err) {
      console.error(err);
      alert("Failed to change status.");
    }
  };

  // RSVP: toggling for admin convenience (not real user RSVP). In real app, RSVP by end-users.
  const toggleRSVP = async (event) => {
    // For admin demo: add/remove a fake attendee named 'Admin' with id 'admin'
    const hasAdmin = (event.attendees || []).some((a) => a.id === "admin");
    const updated = hasAdmin
      ? (event.attendees || []).filter((a) => a.id !== "admin")
      : [...(event.attendees || []), { id: "admin", name: "Admin" }];

    try {
      await updateDoc(doc(db, "events", event.id), { attendees: updated });
      setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, attendees: updated } : e)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Events — Admin Console</h2>
        <div className="flex gap-2">
          <button
            onClick={openCreateForm}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          >
            + New Event
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <input
          className="border rounded p-2"
          placeholder="Search title / organizer / desc"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded p-2"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option>All</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          className="border rounded p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All</option>
          <option>approved</option>
          <option>pending</option>
          <option>rejected</option>
        </select>

        <select
          className="border rounded p-2"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="upcoming">Upcoming first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
          <div className="h-24 bg-gray-100 rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredEvents.map((ev) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                key={ev.id}
                className="bg-white rounded-lg shadow p-4 flex flex-col"
              >
                {/* banner */}
                <div className="h-40 w-full overflow-hidden rounded">
                  {ev.bannerUrl ? (
                    <img
                      src={ev.bannerUrl}
                      alt="banner"
                      className="w-full h-full object-cover"
                      onClick={() => openDrawer(ev)}
                    />
                  ) : (
                    <div
                      className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
                      onClick={() => openDrawer(ev)}
                    >
                      No banner
                    </div>
                  )}
                </div>

                <div className="flex-1 mt-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{ev.title}</h3>
                      <div className="text-sm text-gray-500">{ev.organizer}</div>
                    </div>

                    <div className="text-xs">
                      <span
                        className={`px-2 py-1 rounded text-white text-xs ${
                          ev.status === "approved"
                            ? "bg-green-600"
                            : ev.status === "pending"
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      >
                        {ev.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">{ev.description}</p>

                  <div className="mt-3 text-sm text-gray-700">
                    <div>📅 {ev.date} {ev.time}</div>
                    <div>📍 {ev.location}</div>
                    <div className="mt-2">
                      <span className="inline-block bg-gray-100 px-2 py-1 text-xs rounded">
                        {ev.category || "Other"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRSVP(ev)}
                      className="bg-blue-50 px-3 py-1 rounded text-sm"
                    >
                      RSVP ({(ev.attendees || []).length})
                    </button>

                    <button
                      onClick={() => openDrawer(ev)}
                      className="bg-white border px-3 py-1 rounded text-sm"
                    >
                      Details
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeStatus(ev.id, "approved")}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => changeStatus(ev.id, "rejected")}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => openEditForm(ev)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="bg-gray-200 text-red-600 px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredEvents.length === 0 && (
        <div className="mt-8 text-center text-gray-500">
          No events match your filters.
        </div>
      )}

      {/* Drawer: details */}
      <AnimatePresence>
        {isDrawerOpen && drawerEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex"
          >
            <div
              className="bg-black/40 absolute inset-0"
              onClick={closeDrawer}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween' }}
              className="ml-auto w-full md:w-1/3 bg-white h-full p-6 overflow-auto z-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{drawerEvent.title}</h3>
                  <div className="text-sm text-gray-500">{drawerEvent.organizer}</div>
                </div>
                <div>
                  <button onClick={closeDrawer} className="text-gray-500">Close</button>
                </div>
              </div>

              {drawerEvent.bannerUrl && (
                <img src={drawerEvent.bannerUrl} alt="banner" className="w-full mt-4 rounded h-48 object-cover" />
              )}

              <div className="mt-4 text-gray-700">
                <p>{drawerEvent.description}</p>

                <div className="mt-3">
                  📅 {drawerEvent.date} {drawerEvent.time} <br />
                  📍 {drawerEvent.location} <br />
                  Category: <strong>{drawerEvent.category}</strong> <br />
                  Status: <strong>{drawerEvent.status}</strong>
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold">Attendees ({(drawerEvent.attendees || []).length})</h4>
                  <ul className="mt-2 space-y-1">
                    {(drawerEvent.attendees || []).map((a) => (
                      <li key={a.id} className="text-sm text-gray-700">{a.name}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEditForm(drawerEvent)} className="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                  <button onClick={() => handleDelete(drawerEvent.id)} className="px-3 py-1 bg-gray-200 text-red-600 rounded">Delete</button>
                  <button onClick={() => changeStatus(drawerEvent.id, 'approved')} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                  <button onClick={() => changeStatus(drawerEvent.id, 'rejected')} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Create / Edit form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-black/40 absolute inset-0" onClick={() => setIsFormOpen(false)} />

            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative z-50 w-full md:w-2/3 lg:w-1/2 bg-white rounded shadow p-6 max-h-[90vh] overflow-auto"
            >
              <h3 className="text-lg font-bold mb-3">{editing ? "Edit Event" : "Create Event"}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border p-2 rounded" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
                <input className="border p-2 rounded" placeholder="Organizer" value={form.organizer} onChange={(e)=>setForm({...form,organizer:e.target.value})} />
                <input type="date" className="border p-2 rounded" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} />
                <input type="time" className="border p-2 rounded" value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})} />
                <input className="border p-2 rounded" placeholder="Location" value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} />

                <select className="border p-2 rounded" value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}>
                  {CATEGORIES.map(c=> <option key={c}>{c}</option>)}
                </select>

                <select className="border p-2 rounded" value={form.status} onChange={(e)=>setForm({...form,status:e.target.value})}>
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>

                <label className="col-span-1 md:col-span-2">
                  <div className="text-sm text-gray-600 mb-1">Banner image (optional)</div>
                  <input type="file" accept="image/*" onChange={(e)=>setForm({...form,bannerFile:e.target.files?.[0]})} />
                </label>

                <textarea className="border p-2 rounded md:col-span-2" rows={4} placeholder="Description" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />

              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>{setIsFormOpen(false); setEditing(null); setForm(initialForm);}}>Cancel</button>
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSave}>{editing? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
