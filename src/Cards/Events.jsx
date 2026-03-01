import React, { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import useUserRole from '../hooks/useUserRole';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Trash2,
  CheckCircle,
  XCircle,
  Edit2,
  Users,
  Download,
  Filter,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Info,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const { role: userRole } = useUserRole();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Festival',
    description: '',
    organizer: '',
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'events'),
        orderBy('date', sortAsc ? 'asc' : 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      fetchEvents();
    }
  }, [sortAsc, userRole]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.time || !form.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const eventData = {
        title: form.title,
        date: form.date,
        time: form.time,
        location: form.location,
        category: form.category || 'General',
        description: form.description || '',
        organizer: form.organizer || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Resident',
        status: userRole === 'admin' ? 'approved' : 'pending',
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'Anonymous',
        attendees: [],
      };

      if (editMode && editingEventId) {
        await updateDoc(doc(db, 'events', editingEventId), {
          title: form.title,
          date: form.date,
          time: form.time,
          location: form.location,
          category: form.category || 'General',
          description: form.description || '',
          organizer: form.organizer || 'Resident',
        });
        toast.success('Event updated successfully!');
      } else {
        await addDoc(collection(db, 'events'), eventData);
        toast.success(userRole === 'admin' ? 'Event added!' : 'Event submitted for approval!');
      }

      setForm({ title: '', date: '', time: '', location: '', category: 'Festival', description: '', organizer: '' });
      setShowEventForm(false);
      setEditMode(false);
      setEditingEventId(null);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    }
  };

  const handleRSVP = async (event) => {
    if (!auth.currentUser) {
      toast.error("Please log in to RSVP");
      return;
    }

    const userId = auth.currentUser.uid;
    const userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'User';

    // Check if already RSVP'd
    const isAttending = (event.attendees || []).some(a => a.id === userId);

    try {
      const eventRef = doc(db, 'events', event.id);
      if (isAttending) {
        // Remove RSVP
        await updateDoc(eventRef, {
          attendees: arrayRemove({ id: userId, name: userName })
        });
        toast.success("RSVP removed");
      } else {
        // Add RSVP
        await updateDoc(eventRef, {
          attendees: arrayUnion({ id: userId, name: userName })
        });
        toast.success("RSVP confirmed!");
      }
      fetchEvents();
    } catch (error) {
      console.error("RSVP error:", error);
      toast.error("Failed to update RSVP");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'events', id), { status: newStatus });
      toast.success(`Event ${newStatus}!`);
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      toast.success('Event deleted');
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  const handleEdit = (event) => {
    setForm({
      title: event.title || event.name || '',
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category || 'Festival',
      description: event.description || '',
      organizer: event.organizer || '',
    });
    setEditingEventId(event.id);
    setEditMode(true);
    setShowEventForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredEvents = events.filter((e) => {
    const searchTarget = `${e.title || e.name || ''} ${e.location} ${e.category}`.toLowerCase();
    const matchesSearch = searchTarget.includes(search.toLowerCase());

    const eventDate = new Date(e.date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (filterStatus === 'upcoming') return matchesSearch && eventDate >= now;
    if (filterStatus === 'past') return matchesSearch && eventDate < now;
    if (filterStatus === 'pending') return matchesSearch && e.status === 'pending';

    return matchesSearch;
  });

  const exportCSV = () => {
    const csvRows = [
      ['Event Title', 'Date', 'Time', 'Location', 'Category', 'Status', 'RSVPs'],
      ...filteredEvents.map((e) => [
        e.title || e.name,
        e.date,
        e.time,
        e.location,
        e.category,
        e.status,
        (e.attendees || []).length
      ]),
    ];
    const blob = new Blob([csvRows.map((e) => e.join(',')).join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `society_events_${new Date().toLocaleDateString()}.csv`;
    a.click();
    toast.success("CSV Exported!");
  };

  const getCategoryColor = (category) => {
    const cat = category?.toLowerCase();
    if (cat?.includes('festival') || cat?.includes('celebration')) return 'bg-orange-100 text-orange-600 border-orange-200';
    if (cat?.includes('meeting') || cat?.includes('general')) return 'bg-blue-100 text-blue-600 border-blue-200';
    if (cat?.includes('sport') || cat?.includes('fitness')) return 'bg-green-100 text-green-600 border-green-200';
    if (cat?.includes('emergency') || cat?.includes('urgent')) return 'bg-red-100 text-red-600 border-red-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">Back Home</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Community Events</h1>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400"
              title="Export CSV"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setShowEventForm(!showEventForm);
                if (!showEventForm) setForm({ title: '', date: '', time: '', location: '', category: 'Festival', description: '', organizer: '' });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-1 hover:bg-blue-700 transition-shadow shadow-md active:scale-95"
            >
              <Plus size={18} />
              <span>{showEventForm ? 'Cancel' : 'Create'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search events, locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {['all', 'upcoming', 'past', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${filterStatus === status
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium flex items-center gap-1 hover:border-blue-400"
            >
              <Clock size={16} />
              {sortAsc ? 'Oldest' : 'Newest'}
            </button>
          </div>
        </div>

        {/* Event Form */}
        <AnimatePresence>
          {showEventForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <form
                onSubmit={handleAddEvent}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border dark:border-slate-800 shadow-xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="md:col-span-2">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {editMode ? 'Edit event details' : 'Post a new event'}
                  </h2>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Grand Diwali Celebration"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Organizer</label>
                  <input
                    type="text"
                    placeholder="Society Committee / Resident Name"
                    value={form.organizer}
                    onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                    className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Club House / Main Garden"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</label>
                    <input
                      type="time"
                      required
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  >
                    <option value="Festival">Festival</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Sports">Sports</option>
                    <option value="Function">Function</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Tell us more about the event..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border dark:border-slate-700 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none dark:text-white"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventForm(false);
                      setEditMode(false);
                    }}
                    className="px-6 py-2 border dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    {editMode ? 'Update Event' : 'Save Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4">
                <Calendar size={48} className="opacity-20" />
              </div>
              <p className="text-xl font-semibold text-slate-600 dark:text-slate-300">No events found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
              <button
                onClick={() => { setSearch(''); setFilterStatus('all'); }}
                className="mt-4 text-blue-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const now = new Date();
              now.setHours(0, 0, 0, 0);
              const isPast = eventDate < now;
              const isAttending = (event.attendees || []).some(a => a.id === auth.currentUser?.uid);

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={event.id}
                  className={`group bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col ${isPast ? 'opacity-70' : ''
                    }`}
                >
                  {/* Decorative Banner or Placeholder */}
                  <div className={`h-32 w-full bg-gradient-to-br ${getCategoryColor(event.category).split(' ')[0].replace('bg-', 'from-')} to-blue-500/20 relative`}>
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]"></div>
                    {event.bannerUrl ? (
                      <img src={event.bannerUrl} alt="banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center overflow-hidden">
                        <h4 className="text-4xl font-black text-white/20 whitespace-nowrap uppercase italic tracking-tighter">
                          {event.category || 'EVENT'}
                        </h4>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-xl border ${getCategoryColor(event.category)}`}>
                        {event.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                        <span className={`w-2 h-2 rounded-full ${event.status === 'approved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                            event.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></span>
                        <span className={
                          event.status === 'approved' ? 'text-green-600' :
                            event.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }>
                          {event.status}
                        </span>
                      </div>
                      {isPast && (
                        <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">PAST</span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                      {event.title || event.name}
                    </h3>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <Calendar size={16} />
                        </div>
                        <span className="font-semibold">{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                          <Clock size={16} />
                        </div>
                        <span className="font-semibold">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          <MapPin size={16} />
                        </div>
                        <span className="font-semibold line-clamp-1">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          <User size={16} />
                        </div>
                        <span className="font-semibold line-clamp-1">By {event.organizer || 'Society'}</span>
                      </div>
                    </div>

                    {event.description && (
                      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic line-clamp-2">
                          "{event.description}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex -space-x-3">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                            {(event.attendees || []).length >= i ? (event.attendees[i - 1].name[0]) : '?'}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Users size={14} />
                        {(event.attendees || []).length} Attending
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-800 flex justify-between items-center">
                    <div className="flex gap-1">
                      {userRole === 'admin' ? (
                        <>
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          {event.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(event.id, 'approved')}
                              className="p-2.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-xl transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                          Event ID: {event.id.slice(0, 6)}
                        </div>
                      )}
                    </div>

                    <button
                      disabled={event.status !== 'approved' || isPast}
                      onClick={() => handleRSVP(event)}
                      className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-tighter transition-all shadow-xl active:scale-95 ${event.status === 'approved' && !isPast
                          ? isAttending
                            ? 'bg-green-500 text-white shadow-green-500/20'
                            : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                      {isPast ? 'Ended' : isAttending ? 'Going ✓' : 'RSVP'}
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="font-black text-xs uppercase tracking-widest text-blue-600">Loading Events...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
