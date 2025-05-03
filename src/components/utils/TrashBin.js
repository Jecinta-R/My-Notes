import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; // Make sure this path is correct relative to this file
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const TrashBin = () => {
  const [trashedNotes, setTrashedNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrashedNotes = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      where("isTrashed", "==", true)
    );

    const snapshot = await getDocs(q);
    const notes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setTrashedNotes(notes);
    setLoading(false);
  };

  const permanentlyDelete = async (noteId) => {
    await deleteDoc(doc(db, "notes", noteId));
    setTrashedNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const clearTrash = async () => {
    const confirmDelete = window.confirm("Permanently delete all trashed notes?");
    if (!confirmDelete) return;

    for (const note of trashedNotes) {
      await deleteDoc(doc(db, "notes", note.id));
    }
    setTrashedNotes([]);
  };

  useEffect(() => {
    fetchTrashedNotes();
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🗑️ Trash Bin</h2>

      {loading ? (
        <p>Loading...</p>
      ) : trashedNotes.length === 0 ? (
        <p>No notes in trash.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {trashedNotes.map((note) => (
              <li
                key={note.id}
                className="border p-4 rounded-md bg-red-50 dark:bg-gray-800 dark:border-gray-600"
              >
                <h3 className="font-semibold">{note.title || "Untitled Note"}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {note.content?.slice(0, 100)}...
                </p>
                <button
                  onClick={() => permanentlyDelete(note.id)}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete Permanently
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={clearTrash}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear All Trash
          </button>
        </>
      )}
    </div>
  );
};

export default TrashBin;
