import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Share,
  Trash,
  Pin,
  CheckCircle,
  Clock
} from "lucide-react";

const NoteViewer = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const noteDoc = doc(db, "notes", noteId);
        const noteSnapshot = await getDoc(noteDoc);

        if (noteSnapshot.exists()) {
          const data = noteSnapshot.data();
          if (data.deleted) {
            navigate("/trash");
            return;
          }
          setNote(data);
          setEditableTitle(data.title || "");
          setEditableContent(data.content || "");
          setIsPinned(data.pinned || false);
        } else {
          navigate("/notes");
        }
      } catch (error) {
        console.error("Error fetching note:", error);
      }
    };

    fetchNote();
  }, [noteId, navigate]);

  // Format date for header
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  // Auto-save on change
  useEffect(() => {
    if (note && (editableTitle !== note.title || editableContent !== note.content)) {
      const saveTimeout = setTimeout(async () => {
        try {
          setIsSaving(true);
          await updateDoc(doc(db, "notes", noteId), {
            title: editableTitle,
            content: editableContent,
            updatedAt: new Date()
          });
          setIsSaving(false);
        } catch (error) {
          console.error("Error saving note:", error);
          setIsSaving(false);
        }
      }, 1500);

      return () => clearTimeout(saveTimeout);
    }
  }, [editableTitle, editableContent, note, noteId]);

  const togglePin = async () => {
    try {
      const newPin = !isPinned;
      setIsPinned(newPin);
      await updateDoc(doc(db, "notes", noteId), {
        pinned: newPin,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Move this note to Trash?");
    if (!confirmDelete) return;

    try {
      await updateDoc(doc(db, "notes", noteId), {
        deleted: true,
        deletedAt: new Date()
      });
      navigate("/notes");
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  if (!note) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
        <span className="text-gray-600 dark:text-gray-300">Loading note...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/notes")}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Back"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isSaving ? (
              <span className="flex items-center">
                <Clock size={14} className="mr-1" /> Saving...
              </span>
            ) : (
              <span className="flex items-center">
                <CheckCircle size={14} className="mr-1 text-green-500" /> Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={togglePin}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Pin size={20} className={isPinned ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"} />
          </button>

          <button
            onClick={() => alert("Sharing feature coming soon!")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Share"
          >
            <Share size={20} className="text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900"
            title="Move to Trash"
          >
            <Trash size={20} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-3xl font-medium text-gray-800 dark:text-gray-200 mb-2 bg-transparent focus:outline-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {note.updatedAt ? formatDate(note.updatedAt) : formatDate(note.createdAt)}
            </div>
          </div>

          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            placeholder="Note content..."
            className="w-full min-h-[calc(100vh-200px)] text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default NoteViewer;
