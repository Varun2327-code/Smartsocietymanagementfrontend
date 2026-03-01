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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageSquare,
  FiTrash2,
  FiEdit3,
  FiCheck,
  FiX,
  FiPlus,
  FiClock,
  FiBarChart2,
  FiSend,
  FiSearch,
  FiFilter,
  FiThumbsUp,
  FiUser,
  FiTag,
  FiAlertCircle
} from 'react-icons/fi';

const Communication = () => {
  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('announcements');
  const [loading, setLoading] = useState(true);

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementCategory, setAnnouncementCategory] = useState('General');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState(null);
  const [editingAnnouncementText, setEditingAnnouncementText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Polls State
  const [polls, setPolls] = useState([]);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''], expiresAt: '' });

  // Community Feed State
  const [feedPosts, setFeedPosts] = useState([]);
  const [newPostText, setNewPostText] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, 'user', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        setCurrentUser({
          uid: user.uid,
          role: userData.role || 'user',
          name: userData.name || 'Resident',
          profilePic: userData.profilePic || null
        });
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to Polls
    const pollsQuery = query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribePolls = onSnapshot(pollsQuery, (snapshot) => {
      setPolls(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Announcements
    const announcementsRef = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribeAnnouncements = onSnapshot(announcementsRef, (snapshot) => {
      setAnnouncements(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Community Feed
    const feedRef = query(collection(db, 'community_feed'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribeFeed = onSnapshot(feedRef, (snapshot) => {
      setFeedPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribePolls();
      unsubscribeAnnouncements();
      unsubscribeFeed();
    };
  }, [currentUser]);

  // --- ANNOUNCEMENT HANDLERS ---
  const handleCreateAnnouncement = async () => {
    if (!announcementText.trim() || announcementText.trim().length < 5) return;
    try {
      await addDoc(collection(db, 'announcements'), {
        content: announcementText.trim(),
        category: announcementCategory,
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.name,
      });
      setAnnouncementText('');
    } catch (err) {
      console.error("Error adding announcement:", err);
    }
  };

  const handleEditAnnouncement = async (id) => {
    if (!editingAnnouncementText.trim()) return;
    await updateDoc(doc(db, 'announcements', id), {
      content: editingAnnouncementText.trim(),
      updatedAt: serverTimestamp(),
    });
    setEditingAnnouncementId(null);
    setEditingAnnouncementText('');
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      await deleteDoc(doc(db, 'announcements', id));
    }
  };

  // --- POLL HANDLERS ---
  const handleAddOption = () => {
    setNewPoll((prev) => ({ ...prev, options: [...prev.options, ''] }));
  };

  const handleOptionChange = (index, value) => {
    const updated = [...newPoll.options];
    updated[index] = value;
    setNewPoll((prev) => ({ ...prev, options: updated }));
  };

  const handleCreatePoll = async () => {
    if (!newPoll.question.trim() || newPoll.options.filter(o => o.trim()).length < 2) return;

    try {
      const pollData = {
        question: newPoll.question.trim(),
        options: newPoll.options.filter(opt => opt.trim()).map((opt) => ({ text: opt.trim(), votes: [] })),
        createdAt: serverTimestamp(),
        createdBy: currentUser.name,
        expiresAt: newPoll.expiresAt ? new Date(newPoll.expiresAt).toISOString() : null,
      };

      await addDoc(collection(db, 'polls'), pollData);
      setNewPoll({ question: '', options: ['', ''], expiresAt: '' });
    } catch (err) {
      console.error("Error creating poll:", err);
    }
  };

  const handleVote = async (pollId, optionIndex) => {
    const pollRef = doc(db, 'polls', pollId);
    const pollSnap = await getDoc(pollRef);
    if (!pollSnap.exists()) return;

    const poll = pollSnap.data();

    // Check if user has voted in any option (handling both string and object formats)
    const hasVoted = poll.options.some((opt) =>
      opt.votes?.some((v) => typeof v === 'string' ? v === currentUser.uid : v?.userId === currentUser.uid)
    );

    const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

    if (hasVoted || isExpired) return;

    const updatedOptions = [...poll.options];
    // Consistently use string UID for new votes
    updatedOptions[optionIndex].votes = [...(updatedOptions[optionIndex].votes || []), currentUser.uid];

    await updateDoc(pollRef, { options: updatedOptions });
  };

  const handleDeletePoll = async (pollId) => {
    if (window.confirm("Delete this poll?")) {
      await deleteDoc(doc(db, 'polls', pollId));
    }
  };

  // --- COMMUNITY FEED HANDLERS ---
  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    try {
      await addDoc(collection(db, 'community_feed'), {
        content: newPostText.trim(),
        createdAt: serverTimestamp(),
        userId: currentUser.uid,
        userName: currentUser.name,
        likes: []
      });
      setNewPostText('');
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  const handleLikePost = async (postId, currentLikes) => {
    const postRef = doc(db, 'community_feed', postId);
    const isLiked = currentLikes?.includes(currentUser.uid);

    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    });
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm("Delete this post?")) {
      await deleteDoc(doc(db, 'community_feed', postId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <FiAlertCircle className="w-20 h-20 mx-auto mb-6 text-blue-500" />
          <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-8 text-lg">Please sign in to the society portal to access the Communication Hub.</p>
          <button onClick={() => window.location.href = '/login'} className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all duration-300">
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  const filteredAnnouncements = announcements.filter(ann =>
    ann.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ann.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Communication Hub</h1>
              <p className="text-slate-500 font-medium">Connect, Discuss & Stay Updated</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
              {[
                { id: 'announcements', label: 'Announcements', icon: FiMessageSquare },
                { id: 'feed', label: 'Community Feed', icon: FiUser },
                { id: 'polls', label: 'Polls', icon: FiBarChart2 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        <AnimatePresence mode="wait">
          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Create Announcement (Admin Only) */}
              <div className="lg:col-span-1">
                {currentUser.role === 'admin' ? (
                  <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 sticky top-32">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FiPlus className="text-primary" /> Post Announcement
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                        <select
                          value={announcementCategory}
                          onChange={(e) => setAnnouncementCategory(e.target.value)}
                          className="w-full p-3 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        >
                          <option>General</option>
                          <option>Urgent</option>
                          <option>Maintenance</option>
                          <option>Event</option>
                          <option>Social</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Your Message</label>
                        <textarea
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          placeholder="Type your announcement here..."
                          rows="5"
                          className="w-full p-4 rounded-2xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        />
                      </div>
                      <button
                        onClick={handleCreateAnnouncement}
                        disabled={!announcementText.trim()}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        <FiSend /> Ship Announcement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 rounded-3xl text-white shadow-xl">
                    <FiAlertCircle className="w-12 h-12 mb-4 opacity-80" />
                    <h3 className="text-2xl font-bold mb-2">Official Channel</h3>
                    <p className="opacity-90 leading-relaxed">
                      This section is reserved for official society announcements. Stay tuned for important updates from management.
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Announcement List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-2">
                  <FiSearch className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent outline-none font-medium text-slate-700"
                  />
                  <FiFilter className="text-slate-400" />
                </div>

                {filteredAnnouncements.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <FiMessageSquare className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-medium text-lg">No announcements found matching your search.</p>
                  </div>
                ) : (
                  filteredAnnouncements.map((ann) => (
                    <motion.div
                      layout
                      key={ann.id}
                      className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      {/* Category Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${ann.category === 'Urgent' ? 'bg-red-100 text-red-600' :
                          ann.category === 'Maintenance' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                          {ann.category || 'General'}
                        </span>

                        {currentUser.role === 'admin' && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingAnnouncementId(ann.id);
                                setEditingAnnouncementText(ann.content);
                              }}
                              className="p-2 text-slate-400 hover:text-primary transition-colors"
                            >
                              <FiEdit3 />
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingAnnouncementId === ann.id ? (
                        <div className="space-y-4">
                          <textarea
                            className="w-full p-4 border rounded-2xl bg-slate-50 focus:ring-2 focus:ring-primary/20 outline-none"
                            value={editingAnnouncementText}
                            onChange={(e) => setEditingAnnouncementText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditAnnouncement(ann.id)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2">
                              <FiCheck /> Update
                            </button>
                            <button onClick={() => setEditingAnnouncementId(null)} className="px-6 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-800 text-lg leading-relaxed mb-6 font-medium pr-10">{ann.content}</p>
                      )}

                      <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
                          {ann.userName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{ann.userName || 'Society Admin'}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <FiClock className="inline w-3 h-3" />
                            {ann.createdAt?.seconds ? new Date(ann.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* COMMUNITY FEED TAB */}
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              {/* Write Post */}
              <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {currentUser.name?.charAt(0)}
                  </div>
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`}
                    className="flex-1 p-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-primary/20 outline-none resize-none text-slate-800 font-medium"
                    rows="3"
                  />
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    Please keep posts helpful and polite.
                  </p>
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostText.trim()}
                    className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    Post <FiSend />
                  </button>
                </div>
              </div>

              {/* Feed List */}
              <div className="space-y-6">
                {feedPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative group"
                  >
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold border-2 border-white">
                          {post.userName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{post.userName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleString() : 'Posting...'}
                          </p>
                        </div>
                      </div>

                      {(currentUser.uid === post.userId || currentUser.role === 'admin') && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    <p className="text-slate-800 mb-6 font-medium leading-relaxed">{post.content}</p>

                    <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                      <button
                        onClick={() => handleLikePost(post.id, post.likes)}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${post.likes?.includes(currentUser.uid)
                          ? 'bg-primary text-white'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                      >
                        <FiThumbsUp /> {post.likes?.length || 0}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <motion.div
              key="polls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Poll Creation (Admin) */}
              <div className="lg:col-span-1">
                {currentUser.role === 'admin' ? (
                  <div className="bg-white p-8 rounded-3xl shadow-md border border-slate-100 sticky top-32">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <FiBarChart2 className="text-primary" /> Create New Poll
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Question</label>
                        <input
                          type="text"
                          placeholder="What would you like to ask?"
                          value={newPoll.question}
                          onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                          className="w-full p-4 rounded-xl border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Options</label>
                        <div className="space-y-3">
                          {newPoll.options.map((opt, i) => (
                            <input
                              key={i}
                              type="text"
                              placeholder={`Option ${i + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(i, e.target.value)}
                              className="w-full p-3 rounded-xl border-slate-200 bg-slate-50 outline-none text-sm group"
                            />
                          ))}
                        </div>
                        <button
                          onClick={handleAddOption}
                          className="mt-3 text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                        >
                          <FiPlus /> Add another option
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">End Date (Optional)</label>
                        <input
                          type="datetime-local"
                          value={newPoll.expiresAt}
                          onChange={(e) => setNewPoll({ ...newPoll, expiresAt: e.target.value })}
                          className="w-full p-3 rounded-xl border-slate-200 bg-slate-50 text-slate-600 outline-none text-sm"
                        />
                      </div>

                      <button
                        onClick={handleCreatePoll}
                        disabled={!newPoll.question.trim()}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20"
                      >
                        Publish Poll
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                    <FiTag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Public Opinion</h3>
                    <p className="text-slate-500 leading-relaxed">
                      Your voice matters! Cast your vote on active polls to help the community make decisions.
                    </p>
                  </div>
                )}
              </div>

              {/* Poll List */}
              <div className="lg:col-span-2 space-y-6">
                {polls.map((poll) => {
                  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);
                  const hasUserVoted = poll.options.some((o) =>
                    o.votes?.some((v) => typeof v === 'string' ? v === currentUser.uid : v?.userId === currentUser.uid)
                  );
                  const isExpired = poll.expiresAt && new Date(poll.expiresAt) < new Date();

                  return (
                    <motion.div layout key={poll.id} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 group">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">{poll.question}</h3>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                              <FiUser className="w-3 h-3" /> {totalVotes} Responses
                            </span>
                            {isExpired && (
                              <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">Expired</span>
                            )}
                          </div>
                        </div>

                        {currentUser.role === 'admin' && (
                          <button onClick={() => handleDeletePoll(poll.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {poll.options.map((opt, i) => {
                          const votesCount = opt.votes?.length || 0;
                          const percent = totalVotes > 0 ? Math.round((votesCount * 100) / totalVotes) : 0;
                          const votedForThis = opt.votes?.some((v) => typeof v === 'string' ? v === currentUser.uid : v?.userId === currentUser.uid);

                          return (
                            <button
                              key={i}
                              disabled={hasUserVoted || isExpired}
                              onClick={() => handleVote(poll.id, i)}
                              className={`w-full group/btn relative p-4 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${votedForThis ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-slate-200'
                                }`}
                            >
                              {/* Progress bar background */}
                              <div
                                className={`absolute inset-0 h-full transition-all duration-1000 ease-out z-0 ${votedForThis ? 'bg-primary/10' : 'bg-slate-50'}`}
                                style={{ width: hasUserVoted || isExpired ? `${percent}%` : '0%' }}
                              />

                              <div className="relative z-10 flex justify-between items-center text-sm font-bold">
                                <span className={votedForThis ? 'text-primary' : 'text-slate-700'}>{opt.text}</span>
                                {(hasUserVoted || isExpired) && (
                                  <span className={votedForThis ? 'text-primary' : 'text-slate-400'}>{percent}%</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {poll.expiresAt && !isExpired && (
                        <p className="mt-6 text-xs text-slate-400 font-bold flex items-center gap-1 italic">
                          <FiClock className="w-3 h-3" /> Ends on {new Date(poll.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Communication;
