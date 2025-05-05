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
  Clock,
  MoreVertical,
  X
} from "lucide-react";

const NoteViewer = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableContent, setEditableContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);

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
    
    // Simplified date for mobile
    if (window.innerWidth < 640) {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
    }
    
    // Full date for larger screens
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

  // Close mobile actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMobileActions && !event.target.closest('.mobile-actions-menu')) {
        setShowMobileActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileActions]);

  const togglePin = async () => {
    try {
      const newPin = !isPinned;
      setIsPinned(newPin);
      await updateDoc(doc(db, "notes", noteId), {
        pinned: newPin,
        updatedAt: new Date()
      });
      setShowMobileActions(false);
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

  const handleShare = () => {
    alert("Sharing feature coming soon!");
    setShowMobileActions(false);
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
      <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/notes")}
            className="mr-2 sm:mr-4 p-1 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Back"
            aria-label="Back to notes"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xs:flex">
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

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center space-x-4">
          <button
            onClick={togglePin}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            title={isPinned ? "Unpin" : "Pin"}
          >
            <Pin size={20} className={isPinned ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"} />
          </button>

          <button
            onClick={handleShare}
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

        {/* Mobile Actions Toggle */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setShowMobileActions(!showMobileActions)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="More options"
          >
            {showMobileActions ? (
              <X size={20} className="text-gray-600 dark:text-gray-300" />
            ) : (
              <MoreVertical size={20} className="text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Mobile Actions Menu */}
          {showMobileActions && (
            <div className="mobile-actions-menu absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-1">
                <button
                  onClick={togglePin}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Pin size={18} className={`mr-2 ${isPinned ? "text-yellow-500" : "text-gray-600 dark:text-gray-300"}`} />
                  <span>{isPinned ? "Unpin" : "Pin"}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Share size={18} className="mr-2 text-gray-600 dark:text-gray-300" />
                  <span>Share</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-red-100 dark:hover:bg-red-900 rounded-md"
                >
                  <Trash size={18} className="mr-2 text-red-500" />
                  <span className="text-red-500">Move to Trash</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Save Indicator */}
      <div className="sm:hidden px-4 py-1 text-xs text-center text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        {isSaving ? (
          <span className="flex items-center justify-center">
            <Clock size={12} className="mr-1" /> Saving...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <CheckCircle size={12} className="mr-1 text-green-500" /> Saved
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 sm:mb-6">
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              placeholder="Title"
              className="w-full text-xl sm:text-3xl font-medium text-gray-800 dark:text-gray-200 mb-1 sm:mb-2 bg-transparent focus:outline-none"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {note.updatedAt ? formatDate(note.updatedAt) : formatDate(note.createdAt)}
            </div>
          </div>

          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            placeholder="Note content..."
            className="w-full min-h-[calc(100vh-180px)] text-sm sm:text-base text-gray-700 dark:text-gray-300 bg-transparent focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default NoteViewer;