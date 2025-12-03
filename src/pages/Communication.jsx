// Communication.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiTrash2, FiEdit3, FiCheck, FiX, FiPlus, FiClock, FiBarChart2, FiSend } from 'react-icons/fi';

const Communication = () => {
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ question: '', options: [''], expiresAt: '' });
  const [announcement, setAnnouncement] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editingAnnouncementText, setEditingAnnouncementText] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'user', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        setCurrentUser({ uid: user.uid, role: userData.role || 'user', name: userData.name || 'Unknown' });
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const pollsQuery = query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      setPolls(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const announcementsRef = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeAnnouncements = onSnapshot(announcementsRef, (snapshot) => {
      setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribePolls();
      unsubscribeAnnouncements();
    };
  }, [currentUser]);

  const handleAddOption = () => {
    setNewPoll((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...newPoll.options];
    updated[index] = value;
    setNewPoll((prev) => ({ ...prev, options: updated }));
  };

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim() || newPoll.question.trim().length < 5) return;

    const pollData = {
      question: newPoll.question.trim(),
      options: newPoll.options.filter(opt => opt.trim()).map((opt) => ({ text: opt.trim(), votes: [] })),
      createdAt: serverTimestamp(),
      createdBy: currentUser.name,
      expiresAt: newPoll.expiresAt ? new Date(newPoll.expiresAt).toISOString() : null,
    };

    if (pollData.options.length < 2) return;

    const pollRef = await addDoc(collection(db, 'polls'), pollData);

    await addDoc(collection(db, 'announcements'), {
      content: `📊 A new poll has been created: "${newPoll.question.trim()}"`,
      createdAt: serverTimestamp(),
      userId: currentUser.uid,
      userName: currentUser.name,
      relatedPollId: pollRef.id,
    });

    setNewPoll({ question: '', options: [''], expiresAt: '' });
  };

  const handleVote = async (pollId, optionIndex) => {
    if (!currentUser) return;
    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);
    const poll = pollSnap.data();
    if (!poll) return;

    const hasVoted = poll.options.some((opt) => opt.votes?.some((v) => v.userId === currentUser.uid));
    if (hasVoted || (poll.expiresAt && new Date(poll.expiresAt) < new Date())) return;

    const updatedOptions = poll.options.map((opt, idx) => {
      const votes = Array.isArray(opt.votes) ? opt.votes : [];
      return idx === optionIndex ? { ...opt, votes: [...votes, { userId: currentUser.uid }] } : opt;
    });

    await updateDoc(pollRef, { options: updatedOptions });
  };

  const handleDeletePoll = async (pollId) => {
    await deleteDoc(doc(db, 'polls', pollId));
  };

  const handleCreateAnnouncement = async () => {
    if (!announcement.trim() || announcement.trim().length < 10) return;
    await addDoc(collection(db, 'announcements'), {
      content: announcement.trim(),
      createdAt: serverTimestamp(),
      userId: currentUser.uid,
      userName: currentUser.name,
    });
    setAnnouncement('');
  };

  const handleDeleteAnnouncement = async (id) => {
    await deleteDoc(doc(db, 'announcements', id));
  };

  const handleEditAnnouncement = async (id) => {
    if (!editingAnnouncementText.trim() || editingAnnouncementText.trim().length < 10) return;
    await updateDoc(doc(db, 'announcements', id), {
      content: editingAnnouncementText.trim(),
      updatedAt: serverTimestamp(),
    });
    setEditingAnnouncementId(null);
    setEditingAnnouncementText('');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-2xl shadow-xl">
          <div className="text-center">
            <FiMessageSquare className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Communication Hub</h2>
            <p className="text-gray-600">Please log in to participate</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Communication Hub</h1>
        <p className="text-lg text-gray-600 mb-8">Stay connected with your community</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ANNOUNCEMENTS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <FiMessageSquare className="mr-2" /> Announcements
                </h2>
              </div>

              <div className="p-6">

                {/* ===== ADMIN ONLY ANNOUNCEMENT INPUT ===== */}
                {currentUser.role === 'admin' && (
                  <div className="mb-6">
                    <textarea
                      value={announcement}
                      onChange={(e) => setAnnouncement(e.target.value)}
                      placeholder="Share an announcement..."
                      rows="3"
                      maxLength="1000"
                      className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                    />
                    <button
                      onClick={handleCreateAnnouncement}
                      disabled={announcement.trim().length < 10}
                      className="mt-3 px-5 py-2 text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FiSend /> Post
                    </button>
                  </div>
                )}

                {/* ANNOUNCEMENT LIST */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {announcements.map((ann) => (
                      <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gray-50 p-4 rounded-xl shadow-sm border relative"
                      >
                        {editingAnnouncementId === ann.id ? (
                          <div>
                            <textarea
                              className="w-full border p-2 rounded text-sm"
                              value={editingAnnouncementText}
                              onChange={(e) => setEditingAnnouncementText(e.target.value)}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => handleEditAnnouncement(ann.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"
                              >
                                <FiCheck /> Save
                              </button>
                              <button
                                onClick={() => setEditingAnnouncementId(null)}
                                className="bg-gray-300 px-3 py-1 rounded flex items-center gap-1"
                              >
                                <FiX /> Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-800 text-sm">{ann.content}</p>

                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                              <span>Posted by: {ann.userName}</span>
                              {ann.createdAt && (
                                <time>
                                  {new Date(ann.createdAt.seconds * 1000).toLocaleString()}
                                </time>
                              )}
                            </div>

                            {/* ===== ADMIN ONLY EDIT & DELETE ===== */}
                            {currentUser.role === 'admin' && (
                              <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingAnnouncementId(ann.id);
                                    setEditingAnnouncementText(ann.content);
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <FiEdit3 />
                                </button>
                                <button
                                  onClick={() => handleDeleteAnnouncement(ann.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>

          {/* POLLS */}
          <div className="space-y-8">

            {/* ===== ADMIN ONLY POLL CREATION ===== */}
            {currentUser.role === 'admin' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                  <FiBarChart2 /> Create a Poll
                </h2>

                <input
                  type="text"
                  placeholder="Enter your question"
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                  className="w-full p-3 border rounded-lg mb-3"
                />

                {newPoll.options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="w-full p-3 border rounded-lg mb-2"
                  />
                ))}

                <input
                  type="datetime-local"
                  value={newPoll.expiresAt}
                  onChange={(e) => setNewPoll({ ...newPoll, expiresAt: e.target.value })}
                  className="w-full p-3 border rounded-lg mb-3 text-sm"
                />

                <div className="flex gap-3">
                  <button onClick={handleAddOption} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg">
                    <FiPlus /> Add Option
                  </button>
                  <button onClick={handleCreatePoll} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">
                    Create Poll
                  </button>
                </div>
              </div>
            )}

            {/* POLL DISPLAY */}
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
              const hasUserVoted = poll.options.some((o) => o.votes?.some((v) => v.userId === currentUser.uid));
              const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

              return (
                <div key={poll.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold">{poll.question}</h3>

                  <div className="mt-3 space-y-2">
                    {poll.options.map((opt, i) => {
                      const percent = totalVotes > 0 ? Math.round((opt.votes?.length || 0) * 100 / totalVotes) : 0;
                      const voted = opt.votes?.some((v) => v.userId === currentUser.uid);

                      return (
                        <button
                          key={i}
                          onClick={() => handleVote(poll.id, i)}
                          disabled={hasUserVoted || isExpired}
                          className={`w-full px-4 py-2 rounded-lg flex justify-between border ${
                            voted ? 'bg-green-100 border-green-400' : 'border-gray-300'
                          }`}
                        >
                          <span>{opt.text}</span>
                          <span className="text-xs">{percent}%</span>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">Total Votes: {totalVotes}</p>

                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => handleDeletePoll(poll.id)}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1 mt-3"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Communication;
