import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Send,
  Bot,
  User,
  ArrowLeft,
  Smile,
  Heart,
  ThumbsUp,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Edit2,
  Reply,
  X,
  Plus,
  Hash,
  MessageSquare,
  Search,
  Users,
  Info
} from "lucide-react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
  arrayUnion,
  where,
  limit
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";
import { toast, Toaster } from "react-hot-toast";

const SYSTEM_BOT_UID = "bot";
const BOT_NAME = "SocietyBot";

const DateSeparator = ({ date }) => {
  const label = dayjs(date).isSame(dayjs(), "day")
    ? "Today"
    : dayjs(date).isSame(dayjs().subtract(1, "day"), "day")
      ? "Yesterday"
      : dayjs(date).format("DD MMM YYYY");

  return (
    <div className="flex justify-center my-8">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border dark:border-slate-700">
        {label}
      </div>
    </div>
  );
};

const Avatar = ({ name, role, size = 10 }) => {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";

  const getRoleColor = (r) => {
    switch (r?.toLowerCase()) {
      case 'admin': return 'from-red-500 to-rose-600';
      case 'security': return 'from-blue-500 to-indigo-600';
      case 'ai': return 'from-emerald-400 to-teal-600';
      default: return 'from-slate-400 to-slate-600';
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br ${getRoleColor(role)} text-white shadow-lg`}
      style={{ width: size * 4, height: size * 4 }}
    >
      <span className="font-black text-xs tracking-tighter">{initials}</span>
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
    </div>
  );
};

export default function Chats() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [activeChannel, setActiveChannel] = useState("General");

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        return;
      }
      const userDoc = await getDoc(doc(db, "users", u.uid));
      if (userDoc.exists()) {
        const d = userDoc.data();
        setUser({ uid: u.uid, name: d.name, role: d.role });
      } else {
        setUser({ uid: u.uid, name: u.displayName || "Resident", role: "Resident" });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"), limit(100));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate() || new Date()
      }));
      setMessages(list);

      // Auto scroll to bottom
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 100);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "typing"), where("lastSeen", ">", new Date(Date.now() - 5000)));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.uid !== user?.uid) map[data.uid] = data;
      });
      setTypingUsers(map);
    });
    return () => unsub();
  }, [user]);

  const getBotReply = (text) => {
    const l = text.toLowerCase();
    if (l.includes("rules")) return "📜 The society rules are posted in the main lobby and the digital notices section. Primary rule: Keep the noise down after 10 PM!";
    if (l.includes("maintenance")) return "🛠 Standard maintenance happens every 1st Sunday. For plumbing/electrical issues, please raise a ticket in the Complaints section.";
    if (l.includes("visitor")) return "🚗 Use the Security Gate module to pre-approve your guests and generate QR passes.";
    if (l.includes("event")) return "🎉 Check the Events calendar for upcoming festivals and club meetings!";
    return "🤖 I'm your Society AI. I can help with rules, maintenance schedules, or finding features in the app. What's on your mind?";
  };

  const setTypingStatus = async (isTyping) => {
    if (!user) return;
    try {
      if (isTyping) {
        await setDoc(doc(db, "typing", user.uid), {
          uid: user.uid,
          name: user.name,
          lastSeen: serverTimestamp(),
        });
      } else {
        await deleteDoc(doc(db, "typing", user.uid));
      }
    } catch { }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    const text = input;
    setInput("");
    setReplyTo(null);
    setTypingStatus(false);

    try {
      await addDoc(collection(db, "messages"), {
        uid: user.uid,
        name: user.name,
        userRole: user.role,
        text,
        timestamp: serverTimestamp(),
        reactions: [],
        replyTo: replyTo ? { name: replyTo.name, text: replyTo.text } : null,
      });

      // Bot Logic - Respond to every message (previous behavior)
      setIsBotTyping(true);
      setTimeout(async () => {
        try {
          const botMessage = getBotReply(text);
          await addDoc(collection(db, "messages"), {
            uid: SYSTEM_BOT_UID,
            name: BOT_NAME,
            userRole: "AI",
            text: botMessage,
            timestamp: serverTimestamp(),
            reactions: [],
          });
        } catch (err) {
          console.error("Bot reply failed:", err);
        } finally {
          setIsBotTyping(false);
        }
      }, 1000);
    } catch (err) {
      console.error("Message send failed:", err);
      toast.error("Message failed to send");
    }
  };

  const handleReaction = async (msgId, emoji) => {
    try {
      await updateDoc(doc(db, "messages", msgId), {
        reactions: arrayUnion({ emoji, user: user.name })
      });
    } catch { }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete message?")) return;
    try {
      await deleteDoc(doc(db, "messages", id));
      toast.success("Message deleted");
    } catch { }
  };

  const groupedMessages = useMemo(() => {
    const filtered = messages.filter(m =>
      m.text.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    const groups = [];
    let lastDate = null;
    filtered.forEach((m) => {
      const date = dayjs(m.timestamp).format("YYYY-MM-DD");
      if (date !== lastDate) {
        groups.push({ type: "date", date: m.timestamp });
        lastDate = date;
      }
      groups.push({ type: "msg", ...m });
    });
    return groups;
  }, [messages, search]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      <Toaster />

      {/* Sidebar - Desktop Only */}
      <div className="hidden md:flex w-80 bg-slate-50 dark:bg-slate-900 border-r dark:border-slate-800 flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <MessageSquare size={20} />
          </div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Society Hub</h1>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Channels</p>
          {['General', 'Maintenance', 'Events', 'Marketplace'].map(ch => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeChannel === ch ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'}`}
            >
              <Hash size={18} className={activeChannel === ch ? 'text-blue-200' : 'text-slate-300'} />
              {ch}
            </button>
          ))}
        </div>

        <div className="mt-auto">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <Users size={16} />
              </div>
              <p className="text-xs font-black uppercase text-slate-800 dark:text-white">Live Residents</p>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                +{Object.keys(typingUsers).length + 12}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <ArrowLeft size={24} className="text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Hash size={18} className="text-blue-600" /> {activeChannel}
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {Object.keys(typingUsers).length > 0 ? `${Object.keys(typingUsers).length} neighbors typing...` : 'Real-time Chat'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-2 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-blue-500 transition-all w-64"
              />
            </div>
            <button className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-blue-600 transition-all">
              <Info size={20} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth scrollbar-hide bg-slate-50/30 dark:bg-slate-950/30"
        >
          {groupedMessages.map((item, idx) => (
            item.type === 'date' ? (
              <DateSeparator key={idx} date={item.date} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className={`flex items-start gap-4 ${item.uid === user?.uid ? 'flex-row-reverse' : ''}`}
              >
                <Avatar name={item.name} role={item.userRole} />
                <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${item.uid === user?.uid ? 'items-end' : 'items-start'}`}>
                  {/* Sender Info */}
                  <div className={`flex items-center gap-2 mb-1.5 px-2 ${item.uid === user?.uid ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.name}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">{item.userRole}</span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{dayjs(item.timestamp).format("H:mm")}</span>
                  </div>

                  {/* Message Bubble */}
                  <div className={`group relative p-4 rounded-[1.5rem] shadow-sm transition-all duration-300 ${item.uid === user?.uid
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10'
                    : item.uid === SYSTEM_BOT_UID
                      ? 'bg-emerald-500 text-white rounded-tl-none border-emerald-400'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-transparent'
                    }`}>
                    {/* Reply Context */}
                    {item.replyTo && (
                      <div className={`mb-3 p-3 rounded-xl border-l-4 text-[11px] font-medium leading-relaxed ${item.uid === user?.uid ? 'bg-black/20 border-white/30' : 'bg-slate-50 dark:bg-slate-700/50 border-blue-500'
                        }`}>
                        <p className="font-black uppercase tracking-tighter mb-1 opacity-70">Replying to {item.replyTo.name}</p>
                        <p className="italic opacity-80 truncate">{item.replyTo.text}</p>
                      </div>
                    )}

                    <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{item.text}</p>

                    {/* Message Actions - Hover only */}
                    <div className={`absolute top-0 flex items-center gap-1 p-1.5 rounded-2xl bg-white dark:bg-slate-700 shadow-xl border dark:border-slate-600 scale-0 group-hover:scale-100 transition-all duration-200 z-20 ${item.uid === user?.uid ? 'right-full mr-2' : 'left-full ml-2'
                      }`}>
                      <button onClick={() => setReplyTo(item)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Reply size={14} /></button>
                      <button onClick={() => handleReaction(item.id, '❤️')} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl text-slate-400 hover:text-rose-500 transition-all"><Heart size={14} /></button>
                      {item.uid === user?.uid && (
                        <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>

                  {/* Reactions Display */}
                  {item.reactions?.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1.5 ${item.uid === user?.uid ? 'justify-end' : 'justify-start'}`}>
                      {item.reactions.map((r, i) => (
                        <div key={i} className="px-2 py-0.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full text-[10px] shadow-sm flex items-center gap-1">
                          <span>{r.emoji}</span>
                          <span className="font-bold text-slate-400 hidden group-hover:block">{r.user}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          ))}

          {isBotTyping && (
            <div className="flex items-start gap-4">
              <Avatar name="Society Bot" role="AI" />
              <div className="bg-emerald-500 text-white p-4 rounded-3xl rounded-tl-none shadow-lg animate-pulse">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white dark:bg-slate-950 border-t dark:border-slate-800">
          <div className="max-w-4xl mx-auto flex flex-col gap-4">

            {/* Reply Preview */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border-l-4 border-blue-600"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Replying to {replyTo.name}</p>
                    <p className="text-xs font-bold text-slate-500 truncate italic">"{replyTo.text}"</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="p-2 text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  rows="1"
                  placeholder={`Message #${activeChannel}...`}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setTypingStatus(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setTypingStatus(false), 3000);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-[1.5rem] py-4 pl-6 pr-14 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner"
                />
                <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-all">
                  <Smile size={20} />
                </button>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${input.trim()
                  ? 'bg-blue-600 text-white shadow-blue-500/20 scale-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-300 scale-95 opacity-50 cursor-not-allowed'
                  }`}
              >
                <Send size={24} className={input.trim() ? 'animate-in fade-in zoom-in' : ''} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-6">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border dark:border-slate-700">Enter</kbd> to send
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border dark:border-slate-700">Shift + Enter</kbd> for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
