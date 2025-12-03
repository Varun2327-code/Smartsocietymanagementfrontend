// src/pages/Chats.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  FaPaperPlane,
  FaRobot,
  FaUserCircle,
  FaArrowLeft,
  FaRegSmile,
  FaRegHeart,
  FaRegThumbsUp,
  FaSun,
  FaMoon,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
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
  getDocs,
  where,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import dayjs from "dayjs";

/*
  Upgraded Chats component - Glass bubble theme
  - Requires: firebase auth + firestore collections: messages, users, typing
  - messages doc fields: { uid, name, userRole, text, timestamp, reactions: [...], seenBy: [...] }
  - typing collection: docs with id=uid { uid, name, lastSeen: timestamp }
  - users collection: optional presence/role info
*/

const SYSTEM_BOT_UID = "bot";
const BOT_NAME = "SocietyBot";

function DateSeparator({ date }) {
  const label =
    dayjs(date).isSame(dayjs(), "day")
      ? "Today"
      : dayjs(date).isSame(dayjs().subtract(1, "day"), "day")
      ? "Yesterday"
      : dayjs(date).format("DD MMM YYYY");
  return (
    <div className="flex justify-center my-3">
      <div className="text-xs text-gray-400 px-3 py-1 bg-white/60 backdrop-blur rounded-full border">
        {label}
      </div>
    </div>
  );
}

