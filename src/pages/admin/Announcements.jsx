import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, storage } from "../../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

const Announcements = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setAnnouncements(arr);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleImageSelect = (file) => {
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!content.trim()) return alert("Content cannot be empty.");

    try {
      let imageUrl = null;
      if (imageFile) {
        const imageRef = ref(storage, `announcements/${Date.now()}_${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      const user = auth.currentUser;

      if (editingId) {
        await updateDoc(doc(db, "announcements", editingId), {
          content,
          ...(imageUrl && { imageUrl }),
          updatedAt: serverTimestamp(),
        });
        alert("Announcement updated!");
      } else {
        await addDoc(collection(db, "announcements"), {
          content,
          imageUrl,
          userId: user ? user.uid : null,
          createdAt: serverTimestamp(),
        });
        alert("Announcement created!");
      }

      closeDrawer();

    } catch (err) {
      console.error(err);
      alert("Failed, try again.");
    }
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setEditingId(null);
    setContent("");
    setImageFile(null);
    setPreview(null);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setContent(a.content);
    setPreview(a.imageUrl || null);
    setImageFile(null);
    setShowDrawer(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "announcements", deleteConfirm));
      alert("Deleted!");
    } catch (e) {
      alert("Delete failed.");
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="relative">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <button
          onClick={() => setShowDrawer(true)}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700"
        >
          + New Announcement
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {/* Announcements List */}
      {!loading && announcements.length === 0 && (
        <p className="text-gray-600">No announcements yet.</p>
      )}

      <div className="space-y-5">
        {announcements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-xl shadow border hover:shadow-lg transition"
          >
            <p className="text-gray-800 whitespace-pre-line">{a.content}</p>

            {a.imageUrl && (
              <img
                src={a.imageUrl}
                className="mt-3 rounded-lg max-w-md border shadow"
                alt=""
              />
            )}

            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                {a.createdAt?.toDate().toLocaleString() || "—"}
              </span>

              <div className="flex gap-3">
                <button className="text-indigo-600" onClick={() => openEdit(a)}>Edit</button>
                <button className="text-red-600" onClick={() => setDeleteConfirm(a.id)}>Delete</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Drawer (Create / Edit) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />

            <motion.div
              className="fixed right-0 top-0 bottom-0 w-full md:w-1/3 bg-white shadow-2xl p-6 z-40 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
            >
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </h2>

              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-indigo-500"
                placeholder="Write your announcement..."
              />

              {/* Image Preview */}
              {preview && (
                <img
                  src={preview}
                  className="rounded-lg mt-3 max-w-full border shadow"
                  alt=""
                />
              )}

              {/* Image Upload */}
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Image (optional)</label>

                <div
                  className="w-full border-dashed border-2 rounded-lg p-5 text-center cursor-pointer hover:bg-gray-50"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleImageSelect(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="upload-img"
                    onChange={(e) => handleImageSelect(e.target.files[0])}
                  />
                  <label htmlFor="upload-img" className="cursor-pointer text-indigo-600">
                    Click or drag image here
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 justify-end">
                <button
                  onClick={closeDrawer}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded bg-indigo-600 text-white"
                >
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setDeleteConfirm(null)}
            />

            <motion.div
              className="fixed z-50 top-1/2 left-1/2 bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="text-lg font-semibold">Delete Announcement?</h3>
              <p className="text-gray-600 mt-2">This action cannot be undone.</p>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Announcements;
