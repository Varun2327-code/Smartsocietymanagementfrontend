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
} from 'firebase/firestore';
import { db } from '../firebase';
import useUserRole from '../hooks/useUserRole';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const { role: userRole } = useUserRole();

  const [form, setForm] = useState({
    name: '',
    date: '',
    time: '',
    location: '',
    category: '',
    description: '',
  });

  useEffect(() => {
    const fetchEvents = async () => {
      // ✅ Users also see ALL events now (approved, pending, rejected)
      const q = query(
        collection(db, 'events'),
        orderBy('date', sortAsc ? 'asc' : 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEvents(data);
    };

    if (userRole) {
      fetchEvents();
    }
  }, [sortAsc, userRole]);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.time || !form.location) return;

    const eventData = {
      ...form,
      rsvpCount: 0,
      status: 'pending',
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'events'), eventData);
    setEvents((prev) => [...prev, { id: docRef.id, ...eventData }]);

    setForm({ name: '', date: '', time: '', location: '', category: '', description: '' });
    setShowEventForm(false);

    if (userRole !== 'admin') {
      alert('Event submitted successfully! It is pending admin approval.');
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'events', id));
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const filteredEvents = events.filter(
    (e) =>
      (e.name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (e.location?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (e.category?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const csvRows = [
      ['Event Name', 'Date', 'Time', 'Location', 'Category', 'Status'],
      ...filteredEvents.map((e) => [e.name, e.date, e.time, e.location, e.category, e.status]),
    ];
    const blob = new Blob([csvRows.map((e) => e.join(',')).join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'events.csv';
    a.click();
  };

  if (!userRole) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => (window.location.href = '/')}
        className="mb-4 bg-gray-300 px-4 py-2 rounded"
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-center">Community Events</h1>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
        <input
          type="text"
          placeholder="Search by name, location or category"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-3 rounded w-full sm:w-80"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Sort: {sortAsc ? '↑ Date' : '↓ Date'}
          </button>
          <button
            onClick={exportCSV}
            className="bg-indigo-500 text-white px-4 py-2 rounded"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {showEventForm ? 'Cancel' : 'Add Event'}
          </button>
        </div>
      </div>

      {/* Event Form */}
      {showEventForm && (
        <form
          onSubmit={handleAddEvent}
          className="bg-white p-6 rounded shadow mb-6 space-y-4"
        >
          <input
            type="text"
            placeholder="Event Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border p-3 rounded"
          />
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full border p-3 rounded"
          />
          <input
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            className="w-full border p-3 rounded"
          />
          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full border p-3 rounded"
          />
          <input
            type="text"
            placeholder="Category (e.g., Festival, Meeting)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border p-3 rounded"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border p-3 rounded"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Save Event
          </button>
        </form>
      )}

      {/* Event List */}
      <div className="bg-white p-6 rounded-lg shadow">
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          <ul className="space-y-4">
            {filteredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();
              return (
                <li
                  key={event.id}
                  className="p-4 border rounded shadow-sm flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">{event.name}</h3>
                    <p>
                      {event.date} at {event.time} • {event.location}
                    </p>
                    {event.category && (
                      <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                        {event.category}
                      </span>
                    )}
                    {event.description && (
                      <p className="text-sm text-gray-700 mt-1">
                        {event.description}
                      </p>
                    )}
                    <p
                      className={`text-xs font-medium ${
                        isPast ? 'text-red-500' : 'text-green-600'
                      }`}
                    >
                      Status: {isPast ? 'Past' : 'Upcoming'}
                    </p>
                    {event.status && (
                      <p
                        className={`text-xs font-medium ${
                          event.status === 'approved'
                            ? 'text-green-600'
                            : event.status === 'pending'
                            ? 'text-yellow-600'
                            : event.status === 'rejected'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        Approval Status:{' '}
                        {event.status.charAt(0).toUpperCase() +
                          event.status.slice(1)}
                      </p>
                    )}
                    <p className="text-xs">RSVPs: {event.rsvpCount || 0}</p>
                  </div>

                  {/* User actions */}
                  <div className="flex flex-col ml-4 gap-2">
                    <button
                      disabled={event.status !== 'approved'}
                      className={`px-3 py-1 rounded text-sm ${
                        event.status === 'approved'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      RSVP
                    </button>
                    {userRole === 'admin' && (
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Events;