function Avatar({ name, size = 10 }) {
  const initials =
    name?.split(" ").length > 1
      ? name.split(" ").slice(0, 2).map((n) => n[0]).join("")
      : (name || "U").slice(0, 2);
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white`}
      style={{ width: size * 4, height: size * 4 }}
    >
      <span className="font-semibold text-sm">{initials}</span>
    </div>
  );
}

export default function Chats() {
  const [user, setUser] = useState(null);
  const [usersMeta, setUsersMeta] = useState({}); // small cache of user meta
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const [replyTo, setReplyTo] = useState(null);
  const [dark, setDark] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [collapseHeader, setCollapseHeader] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // auth listener + user meta fetch
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        return;
      }
      const uid = u.uid;
      let name = u.displayName || "Resident";
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          name = d.name || name;
          setUsersMeta((s) => ({ ...s, [uid]: { name: d.name, role: d.role } }));
          setUser({ uid, name: d.name || name, role: d.role || "Resident" });
        } else {
          setUser({ uid, name, role: "Resident" });
        }
      } catch (err) {
        console.error("user fetch err", err);
        setUser({ uid, name, role: "Resident" });
      }
    });
    return () => unsub();
  }, []);

  // messages live listener
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid,
          name: data.name,
          userRole: data.userRole || "Resident",
          text: data.text,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          reactions: data.reactions || [],
          seenBy: data.seenBy || [],
        };
      });
      setMessages(list);

      // mark all visible messages as seen (update seenBy)
      if (user) {
        snapshot.docs.forEach(async (docSnap) => {
          const m = docSnap.data();
          if (m.seenBy && Array.isArray(m.seenBy) && m.seenBy.includes(user.uid)) return;
          try {
            await updateDoc(doc(db, "messages", docSnap.id), {
              seenBy: arrayUnion(user.uid),
            });
          } catch (err) {
            // ignore permission errors
          }
        });
      }
    });

    return () => unsub();
  }, [user]);

  // typing presence listener (collection 'typing')
  useEffect(() => {
    const q = query(collection(db, "typing"), orderBy("lastSeen", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        const data = d.data();
        map[data.uid] = data;
      });
      setTypingUsers(map);
    });
    return () => unsub();
  }, []);

  // scroll tracking to show scroll button
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setShowScrollBtn(!atBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // auto-scroll when messages change (unless user scrolled up)
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (atBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isBotTyping]);

  // helper: send bot/type indicator (SocietyBot quick replies or fallback to simple rules)
  const getBotReply = async (text) => {
    const l = text.toLowerCase();
    const quick = {
      rules: "📜 Society rules: please check the noticeboard or the Events page for details.",
      maintenance: "🛠 Maintenance: weekly on Fridays at 10 AM. For urgent issues, raise a complaint.",
      hello: "👋 Hello! How can I help you today?",
      help: "You can ask about maintenance, events, visitors or society rules.",
      contact: "Office phone: +91 98765 43210 — or email admin@society.com",
    };
    for (const k in quick) if (l.includes(k)) return quick[k];
    // fallback short answer
    return "🤖 Sorry I don't have exact info — please contact the office or ask the admin.";
  };

  // typing presence setter
  const setTyping = async (typing = true) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "typing", user.uid), {
        uid: user.uid,
        name: user.name,
        lastSeen: serverTimestamp(),
      });
      // remove after a timeout locally
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await deleteDoc(doc(db, "typing", user.uid));
        } catch {}
      }, 2500);
    } catch {}
  };

  // send message action
  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || !user) return;

    try {
      // optimistic UI: add locally
      setInput("");
      // add user message
      const docRef = await addDoc(collection(db, "messages"), {
        uid: user.uid,
        name: user.name,
        userRole: user.role || "Resident",
        text,
        timestamp: serverTimestamp(),
        reactions: [],
        seenBy: [user.uid],
        replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, name: replyTo.name } : null,
      });

      // small delay then add bot response if needed
      // show bot typing indicator
      setIsBotTyping(true);
      const botText = await getBotReply(text);
      // bot reply
      await addDoc(collection(db, "messages"), {
        uid: SYSTEM_BOT_UID,
        name: BOT_NAME,
        userRole: "AI",
        text: botText,
        timestamp: serverTimestamp(),
        reactions: [],
        seenBy: [],
      });
      setIsBotTyping(false);
      setReplyTo(null);
    } catch (err) {
      console.error("send error", err);
    } finally {
      try {
        await deleteDoc(doc(db, "typing", user.uid));
      } catch {}
    }
  };

  // delete message (soft delete attempt)
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (err) {
      console.error(err);
    }
  };

  // start editing
  const handleEdit = (msg) => {
    setEditingId(msg.id);
    setEditedText(msg.text);
  };

  // save edited text
  const handleSaveEdit = async (id) => {
    if (!editedText.trim()) return;
    try {
      await updateDoc(doc(db, "messages", id), { text: editedText });
      setEditingId(null);
      setEditedText("");
    } catch (err) {
      console.error(err);
    }
  };

  // reaction toggling (like simple append)
  const handleReaction = async (id, emoji) => {
    try {
      const mDoc = doc(db, "messages", id);
      // read existing reactions quickly (not necessary but safer)
      const snap = await getDoc(mDoc);
      const prev = snap.exists() ? snap.data().reactions || [] : [];
      // if emoji present just append (or toggle remove) - here append multiple allowed
      await updateDoc(mDoc, { reactions: arrayUnion(emoji) });
    } catch (err) {
      console.error(err);
    }
  };

  // reply action
  const startReply = (msg) => {
    setReplyTo({ id: msg.id, text: msg.text, name: msg.name });
    inputRef.current?.focus();
  };

  // scroll to bottom
  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // theme toggle
  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  // utility: group messages by date and prepare UI items
  const grouped = useMemo(() => {
    const groups = [];
    let lastDate = null;
    messages.forEach((m) => {
      const day = dayjs(m.timestamp).startOf("day").format();
      if (day !== lastDate) {
        groups.push({ type: "date", date: m.timestamp });
        lastDate = day;
      }
      groups.push({ type: "msg", msg: m });
    });
    return groups;
  }, [messages]);

  // small Reaction picker component
  const ReactionPicker = ({ onPick }) => {
    const emojis = ["👍", "❤️", "😂", "🎉", "😮"];
    return (
      <div className="flex gap-2 bg-white/80 backdrop-blur p-2 rounded-full border shadow">
        {emojis.map((e) => (
          <button key={e} onClick={() => onPick(e)} className="text-lg">
            {e}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 py-6 transition-colors">
      {/* HEADER */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between bg-white/60 backdrop-blur rounded-2xl p-3 border shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="p-2 rounded hover:bg-gray-100">
              <FaArrowLeft />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-1 rounded bg-white/30">
                <FaRobot className="text-blue-700 w-7 h-7" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">Society Group Chat</div>
                <div className="text-xs text-slate-600">Residents & SocietyBot • {Object.keys(typingUsers).length ? "Active" : "Idle"}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-3 py-1 rounded-md bg-white/80 border"
              onClick={() => setCollapseHeader((s) => !s)}
            >
              {collapseHeader ? <FaChevronDown /> : <FaChevronUp />}
            </button>

            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded bg-white/80 border"
              title="Toggle theme"
            >
              {dark ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE SUBHEADER */}
        {!collapseHeader && (
          <div className="mt-3 bg-white/60 backdrop-blur rounded-xl p-3 border shadow-sm flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Chat with neighbors — be respectful. Use @admin for urgent issues.
            </div>
            <div className="text-xs text-gray-400">Online: {Object.keys(typingUsers).length} users</div>
          </div>
        )}

        {/* CHAT WINDOW */}
        <div className="mt-4 bg-white/60 backdrop-blur rounded-2xl shadow-lg overflow-hidden flex flex-col" style={{ height: "70vh" }}>
          {/* Messages area */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <AnimatePresence initial={false}>
              {grouped.map((g, idx) =>
                g.type === "date" ? (
                  <DateSeparator key={"d-" + idx} date={g.date} />
                ) : (
                  <motion.div
                    key={g.msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={`flex ${g.msg.uid === user?.uid ? "justify-end" : g.msg.uid === SYSTEM_BOT_UID ? "justify-center" : "justify-start"}`}
                  >
                    {/* Bot / center */}
                    {g.msg.uid === SYSTEM_BOT_UID ? (
                      <div className="bg-green-100 text-green-900 px-4 py-2 rounded-2xl shadow-md max-w-[70%]">
                        <div className="font-semibold mb-1">SocietyBot</div>
                        <div className="whitespace-pre-wrap">{g.msg.text}</div>
                        <div className="text-xs text-green-700 mt-2">{dayjs(g.msg.timestamp).format("hh:mm A")}</div>
                      </div>
                    ) : (
                      <div className="flex items-end gap-3 max-w-[80%]">
                        {/* avatar for other users */}
                        {g.msg.uid !== user?.uid && <Avatar name={g.msg.name} size={9} />}
                        <div className={`relative p-3 rounded-2xl shadow glass-bubble ${g.msg.uid === user?.uid ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white" : "bg-white/70 text-slate-900"} `} style={{ backdropFilter: "blur(8px)" }}>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium">{g.msg.name}</div>
                            <div className="text-xs text-gray-400">{g.msg.userRole}</div>
                          </div>

                          {editingId === g.msg.id ? (
                            <div className="mt-2">
                              <input className="w-full rounded px-2 py-1 text-black" value={editedText} onChange={(e) => setEditedText(e.target.value)} />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleSaveEdit(g.msg.id)} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Save</button>
                                <button onClick={() => { setEditingId(null); setEditedText(""); }} className="px-2 py-1 bg-gray-200 rounded text-xs">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* reply preview */}
                              {g.msg.replyTo && (
                                <div className="text-xs bg-white/30 p-2 rounded mb-2">
                                  <div className="font-semibold text-xs">Reply to {g.msg.replyTo.name}:</div>
                                  <div className="text-xs italic truncate">{g.msg.replyTo.text}</div>
                                </div>
                              )}
                              <div className="whitespace-pre-wrap">{g.msg.text}</div>
                            </>
                          )}

                          {/* reactions */}
                          {g.msg.reactions?.length > 0 && (
                            <div className="mt-2 flex gap-2">
                              {g.msg.reactions.slice(0, 6).map((r, i) => (
                                <span key={i} className="text-sm">{r}</span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs mt-2 opacity-80">
                            <div>{dayjs(g.msg.timestamp).format("hh:mm A")}</div>
                            <div className="flex items-center gap-2">
                              {/* seen indicator */}
                              <div className="text-[10px] text-gray-500">
                                {g.msg.seenBy?.length > 1 ? `Seen ${g.msg.seenBy.length}` : g.msg.seenBy?.length === 1 && g.msg.uid !== user?.uid ? "Seen" : ""}
                              </div>

                              {/* actions */}
                              <div className="flex items-center gap-2">
                                <button title="Reply" onClick={() => startReply(g.msg)} className="p-1 rounded hover:bg-gray-100 text-xs">Reply</button>
                                {g.msg.uid === user?.uid && <button onClick={() => handleEdit(g.msg)} className="p-1 rounded hover:bg-gray-100 text-xs">Edit</button>}
                                {(g.msg.uid === user?.uid || user?.role === "Admin") && <button onClick={() => handleDelete(g.msg.id)} className="p-1 rounded hover:bg-red-50 text-xs">Delete</button>}
                                <div className="relative">
                                  <div className="p-1 rounded hover:bg-gray-100 inline-block">
                                    <FaRegSmile onClick={() => {}} />
                                  </div>
                                  {/* quick reaction pop */}
                                  <div className="absolute -right-2 -top-10">
                                    <ReactionPicker onPick={(e) => handleReaction(g.msg.id, e)} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* avatar for me */}
                        {g.msg.uid === user?.uid && <Avatar name={g.msg.name} size={9} />}
                      </div>
                    )}
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* bot typing */}
            {isBotTyping && (
              <div className="flex justify-center">
                <div className="bg-green-100 text-green-900 px-4 py-2 rounded-2xl shadow-sm">
                  <div className="animate-pulse">🤖 SocietyBot is typing...</div>
                </div>
              </div>
            )}
          </div>

          {/* scroll to bottom button */}
          {showScrollBtn && (
            <button onClick={scrollToBottom} className="absolute right-8 bottom-28 bg-blue-600 text-white p-2 rounded-full shadow-lg">
              ↓
            </button>
          )}

          {/* input area */}
          <div className="px-4 py-3 border-t bg-white/70 backdrop-blur">
            {replyTo && (
              <div className="mb-2 p-2 bg-white/40 rounded flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-600">Replying to {replyTo.name}</div>
                  <div className="text-sm italic text-gray-800 truncate max-w-md">{replyTo.text}</div>
                </div>
                <button onClick={() => setReplyTo(null)} className="text-xs text-gray-500">Cancel</button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); setTyping(true); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/60"
              />
              <div className="flex items-center gap-2">
                <button onClick={() => sendMessage()} className="bg-blue-600 text-white px-3 py-2 rounded-full shadow">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* footer small */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Your messages are visible to residents. Be respectful.
        </div>
      </div>
    </div>
  );
}
